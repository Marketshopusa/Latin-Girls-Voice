import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Message } from '@/types';

interface CharacterDescription {
  name: string;
  appearance?: string;
  style?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
}

interface UseImageGenerationOptions {
  character: CharacterDescription;
  nsfw: boolean;
}

export const useImageGeneration = ({ character, nsfw }: UseImageGenerationOptions) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera una imagen basada en el contexto actual de la conversación
   */
  const generateImage = useCallback(async (
    messages: Message[],
    specificAction?: string
  ): Promise<GeneratedImage | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Construir contexto de los últimos mensajes
      const recentMessages = messages.slice(-6);
      const conversationContext = recentMessages
        .map(m => m.text)
        .join('\n');

      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: {
          conversationContext,
          characterDescription: character,
          action: specificAction,
          nsfw,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        // Manejar caso de API no configurada
        if (data.error === 'IMAGE_API_NOT_CONFIGURED') {
          setError('La generación de imágenes no está disponible aún. Se requiere configurar una API externa.');
          toast.info('Generación de imágenes no disponible', {
            description: 'Esta función requiere configuración adicional.',
          });
          
          // Guardar el prompt generado para referencia
          console.log('Generated prompt (for future use):', data.generatedPrompt);
          return null;
        }

        throw new Error(data.message || 'Error al generar imagen');
      }

      const generatedImage: GeneratedImage = {
        url: data.imageUrl,
        prompt: data.prompt,
        timestamp: new Date(),
      };

      setLastGeneratedImage(generatedImage);
      toast.success('Imagen generada');

      return generatedImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al generar imagen', {
        description: errorMessage,
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [character, nsfw]);

  /**
   * Limpia la última imagen generada
   */
  const clearImage = useCallback(() => {
    setLastGeneratedImage(null);
    setError(null);
  }, []);

  return {
    generateImage,
    clearImage,
    isGenerating,
    lastGeneratedImage,
    error,
  };
};
