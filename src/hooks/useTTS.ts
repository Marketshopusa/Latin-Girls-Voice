import { useState, useRef, useCallback } from 'react';
import { VoiceType, DEFAULT_VOICE, getVoiceConfig, normalizeVoiceType } from '@/types';

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

  // Endpoint TTS (solo Google Cloud)
  const getTTSEndpoint = useCallback((): string => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/functions/v1/google-cloud-tts`;
  }, []);

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

      // Normalizar la voz (convierte legacy IDs a Google voices)
      const normalizedVoice = normalizeVoiceType(voiceType);
      
      console.log(`Requesting TTS: voice=${normalizedVoice}, chars=${ttsText.length}`);

      const endpoint = getTTSEndpoint();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          text: ttsText, 
          voiceType: normalizedVoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("TTS error:", response.status, errorData);
        
        if (response.status === 503) {
          throw new Error('Voz no disponible temporalmente');
        }
        throw new Error(`Error de voz: ${response.status}`);
      }

      const audioBlob = await response.blob();
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
      console.log(`TTS playing successfully (Google Cloud)`);

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
  }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType, getTTSEndpoint]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
