import { useEffect, useRef } from 'react';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { Message, VoiceType } from '@/types';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { ChatMessageContent } from '@/components/chat/ChatMessageContent';

interface ChatBubbleProps {
  message: Message;
  characterName?: string;
  voiceType?: VoiceType;
  autoPlay?: boolean;
}

export const ChatBubble = ({ 
  message, 
  characterName, 
  voiceType = 'ARGENTINA_SUAVE',
  autoPlay = false 
}: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const { playAudio, isLoading, isPlaying, error } = useTTS({ voiceType });
  const hasAutoPlayed = useRef(false);

  // Auto-play TTS for new AI messages
  useEffect(() => {
    if (autoPlay && !isUser && !hasAutoPlayed.current && message.text) {
      hasAutoPlayed.current = true;
      // Small delay to ensure the message is rendered
      const timer = setTimeout(() => {
        playAudio(message.text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isUser, message.text, playAudio]);

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
        <ChatMessageContent text={message.text} isUser={isUser} />

        {/* Audio player for AI messages */}
        {!isUser && (
            <div className="mt-3">
              <button
                onClick={handlePlayAudio}
                disabled={isLoading}
                className="audio-button flex items-center gap-2"
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
                  {isLoading ? 'Generando...' : isPlaying ? 'Pausar' : error ? 'Reintentar' : 'Escuchar'}
                </span>
              </button>

              {error && (
                <p className="mt-2 text-xs opacity-80">
                  {error}
                </p>
              )}
            </div>
        )}
      </div>
    </div>
  );
};

