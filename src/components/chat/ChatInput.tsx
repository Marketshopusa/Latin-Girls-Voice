import { Send, Sparkles, Flame, RotateCcw, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatInputProps {
  characterName: string;
  onSend: (message: string) => void;
  onRestart?: () => void;
  disabled?: boolean;
}

export const ChatInput = ({ characterName, onSend, onRestart, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'tranquilo' | 'intenso'>('tranquilo');
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const isMobileOrTablet = useIsMobileOrTablet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleRestart = () => {
    setRestartDialogOpen(true);
  };

  const confirmRestart = () => {
    onRestart?.();
    setRestartDialogOpen(false);
  };

  const isIntenso = mode === 'intenso';

  return (
    <>
      <div className={cn(
        "border-t border-border bg-card/50 backdrop-blur-sm",
        isMobileOrTablet ? "p-3 pb-6" : "p-4"
      )}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Mode dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full transition-all",
                  isMobileOrTablet ? "w-10 h-10 justify-center" : "px-3 py-2 text-sm",
                  isIntenso 
                    ? "bg-primary/20 text-primary" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {isIntenso ? <Flame className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {!isMobileOrTablet && (
                  <>
                    <span>Modo {isIntenso ? 'Intenso' : 'Tranquilo'}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem 
                onClick={() => setMode('tranquilo')}
                className={cn(mode === 'tranquilo' && "bg-accent")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Modo Tranquilo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setMode('intenso')}
                className={cn(mode === 'intenso' && "bg-accent")}
              >
                <Flame className="h-4 w-4 mr-2" />
                Modo Intenso
              </DropdownMenuItem>
              {onRestart && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleRestart}
                    className="text-destructive focus:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reiniciar Chat
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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

      <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán todos los mensajes y la conversación empezará desde cero con {characterName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
