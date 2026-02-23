import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PromoRedemption {
  tts_responses_remaining: number;
  voice_call_seconds_remaining: number;
  expires_at: string;
}

export const usePromoCode = () => {
  const { user } = useAuth();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activePromo, setActivePromo] = useState<PromoRedemption | null>(null);

  const fetchActivePromo = useCallback(async () => {
    if (!user) {
      setActivePromo(null);
      return;
    }

    const { data } = await supabase
      .from('user_promo_redemptions')
      .select('tts_responses_remaining, voice_call_seconds_remaining, expires_at')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && (data.tts_responses_remaining > 0 || data.voice_call_seconds_remaining > 0)) {
      setActivePromo(data);
    } else {
      setActivePromo(null);
    }
  }, [user]);

  useEffect(() => {
    fetchActivePromo();
  }, [fetchActivePromo]);

  const redeemCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user) {
      toast.error('Debes iniciar sesión para usar un código promocional');
      return false;
    }

    setIsRedeeming(true);
    try {
      // Find the promo code
      const { data: promoCode, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (promoError || !promoCode) {
        toast.error('Código inválido o expirado');
        return false;
      }

      // Check if user already redeemed this code
      const { data: existing } = await supabase
        .from('user_promo_redemptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('promo_code_id', promoCode.id)
        .maybeSingle();

      if (existing) {
        toast.error('Ya has utilizado este código promocional');
        return false;
      }

      // Redeem
      const expiresAt = new Date(promoCode.expires_at);
      const { error: insertError } = await supabase
        .from('user_promo_redemptions')
        .insert({
          user_id: user.id,
          promo_code_id: promoCode.id,
          tts_responses_remaining: promoCode.tts_responses,
          voice_call_seconds_remaining: promoCode.voice_call_minutes * 60,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error('Error redeeming promo:', insertError);
        toast.error('Error al canjear el código');
        return false;
      }

      toast.success('¡Código canjeado exitosamente!', {
        description: `Tienes ${promoCode.voice_call_minutes} min de llamadas y ${promoCode.tts_responses} respuestas con voz.`,
      });

      await fetchActivePromo();
      return true;
    } catch (err) {
      console.error('Promo redeem error:', err);
      toast.error('Error inesperado');
      return false;
    } finally {
      setIsRedeeming(false);
    }
  }, [user, fetchActivePromo]);

  return { redeemCode, isRedeeming, activePromo, fetchActivePromo };
};
