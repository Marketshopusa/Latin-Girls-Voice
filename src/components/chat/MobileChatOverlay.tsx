import { useState, useRef, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileChatOverlayProps {
  children: ReactNode;
  backgroundElement: ReactNode;
  characterName: string;
}

export const MobileChatOverlay = ({ 
  children, 
  backgroundElement,
  characterName 
}: MobileChatOverlayProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Only allow dragging to the right (positive diff) when chat is visible
    // Or dragging to the left (negative diff) when chat is hidden
    if (!isHidden && diff > 0) {
      setDragOffset(Math.min(diff, window.innerWidth));
    } else if (isHidden && diff < 0) {
      setDragOffset(Math.max(diff + window.innerWidth, 0));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    
    const threshold = window.innerWidth * 0.3;
    
    if (!isHidden && dragOffset > threshold) {
      setIsHidden(true);
    } else if (isHidden && dragOffset < window.innerWidth - threshold) {
      setIsHidden(false);
    }
    
    setDragOffset(0);
  };

  // Calculate the actual offset for the chat overlay - use 100% to ensure complete hiding
  const getTransformValue = () => {
    if (dragOffset !== 0) {
      return `${dragOffset}px`;
    }
    return isHidden ? '100%' : '0';
  };

  const toggleVisibility = () => {
    setIsHidden(!isHidden);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Full-screen background with character image/video */}
      <div className="absolute inset-0 z-0">
        {backgroundElement}
      </div>

      {/* Chat overlay with transparent background */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-10 flex flex-col transition-transform duration-300 ease-out",
          isDragging.current && "transition-none"
        )}
        style={{ 
          transform: `translateX(${getTransformValue()})`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Semi-transparent gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/30 pointer-events-none" />
        
        {/* Chat content */}
        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
      </div>

      {/* Bottom Arrow Indicator - Always visible */}
      <button
        onClick={toggleVisibility}
        className={cn(
          "fixed bottom-24 z-30 flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-background/40 backdrop-blur-md border border-border/30",
          "text-foreground/80 text-sm font-medium",
          "transition-all duration-300 hover:bg-background/60",
          "shadow-lg",
          isHidden ? "left-4" : "right-4"
        )}
      >
        {isHidden ? (
          <>
            <ChevronLeft className="h-5 w-5 animate-pulse" />
            <span className="hidden sm:inline">Volver al chat</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Ver a {characterName}</span>
            <ChevronRight className="h-5 w-5 animate-pulse" />
          </>
        )}
      </button>

    </div>
  );
};
