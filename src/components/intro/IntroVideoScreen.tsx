import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface IntroVideoScreenProps {
  onComplete: () => void;
}

export const IntroVideoScreen = ({ onComplete }: IntroVideoScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Allow skip after 2 seconds
    const timer = setTimeout(() => {
      setCanSkip(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    // Mark as seen in localStorage
    localStorage.setItem('intro_video_seen', 'true');
    // Small delay for fade out animation
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleSkip = () => {
    if (canSkip) {
      handleComplete();
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black animate-fade-out pointer-events-none" />
    );
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] bg-black flex items-center justify-center",
        "transition-opacity duration-500"
      )}
    >
      {/* Video container */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
      >
        <source src="/intro/welcome-video.mp4" type="video/mp4" />
      </video>

      {/* Skip button */}
      {canSkip && (
        <button
          onClick={handleSkip}
          className={cn(
            "absolute bottom-8 right-8 px-6 py-3 rounded-full",
            "bg-white/20 backdrop-blur-md border border-white/30",
            "text-white font-medium text-sm",
            "hover:bg-white/30 transition-all duration-300",
            "animate-fade-in"
          )}
        >
          Saltar intro →
        </button>
      )}

      {/* Progress indicator - tap anywhere hint */}
      <div className="absolute bottom-8 left-8 text-white/50 text-xs animate-pulse">
        Toca para continuar
      </div>

      {/* Tap anywhere to skip (after delay) */}
      {canSkip && (
        <div 
          className="absolute inset-0 cursor-pointer" 
          onClick={handleSkip}
        />
      )}
    </div>
  );
};
