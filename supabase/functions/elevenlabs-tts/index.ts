 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * ElevenLabs TTS - Voces Premium con modelo Flash v2.5
  * 
  * Modelo: eleven_flash_v2_5 (consume 0.5 créditos por carácter)
  * 
  * IMPORTANTE: Solo se usan las voces REALES disponibles en la Voice Library.
  * Verificadas mediante la API /v2/voices con la API key actual.
  */
 
 /**
  * Catálogo de voces ElevenLabs VERIFICADAS
  * Estos voice_id están confirmados en la biblioteca accesible
  */
 const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string; description: string }> = {
   // ========== VOCES LATINAS VERIFICADAS ==========
   
   // Ale - Happy & Lovely (Latina joven, alegre, cálida)
   "el-latina-alegre": {
     voiceId: "n4x17EKVqyxfey8QMqvy",
     name: "Ale",
     description: "Latina joven, alegre, cálida y vibrante",
   },
   
   // Valeria - Venezuelan Spanish (Venezolana, dulce, dinámica)
   "el-venezolana": {
     voiceId: "iyvXhCAqzDxKnq3FDjZl",
     name: "Valeria",
     description: "Venezolana dulce, dinámica y familiar",
   },
   
   // Yessica Rabit - Soft-Spoken (Latina seductora, susurrante, íntima)
   "el-seductora": {
     voiceId: "wbbP5EPoL4EwxUGRl2PE",
     name: "Yessica Soft",
     description: "Latina seductora, susurrante e íntima",
   },
   
   // Yessica Rabit - Alluring (Latina sensual, profunda, cautivadora)
   "el-sensual": {
     voiceId: "IrUuRgsybSxwyiJfDSJu",
     name: "Yessica Allure",
     description: "Latina sensual, profunda y cautivadora",
   },
   
   // ========== VOCES PREMADE (Inglés con calidad premium) ==========
   
   // Sarah - Young professional woman
   "el-sarah": {
     voiceId: "EXAVITQu4vr4xnSDxMaL",
     name: "Sarah",
     description: "Madura, reconfortante y confiada",
   },
   
   // Laura - Enthusiastic quirky 
   "el-laura": {
     voiceId: "FGY2WhTYpPnrIDTdsKH5",
     name: "Laura",
     description: "Entusiasta, peculiar y brillante",
   },
   
   // Jessica - Playful bright
   "el-jessica": {
     voiceId: "cgSgspJ2msm6clMCkdW9",
     name: "Jessica",
     description: "Juguetona, brillante y cálida",
   },
   
   // Lily - Velvety British
   "el-lily": {
     voiceId: "pFZP5JQG7iQjIQuC4Bku",
     name: "Lily",
     description: "Aterciopelada, británica elegante",
   },
   
   // Alice - Clear educator
   "el-alice": {
     voiceId: "Xb7hH8MSUJpSbSDYk0k2",
     name: "Alice",
     description: "Clara, educadora británica",
   },
   
   // Matilda - Professional alto
   "el-matilda": {
     voiceId: "XrExE9yKIg1WjnnlVkGX",
     name: "Matilda",
     description: "Profesional, conocedora",
   },
   
   // Bella - Warm professional
   "el-bella": {
     voiceId: "hpp4J3VqNfWAUOO0d1Us",
     name: "Bella",
     description: "Profesional, brillante y cálida",
   },
 };
 
 // Voz por defecto de ElevenLabs (Valeria venezolana)
 const DEFAULT_VOICE = "el-venezolana";
 
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