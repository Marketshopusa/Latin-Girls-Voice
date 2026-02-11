import { useState, useRef, useCallback } from 'react';
import { VoiceType, DEFAULT_VOICE, getVoiceConfig, normalizeVoiceType, getVoiceProvider } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface UseTTSOptions {
  voiceType?: VoiceType;
}

export const useTTS = ({ voiceType = DEFAULT_VOICE }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Preparar texto para TTS - SOLO diálogo directo, SIN narraciones entre paréntesis
  const prepareTextForTTS = useCallback((raw: string): string => {
    // PASO 1: Eliminar TODAS las narraciones entre paréntesis
    // Esto incluye: (suspira), (Tu voz se quiebra...), etc.
    let text = raw.replace(/\([^)]*\)/g, '');
    
    // PASO 2: Eliminar formatos markdown
    // **_texto_** -> texto
    text = text.replace(/\*\*_(.+?)_\*\*/gs, '$1');
    // **texto** -> texto
    text = text.replace(/\*\*([^*]+?)\*\*/g, '$1');
    // *texto* -> texto (acciones en cursiva)
    text = text.replace(/\*[^*]+\*/g, '');
    // _texto_ -> texto
    text = text.replace(/_([^_]+)_/g, '$1');
    
    // PASO 3: Limpiar residuos
    text = text
      .replace(/\*\*/g, '')
      .replace(/_/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!text) return "";

    // PASO 4: Optimización de puntuación para TTS natural
    text = text.replace(/,{2,}/g, ',');
    text = text.replace(/\.{4,}/g, '...');
    text = text.replace(/!{2,}/g, '!');
    text = text.replace(/\?{2,}/g, '?');
    text = text.replace(/¡{2,}/g, '¡');
    text = text.replace(/¿{2,}/g, '¿');
    text = text.replace(/[—–]+/g, ', ');
    text = text.replace(/\s+/g, ' ').trim();
    text = text.replace(/([.!?,:])([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, '$1 $2');

    // Límite para TTS
    const MAX_CHARS = 2500;
    
    if (text.length <= MAX_CHARS) {
      return text;
    }
    
    const truncated = text.slice(0, MAX_CHARS);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > MAX_CHARS * 0.6) {
      return truncated.slice(0, lastSentenceEnd + 1);
    }
    
    return truncated;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

 
   // Endpoint TTS según proveedor
   const getTTSEndpoint = useCallback((provider: 'elevenlabs' | 'google'): string => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
     return provider === 'elevenlabs' 
       ? `${baseUrl}/functions/v1/elevenlabs-tts`
       : `${baseUrl}/functions/v1/google-cloud-tts`;
  }, []);
 
   // Llamar a Google Cloud TTS como fallback
  const callGoogleTTS = useCallback(async (ttsText: string, normalizedVoice: VoiceType): Promise<Blob | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const endpoint = getTTSEndpoint('google');
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${authToken}`,
        },
         body: JSON.stringify({ 
           text: ttsText, 
           voiceType: normalizedVoice,
         }),
       });
 
       if (!response.ok) {
         console.error("Google TTS fallback error:", response.status);
         return null;
       }
 
       return await response.blob();
     } catch (err) {
       console.error("Google TTS fallback error:", err);
       return null;
     }
   }, [getTTSEndpoint]);

  const playAudio = useCallback(async (text: string) => {
    if (isLoading) return;

    // Toggle play/pause si ya está reproduciendo
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoading(true);
    setError(null);

     try {
       const ttsText = prepareTextForTTS(text);
       if (!ttsText) {
         throw new Error('No hay texto para reproducir.');
       }
 
       // Normalizar la voz
       const normalizedVoice = normalizeVoiceType(voiceType);
       const provider = getVoiceProvider(normalizedVoice);
       
       // Get auth token
       const { data: { session } } = await supabase.auth.getSession();
       const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
       
       console.log(`Requesting TTS: voice=${normalizedVoice}, provider=${provider}, chars=${ttsText.length}`);
 
       let audioBlob: Blob | null = null;
 
       // Intentar con el proveedor principal
       const endpoint = getTTSEndpoint(provider);
       const response = await fetch(endpoint, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
           Authorization: `Bearer ${authToken}`,
         },
         body: JSON.stringify({ 
           text: ttsText, 
           voiceType: normalizedVoice,
         }),
       });

       // Check if response is JSON with fallback flag (ElevenLabs returns 200 + JSON when it fails)
       let needsFallback = false;
       if (response.ok && provider === 'elevenlabs') {
         const contentType = response.headers.get('content-type') || '';
         if (contentType.includes('application/json')) {
           // ElevenLabs edge function returned JSON = error with fallback flag
           const jsonData = await response.json();
           if (jsonData.fallback) {
             console.warn(`ElevenLabs TTS unavailable, switching to Google Cloud fallback...`);
             needsFallback = true;
           }
         } else {
           // Binary audio data = success
           audioBlob = await response.blob();
         }
       } else if (response.ok) {
         audioBlob = await response.blob();
       }

       // Handle non-200 responses (shouldn't happen for ElevenLabs anymore, but keep for Google)
       if (!response.ok) {
         if (provider === 'elevenlabs') {
           console.warn(`ElevenLabs TTS unavailable (${response.status}), switching to Google Cloud fallback...`);
           needsFallback = true;
         } else {
           throw new Error(`Error de voz: ${response.status}`);
         }
       }

       // Fallback silencioso a Google Cloud TTS
       if (needsFallback) {
         audioBlob = await callGoogleTTS(ttsText, 'es-US-Neural2-A');
         if (!audioBlob) {
           throw new Error('Voz no disponible temporalmente');
         }
         console.log("Google Cloud TTS fallback successful");
       }
 
       if (!audioBlob) {
         throw new Error('No se pudo generar audio');
       }
 
      const playableBlob = audioBlob.type.includes('audio')
        ? audioBlob
        : new Blob([audioBlob], { type: 'audio/mpeg' });

      // Limpiar URL anterior
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(playableBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
       console.log(`TTS playing successfully (${provider})`);

    } catch (err) {
      console.error("TTS error:", err);
      const errName = (err as any)?.name as string | undefined;
      const errMessage = err instanceof Error ? err.message : String(err);

      // Si el navegador bloquea autoplay, no mostramos error
      if (
        errName === 'NotAllowedError' ||
        /NotAllowedError/i.test(errMessage) ||
        (/play\(\)/i.test(errMessage) && /not allowed|user gesture|interrupted/i.test(errMessage))
      ) {
        setIsPlaying(false);
        return;
      }

      setError(errMessage || "Error de síntesis de voz");
    } finally {
      setIsLoading(false);
    }
   }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType, getTTSEndpoint, callGoogleTTS]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
