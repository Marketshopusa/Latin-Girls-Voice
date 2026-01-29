import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Catálogo de voces Neural2 de Google Cloud TTS.
 * Solo usamos Neural2 (la mejor calidad).
 * NO hay modificaciones de pitch/rate - dejamos que Google maneje la prosodia naturalmente.
 */

interface VoiceConfig {
  voiceName: string;
  languageCode: string;
  ssmlGender: "FEMALE" | "MALE";
}

// Mapeo de nuestros tipos de voz a las voces exactas de Google Cloud
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // Voces femeninas latinas (Neural2 - máxima calidad)
  LATINA_CALIDA: {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
  },
  LATINA_COQUETA: {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
  },
  MEXICANA_DULCE: {
    voiceName: "es-MX-Neural2-A",
    languageCode: "es-MX",
    ssmlGender: "FEMALE",
  },
  // Voces masculinas latinas (Neural2)
  LATINO_PROFUNDO: {
    voiceName: "es-US-Neural2-B",
    languageCode: "es-US",
    ssmlGender: "MALE",
  },
  LATINO_SUAVE: {
    voiceName: "es-US-Neural2-C",
    languageCode: "es-US",
    ssmlGender: "MALE",
  },
};

// Fallback para voces legacy (mapear a LATINA_COQUETA)
const DEFAULT_VOICE: VoiceConfig = VOICE_CONFIG.LATINA_COQUETA;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_CLOUD_TTS_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_CLOUD_TTS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "TTS API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, voiceType } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener configuración de voz - usar default si no existe
    const voiceConfig = VOICE_CONFIG[voiceType] || DEFAULT_VOICE;
    
    // Limpiar texto - preservar puntuación natural para pausas correctas
    const cleanText = text.slice(0, 2000);

    console.log(
      `TTS Request: ${cleanText.length} chars, voice=${voiceConfig.voiceName}, lang=${voiceConfig.languageCode}`
    );

    // Request simple con texto plano - SIN SSML, SIN modificaciones de pitch/rate
    // Dejamos que Neural2 maneje TODO naturalmente
    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.voiceName,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3",
        // Sin pitch, sin speakingRate - valores por defecto de Google
        effectsProfileId: ["headphone-class-device"],
      },
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Cloud TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `TTS failed: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      console.error("No audio content in response");
      return new Response(
        JSON.stringify({ error: "No audio generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decodificar audio base64
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`TTS Success: ${bytes.length} bytes of audio generated`);

    return new Response(bytes.buffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
