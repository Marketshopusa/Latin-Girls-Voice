import { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Phone, PhoneOff, Volume2, RotateCcw, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Character } from '@/types';

interface VoiceCallOverlayProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export const VoiceCallOverlay = ({ 
  character, 
  isOpen, 
  onClose,
  agentId 
}: VoiceCallOverlayProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to voice agent');
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('Disconnected from voice agent');
    },
    onMessage: (message: unknown) => {
      console.log('Message:', message);
      const msg = message as { type?: string; agent_response_event?: { agent_response?: string } };
      if (msg.type === 'agent_response') {
        setCurrentTranscript(msg.agent_response_event?.agent_response || '');
      }
    },
    onError: (error) => {
      console.error('Voice agent error:', error);
      setIsConnecting(false);
    },
  });

  // Start call when overlay opens
  useEffect(() => {
    if (isOpen && conversation.status === 'disconnected') {
      startCall();
    }
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [isOpen]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (conversation.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversation.status]);

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    setCallDuration(0);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start conversation with public agent (WebSocket connection)
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
      } as Parameters<typeof conversation.startSession>[0]);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
    }
  }, [conversation, agentId]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    setCallDuration(0);
    setCurrentTranscript('');
    onClose();
  }, [conversation, onClose]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Note: ElevenLabs SDK doesn't have a direct mute function,
    // but we can control input volume
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between p-6">
      {/* Character Image */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-8">
        <div className="relative">
          {/* Animated ring when speaking */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full border-4 border-primary transition-all duration-300",
              conversation.isSpeaking && "animate-pulse scale-105 border-pink-500"
            )}
            style={{
              width: '180px',
              height: '180px',
              margin: '-10px',
            }}
          />
          
          {/* Character avatar */}
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/50">
            {isVideoUrl(character.image) ? (
              <video
                src={character.image}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={character.image}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Speaker indicator */}
          {conversation.isSpeaking && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white animate-pulse" />
            </div>
          )}
        </div>

        {/* Character name */}
        <h2 className="text-2xl font-display font-bold text-foreground mt-4">
          {character.name}
        </h2>

        {/* Status */}
        <p className="text-muted-foreground">
          {isConnecting ? 'Conectando...' : 
           conversation.isSpeaking ? 'Hablando...' : 
           conversation.status === 'connected' ? 'Escuchando...' : 
           'Desconectado'}
        </p>

        {/* Audio visualization bars */}
        {conversation.status === 'connected' && (
          <div className="flex items-center justify-center gap-1 h-16 my-4">
        {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 bg-primary rounded-full transition-all duration-150",
                  conversation.isSpeaking ? "animate-pulse" : ""
                )}
                style={{
                  height: conversation.isSpeaking 
                    ? `${Math.random() * 40 + 20}px` 
                    : '8px',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Current transcript */}
        {currentTranscript && (
          <div className="max-w-sm text-center px-4 py-3 bg-card/50 rounded-lg border border-border/50">
            <p className="text-sm text-foreground">
              {currentTranscript}
            </p>
          </div>
        )}

        {/* Call duration */}
        {conversation.status === 'connected' && (
          <p className="text-sm text-muted-foreground mt-2">
            {formatDuration(callDuration)}
          </p>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex flex-col items-center gap-4 pb-8">
        {/* Secondary controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full bg-card/80"
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>

          {/* Main mic button */}
          <Button
            size="icon"
            className={cn(
              "w-16 h-16 rounded-full transition-all",
              conversation.status === 'connected' 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-muted"
            )}
            disabled={conversation.status !== 'connected'}
          >
            {isMuted ? (
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full bg-card/80"
            onClick={startCall}
            disabled={conversation.status === 'connected' || isConnecting}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        {/* End call button */}
        <Button
          className="w-full max-w-xs h-14 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
          onClick={endCall}
        >
          <PhoneOff className="w-5 h-5" />
          Terminar llamada
        </Button>
      </div>
    </div>
  );
};
