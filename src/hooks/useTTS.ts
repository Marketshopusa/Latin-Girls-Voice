import { useState, useRef, useCallback } from 'react';
import { VoiceType } from '@/types';

interface UseTTSOptions {
  voiceType: VoiceType;
}

// Voice configuration for Web Speech API fallback
const WEB_SPEECH_VOICE_CONFIG: Record<string, { lang: string; gender: 'female' | 'male'; patterns: RegExp[] }> = {
  COLOMBIANA_PAISA: { lang: 'es', gender: 'female', patterns: [/colombia/i, /spanish.*female/i, /female.*spanish/i] },
  VENEZOLANA_GOCHA: { lang: 'es', gender: 'female', patterns: [/venezuela/i, /spanish.*female/i, /female.*spanish/i] },
  VENEZOLANA_CARACAS: { lang: 'es', gender: 'female', patterns: [/venezuela/i, /spanish.*female/i, /female.*spanish/i] },
  ARGENTINA_SUAVE: { lang: 'es', gender: 'female', patterns: [/argentin/i, /spanish.*female/i, /female.*spanish/i] },
  MEXICANA_NORTENA: { lang: 'es', gender: 'female', patterns: [/mexic/i, /spanish.*female/i, /female.*spanish/i] },
  MASCULINA_PROFUNDA: { lang: 'es', gender: 'male', patterns: [/spanish.*male/i, /male.*spanish/i, /jorge/i, /carlos/i] },
  MASCULINA_SUAVE: { lang: 'es', gender: 'male', patterns: [/spanish.*male/i, /male.*spanish/i] },
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Find best matching voice for Web Speech API
  const findBestVoice = useCallback((voices: SpeechSynthesisVoice[], config: typeof WEB_SPEECH_VOICE_CONFIG[string]) => {
    // First try to find a voice matching patterns
    for (const pattern of config.patterns) {
      const match = voices.find(v => 
        v.lang.startsWith('es') && pattern.test(v.name)
      );
      if (match) return match;
    }

    // Filter Spanish voices
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    
    // Try to find by gender based on common naming patterns
    const genderPatterns = config.gender === 'female' 
      ? [/female/i, /mujer/i, /elena/i, /lucia/i, /maria/i, /carmen/i, /paulina/i, /monica/i, /jorge/i]
      : [/male/i, /hombre/i, /jorge/i, /carlos/i, /diego/i, /pablo/i];
    
    // For female, exclude male-sounding names
    const maleNames = [/jorge/i, /carlos/i, /diego/i, /pablo/i, /andres/i, /miguel/i];
    
    if (config.gender === 'female') {
      // Find female voice (exclude male names)
      const femaleVoice = spanishVoices.find(v => 
        !maleNames.some(pattern => pattern.test(v.name))
      );
      if (femaleVoice) return femaleVoice;
    } else {
      // Find male voice
      const maleVoice = spanishVoices.find(v =>
        maleNames.some(pattern => pattern.test(v.name))
      );
      if (maleVoice) return maleVoice;
    }

    // Fallback: just use any Spanish voice
    return spanishVoices[0] || voices.find(v => v.lang.startsWith('es')) || voices[0];
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

      const config = WEB_SPEECH_VOICE_CONFIG[voiceType] || WEB_SPEECH_VOICE_CONFIG.ARGENTINA_SUAVE;
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;
      utterance.pitch = config.gender === 'female' ? 1.1 : 0.9;

      // Get voices and find best match
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = findBestVoice(voices, config);
      
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log('Using voice:', bestVoice.name, bestVoice.lang);
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
  }, [voiceType, findBestVoice]);

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
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as any)?.error || '';
        
        // Check for quota exceeded
        if (errorMsg.includes('quota') || response.status === 401) {
          console.log("ElevenLabs quota exceeded, using Web Speech fallback...");
          setError("Cuota de ElevenLabs agotada. Usando voz del navegador.");
        } else {
          console.log("ElevenLabs failed, using Web Speech fallback...");
        }
        
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
          setIsLoading(false);
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
