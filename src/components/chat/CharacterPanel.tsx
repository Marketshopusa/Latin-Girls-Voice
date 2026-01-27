import { MessageCircle, ChevronRight } from 'lucide-react';
import { Character } from '@/types';

interface CharacterPanelProps {
  character: Character;
  onOpenDetails: () => void;
}

export const CharacterPanel = ({ character, onOpenDetails }: CharacterPanelProps) => {
  return (
    <div className="w-80 xl:w-96 bg-card border-l border-border flex flex-col h-full overflow-hidden">
      {/* Character Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        
        {/* Character info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-display font-bold text-xl text-foreground">
              {character.name}
            </h2>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{character.messageCount || 0}</span>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {character.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
            {character.style && (
              <span className="tag-chip">{character.style}</span>
            )}
          </div>
        </div>
      </div>

      {/* Character description */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {character.history}
        </p>
      </div>

      {/* Details button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onOpenDetails}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <span className="text-sm font-medium">Detalles del personaje</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
