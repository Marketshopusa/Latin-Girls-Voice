import { useState, useRef, useCallback } from 'react';
import { VoiceType, DEFAULT_VOICE, getVoiceConfig, normalizeVoiceType, getVoiceProvider } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface UseTTSOptions {
  voiceType?: VoiceType;
}

export const useTTS = ({ voiceType = DEFAULT_VOICE }: UseTTSOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Mapeo de expresiones a texto vocal expresivo para integrar en TTS
  const EXPRESSION_TO_VOCAL: Record<string, string> = {
    // Gemidos y suspiros
    'gime': '¡Ay!... mmm...',
    'gimes': '¡Ay!... mmm...',
    'gimiendo': '¡Ay!... mmm...',
    'gime suavemente': 'Mmm... ay...',
    'gime fuerte': '¡Ay, Dios!... ¡Ay!...',
    'gime con fuerza': '¡Ay, Dios!... ¡Ay!...',
    'gime intensamente': '¡Ayyy!... ¡Dios!...',
    'suelta un gemido': '¡Ay!... mmm...',
    // Suspiros
    'suspira': 'Mmm... ay...',
    'suspiro': 'Mmm... ay...',
    'suelta un suspiro': 'Mmm... ay...',
    'suspira profundamente': 'Ahhh... mmm...',
    // Jadeos
    'jadea': 'Ah... ah...',
    'jadeando': 'Ah... ah... ah...',
    'jadeo': 'Ah... ah...',
    // Respiración
    'respira agitadamente': 'Ah... ah... ah...',
    'respiración pesada': 'Ah... ah...',
    'sin aliento': 'Ah... ah...',
    // Risas
    'ríe': '¡Ja ja ja!',
    'se ríe': '¡Ja ja ja!',
    'risita': 'Ji ji ji...',
    'riendo': '¡Ja ja ja!',
    'ríe seductoramente': 'Mmm... ja ja...',
    'risa traviesa': 'Ji ji ji...',
    'carcajada': '¡Ja ja ja ja!',
    // Sorpresa
    'sorprendida': '¡Oh!...',
    'asombrada': '¡Oh!... ¡Wow!...',
    'grita': '¡Ayyy!...',
    'grito de placer': '¡Ay, Dios mío!...',
    // Llanto
    'llora': 'Snif... snif...',
    'llorando': 'Snif... snif...',
    'solloza': 'Mmm... snif...',
    // Besos
    'besa': 'Mwah...',
    'te besa': 'Mwah...',
    // Otros
    'ronronea': 'Mrrr... mmm...',
    'muerde su labio': 'Mmm...',
    'se estremece': '¡Oh!... mmm...',
    'tiembla': 'Ah... mmm...',
    'se viene': '¡Ayyy!... ¡Dios!... ¡Ay!...',
  };

  // Convertir expresiones entre *...* o (...) a texto vocal expresivo
  const convertExpressionsToVocal = useCallback((text: string): string => {
    // Reemplazar expresiones entre *...* con texto vocal
    let result = text.replace(/\*([^*]+)\*/g, (_match, expression: string) => {
      const expr = expression.trim().toLowerCase();
      // Buscar coincidencia exacta primero
      if (EXPRESSION_TO_VOCAL[expr]) {
        return ` ${EXPRESSION_TO_VOCAL[expr]} `;
      }
      // Buscar coincidencia parcial
      for (const [key, vocal] of Object.entries(EXPRESSION_TO_VOCAL)) {
        if (expr.includes(key)) {
          return ` ${vocal} `;
        }
      }
      // Si es una acción narrativa larga (más de 5 palabras), eliminar
      if (expr.split(' ').length > 5) {
        return ' ';
      }
      // Acciones cortas desconocidas, eliminar
      return ' ';
    });

    // Reemplazar expresiones entre (...) con texto vocal
    result = result.replace(/\(([^)]+)\)/g, (_match, expression: string) => {
      const expr = expression.trim().toLowerCase();
      if (EXPRESSION_TO_VOCAL[expr]) {
        return ` ${EXPRESSION_TO_VOCAL[expr]} `;
      }
      for (const [key, vocal] of Object.entries(EXPRESSION_TO_VOCAL)) {
        if (expr.includes(key)) {
          return ` ${vocal} `;
        }
      }
      // Narraciones entre paréntesis: eliminar
      return ' ';
    });

    return result;
  }, []);

  // Preparar texto para TTS - integra expresiones vocales directamente
  const prepareTextForTTS = useCallback((raw: string): string => {
    // PASO 1: Convertir expresiones a texto vocal expresivo (en vez de eliminarlas)
    let text = convertExpressionsToVocal(raw);
    
    // PASO 2: Eliminar formatos markdown restantes
    // **_texto_** -> texto
    text = text.replace(/\*\*_(.+?)_\*\*/gs, '$1');
    // **texto** -> texto
    text = text.replace(/\*\*([^*]+?)\*\*/g, '$1');
    // _texto_ -> texto
    text = text.replace(/_([^_]+)_/g, '$1');
    
    // PASO 3: Limpiar residuos
    text = text
      .replace(/\*\*/g, '')
      .replace(/_/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!text) return "";

    // PASO 4: Optimización de puntuación para TTS natural
    text = text.replace(/,{2,}/g, ',');
    text = text.replace(/\.{4,}/g, '...');
    text = text.replace(/!{2,}/g, '!');
    text = text.replace(/\?{2,}/g, '?');
    text = text.replace(/¡{2,}/g, '¡');
    text = text.replace(/¿{2,}/g, '¿');
    text = text.replace(/[—–]+/g, ', ');
    text = text.replace(/\s+/g, ' ').trim();
    text = text.replace(/([.!?,:])([A-ZÁÉÍÓÚÑa-záéíóúñ])/g, '$1 $2');

    // Límite para TTS
    const MAX_CHARS = 2500;
    
    if (text.length <= MAX_CHARS) {
      return text;
    }
    
    const truncated = text.slice(0, MAX_CHARS);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > MAX_CHARS * 0.6) {
      return truncated.slice(0, lastSentenceEnd + 1);
    }
    
    return truncated;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

 
   // Endpoint TTS según proveedor
   const getTTSEndpoint = useCallback((provider: 'elevenlabs' | 'google'): string => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
     return provider === 'elevenlabs' 
       ? `${baseUrl}/functions/v1/elevenlabs-tts`
       : `${baseUrl}/functions/v1/google-cloud-tts`;
  }, []);
 
   // Llamar a Google Cloud TTS como fallback
  const callGoogleTTS = useCallback(async (ttsText: string, normalizedVoice: VoiceType): Promise<Blob | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const endpoint = getTTSEndpoint('google');
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${authToken}`,
        },
         body: JSON.stringify({ 
           text: ttsText, 
           voiceType: normalizedVoice,
         }),
       });
 
       if (!response.ok) {
         console.error("Google TTS fallback error:", response.status);
         return null;
       }
 
       return await response.blob();
     } catch (err) {
       console.error("Google TTS fallback error:", err);
       return null;
     }
   }, [getTTSEndpoint]);

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
 
       // Normalizar la voz
       const normalizedVoice = normalizeVoiceType(voiceType);
       const provider = getVoiceProvider(normalizedVoice);
       
       // Get auth token
       const { data: { session } } = await supabase.auth.getSession();
       const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
       
       // ORDEN: Google Cloud TTS es el principal, ElevenLabs solo si la voz es premium
       const useElevenLabs = provider === 'elevenlabs';
       const primaryProvider = useElevenLabs ? 'elevenlabs' : 'google';
       
       console.log(`Requesting TTS: voice=${normalizedVoice}, provider=${primaryProvider}, chars=${ttsText.length}`);
 
       let audioBlob: Blob | null = null;
 
       // Intentar con el proveedor principal
       const endpoint = getTTSEndpoint(primaryProvider);
       const response = await fetch(endpoint, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
           Authorization: `Bearer ${authToken}`,
         },
         body: JSON.stringify({ 
           text: ttsText, 
           voiceType: normalizedVoice,
         }),
       });

       if (primaryProvider === 'elevenlabs') {
         // ElevenLabs: check for JSON fallback flag
         let needsFallback = false;
         if (response.ok) {
           const contentType = response.headers.get('content-type') || '';
           if (contentType.includes('application/json')) {
             const jsonData = await response.json();
             if (jsonData.fallback) {
               console.warn(`ElevenLabs unavailable, falling back to Google Cloud...`);
               needsFallback = true;
             }
           } else {
             audioBlob = await response.blob();
           }
         } else {
           console.warn(`ElevenLabs error (${response.status}), falling back to Google Cloud...`);
           needsFallback = true;
         }

         if (needsFallback) {
           audioBlob = await callGoogleTTS(ttsText, 'es-US-Chirp3-HD-Kore');
           if (!audioBlob) {
             throw new Error('Voz no disponible temporalmente');
           }
         }
       } else {
         // Google Cloud es el principal — sin fallback necesario
         if (!response.ok) {
           throw new Error(`Error de voz: ${response.status}`);
         }
         audioBlob = await response.blob();
       }
 
       if (!audioBlob) {
         throw new Error('No se pudo generar audio');
       }
 
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
        setIsPlaying(false);
      };

      await audio.play();
      setIsPlaying(true);
       console.log(`TTS playing successfully (${provider})`);

    } catch (err) {
      console.error("TTS error:", err);
      const errName = (err as any)?.name as string | undefined;
      const errMessage = err instanceof Error ? err.message : String(err);

      // Si el navegador bloquea autoplay, no mostramos error
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
   }, [isLoading, isPlaying, prepareTextForTTS, stopAudio, voiceType, getTTSEndpoint, callGoogleTTS]);

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
  };
};
