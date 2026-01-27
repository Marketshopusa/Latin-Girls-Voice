import { ConversationList } from '@/components/chat/ConversationList';
import { mockCharacters } from '@/data/characters';
import { Character } from '@/types';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const MessagesPage = () => {
  const navigate = useNavigate();

  const handleSelectConversation = (character: Character) => {
    navigate(`/chat/${character.id}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-6 py-4">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-display font-bold">Mensajes</h1>
            <p className="text-sm text-muted-foreground">
              Tus conversaciones recientes
            </p>
          </div>
        </div>
      </header>

      {/* Conversations */}
      <main className="divide-y divide-border">
        {mockCharacters.map((character) => (
          <button
            key={character.id}
            onClick={() => handleSelectConversation(character)}
            className="w-full flex items-start gap-4 p-4 hover:bg-card transition-colors text-left"
          >
            {/* Avatar */}
            <img
              src={character.image}
              alt={character.name}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-display font-semibold text-foreground">
                  {character.name}
                </h4>
                <span className="text-xs text-muted-foreground">Hace 2h</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {character.welcomeMessage}
              </p>
              
              {/* Tags */}
              <div className="flex items-center gap-2 mt-2">
                {character.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="tag-chip text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
};

export default MessagesPage;
