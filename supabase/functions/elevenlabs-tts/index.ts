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
 
/**
 * Catálogo de voces ElevenLabs Premium - Voces hispanas diferenciadas
 * Cada voz tiene un ID único de la Voice Library de ElevenLabs
 * con características de tono, acento y estilo distintas
 */
const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string; accent: string; style: string }> = {
  // ========== VOCES FEMENINAS LATINAS ==========
  
  // COLOMBIANAS
  "el-colombiana-paisa": {
    voiceId: "J4vZAFDEcpenkMp3f3R9", // Valentina - Medellín warm conversational
    name: "Valentina",
    accent: "paisa",
    style: "cálida, conversacional, amigable",
  },
  "el-colombiana-bogotana": {
    voiceId: "86V9x9hrQds83qf7zaGn", // Marcela - Colombian natural engaging
    name: "Marcela",
    accent: "bogotana",
    style: "natural, profesional, suave",
  },
  
  // VENEZOLANAS
  "el-venezolana-caraqueña": {
    voiceId: "iyvXhCAqzDxKnq3FDjZl", // Valeria - Venezuelan dynamic sweet
    name: "Valeria",
    accent: "caraqueña",
    style: "dinámica, dulce, expresiva",
  },
  "el-venezolana-caribeña": {
    voiceId: "n4x17EKVqyxfey8QMqvy", // Ale - Happy & Lovely cheerful
    name: "Alejandra",
    accent: "caribeña",
    style: "alegre, vibrante, encantadora",
  },
  "el-venezolana-gocha": {
    voiceId: "wvLjO30m1EKxxecVo059", // Patricia - calm serene quiet
    name: "Patricia",
    accent: "gocha",
    style: "serena, tranquila, suave",
  },
  
  // ARGENTINAS
  "el-argentina-porteña": {
    voiceId: "9rvdnhrYoXoUt4igKpBw", // Mariana - Intimate deep Buenos Aires
    name: "Mariana",
    accent: "porteña",
    style: "íntima, profunda, emotiva",
  },
  "el-argentina-cordobesa": {
    voiceId: "ctNcnV1Afv0vxW8U4yOC", // Melisa - young Argentinian woman
    name: "Melisa",
    accent: "cordobesa",
    style: "joven, fresca, melodiosa",
  },
  
  // MEXICANAS
  "el-mexicana-capitalina": {
    voiceId: "cXc71f0YJUpgE7PMi4jF", // Eugenia - Expressive Mexican neutral
    name: "Eugenia",
    accent: "CDMX",
    style: "expresiva, neutral, versátil",
  },
  "el-mexicana-norteña": {
    voiceId: "wBnAJRbu3cj93gnAm02O", // Daniela - high energy persuasive
    name: "Daniela",
    accent: "norteña",
    style: "enérgica, persuasiva, directa",
  },
  
  // OTRAS LATINAS
  "el-chilena": {
    voiceId: "prblQcKOdF08ozhxP2mk", // Andrea Rabbit - Chilean warm lovely calm
    name: "Andrea",
    accent: "chilena",
    style: "cálida, encantadora, tranquila",
  },
  "el-peruana": {
    voiceId: "ZIxEPysv7w52OU1uxmur", // Lilli - Latin soothing calm
    name: "Lilli",
    accent: "limeña",
    style: "suave, relajante, dulce",
  },
  
  // ESPAÑOLAS
  "el-española-madrileña": {
    voiceId: "HYlEvvU9GMan5YdjFYpg", // LoidaBurgos - Spanish accent friendly calm
    name: "Loida",
    accent: "madrileña",
    style: "clara, amigable, elegante",
  },
  
  // VOCES ESPECIALES FEMENINAS
  "el-seductora": {
    voiceId: "wbbP5EPoL4EwxUGRl2PE", // Yessica Rabit - Soft seductive whisper
    name: "Yessica",
    accent: "latina",
    style: "seductora, susurrante, íntima",
  },
  "el-sensual": {
    voiceId: "IrUuRgsybSxwyiJfDSJu", // Yessica Rabit Alluring - deep captivating
    name: "Yessica Allure",
    accent: "latina",
    style: "sensual, profunda, cautivadora",
  },
  
  // ========== VOCES MASCULINAS LATINAS ==========
  
  "el-colombiano-paisa": {
    voiceId: "ucWwAruuGtBeHfnAaKcJ", // JuanRestrepoPro - young engineer Paisa accent
    name: "Juan",
    accent: "paisa",
    style: "natural, cercano, auténtico",
  },
  "el-venezolano-caraqueño": {
    voiceId: "lFqce66WsdO9Jd8l0zz2", // Yobanis - warm natural professional
    name: "Yobanis",
    accent: "caraqueño",
    style: "cálido, natural, profesional",
  },
  "el-argentino-porteño": {
    voiceId: "KqSsYz0buWgkvSbaGn1n", // Agustin - powerful Buenos Aires accent
    name: "Agustín",
    accent: "porteño",
    style: "potente, narrativo, auténtico",
  },
  "el-mexicano-capitalino": {
    voiceId: "wSFJ1H2XywFI0wLdTylp", // Karim - neutral Mexican professional
    name: "Karim",
    accent: "CDMX",
    style: "neutral, profesional, claro",
  },
  "el-español-madrileño": {
    voiceId: "syjZiIvIUSwKREBfMpKZ", // Jacobo Montoro - Southern Spain warm
    name: "Jacobo",
    accent: "madrileño",
    style: "cálido, narrativo, cercano",
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