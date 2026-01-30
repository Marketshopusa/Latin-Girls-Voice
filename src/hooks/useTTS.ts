import { useState, useRef, useCallback } from 'react';
import { VoiceType, AccentType, ToneType } from '@/types';

interface UseTTSOptions {
  voiceType: VoiceType;
  accent?: AccentType;
  tone?: ToneType;
}

export const useTTS = ({ voiceType, accent, tone }: UseTTSOptions) => {
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

  // Llamar al endpoint TTS con accent y tone
  const callTTSEndpoint = async (text: string): Promise<Response> => {
    return fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-cloud-tts`,
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
          accent: accent || undefined,
          tone: tone || undefined,
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

      console.log(`Requesting TTS: ${ttsText.length} chars, voice: ${voiceType}, accent: ${accent}, tone: ${tone}`);

      // Gemini-TTS con acentos y tonos expresivos
      const response = await callTTSEndpoint(ttsText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("TTS error:", response.status, errorData);
        
        // Error 503 = servicio temporalmente no disponible (mostrar mensaje amigable)
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
  }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType, accent, tone]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
