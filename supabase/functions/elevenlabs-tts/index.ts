import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Voces ElevenLabs con acentos regionales reales
// Estas voces fueron seleccionadas de la Voice Library por su autenticidad regional
const VOICE_MAP: Record<string, { id: string; name: string; description: string }> = {
  // Voces Colombianas
  "COLOMBIANA_PAISA": {
    id: "GPzYRfJNEJniCw2WrKzi",  // Yinet - Upbeat Colombian (voz real colombiana)
    name: "Yinet",
    description: "Voz colombiana femenina auténtica con tono alegre"
  },
  "COLOMBIANA_SUAVE": {
    id: "XrExE9yKIg1WjnnlVkGX",  // Matilda - warm female
    name: "Matilda",
    description: "Voz femenina cálida latina"
  },
  
  // Voces Venezolanas (usando voces latinas expresivas)
  "VENEZOLANA_CARAQUEÑA": {
    id: "EXAVITQu4vr4xnSDxMaL",  // Sarah - expresiva, directa
    name: "Sarah",
    description: "Voz femenina expresiva y directa"
  },
  "VENEZOLANA_GOCHA": {
    id: "cgSgspJ2msm6clMCkdW9",  // Jessica - shy female
    name: "Jessica",
    description: "Voz femenina suave y tímida"
  },
  
  // Voces Latinas Genéricas Premium
  "LATINA_EXPRESIVA": {
    id: "pFZP5JQG7iQjIQuC4Bku",  // Lily
    name: "Lily",
    description: "Voz femenina seductora"
  },
  "LATINA_FUERTE": {
    id: "FGY2WhTYpPnrIDTdsKH5",  // Laura
    name: "Laura",
    description: "Voz femenina fuerte y clara"
  },
  
  // Voces Mexicanas
  "MEXICANA_NATURAL": {
    id: "LlsiGQPTj7Tt7gsEPZl0",  // Gilfoy - Mexican-American
    name: "Gilfoy",
    description: "Voz mexicana casual y calmada"
  },
  
  // Voces Argentinas
  "ARGENTINA_PORTEÑA": {
    id: "t6OyuZ2N3Y2dqVstuTwK",  // Fer - Argentine accent
    name: "Fer",
    description: "Voz argentina con acento porteño"
  },
  
  // Voces Masculinas
  "MASCULINA_PROFUNDA": {
    id: "JBFqnCBsd6RMkjVDRZzb",  // George - deep male
    name: "George",
    description: "Voz masculina profunda"
  },
  "MASCULINA_SUAVE": {
    id: "SAz9YHcvj6GT2YYXdXww",  // River - soft male
    name: "River",
    description: "Voz masculina suave"
  },
  "MASCULINA_LATINA": {
    id: "q2XMPZ6icuVDBj7rgCxQ",  // Eleguar - Deep Latin American
    name: "Eleguar",
    description: "Voz masculina latina profunda y natural"
  },
};

// Default voice
const DEFAULT_VOICE_ID = "GPzYRfJNEJniCw2WrKzi"; // Yinet - Colombiana

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceType } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key not configured",
          code: "ELEVENLABS_NOT_CONFIGURED"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener ID de voz
    const voiceConfig = VOICE_MAP[voiceType];
    const voiceId = voiceConfig?.id || DEFAULT_VOICE_ID;
    
    console.log(`ElevenLabs TTS: voice=${voiceType} (${voiceConfig?.name || 'default'}), text=${text.substring(0, 50)}...`);

    // Usar eleven_flash_v2_5 - consume 50% menos créditos
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);

      // Detectar bloqueo por actividad inusual
      const isBlocked = response.status === 401 && 
        (errorText.includes("detected_unusual_activity") || 
         errorText.includes("Free Tier usage disabled"));

      // Detectar límite de cuota
      const isQuotaExceeded = response.status === 429 || 
        errorText.includes("quota") || 
        errorText.includes("limit");

      return new Response(
        JSON.stringify({
          error: isBlocked 
            ? "Cuenta ElevenLabs bloqueada por actividad inusual"
            : isQuotaExceeded
            ? "Límite de cuota ElevenLabs alcanzado"
            : "Error en generación de voz",
          code: isBlocked ? "ELEVENLABS_BLOCKED" : isQuotaExceeded ? "ELEVENLABS_QUOTA" : "ELEVENLABS_ERROR",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`ElevenLabs TTS: success, ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        code: "ELEVENLABS_UNKNOWN_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
