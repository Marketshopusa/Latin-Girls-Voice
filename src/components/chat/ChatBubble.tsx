import { useEffect, useRef } from 'react';
import { Play, Pause, Loader2, Volume2, Lock } from 'lucide-react';
import { Message, VoiceType, DEFAULT_VOICE } from '@/types';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { ChatMessageContent } from '@/components/chat/ChatMessageContent';
import { useSoundEffects, detectSfxFromText } from '@/hooks/useSoundEffects';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { playPreset } = useSoundEffects({ voiceType });
  const { limits } = useSubscription();
  const { user } = useAuth();
  const hasAutoPlayed = useRef(false);
  const hasSfxPlayed = useRef(false);

  // Check if TTS is allowed (user logged in AND has TTS access)
  const canUseTTS = user && limits.hasTTS;

  // Auto-play SFX for expressions in AI messages (only if TTS allowed)
  useEffect(() => {
    if (!isUser && !hasSfxPlayed.current && message.text && canUseTTS) {
      const sfxPreset = detectSfxFromText(message.text);
      if (sfxPreset) {
        hasSfxPlayed.current = true;
        const timer = setTimeout(() => {
          playPreset(sfxPreset).catch(() => {
            // Silently ignore SFX errors (e.g. quota exceeded)
          });
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isUser, message.text, playPreset, canUseTTS]);

  // Auto-play TTS for new AI messages (only if TTS allowed)
  useEffect(() => {
    if (autoPlay && !isUser && !hasAutoPlayed.current && message.text && canUseTTS) {
      hasAutoPlayed.current = true;
      const sfxPreset = detectSfxFromText(message.text);
      const delay = sfxPreset ? 2500 : 500;
      
      const timer = setTimeout(() => {
        playAudio(message.text);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isUser, message.text, playAudio, canUseTTS]);

  const handlePlayAudio = () => {
    if (canUseTTS) {
      playAudio(message.text);
    }
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

        {/* Audio player for AI messages - only show if TTS allowed */}
        {!isUser && canUseTTS && (
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

        {/* Show locked state for non-subscribers */}
        {!isUser && !canUseTTS && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs opacity-60">
              <Lock className="h-3 w-3" />
              <span>Audio exclusivo para suscriptores</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
