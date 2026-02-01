import { useState, useRef, useCallback } from 'react';
import { VoiceType, DEFAULT_VOICE, getVoiceProvider, getVoiceConfig } from '@/types';

interface UseTTSOptions {
  voiceType?: VoiceType;
}

// Voz de fallback de Google Cloud TTS
const GOOGLE_FALLBACK_VOICE: VoiceType = 'es-US-Neural2-A';

export const useTTS = ({ voiceType = DEFAULT_VOICE }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const elevenlabsDisabledRef = useRef(false);

  // Preparar texto para TTS - Extrae diálogo en MÚLTIPLES formatos
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
      // Evitar duplicados si ya se capturó con el primer regex
      if (content && !dialogueOnly.includes(content)) {
        dialogueOnly.push(content);
      }
    }

    // Si no hay diálogo formateado, usar todo el texto (fallback)
    let joined: string;
    if (dialogueOnly.length === 0) {
      // Eliminar acciones en cursiva simple *acción* y usar el resto
      joined = raw
        .replace(/\*[^*]+\*/g, '') // Eliminar *acciones*
        .replace(/\*\*/g, '')
        .replace(/_/g, '')
        .trim();
      
      // Si aún no hay texto, retornar vacío
      if (!joined) return "";
    } else {
      joined = dialogueOnly.join(" ");
    }

    // Limpieza de markdown residual
    joined = joined
      .replace(/\*\*/g, "")
      .replace(/_/g, "")
      .trim();

    // === OPTIMIZACIÓN PARA FLUIDEZ NATURAL ===
    joined = joined.replace(/,+/g, ",");
    joined = joined.replace(/,\s*([.!?])/g, "$1");
    joined = joined.replace(/\.{3,}/g, "..");
    joined = joined.replace(/,\s*(y|o|pero|que)\s/gi, " $1 ");
    joined = joined.replace(/!+/g, "!");
    joined = joined.replace(/\?+/g, "?");
    joined = joined.replace(/¡+/g, "¡");
    joined = joined.replace(/¿+/g, "¿");
    joined = joined.replace(/;/g, ",");
    joined = joined.replace(/[—–-]+/g, " ");
    joined = joined.replace(/[()[\]{}]/g, "");
    joined = joined.replace(/\s+/g, " ").trim();
    joined = joined.replace(/([.!?])([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, "$1 $2");

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

  // Determinar el endpoint TTS según el proveedor
  const getTTSEndpoint = useCallback((provider: 'google' | 'elevenlabs'): string => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (provider === 'elevenlabs') {
      return `${baseUrl}/functions/v1/elevenlabs-tts`;
    }
    return `${baseUrl}/functions/v1/google-cloud-tts`;
  }, []);

  // Llamar al endpoint TTS
  const callTTSEndpoint = async (text: string, voice: VoiceType, provider: 'google' | 'elevenlabs'): Promise<Response> => {
    const endpoint = getTTSEndpoint(provider);
    
    return fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        text, 
        voiceType: voice,
      }),
    });
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

      // Elegir proveedor según la voz seleccionada.
      // Regla: si el usuario selecciona una voz Google, NO intentamos ElevenLabs.
      // Si selecciona ElevenLabs, intentamos ElevenLabs y si falla hacemos fallback a Google.
      const selectedProvider = getVoiceProvider(voiceType);

      const getGoogleFallbackVoice = (selected: VoiceType): VoiceType => {
        const cfg = getVoiceConfig(selected);
        if (!cfg) return GOOGLE_FALLBACK_VOICE;
        if (cfg.provider === 'google') return selected;

        // Fallback por región + género para que NO suene siempre igual.
        if (cfg.region === 'MEXICO') {
          return cfg.gender === 'MALE' ? 'es-MX-Neural2-B' : 'es-MX-Neural2-A';
        }
        if (cfg.region === 'ESPAÑA') {
          return cfg.gender === 'MALE' ? 'es-ES-Neural2-B' : 'es-ES-Neural2-D';
        }
        if (cfg.region === 'ARGENTINA') {
          return cfg.gender === 'MALE' ? 'es-US-Neural2-B' : 'es-ES-Neural2-E';
        }
        if (cfg.region === 'VENEZUELA') {
          return cfg.gender === 'MALE' ? 'es-US-Neural2-C' : 'es-ES-Neural2-C';
        }
        if (cfg.region === 'COLOMBIA') {
          return cfg.gender === 'MALE' ? 'es-US-Neural2-B' : 'es-US-Neural2-A';
        }

        // LATINO y resto
        return cfg.gender === 'MALE' ? 'es-US-Neural2-B' : 'es-US-Neural2-A';
      };

      const googleVoiceForFallback = getGoogleFallbackVoice(voiceType);

      let provider: 'google' | 'elevenlabs' =
        selectedProvider === 'elevenlabs' && !elevenlabsDisabledRef.current
          ? 'elevenlabs'
          : 'google';

      let currentVoice: VoiceType = provider === 'google' ? googleVoiceForFallback : voiceType;

      console.log(`Requesting TTS: provider=${provider}, chars=${ttsText.length}, voice=${currentVoice}`);

      let response = await callTTSEndpoint(ttsText, currentVoice, provider);

      // Si ElevenLabs falla, usar Google Cloud TTS como respaldo
      if (provider === 'elevenlabs' && !response.ok) {
        const errorText = await response.text();
        const isInvalidKey = response.status === 401 && /ELEVENLABS_INVALID_KEY|invalid_api_key|Invalid API key/i.test(errorText);

        if (isInvalidKey) {
          elevenlabsDisabledRef.current = true;
        }

        console.warn(`ElevenLabs failed (${response.status}), falling back to Google Cloud`);

        provider = 'google';
        currentVoice = googleVoiceForFallback;

        console.log(`Fallback to Google Cloud: chars=${ttsText.length}, voice=${currentVoice}`);
        response = await callTTSEndpoint(ttsText, currentVoice, provider);
      }

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
        // Algunos proxies/plataformas pueden devolver headers incorrectos.
        // Si realmente es un error JSON, lo mostramos; si no, asumimos que es audio binario.
        const maybeJson = await response.clone().json().catch(() => null) as any;
        if (maybeJson?.error) {
          throw new Error(typeof maybeJson.error === 'string' ? maybeJson.error : 'Respuesta inválida del servidor de voz');
        }
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
        // Silencioso: evitamos el "letrero" molesto; el usuario puede reintentar.
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
      console.log(`TTS playing successfully (${provider})`);

    } catch (err) {
      console.error("TTS error:", err);
      const errName = (err as any)?.name as string | undefined;
      const errMessage = err instanceof Error ? err.message : String(err);

      // Si el navegador bloquea autoplay (muy común en móvil/desktop sin interacción),
      // no mostramos error para no ensuciar el chat: el usuario puede tocar "Escuchar".
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
