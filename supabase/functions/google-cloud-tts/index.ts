import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google Cloud TTS voice mapping - Using regional Spanish voices for authenticity
// es-MX = Mexican Spanish, es-ES = Spain Spanish (closest to South American cadence)
const VOICE_CONFIG: Record<string, { languageCode: string; name: string; ssmlGender: string; speakingRate?: number; pitch?: number }> = {
  // Colombian - using Spain Spanish with slightly higher pitch for warmth
  COLOMBIANA_PAISA: { languageCode: "es-ES", name: "es-ES-Neural2-A", ssmlGender: "FEMALE", speakingRate: 1.05, pitch: 1.5 },
  // Venezuelan voices - softer, using Spain Spanish
  VENEZOLANA_GOCHA: { languageCode: "es-ES", name: "es-ES-Neural2-A", ssmlGender: "FEMALE", speakingRate: 0.95, pitch: 0.5 },
  VENEZOLANA_CARACAS: { languageCode: "es-ES", name: "es-ES-Neural2-A", ssmlGender: "FEMALE", speakingRate: 1.1, pitch: 0 },
  // Argentine - distinctive cadence
  ARGENTINA_SUAVE: { languageCode: "es-ES", name: "es-ES-Neural2-A", ssmlGender: "FEMALE", speakingRate: 0.95, pitch: -1 },
  // Mexican - using actual Mexican Spanish voice!
  MEXICANA_NORTENA: { languageCode: "es-MX", name: "es-MX-Neural2-A", ssmlGender: "FEMALE", speakingRate: 1.0, pitch: 0 },
  // Male voices
  MASCULINA_PROFUNDA: { languageCode: "es-ES", name: "es-ES-Neural2-B", ssmlGender: "MALE", speakingRate: 0.9, pitch: -3 },
  MASCULINA_SUAVE: { languageCode: "es-ES", name: "es-ES-Neural2-C", ssmlGender: "MALE", speakingRate: 0.95, pitch: -1 },
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

    // Get voice config or default to female Spanish voice
    const voiceConfig = VOICE_CONFIG[voiceType] || VOICE_CONFIG.ARGENTINA_SUAVE;
    
    // Limit text length to avoid excessive costs
    const cleanText = text.slice(0, 1000);

    console.log(`Generating TTS with Google Cloud for ${cleanText.length} chars, voice: ${voiceConfig.name}`);

    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: voiceConfig.speakingRate || 1.0,
        pitch: voiceConfig.pitch || 0,
        effectsProfileId: ["small-bluetooth-speaker-class-device"],
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
