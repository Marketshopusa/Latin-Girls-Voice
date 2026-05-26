import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
 
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

   // Caraqueña suave - Malandra dulce
   "el-caraqueña-suave": {
     voiceId: "oK1rPi7An5Ii9CAYjLdP",
     name: "Caraqueña Suave",
     description: "Malandra caraqueña dulce y suavecita, 18 años",
   },

   // DominicP - Voz caraqueña con acento dominicano
   "el-dominic-p": {
     voiceId: "MhqexLpDpHRhh5mFR7EE",
     name: "Dominic P",
     description: "Caraqueña con estilo dominicano, juguetona y desafiante",
   },

   // VZLA CANDY - Voz dulce venezolana de San Cristóbal
   "el-vzla-candy": {
     voiceId: "719dQR7QYslVxD6ZoaKH",
     name: "Dulces VZLA",
     description: "Voz dulce y etérea, acento venezolano de San Cristóbal",
   },
  
  // ========== VOCES COLOMBIANAS ==========
  
  // Paisa Dulce - Voz colombiana paisa tierna
  "el-paisa-dulce": {
    voiceId: "IzEBGttKuh6NIcZ8AduE",
    name: "Paisa Dulce",
    description: "Colombiana paisa suave, tierna e inocente",
  },
  
  // ========== VOCES ARGENTINAS ==========
  
  // ARG DULCE - Voz argentina dulce
  "el-arg-dulce": {
    voiceId: "qFwDmr5qMPNoIA7KFJQW",
    name: "ARG Dulce",
    description: "Argentina suave, tierna y soñadora",
  },

  // Paola Cheerful - Brillante y enérgica (es-AR)
  "el-paola-cheerful": {
    voiceId: "oMtcuusPYvELKy2OYBJy",
    name: "Paola Cheerful",
    description: "Argentina brillante y enérgica, sonrisa en la voz",
  },
  
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

  // --- Auth check ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  const _sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user: _authUser }, error: _userErr } = await _sb.auth.getUser();
  if (_userErr || !_authUser) {
    console.error('Auth failed:', _userErr?.message);
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // --- End auth check ---

  // --- Plan check (server-side enforcement) ---
  const { getUserPlan } = await import("../_shared/check-plan.ts");
  const planInfo = await getUserPlan(_authUser.id, _authUser.email);
  if (!planInfo.hasTTS && !planInfo.isAdmin) {
    return new Response(JSON.stringify({ error: "TTS no disponible en tu plan actual", fallback: true }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // --- End plan check ---

  // --- Rate limit check ---
  const allowed = await checkRateLimit(_authUser.id, "elevenlabs-tts");
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Límite de peticiones de voz alcanzado. Intenta de nuevo más tarde.", fallback: true }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // --- End rate limit ---

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
 
     // Helper: llama a la API de ElevenLabs con un voiceId
     const callEleven = async (voiceId: string) => {
       return await fetch(
         `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
         {
           method: "POST",
           headers: {
             "xi-api-key": apiKey,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             text: cleanText,
             model_id: "eleven_flash_v2_5",
             voice_settings: {
               stability: 0.5,
               similarity_boost: 0.75,
               style: 0.4,
               use_speaker_boost: true,
             },
           }),
         }
       );
     };

     // Intento principal con la voz solicitada
     let response = await callEleven(voiceConfig.voiceId);
     let usedVoice = voiceConfig.name;

     // Si la voz solicitada no existe en la biblioteca (404 voice_not_found),
     // reintentar con la voz por defecto para no dejar al usuario sin audio.
     if (!response.ok && response.status === 404) {
       const errorText = await response.text();
       console.warn(
         `Voice ${voiceConfig.voiceId} not found, retrying with default voice. Detail: ${errorText}`
       );
       const fallbackVoice = ELEVENLABS_VOICES[DEFAULT_VOICE];
       response = await callEleven(fallbackVoice.voiceId);
       usedVoice = `${fallbackVoice.name} (fallback de ${voiceConfig.name})`;
     }

     if (!response.ok) {
       const errorText = await response.text();
       console.warn("ElevenLabs TTS unavailable:", response.status, errorText);

       return new Response(
         JSON.stringify({
           error: `ElevenLabs TTS failed: ${response.status}`,
           details: errorText,
           fallback: true,
         }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // ElevenLabs devuelve audio directamente (no base64)
     const audioBuffer = await response.arrayBuffer();

     console.log(`ElevenLabs TTS Success: ${audioBuffer.byteLength} bytes | Voice: ${usedVoice}`);

     return new Response(audioBuffer, {
       headers: {
         ...corsHeaders,
         "Content-Type": "audio/mpeg",
         "Access-Control-Expose-Headers": "x-tts-voice, x-tts-provider",
         "x-tts-voice": usedVoice,
         "x-tts-provider": "elevenlabs",
       },
     });
   } catch (error) {
     console.warn("ElevenLabs TTS error:", error);
     return new Response(
       JSON.stringify({ 
         error: error instanceof Error ? error.message : "Unknown error",
         fallback: true 
       }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });