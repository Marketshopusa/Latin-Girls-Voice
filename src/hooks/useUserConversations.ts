import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Character, VoiceType } from '@/types';
import { mockCharacters } from '@/data/characters';

interface UserConversation {
  id: string;
  character_id: string;
  updated_at: string;
  character: Character | null;
  lastMessage?: string;
}

export const useUserConversations = () => {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
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

  // Load user conversations
  const loadConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get user's conversations
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('id, character_id, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (!convs || convs.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Get character details for each conversation
      const characterIds = convs.map(c => c.character_id);
      
      // First check mock characters
      const mockChars = mockCharacters.filter(mc => characterIds.includes(mc.id));
      
      // Then fetch from database for the rest
      const dbCharacterIds = characterIds.filter(
        id => !mockCharacters.some(mc => mc.id === id)
      );

      let dbChars: Character[] = [];
      if (dbCharacterIds.length > 0) {
        const { data: dbCharData } = await supabase
          .from('characters')
          .select('*')
          .in('id', dbCharacterIds);

        if (dbCharData) {
          dbChars = dbCharData.map(data => ({
            id: data.id,
            name: data.name,
            age: data.age,
            tagline: data.tagline,
            history: data.history,
            welcomeMessage: data.welcome_message,
            image: data.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
            tags: data.nsfw ? ['NSFW', '+18'] : ['SFW'],
            voice: data.voice as VoiceType,
            nsfw: data.nsfw,
            style: 'Realistic' as const,
          }));
        }
      }

      const allChars = [...mockChars, ...dbChars];

      // Get last message for each conversation
      const conversationsWithDetails: UserConversation[] = await Promise.all(
        convs.map(async (conv) => {
          const character = allChars.find(c => c.id === conv.character_id) || null;
          
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: conv.id,
            character_id: conv.character_id,
            updated_at: conv.updated_at,
            character,
            lastMessage: lastMsg?.content,
          };
        })
      );

      setConversations(conversationsWithDetails.filter(c => c.character !== null));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) return false;

    try {
      // First delete all messages
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }, [userId]);

  return {
    conversations,
    isLoading,
    deleteConversation,
    refreshConversations: loadConversations,
    isAuthenticated: !!userId,
  };
};
