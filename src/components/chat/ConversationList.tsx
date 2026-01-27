import { Character } from '@/types';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  characters: Character[];
  activeId: string;
  onSelect: (character: Character) => void;
}

export const ConversationList = ({ characters, activeId, onSelect }: ConversationListProps) => {
  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {characters.map((character) => (
          <button
            key={character.id}
            onClick={() => onSelect(character)}
            className={cn(
              'w-full flex items-start gap-3 px-4 py-3 hover:bg-sidebar-accent transition-colors text-left',
              activeId === character.id && 'bg-sidebar-accent'
            )}
          >
            {/* Avatar */}
            <img
              src={character.image}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-sidebar-foreground truncate">
                  {character.name}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {character.tagline}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
