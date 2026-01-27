import { Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { Message, VoiceType } from '@/types';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';

interface ChatBubbleProps {
  message: Message;
  characterName?: string;
  voiceType?: VoiceType;
}

export const ChatBubble = ({ message, characterName, voiceType = 'ARGENTINA_SUAVE' }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const { playAudio, isLoading, isPlaying } = useTTS({ voiceType });

  const handlePlayAudio = () => {
    playAudio(message.text);
  };

  return (
    <div
      className={cn(
        'flex w-full animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] lg:max-w-[70%]',
          isUser ? 'chat-bubble-user' : 'chat-bubble-ai'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>

        {/* Audio player for AI messages */}
        {!isUser && (
          <button
            onClick={handlePlayAudio}
            disabled={isLoading}
            className="audio-button mt-3 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <Volume2 className="h-3 w-3 opacity-60" />
            <span className="text-xs">
              {isLoading ? 'Generando...' : isPlaying ? 'Pausar' : 'Escuchar'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
