import { useState, useRef, useCallback } from 'react';
import { VoiceType } from '@/types';

interface UseTTSOptions {
  voiceType: VoiceType;
}

// Voice configuration for Web Speech API fallback
const WEB_SPEECH_VOICE_CONFIG: Record<string, { lang: string; gender: 'female' | 'male' }> = {
  COLOMBIANA_PAISA: { lang: 'es', gender: 'female' },
  VENEZOLANA_GOCHA: { lang: 'es', gender: 'female' },
  VENEZOLANA_CARACAS: { lang: 'es', gender: 'female' },
  ARGENTINA_SUAVE: { lang: 'es', gender: 'female' },
  MEXICANA_NORTENA: { lang: 'es', gender: 'female' },
  MASCULINA_PROFUNDA: { lang: 'es', gender: 'male' },
  MASCULINA_SUAVE: { lang: 'es', gender: 'male' },
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

      // Skip action and thought lines
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

      // Clean markdown but preserve punctuation for natural speech
      let cleaned = unwrappedDialogue.replace(/\*|_/g, "").trim();
      
      // Normalize multiple spaces
      cleaned = cleaned.replace(/\s+/g, " ");
      
      if (cleaned) spoken.push(cleaned);
    }

    // Join with proper sentence spacing
    let joined = spoken.join(" ");
    
    // Ensure proper spacing after punctuation for natural pauses
    joined = joined.replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, "$1 $2");
    
    // Add natural pause markers for emotional expressions
    joined = joined.replace(/¡+/g, "¡");
    joined = joined.replace(/¿+/g, "¿");
    
    const MAX_CHARS = 800; // Increased for more context
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
  const findBestVoice = useCallback((voices: SpeechSynthesisVoice[], gender: 'female' | 'male') => {
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    const maleNames = [/jorge/i, /carlos/i, /diego/i, /pablo/i, /andres/i, /miguel/i, /male/i];
    
    if (gender === 'female') {
      const femaleVoice = spanishVoices.find(v => 
        !maleNames.some(pattern => pattern.test(v.name))
      );
      if (femaleVoice) return femaleVoice;
    } else {
      const maleVoice = spanishVoices.find(v =>
        maleNames.some(pattern => pattern.test(v.name))
      );
      if (maleVoice) return maleVoice;
    }

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

      const voices = window.speechSynthesis.getVoices();
      const bestVoice = findBestVoice(voices, config.gender);
      
      if (bestVoice) {
        utterance.voice = bestVoice;
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

  // Try a TTS endpoint and return the audio blob if successful
  const tryTTSEndpoint = async (endpoint: string, text: string): Promise<Blob | null> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
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

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('audio')) {
          return await response.blob();
        }
      }
      
      console.log(`${endpoint} failed:`, response.status);
      return null;
    } catch (err) {
      console.log(`${endpoint} error:`, err);
      return null;
    }
  };

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

      // Try TTS providers in order of quality:
      // 1. Google Cloud TTS (high quality Neural2 voices)
      let audioBlob = await tryTTSEndpoint('google-cloud-tts', ttsText);
      
      // 2. Google Translate TTS (free fallback)
      if (!audioBlob) {
        console.log("Google Cloud TTS failed, trying Google Translate TTS...");
        audioBlob = await tryTTSEndpoint('google-tts', ttsText);
      }

      // 3. If all cloud TTS fail, use Web Speech API
      if (!audioBlob) {
        console.log("All cloud TTS failed, using Web Speech API...");
        setError("Usando voz del navegador");
        setIsLoading(false);
        await playWithWebSpeech(ttsText);
        return;
      }

      // Play the audio blob
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
