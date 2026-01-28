import { useState, useCallback } from 'react';
import { Character, Message } from '@/types';

interface UseChatAIOptions {
  character: Character;
  onResponse?: (response: string) => void;
}

export const useChatAI = ({ character, onResponse }: UseChatAIOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    userMessage: string,
    conversationHistory: Message[]
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            character: {
              name: character.name,
              age: character.age,
              history: character.history,
              tagline: character.tagline,
              voice: character.voice,
              nsfw: character.nsfw || false,
            },
            conversationHistory: conversationHistory.map(m => ({
              role: m.role,
              text: m.text,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response;

      if (onResponse) {
        onResponse(aiResponse);
      }

      return aiResponse;
    } catch (err) {
      console.error('Chat AI error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al comunicarse con la IA';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [character, onResponse]);

  return {
    sendMessage,
    isLoading,
    error,
  };
};
