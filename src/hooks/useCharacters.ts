import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Character, VoiceType } from '@/types';
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

const mapDbToCharacter = (db: DbCharacter): Character => ({
  id: db.id,
  name: db.name,
  age: db.age,
  tagline: db.tagline,
  history: db.history,
  welcomeMessage: db.welcome_message,
  image: db.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
  tags: db.nsfw ? ['NSFW', '+18'] : ['SFW'],
  voice: db.voice as VoiceType,
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
      // Fetch characters based on NSFW setting
      // Using .from() with explicit type casting since the table was just created
      const { data, error } = await supabase
        .from('characters' as any)
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false }) as { data: DbCharacter[] | null, error: any };

      if (error) {
        console.error('Error fetching characters:', error);
        // Fallback to mock characters filtered by nsfw
        const filtered = mockCharacters.filter(c => nsfwEnabled || !c.nsfw);
        setCharacters(filtered);
        return;
      }

      // Filter DB characters by NSFW setting
      const filteredDbCharacters = (data || [])
        .filter(c => nsfwEnabled || !c.nsfw)
        .map(mapDbToCharacter);
      
      // Filter mock characters by NSFW setting
      const filteredMocks = mockCharacters.filter(c => nsfwEnabled || !c.nsfw);
      
      // Combine DB characters (priority) with filtered mock characters
      const allCharacters = [...filteredDbCharacters, ...filteredMocks];
      
      // Remove duplicates by id (DB characters take priority)
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
      // Convert base64 to blob
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
      
      // Upload image if provided
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
