import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type GoogleSsmlGender = "SSML_VOICE_GENDER_UNSPECIFIED" | "MALE" | "FEMALE" | "NEUTRAL";

interface GoogleVoice {
  name: string;
  languageCodes: string[];
  ssmlGender: GoogleSsmlGender;
  naturalSampleRateHertz: number;
}

interface VoiceConfig {
  languageCode: string;
  ssmlGender: Exclude<GoogleSsmlGender, "SSML_VOICE_GENDER_UNSPECIFIED">;
  /** A soft preference; we'll only pick it if it exists in the real voices list. */
  preferNameIncludes?: string[];
  speakingRate?: number;
  pitch?: number;
}

// IMPORTANT: No hardcoded voice names.
// We only specify languageCode + ssmlGender and then pick a real voice name
// from Google's /voices endpoint (cached) to avoid INVALID_ARGUMENT errors.
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  COLOMBIANA_PAISA: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 1.05,
    pitch: 1.0,
  },
  VENEZOLANA_GOCHA: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.95,
    pitch: 0.5,
  },
  VENEZOLANA_CARACAS: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 1.1,
    pitch: 0,
  },
  ARGENTINA_SUAVE: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.95,
    pitch: -0.5,
  },
  // Mexican accent: request es-MX; pick whatever real voice exists for that locale
  MEXICANA_NORTENA: {
    languageCode: "es-MX",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Wavenet", "Neural2", "Standard"],
    speakingRate: 1.0,
    pitch: 0,
  },
  MASCULINA_PROFUNDA: {
    languageCode: "es-US",
    ssmlGender: "MALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.9,
    pitch: -2,
  },
  MASCULINA_SUAVE: {
    languageCode: "es-US",
    ssmlGender: "MALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.95,
    pitch: -1,
  },
};

let cachedVoices: GoogleVoice[] | null = null;
let cachedVoicesAt = 0;
const VOICES_TTL_MS = 1000 * 60 * 60; // 1h

async function getVoices(apiKey: string): Promise<GoogleVoice[]> {
  const now = Date.now();
  if (cachedVoices && now - cachedVoicesAt < VOICES_TTL_MS) return cachedVoices;

  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
  if (!res.ok) {
    const t = await res.text();
    console.error("Failed to fetch voices list:", res.status, t);
    // Fallback to empty; request will still work without voice.name
    cachedVoices = [];
    cachedVoicesAt = now;
    return cachedVoices;
  }

  const data = await res.json().catch(() => ({}));
  const voices = (data?.voices || []) as GoogleVoice[];
  cachedVoices = voices;
  cachedVoicesAt = now;
  return voices;
}

function pickVoiceName(voices: GoogleVoice[], cfg: VoiceConfig): string | undefined {
  if (!voices.length) return undefined;

  const langMatches = voices.filter((v) => v.languageCodes?.includes(cfg.languageCode));
  const pool1 = langMatches.length ? langMatches : voices;

  const genderMatches = pool1.filter((v) => v.ssmlGender === cfg.ssmlGender);
  const pool2 = genderMatches.length ? genderMatches : pool1;

  const preferred = (cfg.preferNameIncludes || [])
    .flatMap((needle) => pool2.filter((v) => v.name?.includes(needle)));
  const pool3 = preferred.length ? preferred : pool2;

  // Stable pick: first candidate
  return pool3[0]?.name;
}

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

    const voices = await getVoices(apiKey);
    const pickedVoiceName = pickVoiceName(voices, voiceConfig);
    console.log(
      `Generating TTS with Google Cloud for ${cleanText.length} chars, lang=${voiceConfig.languageCode}, picked=${pickedVoiceName ?? "(default)"}`
    );

    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode: voiceConfig.languageCode,
        ssmlGender: voiceConfig.ssmlGender,
        ...(pickedVoiceName ? { name: pickedVoiceName } : {}),
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
