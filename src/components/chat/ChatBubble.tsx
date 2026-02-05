import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { Message, VoiceType, DEFAULT_VOICE } from '@/types';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { ChatMessageContent } from '@/components/chat/ChatMessageContent';
import { useSoundEffects, detectSfxFromText } from '@/hooks/useSoundEffects';

interface ChatBubbleProps {
  message: Message;
  characterName?: string;
  voiceType?: VoiceType;
  autoPlay?: boolean;
}

export const ChatBubble = ({ 
  message, 
  characterName, 
  voiceType = DEFAULT_VOICE,
  autoPlay = false 
}: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const { playAudio, isLoading, isPlaying, error } = useTTS({ voiceType });
  const { playPreset, isPlaying: isSfxPlaying } = useSoundEffects();
  const hasAutoPlayed = useRef(false);
  const hasSfxPlayed = useRef(false);

  // Auto-play SFX for expressions in AI messages
  useEffect(() => {
    if (!isUser && !hasSfxPlayed.current && message.text) {
      const sfxPreset = detectSfxFromText(message.text);
      if (sfxPreset) {
        hasSfxPlayed.current = true;
        // Play SFX before TTS starts (small delay)
        const timer = setTimeout(() => {
          playPreset(sfxPreset);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isUser, message.text, playPreset]);

  // Auto-play TTS for new AI messages
  useEffect(() => {
    if (autoPlay && !isUser && !hasAutoPlayed.current && message.text) {
      hasAutoPlayed.current = true;
      // Delay TTS to allow SFX to play first if present
      const sfxPreset = detectSfxFromText(message.text);
      const delay = sfxPreset ? 2500 : 500; // Wait for SFX if present
      
      const timer = setTimeout(() => {
        playAudio(message.text);
      }, delay);
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
            </div>
        )}
      </div>
    </div>
  );
};

