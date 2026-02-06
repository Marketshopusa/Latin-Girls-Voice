 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  // ========== VOCES VENEZOLANAS ==========
  
  // diominicana venezolana - Gocha accent
  "el-venezolana-gocha": {
    voiceId: "nR7TRcRXD2dbZqmJivg9",
    name: "Venezolana Gocha",
    description: "Acento gocho venezolano, expresiva y juvenil",
  },
  
  // caraqueña loca - Caracas accent
  "el-caraqueña": {
    voiceId: "rBlWm6DvQsfBSgHaVzI0",
    name: "Caraqueña",
    description: "Acento caraqueño, expresiva y femenina",
  },
   
   // Caraqueña suave - Malandra dulce
   "el-caraqueña-suave": {
     voiceId: "oK1rPi7An5Ii9CAYjLdP",
     name: "Caraqueña Suave",
     description: "Malandra caraqueña dulce y suavecita, 18 años",
   },
   
   // Caraqueña Malandra - Expresiva y zumbada
   "el-caraqueña-malandra": {
     voiceId: "SrW0xDsRgzAnEsFZ9C2y",
     name: "Malandra Caraqueña",
     description: "Caraqueña zumbada y expresiva, 25 años",
   },
  
  // ========== VOCES COLOMBIANAS ==========
  
  // Vanessa - Paisa accent
  "el-colombiana-paisa": {
    voiceId: "wutgczPT1RZgTX0H3qRJ",
    name: "Vanessa Paisa",
    description: "Colombiana paisa, cálida y carismática",
  },
  
  // Jessica - Natural Colombian
  "el-colombiana-natural": {
    voiceId: "MqSrMUk8EHh32HBKytrG",
    name: "Jessica Natural",
    description: "Colombiana natural, cálida y clara",
  },
  
  // Linda Gómez - Energetic
  "el-colombiana-linda": {
    voiceId: "TsKSGPuG26FpNj0JzQBq",
    name: "Linda Enérgica",
    description: "Colombiana enérgica y optimista",
  },
  
  // ========== VOCES LATINAS GENERALES ==========
  
  // Lina - Sunny and friendly
  "el-lina": {
    voiceId: "VmejBeYhbrcTPwDniox7",
    name: "Lina Soleada",
    description: "Soleada, amable y amigable",
  },
  
  // Teylu - Dramatic and warm
  "el-teylu": {
    voiceId: "n6b7167RXAtrYaNTTD31",
    name: "Teylu Dramática",
    description: "Segura, dramática y cálida",
  },
  
  // María - Radiant and melodic
  "el-maria": {
    voiceId: "GszuzIPs4fVZTjP0EXrv",
    name: "María Radiante",
    description: "Cálida, radiante y melódica",
  },
  
  // Ana María - Calm and natural
  "el-ana-maria": {
    voiceId: "m7yTemJqdIqrcNleANfX",
    name: "Ana María Calma",
    description: "Calma, natural y clara",
  },
  
  // Daniela Valentina - Young and optimistic
  "el-daniela-valentina": {
    voiceId: "fqf2iY1NwgXWQDrrPZjv",
    name: "Daniela Joven",
    description: "Joven, optimista y animada",
  },
  
  // Ligia Elena - Serene and neutral
  "el-ligia-elena": {
    voiceId: "4VDZLGtT3KMPG6CtDKCT",
    name: "Ligia Elena Serena",
    description: "Tranquila, pulida y neutral",
  },
 };
 
// Voz por defecto de ElevenLabs (Vanessa colombiana paisa)
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