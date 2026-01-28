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

  const prepareTextForTTS = useCallback((raw: string) => {
    // Our chat format is:
    // - Dialogue lines: **_..._**
    // - Meta lines: _Acción: ..._ / _Pensamiento: ..._
    // For TTS we only want spoken dialogue (and we strip markdown wrappers).
    const lines = raw.split("\n");
    const spoken: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Remove surrounding underscores first (meta lines are italicized)
      const noOuterItalics = trimmed.replace(/^_/, "").replace(/_$/, "").trim();
      const lower = noOuterItalics.toLowerCase();

      // Skip actions/thoughts for audio
      if (
        lower.startsWith("acción:") ||
        lower.startsWith("accion:") ||
        lower.startsWith("pensamiento:")
      ) {
        continue;
      }

      // Unwrap **_dialogue_**
      const unwrappedDialogue = trimmed
        .replace(/^\*\*_/, "")
        .replace(/_\*\*$/, "")
        .trim();

      // Also remove any leftover markdown emphasis markers
      const cleaned = unwrappedDialogue.replace(/\*|_/g, "").trim();
      if (cleaned) spoken.push(cleaned);
    }

    // TTS performs better with a reasonable length.
    const joined = spoken.join("\n");
    const MAX_CHARS = 1500;
    return joined.length > MAX_CHARS ? joined.slice(0, MAX_CHARS) : joined;
  }, []);

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
      const ttsText = prepareTextForTTS(text);
      if (!ttsText) {
        throw new Error('No hay texto hablado para reproducir.');
      }

      // Try TTSForFree first (free neural voices with regional accents)
      let response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ttsforfree`,
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

      // If TTSForFree fails, fallback to ElevenLabs
      if (!response.ok) {
        console.log("TTSForFree failed, trying ElevenLabs fallback...");
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
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
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        throw new Error((errorData as any).error || `TTS request failed: ${response.status}`);
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
  }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
