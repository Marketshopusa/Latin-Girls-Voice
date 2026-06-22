import { useState, useCallback } from 'react';
import { Character, Message } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface UseChatAIOptions {
  character: Character;
  onResponse?: (response: string) => void;
}

// Build a summary of last 10-15 messages for NSFW history persistence
function buildHistorySummary(characterId: string, conversationHistory: Message[]): string {
  // Use conversation history directly (last 12 messages)
  const recent = conversationHistory.slice(-12);
  if (recent.length === 0) return "";

  return recent.map(m => {
    const role = m.role === 'user' ? 'Usuario' : 'Personaje';
    const text = m.text.length > 120 ? m.text.slice(0, 120) + '...' : m.text;
    return `${role}: ${text}`;
  }).join('\n');
}

function buildRequestHistory(userMessage: string, conversationHistory: Message[]): Message[] {
  const recentHistory = conversationHistory.slice(-18);
  const normalizedUserMessage = userMessage.trim();
  const lastMessage = recentHistory[recentHistory.length - 1];

  if (
    lastMessage?.role === 'user' &&
    lastMessage.text.trim() === normalizedUserMessage
  ) {
    return recentHistory;
  }

  return [
    ...recentHistory,
    {
      id: `pending-${Date.now()}`,
      role: 'user',
      text: userMessage,
      timestamp: new Date(),
    },
  ];
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
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const requestHistory = buildRequestHistory(userMessage, conversationHistory);

      // Build history summary only for NSFW characters
      const isNsfw = character.nsfw || false;
      const historySummary = isNsfw
        ? buildHistorySummary(character.id, requestHistory)
        : undefined;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            message: userMessage,
            character: {
              name: character.name,
              age: character.age,
              history: character.history,
              tagline: character.tagline,
              voice: character.voice,
              nsfw: isNsfw,
            },
            conversationHistory: requestHistory.map(m => ({
              role: m.role,
              text: m.text,
            })),
            historySummary,
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
