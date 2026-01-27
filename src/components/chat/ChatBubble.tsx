import { Play, Pause } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ChatBubbleProps {
  message: Message;
  characterName?: string;
}

export const ChatBubble = ({ message, characterName }: ChatBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.role === 'user';

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    // Audio playback logic would go here
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
        {!isUser && message.audioDuration && (
          <button
            onClick={toggleAudio}
            className="audio-button mt-3"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>{message.audioDuration}"</span>
          </button>
        )}
      </div>
    </div>
  );
};
