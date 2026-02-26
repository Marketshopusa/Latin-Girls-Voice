import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
 
 // Presets de efectos de sonido disponibles
 export const SFX_PRESETS = {
   // Gemidos y suspiros
   "moan-soft": { label: "Gemido suave", category: "intimate" },
   "moan-intense": { label: "Gemido intenso", category: "intimate" },
   "sigh-pleasure": { label: "Suspiro de placer", category: "intimate" },
   "gasp-surprise": { label: "Jadeo de sorpresa", category: "intimate" },
   "breath-heavy": { label: "Respiración agitada", category: "intimate" },
   
   // Risas y expresiones
   "giggle-playful": { label: "Risita juguetona", category: "expression" },
   "laugh-seductive": { label: "Risa seductora", category: "expression" },
   
   // Sonidos emocionales
   "whimper-soft": { label: "Gemido suave", category: "emotional" },
   "cry-pleasure": { label: "Grito de placer", category: "intimate" },
   
   // Expresiones vocales
   "hmm-thinking": { label: "Hmm pensativo", category: "expression" },
   "mmm-approval": { label: "Mmm de aprobación", category: "expression" },
   "oh-realization": { label: "Oh de sorpresa", category: "expression" },
 } as const;
 
 export type SfxPreset = keyof typeof SFX_PRESETS;
 
 // Mapeo de expresiones de texto a presets de sonido
 // Las expresiones pueden estar entre paréntesis () o asteriscos *
 const EXPRESSION_TO_SFX: Array<{ patterns: RegExp[]; preset: SfxPreset }> = [
   // Gemidos
   {
     patterns: [
       /\*gime[s]?\*/gi,
       /\(gime[s]?\)/gi,
       /\*gimiendo\*/gi,
       /\(gimiendo\)/gi,
       /\*suelta un gemido\*/gi,
       /\(suelta un gemido\)/gi,
     ],
     preset: "moan-soft",
   },
   {
     patterns: [
       /\*gime fuerte\*/gi,
       /\(gime fuerte\)/gi,
       /\*gime con fuerza\*/gi,
       /\(gime con fuerza\)/gi,
       /\*gime intensamente\*/gi,
       /\(gime intensamente\)/gi,
     ],
     preset: "moan-intense",
   },
   // Suspiros
   {
     patterns: [
       /\*suspira\*/gi,
       /\(suspira\)/gi,
       /\*suspiro\*/gi,
       /\(suspiro\)/gi,
       /\*suelta un suspiro\*/gi,
       /\(suelta un suspiro\)/gi,
     ],
     preset: "sigh-pleasure",
   },
   // Jadeos
   {
     patterns: [
       /\*jadea\*/gi,
       /\(jadea\)/gi,
       /\*jadeando\*/gi,
       /\(jadeando\)/gi,
       /\*jadeo\*/gi,
       /\(jadeo\)/gi,
     ],
     preset: "gasp-surprise",
   },
   // Respiración
   {
     patterns: [
       /\*respira agitad/gi,
       /\(respira agitad/gi,
       /\*respiración pesada\*/gi,
       /\(respiración pesada\)/gi,
       /\*sin aliento\*/gi,
       /\(sin aliento\)/gi,
     ],
     preset: "breath-heavy",
   },
   // Risas
   {
     patterns: [
       /\*ríe\*/gi,
       /\(ríe\)/gi,
       /\*risita\*/gi,
       /\(risita\)/gi,
       /\*se ríe\*/gi,
       /\(se ríe\)/gi,
       /\*riendo\*/gi,
       /\(riendo\)/gi,
     ],
     preset: "giggle-playful",
   },
   {
     patterns: [
       /\*ríe seductora/gi,
       /\(ríe seductora/gi,
       /\*risa traviesa\*/gi,
       /\(risa traviesa\)/gi,
     ],
     preset: "laugh-seductive",
   },
   // Gritos de placer
   {
     patterns: [
       /\*grita\*/gi,
       /\(grita\)/gi,
       /\*grito de placer\*/gi,
       /\(grito de placer\)/gi,
       /\*se viene\*/gi,
       /\(se viene\)/gi,
     ],
     preset: "cry-pleasure",
   },
   // Expresiones vocales
   {
     patterns: [
       /\bmmm+\b/gi,
       /\bhmm+\b/gi,
     ],
     preset: "mmm-approval",
   },
 ];
 
 /**
  * Detecta expresiones en el texto y devuelve el primer preset de SFX correspondiente
  */
 export const detectSfxFromText = (text: string): SfxPreset | null => {
   for (const { patterns, preset } of EXPRESSION_TO_SFX) {
     for (const pattern of patterns) {
       if (pattern.test(text)) {
         return preset;
       }
     }
   }
   return null;
 };
 
 interface UseSoundEffectsOptions {
   onPlay?: () => void;
   onEnd?: () => void;
   onError?: (error: string) => void;
 }
 
 export const useSoundEffects = (options: UseSoundEffectsOptions = {}) => {
   const [isLoading, setIsLoading] = useState(false);
   const [isPlaying, setIsPlaying] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const audioRef = useRef<HTMLAudioElement | null>(null);
   const audioUrlRef = useRef<string | null>(null);
 
   const stopSound = useCallback(() => {
     if (audioRef.current) {
       audioRef.current.pause();
       audioRef.current.currentTime = 0;
     }
     if (audioUrlRef.current) {
       URL.revokeObjectURL(audioUrlRef.current);
       audioUrlRef.current = null;
     }
     setIsPlaying(false);
   }, []);
 
   const playPreset = useCallback(async (preset: SfxPreset) => {
     if (isLoading || isPlaying) {
       stopSound();
       return;
     }
 
     setIsLoading(true);
     setError(null);
 
     try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          throw new Error('Debes iniciar sesión para usar efectos de sonido');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preset }),
          }
        );
 
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || `Error: ${response.status}`);
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
 
       audio.onplay = () => {
         setIsPlaying(true);
         options.onPlay?.();
       };
 
       audio.onended = () => {
         setIsPlaying(false);
         options.onEnd?.();
       };
 
       audio.onerror = () => {
         setIsPlaying(false);
         setError("Error al reproducir audio");
         options.onError?.("Error al reproducir audio");
       };
 
       await audio.play();
     } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Error desconocido";
        console.warn('[SFX] Error silenciado:', errMessage);
        setError(errMessage);
        options.onError?.(errMessage);
     } finally {
       setIsLoading(false);
     }
   }, [isLoading, isPlaying, stopSound, options]);
 
   const playCustom = useCallback(async (prompt: string, duration: number = 3) => {
     if (isLoading || isPlaying) {
       stopSound();
       return;
     }
 
     setIsLoading(true);
     setError(null);
 
     try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          throw new Error('Debes iniciar sesión para usar efectos de sonido');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ customPrompt: prompt, duration }),
          }
        );
 
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || `Error: ${response.status}`);
       }
 
       const audioBlob = await response.blob();
       
       if (audioUrlRef.current) {
         URL.revokeObjectURL(audioUrlRef.current);
       }
 
       const audioUrl = URL.createObjectURL(audioBlob);
       audioUrlRef.current = audioUrl;
 
       const audio = new Audio(audioUrl);
       audioRef.current = audio;
 
       audio.onplay = () => {
         setIsPlaying(true);
         options.onPlay?.();
       };
 
       audio.onended = () => {
         setIsPlaying(false);
         options.onEnd?.();
       };
 
       audio.onerror = () => {
         setIsPlaying(false);
         setError("Error al reproducir audio");
       };
 
       await audio.play();
     } catch (err) {
       const errMessage = err instanceof Error ? err.message : "Error desconocido";
       setError(errMessage);
     } finally {
       setIsLoading(false);
     }
   }, [isLoading, isPlaying, stopSound, options]);
 
   return {
     playPreset,
     playCustom,
     stopSound,
     isLoading,
     isPlaying,
     error,
     presets: SFX_PRESETS,
   };
 };