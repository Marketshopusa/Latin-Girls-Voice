import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Character, VoiceType, DEFAULT_VOICE, VOICE_CATALOG } from '@/types';
import { mockCharacters } from '@/data/characters';
import { useNsfw } from '@/contexts/NsfwContext';

interface DbCharacter {
  id: string;
  creator_id: string | null;
  name: string;
  age: number;
  tagline: string;
  history: string;
  welcome_message: string;
  voice: string;
  nsfw: boolean;
  image_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Set de voces válidas del nuevo catálogo Google Cloud TTS
const VALID_VOICES = new Set(VOICE_CATALOG.map(v => v.id));

// Mapeo de voces legacy a las nuevas
const LEGACY_VOICE_MAP: Record<string, VoiceType> = {
  'LATINA_CALIDA': 'es-US-Neural2-A',
  'LATINA_COQUETA': 'es-US-Neural2-A',
  'MEXICANA_DULCE': 'es-MX-Neural2-A',
  'LATINO_PROFUNDO': 'es-US-Neural2-B',
  'LATINO_SUAVE': 'es-US-Neural2-C',
  'VENEZOLANA': 'es-US-Neural2-A',
  'COLOMBIANA': 'es-US-Neural2-A',
  'ARGENTINA': 'es-US-Neural2-A',
};

// Normalizar voces legacy a las nuevas
const normalizeVoiceType = (voice: string | null | undefined): VoiceType => {
  if (!voice) return DEFAULT_VOICE;
  
  // Si ya es una voz válida del nuevo catálogo
  if (VALID_VOICES.has(voice as VoiceType)) {
    return voice as VoiceType;
  }
  
  // Si es una voz legacy, mapear
  if (LEGACY_VOICE_MAP[voice]) {
    return LEGACY_VOICE_MAP[voice];
  }
  
  // Default
  return DEFAULT_VOICE;
};

const mapDbToCharacter = (db: DbCharacter): Character => ({
  id: db.id,
  name: db.name,
  age: db.age,
  tagline: db.tagline,
  history: db.history,
  welcomeMessage: db.welcome_message,
  image: db.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
  tags: db.nsfw ? ['NSFW', '+18'] : ['SFW'],
  voice: normalizeVoiceType(db.voice),
  nsfw: db.nsfw,
  style: 'Realistic',
});

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const { nsfwEnabled } = useNsfw();

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters' as any)
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false }) as { data: DbCharacter[] | null, error: any };

      if (error) {
        console.error('Error fetching characters:', error);
        const filtered = mockCharacters.filter(c => nsfwEnabled || !c.nsfw);
        setCharacters(filtered);
        return;
      }

      // Filtrar por NSFW
      const filteredDbCharacters = (data || [])
        .filter(c => nsfwEnabled || !c.nsfw)
        .map(mapDbToCharacter);
      
      const filteredMocks = mockCharacters.filter(c => nsfwEnabled || !c.nsfw);
      
      // Combinar (DB tiene prioridad)
      const allCharacters = [...filteredDbCharacters, ...filteredMocks];
      const uniqueCharacters = allCharacters.filter((c, index, self) => 
        index === self.findIndex(t => t.id === c.id)
      );
      
      setCharacters(uniqueCharacters);
    } catch (err) {
      console.error('Error:', err);
      const filtered = mockCharacters.filter(c => nsfwEnabled || !c.nsfw);
      setCharacters(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [nsfwEnabled]);

  return { characters, loading, refetch: fetchCharacters };
};

export const useCreateCharacter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (imageDataUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      const fileName = `character_${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('character-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      return null;
    }
  };

  const createCharacter = async (characterData: {
    name: string;
    age: number;
    tagline: string;
    history: string;
    welcomeMessage: string;
    voice: VoiceType;
    nsfw: boolean;
    image: string | null;
  }): Promise<Character | null> => {
    setLoading(true);
    setError(null);

    try {
      let imageUrl: string | null = null;
      
      if (characterData.image && characterData.image.startsWith('data:')) {
        imageUrl = await uploadImage(characterData.image);
      } else if (characterData.image) {
        imageUrl = characterData.image;
      }

      const { data, error: insertError } = await supabase
        .from('characters' as any)
        .insert({
          name: characterData.name,
          age: characterData.age,
          tagline: characterData.tagline,
          history: characterData.history,
          welcome_message: characterData.welcomeMessage,
          voice: characterData.voice,
          nsfw: characterData.nsfw,
          image_url: imageUrl,
          is_public: true,
        })
        .select()
        .single() as { data: DbCharacter | null, error: any };

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(insertError.message);
        return null;
      }

      return mapDbToCharacter(data as DbCharacter);
    } catch (err) {
      console.error('Create character error:', err);
      setError('Error al crear el personaje');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createCharacter, loading, error };
};
