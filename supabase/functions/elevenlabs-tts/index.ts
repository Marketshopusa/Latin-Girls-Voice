 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * ElevenLabs TTS - Voces Premium con modelo Flash v2.5
  * 
  * Modelo: eleven_flash_v2_5 (consume 0.5 créditos por carácter)
  * Soporte: 32 idiomas incluyendo español con acentos latinos
  */
 
 // Catálogo de voces ElevenLabs Premium (españolas/latinas)
 const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string; accent: string }> = {
   // === VOCES FEMENINAS LATINAS ===
   "el-colombiana-paisa": {
     voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily - cálida y expresiva
     name: "Colombiana Paisa",
     accent: "paisa",
   },
   "el-colombiana-bogotana": {
     voiceId: "XrExE9yKIg1WjnnlVkGX", // Matilda - suave
     name: "Colombiana Bogotana", 
     accent: "bogotana",
   },
   "el-venezolana-caraqueña": {
     voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - clara y expresiva
     name: "Venezolana Caraqueña",
     accent: "caraqueña",
   },
   "el-venezolana-caribeña": {
     voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura - cálida
     name: "Venezolana Caribeña",
     accent: "caribeña",
   },
   "el-venezolana-gocha": {
     voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice - suave
     name: "Venezolana Andina",
     accent: "gocha",
   },
   "el-argentina-porteña": {
     voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica - expresiva
     name: "Argentina Porteña",
     accent: "porteña",
   },
   "el-argentina-cordobesa": {
     voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily
     name: "Argentina Cordobesa",
     accent: "cordobesa",
   },
   "el-mexicana-capitalina": {
     voiceId: "XrExE9yKIg1WjnnlVkGX", // Matilda
     name: "Mexicana Capitalina",
     accent: "CDMX",
   },
   "el-mexicana-norteña": {
     voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura
     name: "Mexicana Norteña",
     accent: "norteña",
   },
   "el-chilena": {
     voiceId: "Xb7hH8MSUJpSbSDYk0k2", // Alice
     name: "Chilena",
     accent: "chilena",
   },
   "el-peruana": {
     voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
     name: "Peruana Limeña",
     accent: "limeña",
   },
   "el-española-madrileña": {
     voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica
     name: "Española Madrileña",
     accent: "madrileña",
   },
   // === VOCES MASCULINAS LATINAS ===
   "el-colombiano-paisa": {
     voiceId: "TX3LPaxmHKxFdv7VOQHJ", // Liam - profunda
     name: "Colombiano Paisa",
     accent: "paisa",
   },
   "el-venezolano-caraqueño": {
     voiceId: "iP95p4xoKVk53GoZ742B", // Chris - clara
     name: "Venezolano Caraqueño",
     accent: "caraqueño",
   },
   "el-argentino-porteño": {
     voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - suave
     name: "Argentino Porteño",
     accent: "porteño",
   },
   "el-mexicano-capitalino": {
     voiceId: "cjVigY5qzO86Huf0OWal", // Eric - seria
     name: "Mexicano Capitalino",
     accent: "CDMX",
   },
   "el-español-madrileño": {
     voiceId: "nPczCjzI2devNBz1zQrb", // Brian - narrativo
     name: "Español Madrileño",
     accent: "madrileño",
   },
 };
 
 // Voz por defecto de ElevenLabs
 const DEFAULT_VOICE = "el-colombiana-paisa";
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Obtener API key (priorizar override)
     const apiKey = Deno.env.get("ELEVENLABS_API_KEY_OVERRIDE") || Deno.env.get("ELEVENLABS_API_KEY");
     
     if (!apiKey) {
       console.error("ELEVENLABS_API_KEY not configured");
       return new Response(
         JSON.stringify({ error: "ElevenLabs API key not configured", fallback: true }),
         { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { text, voiceType } = await req.json();
 
     if (!text) {
       return new Response(
         JSON.stringify({ error: "Text is required" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Resolver voz
     const voiceConfig = ELEVENLABS_VOICES[voiceType] || ELEVENLABS_VOICES[DEFAULT_VOICE];
     
     // Limpiar texto (ElevenLabs soporta hasta 5000 chars)
     const cleanText = String(text).slice(0, 3000);
 
     console.log(
       `ElevenLabs TTS: ${cleanText.length} chars | Voice: ${voiceConfig.name} (${voiceConfig.voiceId}) | Model: eleven_flash_v2_5`
     );
 
     // Llamar a ElevenLabs API con modelo Flash v2.5 (0.5 créditos/char)
     const response = await fetch(
       `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}?output_format=mp3_44100_128`,
       {
         method: "POST",
         headers: {
           "xi-api-key": apiKey,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           text: cleanText,
           model_id: "eleven_flash_v2_5", // Modelo económico: 0.5 créditos por carácter
           voice_settings: {
             stability: 0.5,
             similarity_boost: 0.75,
             style: 0.4,
             use_speaker_boost: true,
           },
         }),
       }
     );
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("ElevenLabs TTS error:", response.status, errorText);
       
       return new Response(
         JSON.stringify({ 
           error: `ElevenLabs TTS failed: ${response.status}`, 
           details: errorText,
           fallback: true 
         }),
         { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // ElevenLabs devuelve audio directamente (no base64)
     const audioBuffer = await response.arrayBuffer();
 
     console.log(`ElevenLabs TTS Success: ${audioBuffer.byteLength} bytes | Voice: ${voiceConfig.name}`);
 
     return new Response(audioBuffer, {
       headers: {
         ...corsHeaders,
         "Content-Type": "audio/mpeg",
         "Access-Control-Expose-Headers": "x-tts-voice, x-tts-provider",
         "x-tts-voice": voiceConfig.name,
         "x-tts-provider": "elevenlabs",
       },
     });
   } catch (error) {
     console.error("ElevenLabs TTS error:", error);
     return new Response(
       JSON.stringify({ 
         error: error instanceof Error ? error.message : "Unknown error",
         fallback: true 
       }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });