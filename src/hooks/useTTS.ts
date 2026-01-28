import { useState, useRef, useCallback } from 'react';
import { VoiceType } from '@/types';

interface UseTTSOptions {
  voiceType: VoiceType;
}

// Map voice types to Web Speech API voice names (browser fallback)
const WEB_SPEECH_VOICE_MAP: Record<string, { lang: string; namePattern: RegExp }> = {
  COLOMBIANA_PAISA: { lang: 'es-CO', namePattern: /colombia|spanish.*colombia/i },
  VENEZOLANA_GOCHA: { lang: 'es-VE', namePattern: /venezuela|spanish.*venezuela/i },
  VENEZOLANA_CARACAS: { lang: 'es-VE', namePattern: /venezuela|spanish.*venezuela/i },
  ARGENTINA_SUAVE: { lang: 'es-AR', namePattern: /argentin|spanish.*argentin/i },
  MEXICANA_NORTENA: { lang: 'es-MX', namePattern: /mexic|spanish.*mexic/i },
  MASCULINA_PROFUNDA: { lang: 'es-MX', namePattern: /mexic|spanish.*mexic/i },
  MASCULINA_SUAVE: { lang: 'es-AR', namePattern: /argentin|spanish.*argentin/i },
};

export const useTTS = ({ voiceType }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const prepareTextForTTS = useCallback((raw: string) => {
    const lines = raw.split("\n");
    const spoken: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const noOuterItalics = trimmed.replace(/^_/, "").replace(/_$/, "").trim();
      const lower = noOuterItalics.toLowerCase();

      if (
        lower.startsWith("acción:") ||
        lower.startsWith("accion:") ||
        lower.startsWith("pensamiento:")
      ) {
        continue;
      }

      const unwrappedDialogue = trimmed
        .replace(/^\*\*_/, "")
        .replace(/_\*\*$/, "")
        .trim();

      const cleaned = unwrappedDialogue.replace(/\*|_/g, "").trim();
      if (cleaned) spoken.push(cleaned);
    }

    const joined = spoken.join("\n");
    const MAX_CHARS = 1500;
    return joined.length > MAX_CHARS ? joined.slice(0, MAX_CHARS) : joined;
  }, []);

  const stopAudio = useCallback(() => {
    // Stop HTML Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop Web Speech
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Web Speech API fallback
  const playWithWebSpeech = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API no disponible'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const voiceConfig = WEB_SPEECH_VOICE_MAP[voiceType] || { lang: 'es-ES', namePattern: /spanish/i };
      utterance.lang = voiceConfig.lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => 
        v.lang.startsWith(voiceConfig.lang.split('-')[0]) && voiceConfig.namePattern.test(v.name)
      ) || voices.find(v => v.lang.startsWith('es'));
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
        resolve();
      };

      utterance.onerror = (e) => {
        setIsPlaying(false);
        reject(new Error(e.error || 'Error de síntesis de voz'));
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    });
  }, [voiceType]);

  const playAudio = useCallback(async (text: string) => {
    if (isLoading) return;

    if (isPlaying) {
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

      // Try ElevenLabs first (best quality)
      const response = await fetch(
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

      if (!response.ok) {
        console.log("ElevenLabs failed, using Web Speech API fallback...");
        setIsLoading(false);
        await playWithWebSpeech(ttsText);
        return;
      }

      const audioBlob = await response.blob();
      
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
        setError("Error playing audio");
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("TTS error:", err);
      // Final fallback to Web Speech
      try {
        const ttsText = prepareTextForTTS(text);
        if (ttsText) {
          await playWithWebSpeech(ttsText);
          return;
        }
      } catch {
        // Ignore fallback error
      }
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType, playWithWebSpeech]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
