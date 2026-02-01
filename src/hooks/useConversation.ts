import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types';

interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  audio_duration: number | null;
  created_at: string;
}

interface DbConversation {
  id: string;
  user_id: string;
  character_id: string;
  created_at: string;
  updated_at: string;
}

export const useConversation = (characterId: string | undefined) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load or create conversation
  useEffect(() => {
    if (!characterId || !userId) {
      setIsLoading(false);
      return;
    }

    const loadConversation = async () => {
      setIsLoading(true);
      
      try {
        // Try to find existing conversation
        const { data: existing, error: findError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('character_id', characterId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (findError) throw findError;

        let convId: string;

        if (existing) {
          convId = existing.id;
        } else {
          // Create new conversation
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({ user_id: userId, character_id: characterId })
            .select()
            .single();

          if (createError) throw createError;
          convId = newConv.id;
        }

        setConversationId(convId);

        // Load messages
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (msgsError) throw msgsError;

        const formattedMessages: Message[] = (msgs as DbMessage[]).map((m) => ({
          id: m.id,
          role: m.role,
          text: m.content,
          timestamp: new Date(m.created_at),
          audioDuration: m.audio_duration ?? undefined,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [characterId, userId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          const formatted: Message = {
            id: newMsg.id,
            role: newMsg.role,
            text: newMsg.content,
            timestamp: new Date(newMsg.created_at),
            audioDuration: newMsg.audio_duration ?? undefined,
          };
          
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === formatted.id)) return prev;
            return [...prev, formatted];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const addMessage = useCallback(
    async (role: 'user' | 'assistant', text: string, audioDuration?: number): Promise<Message | null> => {
      if (!conversationId || !userId) {
        // Return local-only message for non-authenticated users
        const localMessage: Message = {
          id: Date.now().toString(),
          role,
          text,
          timestamp: new Date(),
          audioDuration,
        };
        setMessages((prev) => [...prev, localMessage]);
        return localMessage;
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role,
            content: text,
            audio_duration: audioDuration ?? null,
          })
          .select()
          .single();

        if (error) throw error;

        const msg = data as DbMessage;
        const formatted: Message = {
          id: msg.id,
          role: msg.role,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          audioDuration: msg.audio_duration ?? undefined,
        };

        // IMPORTANT: Update UI immediately (do not rely on realtime INSERT event timing)
        setMessages((prev) => {
          if (prev.some((m) => m.id === formatted.id)) return prev;
          return [...prev, formatted];
        });

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return formatted;
      } catch (error) {
        console.error('Error saving message:', error);
        // Fallback to local message
        const localMessage: Message = {
          id: Date.now().toString(),
          role,
          text,
          timestamp: new Date(),
          audioDuration,
        };
        setMessages((prev) => [...prev, localMessage]);
        return localMessage;
      }
    },
    [conversationId, userId]
  );

  const setInitialMessage = useCallback(
    async (welcomeMessage: string) => {
      if (messages.length === 0 && conversationId && userId) {
        await addMessage('assistant', welcomeMessage, 12);
      } else if (messages.length === 0 && !userId) {
        // For non-authenticated users, just add locally
        setMessages([{
          id: '1',
          role: 'assistant',
          text: welcomeMessage,
          timestamp: new Date(),
          audioDuration: 12,
        }]);
      }
    },
    [messages.length, conversationId, userId, addMessage]
  );

  // Reset conversation with a new welcome message (for when user edits character)
  const resetConversationWithNewWelcome = useCallback(
    async (newWelcomeMessage: string) => {
      // Clear local messages
      setMessages([]);
      
      if (conversationId && userId) {
        try {
          // Delete existing messages from this conversation
          await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId);
          
          // Add the new welcome message
          const { data, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: newWelcomeMessage,
              audio_duration: 12,
            })
            .select()
            .single();

          if (!error && data) {
            const msg = data as DbMessage;
            setMessages([{
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              text: msg.content,
              timestamp: new Date(msg.created_at),
              audioDuration: msg.audio_duration ?? undefined,
            }]);
          }
        } catch (error) {
          console.error('Error resetting conversation:', error);
        }
      } else {
        // For non-authenticated users, just set local
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          text: newWelcomeMessage,
          timestamp: new Date(),
          audioDuration: 12,
        }]);
      }
    },
    [conversationId, userId]
  );

  return {
    messages,
    isLoading,
    addMessage,
    setInitialMessage,
    resetConversationWithNewWelcome,
    isAuthenticated: !!userId,
  };
};
