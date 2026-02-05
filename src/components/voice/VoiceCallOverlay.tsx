import { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneOff, Volume2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Character, Message } from '@/types';
import { getVoiceProvider, isPremiumVoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceCallOverlayProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: Array<{ role: string; content: string }>;
  // Function to add messages to the chat history (syncs with DB)
  addMessageToChat: (role: 'user' | 'assistant', text: string, audioDuration?: number) => Promise<Message | null>;
}

export const VoiceCallOverlay = ({ 
  character, 
  isOpen, 
  onClose,
  conversationHistory,
  addMessageToChat
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

    let recognition: any = null;
    
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        if (isCallActiveRef.current) {
          setIsListening(true);
          setIsConnected(true);
        }
      };

      recognition.onresult = (event: any) => {
        if (!isCallActiveRef.current) return;
        
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

        if (finalTranscript && !isProcessing && isCallActiveRef.current) {
          handleUserMessage(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        // Only log non-trivial errors
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition error:', event.error);
        }
        // Don't show toast for common non-critical errors
        if (event.error === 'network' || event.error === 'service-not-allowed') {
          toast.error('Error en el reconocimiento de voz');
        }
      };

      recognition.onend = () => {
        // Only restart if call is still active and not muted and not speaking
        if (isCallActiveRef.current && !isMuted && !isSpeaking) {
          try {
            recognition?.start();
          } catch (e) {
            // Silently ignore - recognition may already be started
          }
        }
      };

      recognitionRef.current = recognition;
      isCallActiveRef.current = true;
      
      // Initialize call history with conversation context
      callHistoryRef.current = conversationHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Start listening with error handling
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        toast.error('No se pudo iniciar el reconocimiento de voz');
      }
    } catch (e) {
      console.error('Error initializing speech recognition:', e);
      toast.error('Error al inicializar el reconocimiento de voz');
    }

    return () => {
      // Mark as inactive first
      isCallActiveRef.current = false;
      
      // Safely stop recognition
      if (recognition) {
        try {
          recognition.onend = null; // Prevent restart on cleanup
          recognition.onerror = null;
          recognition.onresult = null;
          recognition.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      recognitionRef.current = null;
      
      // Stop any playing audio
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
        } catch (e) {
          // Ignore audio cleanup errors
        }
        audioRef.current = null;
      }
      
      setIsConnected(false);
      setIsListening(false);
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
    
    // Add user message to call history
    callHistoryRef.current.push({ role: 'user', content: text });
    
    // Save user message to chat database (sync with chat)
    await addMessageToChat('user', text);

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
      
      // Save assistant message to chat database (sync with chat)
      const audioDuration = Math.floor(aiText.length / 15);
      await addMessageToChat('assistant', aiText, audioDuration);

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
      const voiceId = character.voice || 'es-US-Neural2-A';
      const provider = getVoiceProvider(voiceId);
      
      // Use ElevenLabs for premium voices, Google Cloud for standard
      const endpoint = provider === 'elevenlabs' 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-cloud-tts`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          text,
          voiceType: voiceId,
        }),
      });

      if (!response.ok) {
        // If ElevenLabs fails, fallback to Google Cloud TTS
        if (provider === 'elevenlabs') {
          console.warn('ElevenLabs TTS failed, falling back to Google Cloud');
          const fallbackResponse = await fetch(
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
                voiceType: 'es-US-Neural2-A',
              }),
            }
          );
          
          if (!fallbackResponse.ok) throw new Error('TTS request failed');
          
          const audioBlob = await fallbackResponse.blob();
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
          return;
        }
        throw new Error('TTS request failed');
      }

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
    // Mark call as inactive FIRST to prevent any new processing
    isCallActiveRef.current = false;
    
    // Safely stop speech recognition
    if (recognitionRef.current) {
      try {
        // Remove event handlers to prevent callbacks during cleanup
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    
    // Safely stop any playing audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      } catch (e) {
        // Ignore audio cleanup errors
      }
      audioRef.current = null;
    }
    
    // Reset all state synchronously
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setCallDuration(0);
    setCurrentTranscript('');
    setAgentResponse('');
    callHistoryRef.current = [];
    
    // Close the overlay after state reset
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Full-screen character image */}
      <div className="flex-1 relative overflow-hidden">
        {isVideoUrl(character.image) ? (
          <video
            src={character.image}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={character.image}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Gradient overlay at bottom for controls visibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Animated ring overlay when speaking */}
        <div 
          className={cn(
            "absolute inset-0 border-4 transition-all duration-300 pointer-events-none",
            isSpeaking ? "border-pink-500 animate-pulse" : "border-transparent"
          )}
        />
        
        {/* Top info bar */}
        <div className="absolute top-0 inset-x-0 pt-safe px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-display font-bold text-white drop-shadow-lg">
              {character.name}
            </h2>
            <p className="text-sm text-white/80 drop-shadow">
              {isProcessing ? 'Pensando...' : 
               isSpeaking ? 'Hablando...' : 
               isListening && !isMuted ? 'Escuchando...' : 
               isMuted ? 'En silencio' :
               'Conectando...'}
            </p>
            {isConnected && (
              <p className="text-xs text-white/60 font-mono">
                {formatDuration(callDuration)}
              </p>
            )}
          </div>
        </div>
        
        {/* Speaker indicator floating badge */}
        {isSpeaking && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 bg-pink-500/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
              <Volume2 className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
        )}
        
        {/* Audio visualization bars - floating at center bottom of image */}
        {isConnected && !isSpeaking && (
          <div className="absolute bottom-36 inset-x-0 flex items-center justify-center gap-1.5">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 bg-white/80 rounded-full transition-all duration-150",
                  (isListening && !isMuted) ? "animate-pulse" : ""
                )}
                style={{
                  height: (isListening && !isMuted)
                    ? `${Math.random() * 30 + 10}px` 
                    : '4px',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Control buttons - fixed at bottom */}
      <div className="absolute bottom-0 inset-x-0 pb-safe px-6 py-6 flex flex-col items-center gap-4">
        {/* Control row */}
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-red-400" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </Button>

          {/* Main status indicator */}
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all backdrop-blur-md",
              isSpeaking ? "bg-pink-500" :
              isListening && !isMuted ? "bg-primary animate-pulse" :
              "bg-white/20"
            )}
          >
            {isSpeaking ? (
              <Volume2 className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border-white/20"
            disabled
          >
            <Volume2 className="w-6 h-6 text-white/50" />
          </Button>
        </div>

        {/* End call button */}
        <Button
          className="w-full max-w-xs h-12 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
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
