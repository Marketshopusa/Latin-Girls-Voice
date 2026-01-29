import { forwardRef } from 'react';
import { Shield } from 'lucide-react';
import { Character } from '@/types';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

// Helper to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

export const CharacterCard = forwardRef<HTMLDivElement, CharacterCardProps>(
  ({ character, onClick }, ref) => {
    const isVideo = isVideoUrl(character.image);

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl cursor-pointer group",
          "bg-card border border-border/50",
          "transition-all duration-300 hover:border-primary/30",
          "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
        )}
        onClick={() => onClick(character)}
      >
        {/* Image/Video Container - Tall aspect ratio for mobile-first design */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {isVideo ? (
            <video
              src={character.image}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={character.image}
              alt={character.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          )}
          
          {/* Dark gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* NSFW Badge */}
          {character.nsfw && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium backdrop-blur-sm">
              <Shield className="h-3 w-3" />
              +18
            </div>
          )}

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Character name */}
            <h3 className="font-display font-bold text-lg text-white leading-tight mb-1">
              {character.name}
            </h3>
            
            {/* Tagline - 2 lines max */}
            <p className="text-sm text-white/80 leading-snug line-clamp-2 mb-3">
              {character.tagline}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {character.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              {character.style && (
                <span className="px-2.5 py-1 rounded-full bg-primary/30 backdrop-blur-sm text-primary-foreground text-xs font-medium">
                  {character.style}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CharacterCard.displayName = 'CharacterCard';
