import { Send, Sparkles, Flame } from 'lucide-react';
import { useState } from 'react';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInputProps {
  characterName: string;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ characterName, onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'tranquilo' | 'intenso'>('tranquilo');
  const isMobileOrTablet = useIsMobileOrTablet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const ModeButton = () => {
    const isIntenso = mode === 'intenso';
    
    // Mobile: solo icono con tooltip
    if (isMobileOrTablet) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setMode(isIntenso ? 'tranquilo' : 'intenso')}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isIntenso 
                    ? "bg-primary/20 text-primary" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {isIntenso ? <Flame className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Modo {isIntenso ? 'Intenso 🔥' : 'Tranquilo ✨'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Desktop: botón con texto
    return (
      <button
        type="button"
        onClick={() => setMode(isIntenso ? 'tranquilo' : 'intenso')}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors",
          isIntenso 
            ? "bg-primary/20 text-primary" 
            : "bg-secondary text-muted-foreground hover:text-foreground"
        )}
      >
        {isIntenso ? <Flame className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <span>Modo {isIntenso ? 'Intenso' : 'Tranquilo'}</span>
      </button>
    );
  };

  return (
    <div className={cn(
      "border-t border-border bg-card/50 backdrop-blur-sm",
      isMobileOrTablet ? "p-3 pb-6" : "p-4"
    )}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Mode toggle */}
        <ModeButton />

        {/* Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isMobileOrTablet ? `Mensaje...` : `¿Qué quieres decirle a ${characterName}...`}
            disabled={disabled}
            className={cn(
              "w-full rounded-full bg-muted input-dark text-sm",
              isMobileOrTablet ? "px-4 py-2.5" : "px-4 py-3"
            )}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-glow"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
