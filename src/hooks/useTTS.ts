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

  // Preparar texto para TTS - Mantener puntuación natural para pausas
  const prepareTextForTTS = useCallback((raw: string): string => {
    const dialogueOnly: string[] = [];

    // Formato 1: **_texto_** (negrita + cursiva)
    const re1 = /\*\*_(.+?)_\*\*/gs;
    for (const match of raw.matchAll(re1)) {
      const content = (match[1] || "").trim();
      if (content) dialogueOnly.push(content);
    }

    // Formato 2: **texto** (solo negrita - común en el chat)
    const re2 = /\*\*([^*_]+?)\*\*/gs;
    for (const match of raw.matchAll(re2)) {
      const content = (match[1] || "").trim();
      if (content && !dialogueOnly.includes(content)) {
        dialogueOnly.push(content);
      }
    }

    let joined: string;
    if (dialogueOnly.length === 0) {
      // Eliminar acciones en cursiva simple *acción* y usar el resto
      joined = raw
        .replace(/\*[^*]+\*/g, '')
        .replace(/\*\*/g, '')
        .replace(/_/g, '')
        .trim();
      
      if (!joined) return "";
    } else {
      joined = dialogueOnly.join(" ");
    }

    // Limpieza de markdown residual
    joined = joined
      .replace(/\*\*/g, "")
      .replace(/_/g, "")
      .trim();

    // === OPTIMIZACIÓN PARA FLUIDEZ NATURAL CON PAUSAS ===
    // Mantener puntuación para pausas naturales (comas, puntos, signos)
    
    // Normalizar múltiples comas pero mantenerlas
    joined = joined.replace(/,{2,}/g, ",");
    
    // Normalizar múltiples puntos (pero permitir "...")
    joined = joined.replace(/\.{4,}/g, "...");
    
    // Mantener signos de exclamación e interrogación
    joined = joined.replace(/!{2,}/g, "!");
    joined = joined.replace(/\?{2,}/g, "?");
    joined = joined.replace(/¡{2,}/g, "¡");
    joined = joined.replace(/¿{2,}/g, "¿");
    
    // Convertir guiones largos a comas (para pausas)
    joined = joined.replace(/[—–]+/g, ", ");
    
    // Eliminar paréntesis y corchetes pero mantener contenido
    joined = joined.replace(/[()[\]{}]/g, "");
    
    // Normalizar espacios
    joined = joined.replace(/\s+/g, " ").trim();
    
    // Asegurar espacio después de puntuación
    joined = joined.replace(/([.!?,:])([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, "$1 $2");

    const MAX_CHARS = 1500;
    return joined.length > MAX_CHARS ? joined.slice(0, MAX_CHARS) : joined;
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
