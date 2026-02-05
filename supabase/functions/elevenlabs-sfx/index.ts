 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * ElevenLabs Sound Effects API
  * 
  * Genera efectos de sonido expresivos como gemidos, suspiros, gritos, etc.
  * Duración máxima: 22 segundos
  */
 
 // Catálogo de efectos expresivos predefinidos
 const SFX_PRESETS: Record<string, { prompt: string; duration: number }> = {
   // Gemidos y suspiros
   "moan-soft": {
     prompt: "soft sensual female moan, breathy, intimate whisper, pleasure sound",
     duration: 2,
   },
   "moan-intense": {
     prompt: "intense passionate female moan, pleasure, ecstasy, breathy gasping",
     duration: 3,
   },
   "sigh-pleasure": {
     prompt: "female sigh of pleasure, soft exhale, satisfied, relaxed, intimate",
     duration: 1.5,
   },
   "gasp-surprise": {
     prompt: "female gasp of surprise, sharp inhale, caught off guard, breathy",
     duration: 1,
   },
   "breath-heavy": {
     prompt: "heavy breathing female, panting, out of breath, intimate, close microphone",
     duration: 3,
   },
   
   // Risas y expresiones
   "giggle-playful": {
     prompt: "playful female giggle, flirty, teasing, lighthearted laughter",
     duration: 2,
   },
   "laugh-seductive": {
     prompt: "seductive female laugh, low and breathy, confident, alluring",
     duration: 2,
   },
   
   // Sonidos de dolor/placer
   "whimper-soft": {
     prompt: "soft female whimper, vulnerable, emotional, gentle cry",
     duration: 1.5,
   },
   "cry-pleasure": {
     prompt: "female cry of pleasure, peak moment, intense, passionate outburst",
     duration: 2,
   },
   
   // Expresiones vocales
   "hmm-thinking": {
     prompt: "female thinking sound, contemplative hmm, curious, interested",
     duration: 1,
   },
   "mmm-approval": {
     prompt: "female mmm sound of approval, satisfied, agreeing, pleased",
     duration: 1,
   },
   "oh-realization": {
     prompt: "female oh sound, realization, understanding, soft exclamation",
     duration: 1,
   },
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const apiKey = Deno.env.get("ELEVENLABS_API_KEY_OVERRIDE") || Deno.env.get("ELEVENLABS_API_KEY");
     
     if (!apiKey) {
       console.error("ELEVENLABS_API_KEY not configured");
       return new Response(
         JSON.stringify({ error: "ElevenLabs API key not configured" }),
         { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { preset, customPrompt, duration } = await req.json();
 
     // Usar preset predefinido o prompt personalizado
     let sfxPrompt: string;
     let sfxDuration: number;
 
     if (preset && SFX_PRESETS[preset]) {
       sfxPrompt = SFX_PRESETS[preset].prompt;
       sfxDuration = SFX_PRESETS[preset].duration;
     } else if (customPrompt) {
       sfxPrompt = customPrompt;
       sfxDuration = Math.min(duration || 3, 22); // Máximo 22 segundos
     } else {
       return new Response(
         JSON.stringify({ 
           error: "Se requiere 'preset' o 'customPrompt'",
           availablePresets: Object.keys(SFX_PRESETS)
         }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log(`ElevenLabs SFX: "${sfxPrompt}" | Duration: ${sfxDuration}s`);
 
     // Llamar a ElevenLabs Sound Generation API
     const response = await fetch(
       "https://api.elevenlabs.io/v1/sound-generation",
       {
         method: "POST",
         headers: {
           "xi-api-key": apiKey,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           text: sfxPrompt,
           duration_seconds: sfxDuration,
           prompt_influence: 0.5, // Balance entre prompt y creatividad
         }),
       }
     );
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("ElevenLabs SFX error:", response.status, errorText);
       
       return new Response(
         JSON.stringify({ 
           error: `Sound generation failed: ${response.status}`, 
           details: errorText 
         }),
         { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // ElevenLabs devuelve audio directamente
     const audioBuffer = await response.arrayBuffer();
 
     console.log(`ElevenLabs SFX Success: ${audioBuffer.byteLength} bytes`);
 
     return new Response(audioBuffer, {
       headers: {
         ...corsHeaders,
         "Content-Type": "audio/mpeg",
         "x-sfx-preset": preset || "custom",
         "x-sfx-duration": String(sfxDuration),
       },
     });
   } catch (error) {
     console.error("ElevenLabs SFX error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });