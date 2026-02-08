import { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneOff, Volume2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Character, Message } from '@/types';
import { getVoiceProvider } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceCallOverlayProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  conversationHistory: Array<{ role: string; content: string }>;
  addMessageToChat: (role: 'user' | 'assistant', text: string, audioDuration?: number) => Promise<Message | null>;
}

// Clean text for TTS - remove markdown formatting
const cleanTextForTTS = (text: string): string => {
  let cleaned = text.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\*\*_(.+?)_\*\*/gs, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*[^*]+\*/g, '');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned
    .replace(/\*\*/g, '')
    .replace(/_/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return "";
  cleaned = cleaned.replace(/,{2,}/g, ',');
  cleaned = cleaned.replace(/\.{4,}/g, '...');
  cleaned = cleaned.replace(/!{2,}/g, '!');
  cleaned = cleaned.replace(/\?{2,}/g, '?');
  cleaned = cleaned.replace(/¡{2,}/g, '¡');
  cleaned = cleaned.replace(/¿{2,}/g, '¿');
  cleaned = cleaned.replace(/[—–]+/g, ', ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/([.!?,:])([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, '$1 $2');

  const MAX_CHARS = 2500;
  if (cleaned.length <= MAX_CHARS) return cleaned;
  const truncated = cleaned.slice(0, MAX_CHARS);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  if (lastSentenceEnd > MAX_CHARS * 0.6) return truncated.slice(0, lastSentenceEnd + 1);
  return truncated;
};

// Helper to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

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
  
  // CRITICAL: Use refs to track state inside callbacks to avoid stale closures
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isMutedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Store addMessageToChat in a ref so it's always current
  const addMessageRef = useRef(addMessageToChat);
  useEffect(() => { addMessageRef.current = addMessageToChat; }, [addMessageToChat]);

  // Store character in ref for stable access
  const characterRef = useRef(character);
  useEffect(() => { characterRef.current = character; }, [character]);

  const playTTS = useCallback(async (text: string) => {
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    
    try {
      const char = characterRef.current;
      const voiceId = char.voice || 'es-US-Neural2-A';
      const provider = getVoiceProvider(voiceId);
      
      // Get auth token (same as useTTS)
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const endpoint = provider === 'elevenlabs' 
        ? `${baseUrl}/functions/v1/elevenlabs-tts`
        : `${baseUrl}/functions/v1/google-cloud-tts`;
      
      console.log(`[VoiceCall] TTS request: voice=${voiceId}, provider=${provider}, chars=${text.length}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text, voiceType: voiceId }),
      });

      if (!response.ok) {
        console.warn(`[VoiceCall] ${provider} TTS failed (${response.status}), trying fallback...`);
        if (provider === 'elevenlabs') {
          const fallbackResponse = await fetch(
            `${baseUrl}/functions/v1/google-cloud-tts`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({ text, voiceType: 'es-US-Neural2-A' }),
            }
          );
          
          if (!fallbackResponse.ok) {
            console.error('[VoiceCall] Google TTS fallback also failed:', fallbackResponse.status);
            throw new Error('TTS fallback failed');
          }
          
          console.log('[VoiceCall] Google TTS fallback successful');
          const audioBlob = await fallbackResponse.blob();
          const playableBlob = audioBlob.type.includes('audio')
            ? audioBlob
            : new Blob([audioBlob], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(playableBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          audio.onended = () => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            console.error('[VoiceCall] Audio playback error (fallback)');
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
          await audio.play();
          console.log('[VoiceCall] TTS playing (fallback)');
          return;
        }
        throw new Error('TTS request failed');
      }

      console.log('[VoiceCall] TTS response OK, playing audio...');
      const audioBlob = await response.blob();
      const playableBlob = audioBlob.type.includes('audio')
        ? audioBlob
        : new Blob([audioBlob], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(playableBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.log('[VoiceCall] TTS playback ended');
      };
      audio.onerror = (e) => {
        console.error('[VoiceCall] Audio playback error:', e);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
      console.log('[VoiceCall] TTS playing successfully');
    } catch (error) {
      console.error('[VoiceCall] TTS error:', error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  // handleUserMessage stored as ref to always have latest version in recognition callbacks
  const handleUserMessageRef = useRef<(text: string) => Promise<void>>();
  
  handleUserMessageRef.current = async (text: string) => {
    // Use refs for guards - these are always current
    if (isProcessingRef.current || isSpeakingRef.current || !isCallActiveRef.current) {
      console.log('[VoiceCall] Skipping message - processing:', isProcessingRef.current, 'speaking:', isSpeakingRef.current, 'active:', isCallActiveRef.current);
      return;
    }
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setCurrentTranscript('');
    
    console.log('[VoiceCall] Processing user message:', text);
    
    // Add user message to call history
    callHistoryRef.current.push({ role: 'user', content: text });
    
    // Save user message to chat
    await addMessageRef.current('user', text);

    try {
      const char = characterRef.current;
      const response = await supabase.functions.invoke('chat-ai', {
        body: {
          message: text,
          character: {
            name: char.name,
            age: char.age || 25,
            history: char.history,
            tagline: char.tagline || '',
            voice: char.voice || 'LATINA_COQUETA',
            nsfw: char.nsfw || false,
          },
          conversationHistory: callHistoryRef.current.map(msg => ({
            role: msg.role,
            text: msg.content
          })),
        },
      });

      if (response.error) throw response.error;

      const aiText = response.data?.response || 'Lo siento, no pude escucharte bien.';
      console.log('[VoiceCall] AI response received, length:', aiText.length);
      
      setAgentResponse(aiText);
      callHistoryRef.current.push({ role: 'assistant', content: aiText });
      
      const audioDuration = Math.floor(aiText.length / 15);
      await addMessageRef.current('assistant', aiText, audioDuration);

      if (isCallActiveRef.current) {
        await playTTS(cleanTextForTTS(aiText));
      }
    } catch (error) {
      console.error('[VoiceCall] Error getting AI response:', error);
      toast.error('Error al obtener respuesta');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
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
          console.log('[VoiceCall] Speech recognition started');
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

        // Use REFS for guards, not state (avoids stale closure)
        if (finalTranscript && !isProcessingRef.current && !isSpeakingRef.current && isCallActiveRef.current) {
          console.log('[VoiceCall] Final transcript detected:', finalTranscript);
          handleUserMessageRef.current?.(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[VoiceCall] Speech recognition error:', event.error);
        }
        if (event.error === 'network' || event.error === 'service-not-allowed') {
          toast.error('Error en el reconocimiento de voz');
        }
      };

      recognition.onend = () => {
        // Use REFS to check state (avoids stale closure)
        if (isCallActiveRef.current && !isMutedRef.current && !isSpeakingRef.current) {
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
      
      try {
        recognition.start();
        console.log('[VoiceCall] Starting speech recognition...');
      } catch (e) {
        console.error('[VoiceCall] Failed to start recognition:', e);
        toast.error('No se pudo iniciar el reconocimiento de voz');
      }
    } catch (e) {
      console.error('[VoiceCall] Error initializing speech recognition:', e);
      toast.error('Error al inicializar el reconocimiento de voz');
    }

    return () => {
      isCallActiveRef.current = false;
      
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.onerror = null;
          recognition.onresult = null;
          recognition.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      recognitionRef.current = null;
      
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

  // Stop/restart recognition when speaking state changes
  useEffect(() => {
    if (!recognitionRef.current || !isCallActiveRef.current) return;
    
    if (isSpeaking) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    } else if (isConnected && !isMuted) {
      try { recognitionRef.current.start(); } catch (e) { /* already started */ }
    }
  }, [isSpeaking, isConnected, isMuted]);

  const endCall = useCallback(() => {
    isCallActiveRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
      } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      } catch (e) { /* ignore */ }
      audioRef.current = null;
    }
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setCallDuration(0);
    setCurrentTranscript('');
    setAgentResponse('');
    isProcessingRef.current = false;
    isSpeakingRef.current = false;
    isMutedRef.current = false;
    callHistoryRef.current = [];
    
    onClose();
  }, [onClose]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    
    if (recognitionRef.current) {
      if (newMuted) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      } else {
        try { recognitionRef.current.start(); } catch (e) { /* already started */ }
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-black via-black/95 to-black flex flex-col">
      {/* Character image container */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10" />
        
        {isVideoUrl(character.image) ? (
          <video
            src={character.image}
            className="relative z-10 max-h-[70vh] md:max-h-[75vh] w-auto max-w-[90vw] md:max-w-[50vw] object-contain rounded-2xl shadow-2xl shadow-black/50"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={character.image}
            alt={character.name}
            className="relative z-10 max-h-[70vh] md:max-h-[75vh] w-auto max-w-[90vw] md:max-w-[50vw] object-contain rounded-2xl shadow-2xl shadow-black/50"
          />
        )}
        
        {/* Animated ring overlay when speaking */}
        <div className="absolute z-20 inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className={cn(
              "max-h-[70vh] md:max-h-[75vh] w-auto max-w-[90vw] md:max-w-[50vw] aspect-[3/4] rounded-2xl border-4 transition-all duration-300",
              isSpeaking ? "border-pink-500 animate-pulse" : "border-transparent"
            )}
          />
        </div>
        
        {/* Top info bar */}
        <div className="absolute top-0 inset-x-0 z-30 pt-safe px-4 py-4">
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
        
        {/* Speaker indicator */}
        {isSpeaking && (
          <div className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 bg-pink-500/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
              <Volume2 className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
        )}
        
        {/* Audio visualization bars */}
        {isConnected && !isSpeaking && (
          <div className="absolute z-30 bottom-32 md:bottom-36 inset-x-0 flex items-center justify-center gap-1.5">
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

      {/* Control buttons */}
      <div className="absolute bottom-0 inset-x-0 z-40 pb-safe px-6 py-4 md:py-6 flex flex-col items-center gap-3 md:gap-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-8">
        <div className="flex items-center gap-4 md:gap-6">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            ) : (
              <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />
            )}
          </Button>

          <div
            className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all backdrop-blur-md",
              isSpeaking ? "bg-pink-500" :
              isListening && !isMuted ? "bg-primary animate-pulse" :
              "bg-white/20"
            )}
          >
            {isSpeaking ? (
              <Volume2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
            ) : (
              <Mic className="w-6 h-6 md:w-7 md:h-7 text-white" />
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border-white/20"
            disabled
          >
            <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white/50" />
          </Button>
        </div>

        <Button
          className="w-full max-w-[280px] md:max-w-xs h-11 md:h-12 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 text-sm md:text-base"
          onClick={endCall}
        >
          <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
          Terminar llamada
        </Button>
      </div>
    </div>
  );
};

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
