import { Heart, X } from 'lucide-react';
import { Character } from '@/types';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

export const CharacterCard = ({ character, onClick }: CharacterCardProps) => {
  return (
    <div 
      className="card-character group cursor-pointer"
      onClick={() => onClick(character)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              // Like action
            }}
          >
            <Heart className="h-4 w-4 text-white fill-white" />
          </button>
          <button 
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              // Dismiss action
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Character info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-lg text-foreground">
              {character.name}
            </h3>
            <span className="text-muted-foreground">{character.age}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {character.tagline}
          </p>
        </div>
      </div>
    </div>
  );
};
