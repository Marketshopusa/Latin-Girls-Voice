import { MessageCircle, ChevronRight } from 'lucide-react';
import { Character } from '@/types';

interface CharacterPanelProps {
  character: Character;
  onOpenDetails: () => void;
}

// Helper to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

export const CharacterPanel = ({ character, onOpenDetails }: CharacterPanelProps) => {
  const isVideo = isVideoUrl(character.image);

  return (
    <div className="w-[360px] bg-card flex flex-col h-screen relative">
      {/* Full-height character image or video */}
      <div className="absolute inset-0 flex items-start justify-center bg-card">
        {isVideo ? (
          <video
            src={character.image}
            className="w-full h-full object-contain object-top"
            autoPlay
            loop
            muted
            playsInline
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <img
            src={character.image}
            alt={character.name}
            className="w-full h-full object-contain object-top"
            loading="eager"
            decoding="async"
            style={{ imageRendering: 'auto' }}
          />
        )}
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
