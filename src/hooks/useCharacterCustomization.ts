import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Character, VoiceType, normalizeVoiceType } from '@/types';

interface CharacterCustomization {
  history?: string;
  welcomeMessage?: string;
  voice?: VoiceType;
  nsfw?: boolean;
}

interface DbCustomization {
  id: string;
  user_id: string;
  character_id: string;
  history: string | null;
  welcome_message: string | null;
  voice: string | null;
  nsfw: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useCharacterCustomization = (characterId: string | undefined) => {
  const { user } = useAuth();
  const [customization, setCustomization] = useState<CharacterCustomization | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar personalización existente
  useEffect(() => {
    const loadCustomization = async () => {
      if (!user || !characterId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('character_customizations' as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('character_id', characterId)
          .maybeSingle() as { data: DbCustomization | null, error: any };

        if (error) {
          console.error('Error loading customization:', error);
        } else if (data) {
          setCustomization({
            history: data.history || undefined,
            welcomeMessage: data.welcome_message || undefined,
            voice: data.voice ? (normalizeVoiceType(data.voice) as VoiceType) : undefined,
            nsfw: data.nsfw ?? undefined,
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomization();
  }, [user, characterId]);

  // Guardar personalización
  const saveCustomization = useCallback(async (updates: Partial<Character>): Promise<boolean> => {
    if (!user || !characterId) {
      console.log('No user or characterId, skipping save');
      return false;
    }

    try {
      const customData = {
        user_id: user.id,
        character_id: characterId,
        history: updates.history || null,
        welcome_message: updates.welcomeMessage || null,
        // Guardar siempre una voz REAL de Google (evita legacy -> fallback a la misma voz)
        voice: updates.voice ? normalizeVoiceType(String(updates.voice)) : null,
        nsfw: updates.nsfw ?? null,
      };

      // Upsert - insertar o actualizar si ya existe
      const { error } = await supabase
        .from('character_customizations' as any)
        .upsert(customData, {
          onConflict: 'user_id,character_id',
        });

      if (error) {
        console.error('Error saving customization:', error);
        return false;
      }

      // Actualizar estado local
      setCustomization({
        history: updates.history,
        welcomeMessage: updates.welcomeMessage,
        voice: updates.voice ? (normalizeVoiceType(String(updates.voice)) as VoiceType) : undefined,
        nsfw: updates.nsfw,
      });

      return true;
    } catch (err) {
      console.error('Error saving:', err);
      return false;
    }
  }, [user, characterId]);

  // Aplicar personalizaciones a un personaje base
  const applyCustomization = useCallback((baseCharacter: Character): Character => {
    if (!customization) return baseCharacter;

    return {
      ...baseCharacter,
      history: customization.history ?? baseCharacter.history,
      welcomeMessage: customization.welcomeMessage ?? baseCharacter.welcomeMessage,
      voice: customization.voice ?? baseCharacter.voice,
      nsfw: customization.nsfw ?? baseCharacter.nsfw,
    };
  }, [customization]);

  return {
    customization,
    loading,
    saveCustomization,
    applyCustomization,
    hasCustomization: !!customization,
  };
};
