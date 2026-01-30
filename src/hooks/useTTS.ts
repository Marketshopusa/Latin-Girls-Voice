import { useState, useRef, useCallback } from 'react';
import { VoiceType, DEFAULT_VOICE } from '@/types';

interface UseTTSOptions {
  voiceType?: VoiceType;
}

export const useTTS = ({ voiceType = DEFAULT_VOICE }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Preparar texto para TTS - SOLO diálogo, optimizado para fluidez natural
  const prepareTextForTTS = useCallback((raw: string): string => {
    const dialogueOnly: string[] = [];

    // Match no-greedy across lines
    const re = /\*\*_(.+?)_\*\*/gs;
    for (const match of raw.matchAll(re)) {
      const content = (match[1] || "").trim();
      if (content) dialogueOnly.push(content);
    }

    // Si no hay diálogo formateado, no reproducir nada
    if (dialogueOnly.length === 0) return "";

    // Unir diálogos con espacios
    let joined = dialogueOnly.join(" ");

    // Limpieza de markdown
    joined = joined
      .replace(/\*\*/g, "")
      .replace(/_/g, "")
      .trim();

    // === OPTIMIZACIÓN PARA FLUIDEZ NATURAL ===
    
    // Reducir comas múltiples a una sola
    joined = joined.replace(/,+/g, ",");
    
    // Eliminar comas antes de puntuación final
    joined = joined.replace(/,\s*([.!?])/g, "$1");
    
    // Reducir puntos suspensivos a solo dos (menos pausa)
    joined = joined.replace(/\.{3,}/g, "..");
    
    // Eliminar comas redundantes (antes de "y", "o", "pero", "que")
    joined = joined.replace(/,\s*(y|o|pero|que)\s/gi, " $1 ");
    
    // Reducir signos de exclamación/interrogación múltiples
    joined = joined.replace(/!+/g, "!");
    joined = joined.replace(/\?+/g, "?");
    joined = joined.replace(/¡+/g, "¡");
    joined = joined.replace(/¿+/g, "¿");
    
    // Eliminar pausas innecesarias (punto y coma → coma simple o nada)
    joined = joined.replace(/;/g, ",");
    
    // Eliminar guiones largos que causan pausas
    joined = joined.replace(/[—–-]+/g, " ");
    
    // Eliminar paréntesis y corchetes (causan pausas artificiales)
    joined = joined.replace(/[()[\]{}]/g, "");
    
    // Reducir espacios múltiples
    joined = joined.replace(/\s+/g, " ").trim();
    
    // Asegurar espaciado correcto después de puntuación
    joined = joined.replace(/([.!?])([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, "$1 $2");

    // Límite de caracteres para TTS
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

  // Llamar al endpoint TTS de Google Cloud
  const callTTSEndpoint = async (text: string): Promise<Response> => {
    return fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-cloud-tts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          text, 
          voiceType,
        }),
      }
    );
  };

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

      console.log(`Requesting TTS: ${ttsText.length} chars, voice: ${voiceType}`);

      // Google Cloud TTS
      const response = await callTTSEndpoint(ttsText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("TTS error:", response.status, errorData);
        
        if (response.status === 503) {
          throw new Error('Voz no disponible temporalmente');
        }
        throw new Error(`Error de voz: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error('Respuesta inválida del servidor de voz');
      }

      const audioBlob = await response.blob();

      // Limpiar URL anterior
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setError("Error al reproducir audio");
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
      console.log("TTS playing successfully");

    } catch (err) {
      console.error("TTS error:", err);
      setError(err instanceof Error ? err.message : "Error de síntesis de voz");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
