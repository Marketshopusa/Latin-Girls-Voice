import { useState, useRef, useCallback } from 'react';
import { VoiceType } from '@/types';

interface UseTTSOptions {
  voiceType: VoiceType;
}

export const useTTS = ({ voiceType }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Preparar texto para TTS - SOLO diálogo (formato **_texto_**)
  const prepareTextForTTS = useCallback((raw: string): string => {
    const lines = raw.split("\n");
    const dialogueOnly: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // SOLO extraer diálogo: líneas que empiezan con **_ y terminan con _**
      if (/^\*\*_.*_\*\*$/.test(trimmed)) {
        // Extraer solo el contenido del diálogo
        const dialogueContent = trimmed
          .replace(/^\*\*_/, "")
          .replace(/_\*\*$/, "")
          .trim();
        
        if (dialogueContent) {
          dialogueOnly.push(dialogueContent);
        }
      }
    }

    // Si no hay diálogo formateado, no reproducir nada
    if (dialogueOnly.length === 0) {
      return "";
    }

    // Unir diálogos con espacios
    let joined = dialogueOnly.join(" ");
    
    // Normalizar espacios múltiples
    joined = joined.replace(/\s+/g, " ");
    
    // Asegurar espaciado correcto después de puntuación
    joined = joined.replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, "$1 $2");
    
    // Normalizar signos de exclamación/interrogación
    joined = joined.replace(/¡+/g, "¡").replace(/¿+/g, "¿");
    
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

      // Llamar SOLO a Google Cloud TTS - sin fallbacks
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-cloud-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: ttsText, voiceType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("TTS Error:", response.status, errorData);
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
