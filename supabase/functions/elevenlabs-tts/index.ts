import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  processForVocalInterpretation, 
  type VoiceActingSettings 
} from "../_shared/vocal-interpretation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * ElevenLabs TTS - Voces Premium con Interpretación Vocal Dinámica
 * 
 * Modelo: eleven_flash_v2_5 (consume 0.5 créditos por carácter)
 * 
 * NUEVO: Sistema de actuación vocal que detecta emociones y ajusta
 * automáticamente los parámetros de voz para una interpretación natural.
 */

/**
 * Catálogo de voces ElevenLabs VERIFICADAS
 */
const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string; description: string }> = {
  // ========== VOCES VENEZOLANAS ==========
  
  "el-venezolana-gocha": {
    voiceId: "nR7TRcRXD2dbZqmJivg9",
    name: "Venezolana Gocha",
    description: "Acento gocho venezolano, expresiva y juvenil",
  },
  
  "el-caraqueña": {
    voiceId: "rBlWm6DvQsfBSgHaVzI0",
    name: "Caraqueña",
    description: "Acento caraqueño, expresiva y femenina",
  },
   
  "el-caraqueña-suave": {
    voiceId: "oK1rPi7An5Ii9CAYjLdP",
    name: "Caraqueña Suave",
    description: "Malandra caraqueña dulce y suavecita, 18 años",
  },
  
  "el-caraqueña-malandra": {
    voiceId: "SrW0xDsRgzAnEsFZ9C2y",
    name: "Malandra Caraqueña",
    description: "Caraqueña zumbada y expresiva, 25 años",
  },
  
  "el-pana-vzla": {
    voiceId: "UkrE1PXKZzHbSDLWombK",
    name: "La Pana Vzla",
    description: "Joven caraqueña, tono grave rasposo y retador",
  },
  
  "el-dominic-p": {
    voiceId: "MhqexLpDpHRhh5mFR7EE",
    name: "Dominic P",
    description: "Caraqueña con estilo dominicano, juguetona y desafiante",
  },
  
  "el-caracas01": {
    voiceId: "Na1MRhNLkzddf48WbAxW",
    name: "Caracas 01",
    description: "Ultra-natural caraqueña, malandrosa y expresiva",
  },
  
  // ========== VOCES COLOMBIANAS ==========
  
  "el-colombiana-paisa": {
    voiceId: "wutgczPT1RZgTX0H3qRJ",
    name: "Vanessa Paisa",
    description: "Colombiana paisa, cálida y carismática",
  },
  
  "el-colombiana-natural": {
    voiceId: "MqSrMUk8EHh32HBKytrG",
    name: "Jessica Natural",
    description: "Colombiana natural, cálida y clara",
  },
  
  "el-colombiana-linda": {
    voiceId: "TsKSGPuG26FpNj0JzQBq",
    name: "Linda Enérgica",
    description: "Colombiana enérgica y optimista",
  },
  
  // ========== VOCES LATINAS GENERALES ==========
  
  "el-lina": {
    voiceId: "VmejBeYhbrcTPwDniox7",
    name: "Lina Soleada",
    description: "Soleada, amable y amigable",
  },
  
  "el-teylu": {
    voiceId: "n6b7167RXAtrYaNTTD31",
    name: "Teylu Dramática",
    description: "Segura, dramática y cálida",
  },
  
  "el-maria": {
    voiceId: "GszuzIPs4fVZTjP0EXrv",
    name: "María Radiante",
    description: "Cálida, radiante y melódica",
  },
  
  "el-ana-maria": {
    voiceId: "m7yTemJqdIqrcNleANfX",
    name: "Ana María Calma",
    description: "Calma, natural y clara",
  },
  
  "el-daniela-valentina": {
    voiceId: "fqf2iY1NwgXWQDrrPZjv",
    name: "Daniela Joven",
    description: "Joven, optimista y animada",
  },
  
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
    
    // ⭐ NUEVO: Procesar texto para interpretación vocal dinámica
    const { processedText, context, voiceSettings } = processForVocalInterpretation(text);
    
    // Limpiar texto (ElevenLabs soporta hasta 5000 chars)
    const cleanText = String(processedText).slice(0, 3000);

    console.log(
      `ElevenLabs TTS (Dynamic Acting): ${cleanText.length} chars | Voice: ${voiceConfig.name} | ` +
      `Emotion: ${context.emotion} (${(context.intensity * 100).toFixed(0)}%) | ` +
      `Settings: stability=${voiceSettings.stability}, style=${voiceSettings.style}`
    );

    // ⭐ Llamar a ElevenLabs con parámetros de actuación dinámica
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
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarityBoost,
            style: voiceSettings.style,
            use_speaker_boost: voiceSettings.useSpeakerBoost,
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

    const audioBuffer = await response.arrayBuffer();

    console.log(
      `ElevenLabs TTS Success: ${audioBuffer.byteLength} bytes | ` +
      `Voice: ${voiceConfig.name} | Emotion: ${context.emotion}`
    );

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Access-Control-Expose-Headers": "x-tts-voice, x-tts-provider, x-tts-emotion",
        "x-tts-voice": voiceConfig.name,
        "x-tts-provider": "elevenlabs",
        "x-tts-emotion": context.emotion,
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