import { useState, useRef, useEffect, ReactNode } from 'react';
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

  // Calculate the actual offset for the chat overlay
  const getTransformOffset = () => {
    if (dragOffset !== 0) {
      return dragOffset;
    }
    return isHidden ? window.innerWidth : 0;
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Full-screen background with character image/video */}
      <div className="absolute inset-0 z-0">
        {backgroundElement}
      </div>

      {/* Swipe indicator when chat is hidden */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground text-sm animate-pulse"
        >
          <span>←</span>
          <span>Desliza para chatear</span>
        </button>
      )}

      {/* Chat overlay with transparent background */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-10 flex flex-col transition-transform duration-300 ease-out",
          isDragging.current && "transition-none"
        )}
        style={{ 
          transform: `translateX(${getTransformOffset()}px)`,
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

        {/* Swipe hint at top when visible */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 backdrop-blur-sm text-muted-foreground text-xs">
          <span>Desliza → para ver a {characterName}</span>
        </div>
      </div>
    </div>
  );
};
