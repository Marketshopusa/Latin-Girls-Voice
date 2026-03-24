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
      // Validate promo code server-side via edge function
      const { data, error: fnError } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: code.trim() },
      });

      if (fnError) {
        // Parse error message from response
        const errMsg = fnError.message || 'Error al canjear el código';
        toast.error(errMsg);
        return false;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Código inválido o expirado');
        return false;
      }

      toast.success('¡Código canjeado exitosamente!', {
        description: `Tienes ${data.voice_call_minutes} min de llamadas y ${data.tts_responses} respuestas con voz.`,
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
