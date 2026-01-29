import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Voice configuration using EXACT Google Cloud TTS voice names.
 * No pitch or rate modifications - let Google's neural voices speak naturally.
 * 
 * Available Spanish voices from Google Cloud TTS:
 * - es-ES (Spain): Neural2-A/B/C/D/E/F, Wavenet, Standard
 * - es-US (Latin America): Neural2-A/B/C, Wavenet, Standard  
 * - es-MX (Mexico): Wavenet-A/B/C, Standard
 * 
 * Note: Google does NOT have specific voices for Venezuela, Colombia, or Argentina.
 * es-US is the general Latin American Spanish accent.
 */

interface VoiceConfig {
  voiceName: string;
  languageCode: string;
  description: string;
}

// Map our voice types to exact Google Cloud TTS voice names
// Using Neural2 for best quality, with no pitch/rate modifications
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // New simplified voice types
  LATINA_FEMENINA_1: {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    description: "Latin American Spanish female voice (Neural2)",
  },
  LATINA_FEMENINA_2: {
    voiceName: "es-US-Wavenet-A",
    languageCode: "es-US",
    description: "Latin American Spanish female voice (Wavenet)",
  },
  MEXICANA_FEMENINA: {
    voiceName: "es-MX-Wavenet-A",
    languageCode: "es-MX",
    description: "Mexican Spanish female voice (Wavenet)",
  },
  LATINA_MASCULINA_1: {
    voiceName: "es-US-Neural2-B",
    languageCode: "es-US",
    description: "Latin American Spanish male voice (Neural2)",
  },
  LATINA_MASCULINA_2: {
    voiceName: "es-US-Neural2-C",
    languageCode: "es-US",
    description: "Latin American Spanish male voice (Neural2)",
  },
  
  // Legacy voice types for backward compatibility
  COLOMBIANA_PAISA: {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    description: "Latin American Spanish female voice (Neural2)",
  },
  VENEZOLANA_GOCHA: {
    voiceName: "es-US-Wavenet-A",
    languageCode: "es-US",
    description: "Latin American Spanish female voice (Wavenet)",
  },
  VENEZOLANA_CARACAS: {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    description: "Latin American Spanish female voice (Neural2)",
  },
  ARGENTINA_SUAVE: {
    voiceName: "es-US-Wavenet-A",
    languageCode: "es-US",
    description: "Latin American Spanish female voice (Wavenet)",
  },
  MEXICANA_NORTENA: {
    voiceName: "es-MX-Wavenet-A",
    languageCode: "es-MX",
    description: "Mexican Spanish female voice (Wavenet)",
  },
  MASCULINA_PROFUNDA: {
    voiceName: "es-US-Neural2-B",
    languageCode: "es-US",
    description: "Latin American Spanish male voice (Neural2)",
  },
  MASCULINA_SUAVE: {
    voiceName: "es-US-Neural2-C",
    languageCode: "es-US",
    description: "Latin American Spanish male voice (Neural2)",
  },
};

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

    // Get voice configuration - default to a Neural2 voice
    const voiceConfig = VOICE_CONFIG[voiceType] || VOICE_CONFIG.ARGENTINA_SUAVE;
    
    // Clean text - limit length but preserve natural punctuation
    const cleanText = text.slice(0, 1500);

    console.log(
      `Generating TTS: ${cleanText.length} chars, voice=${voiceConfig.voiceName}, lang=${voiceConfig.languageCode}`
    );

    // Use plain text input - let Neural2/Wavenet handle natural speech patterns
    // No SSML, no pitch/rate modifications - pure Google voice quality
    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3",
        // Let Google use default speaking rate (1.0) and pitch (0)
        // No modifications that could make it sound artificial
        effectsProfileId: ["headphone-class-device"],
      },
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

    // Decode base64 audio content
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`Successfully generated ${bytes.length} bytes of audio`);

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
