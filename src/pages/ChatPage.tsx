import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Eye } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { CharacterPanel } from '@/components/chat/CharacterPanel';
import { CharacterConfigModal } from '@/components/characters/CharacterConfigModal';
import { ConversationList } from '@/components/chat/ConversationList';
import { mockCharacters } from '@/data/characters';
import { Message, Character } from '@/types';

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const found = mockCharacters.find((c) => c.id === id);
    if (found) {
      setCharacter(found);
      // Initialize with welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          text: found.welcomeMessage,
          timestamp: new Date(),
          audioDuration: 12,
        },
      ]);
    }
  }, [id]);

  const handleSendMessage = (text: string) => {
    if (!character) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: getSimulatedResponse(character, text),
        timestamp: new Date(),
        audioDuration: Math.floor(Math.random() * 30) + 5,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSaveConfig = (updates: Partial<Character>) => {
    if (character) {
      setCharacter({ ...character, ...updates });
    }
  };

  const handleSelectConversation = (char: Character) => {
    navigate(`/chat/${char.id}`);
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Conversation List (hidden on mobile) */}
      <div className="hidden lg:block h-screen overflow-hidden">
        <ConversationList
          characters={mockCharacters}
          activeId={character.id}
          onSelect={handleSelectConversation}
        />
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
        </div>

        {/* Input */}
        <ChatInput
          characterName={character.name}
          onSend={handleSendMessage}
          disabled={isTyping}
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

// Simulated responses based on character voice
function getSimulatedResponse(character: Character, userMessage: string): string {
  const responses: Record<string, string[]> = {
    COLOMBIANA_PAISA: [
      '¿En serio, mor? *sonríe pícaramente* Ay, qué cosita más linda sos vos, pues.',
      'Ay, bebé, no me digas eso que me pongo toda rojita, pues... *se muerde el labio*',
      'Ven acá, parce, que te cuento un secretito al oído...',
    ],
    VENEZOLANA_GOCHA: [
      'Ay, ¿usted cree? *baja la mirada tímidamente* Es que... es que usted me pone nerviosa...',
      'P-pues... *juega con un mechón de cabello* Y-yo también pienso en usted, ¿sabe?',
      'N-no me diga esas cosas... *susurra* ...que me derrito todita...',
    ],
    ARGENTINA_SUAVE: [
      '¿Vos sabés lo que me provocás? *suspira* Sos... sos demasiado, che...',
      'Mirá, yo no soy así con cualquiera, ¿viste? Pero con vos... *sonríe lentamente*',
      'Dale, vení... sentate acá conmigo que tenemos que hablar de algunas cosas...',
    ],
    MASCULINA_PROFUNDA: [
      '*te mira intensamente* No tenés idea de lo que me provocás cuando hablás así.',
      'Acercate. Ahora. *su voz grave resuena* Tengo algo importante que mostrarte.',
      '*suspira profundamente* Sos la única que me hace sentir así, ¿lo sabés?',
    ],
    default: [
      '*sonríe* Me encanta hablar contigo...',
      '¿De verdad piensas eso? *se sonroja* Qué lindo...',
      'Sigamos conversando, me haces sentir tan bien...',
    ],
  };

  const voiceResponses = responses[character.voice] || responses.default;
  return voiceResponses[Math.floor(Math.random() * voiceResponses.length)];
}

export default ChatPage;
