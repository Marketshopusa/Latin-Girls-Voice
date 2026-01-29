import { useState, useRef, useCallback } from 'react';
import { VoiceType } from '@/types';

interface UseTTSOptions {
  voiceType: VoiceType;
}

// Mapeo de voces Gemini a Google Cloud TTS para fallback
const GEMINI_TO_GOOGLE_FALLBACK: Record<string, string> = {
  'LATINA_CALIDA': 'LATINA_CALIDA',
  'LATINA_COQUETA': 'LATINA_COQUETA',
  'MEXICANA_DULCE': 'MEXICANA_DULCE',
  'LATINO_PROFUNDO': 'LATINO_PROFUNDO',
  'LATINO_SUAVE': 'LATINO_SUAVE',
  // Los acentos regionales de Gemini mapean a voces similares en Google Cloud
  'VENEZOLANA': 'LATINA_COQUETA',
  'COLOMBIANA': 'LATINA_CALIDA',
  'ARGENTINA': 'MEXICANA_DULCE',
};

export const useTTS = ({ voiceType }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Preparar texto para TTS - SOLO diálogo (extrae TODOS los bloques **_..._** aunque vengan en la misma línea)
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

    // Limpieza defensiva por si llega markdown suelto
    joined = joined
      .replace(/\*\*/g, "")
      .replace(/_/g, "")
      .replace(/\s+/g, " ")
      .trim();

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

  // Llamar a un endpoint TTS específico
  const callTTSEndpoint = async (endpoint: string, text: string, voice: string): Promise<Response> => {
    return fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceType: voice }),
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

      // Intentar primero con Gemini TTS
      let response = await callTTSEndpoint("gemini-tts", ttsText, voiceType);

      // Si Gemini falla (429 rate limit u otro error), usar Google Cloud TTS como fallback
      if (!response.ok) {
        const errorStatus = response.status;
        console.warn(`Gemini TTS failed (${errorStatus}), falling back to Google Cloud TTS`);
        
        // Mapear la voz de Gemini a una equivalente de Google Cloud
        const fallbackVoice = GEMINI_TO_GOOGLE_FALLBACK[voiceType] || 'LATINA_COQUETA';
        
        response = await callTTSEndpoint("google-cloud-tts", ttsText, fallbackVoice);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Google Cloud TTS fallback also failed:", response.status, errorData);
          throw new Error(`Error de voz: ${response.status}`);
        }
        
        console.log("Using Google Cloud TTS fallback successfully");
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
