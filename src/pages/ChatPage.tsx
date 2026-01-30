import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { CharacterPanel } from '@/components/chat/CharacterPanel';
import { CharacterConfigModal } from '@/components/characters/CharacterConfigModal';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatSidebar } from '@/components/layout/ChatSidebar';
import { MobileChatOverlay } from '@/components/chat/MobileChatOverlay';
import { useConversation } from '@/hooks/useConversation';
import { useCharacters } from '@/hooks/useCharacters';
import { useChatAI } from '@/hooks/useChatAI';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { useNsfw } from '@/contexts/NsfwContext';
import { mockCharacters } from '@/data/characters';
import { Character, VoiceType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobileOrTablet = useIsMobileOrTablet();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [lastAIMessageId, setLastAIMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { characters } = useCharacters();
  const { messages, isLoading, addMessage, setInitialMessage, resetConversationWithNewWelcome } = useConversation(id);
  
  const { sendMessage: sendAIMessage, isLoading: isAILoading, error: aiError } = useChatAI({
    character: character!,
  });

  const { nsfwEnabled } = useNsfw();
  
  // Hook para generación de imágenes
  const {
    generateImage,
    clearImage,
    isGenerating: isGeneratingImage,
    lastGeneratedImage,
  } = useImageGeneration({
    character: {
      name: character?.name || '',
      appearance: character?.tagline,
      style: character?.style,
    },
    nsfw: nsfwEnabled && (character?.nsfw || false),
  });

  // Load character data - first check mocks, then DB
  useEffect(() => {
    const loadCharacter = async () => {
      setCharacterLoading(true);
      
      // First check mock characters
      const mockFound = mockCharacters.find((c) => c.id === id);
      if (mockFound) {
        setCharacter(mockFound);
        setCharacterLoading(false);
        return;
      }

      // Then check database
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching character:', error);
          setCharacterLoading(false);
          return;
        }

        if (data) {
          const dbChar: Character = {
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
            style: 'Realistic',
          };
          setCharacter(dbChar);
        }
      } catch (err) {
        console.error('Error loading character:', err);
      } finally {
        setCharacterLoading(false);
      }
    };

    if (id) {
      loadCharacter();
    }
  }, [id]);

  // Set welcome message when conversation is ready
  useEffect(() => {
    if (character && !isLoading) {
      setInitialMessage(character.welcomeMessage);
    }
  }, [character, isLoading, setInitialMessage]);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!character) return;

    // Add user message
    await addMessage('user', text);

    // Get AI response
    setIsTyping(true);
    
    try {
      const aiResponse = await sendAIMessage(text, messages);
      
      if (aiResponse) {
        const audioDuration = Math.floor(aiResponse.length / 15); // Estimate based on text length
        const newMessage = await addMessage('assistant', aiResponse, audioDuration);
        if (newMessage) {
          setLastAIMessageId(newMessage.id);
        }
      } else if (aiError) {
        toast.error(aiError);
      }
    } catch (err) {
      console.error('Error getting AI response:', err);
      toast.error('Error al obtener respuesta del personaje');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveConfig = async (updates: Partial<Character>) => {
    if (character) {
      const updatedCharacter = { ...character, ...updates };
      setCharacter(updatedCharacter);
      
      // Si se cambió el welcomeMessage, reiniciar la conversación
      if (updates.welcomeMessage && updates.welcomeMessage !== character.welcomeMessage) {
        // Limpiar mensajes existentes y establecer el nuevo mensaje de bienvenida
        await resetConversationWithNewWelcome(updates.welcomeMessage);
        toast.success('Personaje actualizado. La conversación se reinició con el nuevo mensaje.');
      } else if (updates.history && updates.history !== character.history) {
        // Si solo cambió la historia, notificar que afectará futuras respuestas
        toast.success('Historia actualizada. El personaje usará la nueva personalidad.');
      } else {
        toast.success('Configuración guardada');
      }
    }
  };

  const handleSelectConversation = (char: Character) => {
    navigate(`/chat/${char.id}`);
  };

  const handleGenerateImage = async () => {
    if (!character) return;
    await generateImage(messages);
  };

  if (characterLoading || !character || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  // Background element for mobile overlay
  const backgroundElement = (
    <div className="w-full h-full">
      {isVideoUrl(character.image) ? (
        <video
          src={character.image}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover"
          loading="eager"
        />
      )}
    </div>
  );

  // Mobile chat content
  const mobileChatContent = (
    <>
      {/* Mobile Header */}
      <header className="flex items-center gap-4 px-4 py-3 bg-background/50 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-outline">{character.name}</h2>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            characterName={character.name}
            voiceType={character.voice}
            autoPlay={message.id === lastAIMessageId}
          />
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-foreground text-sm text-outline">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{character.name} está escribiendo...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-background/70 backdrop-blur-sm">
        <ChatInput
          characterName={character.name}
          onSend={handleSendMessage}
          onRestart={() => character && resetConversationWithNewWelcome(character.welcomeMessage)}
          disabled={isTyping}
          onGenerateImage={handleGenerateImage}
          isGeneratingImage={isGeneratingImage}
          lastGeneratedImage={lastGeneratedImage}
          onClearImage={clearImage}
        />
      </div>
    </>
  );

  // Mobile/Tablet layout with overlay
  if (isMobileOrTablet) {
    return (
      <>
        <MobileChatOverlay
          backgroundElement={backgroundElement}
          characterName={character.name}
        >
          {mobileChatContent}
        </MobileChatOverlay>

        <CharacterConfigModal
          character={character}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      </>
    );
  }

  // Desktop layout (unchanged)
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Icon Sidebar */}
      <ChatSidebar />

      {/* Conversation List */}
      <div className="hidden lg:block h-screen overflow-hidden">
        <ConversationList activeId={character.id} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
          <button
            onClick={() => navigate('/')}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <img
            src={character.image}
            alt={character.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold truncate">{character.name}</h2>
          </div>

          {/* Thought bubble hint */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm">
            <span>💭</span>
            <span className="truncate">¡Shhh! Veamos qué piensa {character.name}...</span>
            <button className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              <Eye className="h-3 w-3" />
              Ver corazón
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              characterName={character.name}
              voiceType={character.voice}
              autoPlay={message.id === lastAIMessageId}
            />
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{character.name} está escribiendo...</span>
            </div>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          characterName={character.name}
          onSend={handleSendMessage}
          onRestart={() => character && resetConversationWithNewWelcome(character.welcomeMessage)}
          disabled={isTyping}
          onGenerateImage={handleGenerateImage}
          isGeneratingImage={isGeneratingImage}
          lastGeneratedImage={lastGeneratedImage}
          onClearImage={clearImage}
        />
      </div>

      {/* Character Panel (hidden on mobile) */}
      <div className="hidden xl:flex h-screen">
        <CharacterPanel
          character={character}
          onOpenDetails={() => setIsConfigOpen(true)}
        />
      </div>

      {/* Config Modal */}
      <CharacterConfigModal
        character={character}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default ChatPage;
