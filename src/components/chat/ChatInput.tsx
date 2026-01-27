import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  characterName: string;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ characterName, onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'tranquilo' | 'intenso'>('tranquilo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Mode toggle */}
        <button
          type="button"
          onClick={() => setMode(mode === 'tranquilo' ? 'intenso' : 'tranquilo')}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          <span>Modo {mode === 'tranquilo' ? 'Tranquilo' : 'Intenso'}</span>
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`¿Qué quieres decirle a ${characterName}...`}
            disabled={disabled}
            className="w-full px-4 py-3 rounded-full bg-muted input-dark text-sm"
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
