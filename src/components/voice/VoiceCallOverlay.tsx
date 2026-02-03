import { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, PhoneOff, Volume2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Character } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceCallOverlayProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: Array<{ role: string; content: string }>;
}

export const VoiceCallOverlay = ({ 
  character, 
  isOpen, 
  onClose,
  conversationHistory
}: VoiceCallOverlayProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const isCallActiveRef = useRef(false);

  // Clean text for TTS - remove markdown formatting
  const cleanTextForTTS = (text: string): string => {
    return text
      .replace(/\*\*_|_\*\*/g, '') // Remove **_ and _**
      .replace(/\*\*|__/g, '')     // Remove ** and __
      .replace(/\*|_/g, '')        // Remove single * and _
      .replace(/^[-–—]\s*/gm, '')  // Remove leading dashes
      .replace(/\n+/g, ' ')        // Replace newlines with spaces
      .trim();
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      setIsListening(true);
      setIsConnected(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript || finalTranscript);

      if (finalTranscript && !isProcessing) {
        handleUserMessage(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Error en el reconocimiento de voz');
      }
    };

    recognition.onend = () => {
      // Restart if still in call and not muted
      if (isOpen && !isMuted && !isSpeaking) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    isCallActiveRef.current = true;
    
    // Initialize call history with conversation context - convert to proper format
    callHistoryRef.current = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Start listening
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }

    return () => {
      isCallActiveRef.current = false;
      recognition.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isOpen]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Stop recognition while speaking
  useEffect(() => {
    if (isSpeaking && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (!isSpeaking && isConnected && !isMuted && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  }, [isSpeaking, isConnected, isMuted]);

  const handleUserMessage = async (text: string) => {
    if (isProcessing || isSpeaking || !isCallActiveRef.current) return;
    
    setIsProcessing(true);
    setCurrentTranscript('');
    
    // Add to call history with correct role
    callHistoryRef.current.push({ role: 'user', content: text });

    try {
      // Get AI response using existing chat-ai function
      const response = await supabase.functions.invoke('chat-ai', {
        body: {
          message: text,
          character: {
            name: character.name,
            age: character.age || 25,
            history: character.history,
            tagline: character.tagline || '',
            voice: character.voice || 'LATINA_COQUETA',
            nsfw: character.nsfw || false,
          },
          conversationHistory: callHistoryRef.current.map(msg => ({
            role: msg.role,
            text: msg.content
          })),
        },
      });

      if (response.error) throw response.error;

      const aiText = response.data?.response || 'Lo siento, no pude escucharte bien.';
      setAgentResponse(aiText);
      callHistoryRef.current.push({ role: 'assistant', content: aiText });

      // Play TTS response - clean text first
      if (isCallActiveRef.current) {
        await playTTS(cleanTextForTTS(aiText));
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Error al obtener respuesta');
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-cloud-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            voiceType: character.voice || 'seductora',
          }),
        }
      );

      if (!response.ok) throw new Error('TTS request failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const endCall = useCallback(() => {
    // Mark call as inactive first to prevent any new processing
    isCallActiveRef.current = false;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort?.();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    // Reset all state
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setCallDuration(0);
    setCurrentTranscript('');
    setAgentResponse('');
    callHistoryRef.current = [];
    
    // Close the overlay
    onClose();
  }, [onClose]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (recognitionRef.current) {
      if (!isMuted) {
        recognitionRef.current.stop();
      } else {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started
        }
      }
    }
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
              isSpeaking && "animate-pulse scale-105 border-pink-500"
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
          {isSpeaking && (
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
          {isProcessing ? 'Pensando...' : 
           isSpeaking ? 'Hablando...' : 
           isListening && !isMuted ? 'Escuchando...' : 
           isMuted ? 'En silencio' :
           'Conectando...'}
        </p>

        {/* Audio visualization bars */}
        {isConnected && (
          <div className="flex items-center justify-center gap-1 h-16 my-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 bg-primary rounded-full transition-all duration-150",
                  (isSpeaking || (isListening && !isMuted)) ? "animate-pulse" : ""
                )}
                style={{
                  height: (isSpeaking || (isListening && !isMuted))
                    ? `${Math.random() * 40 + 20}px` 
                    : '8px',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Current transcript (what user is saying) */}
        {currentTranscript && (
          <div className="max-w-sm text-center px-4 py-3 bg-secondary/50 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground italic">
              "{currentTranscript}"
            </p>
          </div>
        )}

        {/* Agent response */}
        {agentResponse && !currentTranscript && (
          <div className="max-w-sm text-center px-4 py-3 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm text-foreground">
              {agentResponse}
            </p>
          </div>
        )}

        {/* Call duration */}
        {isConnected && (
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
              <MicOff className="w-6 h-6 text-destructive" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Main status indicator */}
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              isSpeaking ? "bg-pink-500" :
              isListening && !isMuted ? "bg-primary animate-pulse" :
              "bg-muted"
            )}
          >
            {isSpeaking ? (
              <Volume2 className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-primary-foreground" />
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full bg-card/80"
            disabled
          >
            <Volume2 className="w-6 h-6" />
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

// Add Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
