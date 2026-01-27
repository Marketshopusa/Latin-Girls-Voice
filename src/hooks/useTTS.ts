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

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const playAudio = useCallback(async (text: string) => {
    if (isLoading) return;

    // If already playing, stop it
    if (isPlaying && audioRef.current) {
      stopAudio();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      
      // Clean up previous audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setError("Error playing audio");
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("TTS error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPlaying, stopAudio, voiceType]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
