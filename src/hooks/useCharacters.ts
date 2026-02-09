import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Character, VoiceType, normalizeVoiceType } from '@/types';
import { mockCharacters } from '@/data/characters';
import { useNsfw } from '@/contexts/NsfwContext';
import { toast } from 'sonner';

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
      // Use characters_public view to avoid exposing creator_id
      const { data, error } = await supabase
        .from('characters_public' as any)
        .select('*')
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
      console.log('[Upload] Starting image upload, data URL length:', imageDataUrl.length);
      
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      console.log('[Upload] Blob created:', blob.type, blob.size, 'bytes');
      
      // Determine proper extension from the blob type
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'application/octet-stream': 'jpg', // fallback for unknown types
      };
      
      const ext = mimeToExt[blob.type] || blob.type.split('/')[1] || 'jpg';
      const fileName = `character_${Date.now()}.${ext}`;
      
      console.log('[Upload] Uploading as:', fileName);
      
      const { data, error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('[Upload] Storage error:', uploadError.message, uploadError);
        toast.error(`Error al subir la imagen: ${uploadError.message}`);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('character-images')
        .getPublicUrl(data.path);

      console.log('[Upload] Success! URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[Upload] Failed:', err);
      toast.error('Error al subir la imagen. Intenta con un archivo más pequeño.');
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
      // Require authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión para crear un personaje');
        return null;
      }
      
      let imageUrl: string | null = null;
      
      if (characterData.image && characterData.image.startsWith('data:')) {
        imageUrl = await uploadImage(characterData.image);
        if (!imageUrl) {
          // Upload failed - don't create character with missing image
          setError('No se pudo subir la imagen. Intenta de nuevo.');
          return null;
        }
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
          creator_id: user.id,
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
