import { MessageCircle, ChevronRight } from 'lucide-react';
import { Character } from '@/types';

interface CharacterPanelProps {
  character: Character;
  onOpenDetails: () => void;
}

export const CharacterPanel = ({ character, onOpenDetails }: CharacterPanelProps) => {
  return (
    <div className="w-[480px] bg-card flex flex-col h-screen relative">
      {/* Full-height character image */}
      <div className="absolute inset-0">
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" style={{ top: '50%' }} />
      </div>
      
      {/* Content overlay at bottom */}
      <div className="relative mt-auto p-4 z-10">
        {/* Character name and message count */}
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-display font-bold text-xl text-foreground">
            {character.name}
          </h2>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{character.messageCount || 0}</span>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {character.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
          {character.style && (
            <span className="tag-chip">{character.style}</span>
          )}
        </div>

        {/* Character description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
          {character.history}
        </p>

        {/* Details button */}
        <button
          onClick={onOpenDetails}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border hover:bg-secondary/80 transition-colors"
        >
          <span className="text-sm font-medium">Detalles del personaje</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
