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
  preferNameIncludes?: string[];
  speakingRate?: number;
  pitch?: number;
}

const VOICE_CONFIG: Record<string, VoiceConfig> = {
  COLOMBIANA_PAISA: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 1.0,
    pitch: 1.0,
  },
  VENEZOLANA_GOCHA: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.92,
    pitch: 0.5,
  },
  VENEZOLANA_CARACAS: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 1.05,
    pitch: 0,
  },
  ARGENTINA_SUAVE: {
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.92,
    pitch: -0.5,
  },
  MEXICANA_NORTENA: {
    languageCode: "es-MX",
    ssmlGender: "FEMALE",
    preferNameIncludes: ["Wavenet", "Neural2", "Standard"],
    speakingRate: 0.95,
    pitch: 0,
  },
  MASCULINA_PROFUNDA: {
    languageCode: "es-US",
    ssmlGender: "MALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.88,
    pitch: -2,
  },
  MASCULINA_SUAVE: {
    languageCode: "es-US",
    ssmlGender: "MALE",
    preferNameIncludes: ["Neural2", "Wavenet"],
    speakingRate: 0.9,
    pitch: -1,
  },
};

let cachedVoices: GoogleVoice[] | null = null;
let cachedVoicesAt = 0;
const VOICES_TTL_MS = 1000 * 60 * 60;

async function getVoices(apiKey: string): Promise<GoogleVoice[]> {
  const now = Date.now();
  if (cachedVoices && now - cachedVoicesAt < VOICES_TTL_MS) return cachedVoices;

  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
  if (!res.ok) {
    const t = await res.text();
    console.error("Failed to fetch voices list:", res.status, t);
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

  return pool3[0]?.name;
}

/**
 * Convert plain text to SSML with natural pauses, emphasis, and prosody.
 * This makes the TTS output sound more conversational and expressive.
 */
function textToSSML(text: string): string {
  let ssml = text;

  // Escape XML special characters first
  ssml = ssml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Add pauses for punctuation - natural conversation rhythm
  // Ellipsis gets a longer thoughtful pause
  ssml = ssml.replace(/\.{3,}/g, '<break time="600ms"/>');
  
  // Period followed by space or end - medium pause
  ssml = ssml.replace(/\.(\s|$)/g, '.<break time="400ms"/>$1');
  
  // Comma - short breath pause
  ssml = ssml.replace(/,(\s)/g, ',<break time="200ms"/>$1');
  
  // Semicolon and colon - medium pause
  ssml = ssml.replace(/;(\s)/g, ';<break time="300ms"/>$1');
  ssml = ssml.replace(/:(\s)/g, ':<break time="250ms"/>$1');
  
  // Question mark - pause with rising intonation feel
  ssml = ssml.replace(/\?(\s|$)/g, '?<break time="450ms"/>$1');
  
  // Exclamation - slightly shorter energetic pause
  ssml = ssml.replace(/!(\s|$)/g, '!<break time="350ms"/>$1');
  
  // Dash/hyphen used for interruption or aside
  ssml = ssml.replace(/\s—\s/g, ' <break time="200ms"/>—<break time="200ms"/> ');
  ssml = ssml.replace(/\s-\s/g, ' <break time="150ms"/>-<break time="150ms"/> ');

  // Emphasize words in ALL CAPS (common in expressive text)
  ssml = ssml.replace(/\b([A-ZÁÉÍÓÚÑ]{2,})\b/g, '<emphasis level="strong">$1</emphasis>');

  // Handle common interjections with appropriate emphasis
  const interjections = [
    { pattern: /\b(ay|Ay|AY)\b/gi, replacement: '<emphasis level="moderate">ay</emphasis>' },
    { pattern: /\b(uy|Uy|UY)\b/gi, replacement: '<emphasis level="moderate">uy</emphasis>' },
    { pattern: /\b(oh|Oh|OH)\b/gi, replacement: '<emphasis level="moderate">oh</emphasis>' },
    { pattern: /\b(ah|Ah|AH)\b/gi, replacement: '<emphasis level="moderate">ah</emphasis>' },
    { pattern: /\b(eh|Eh|EH)\b/gi, replacement: '<emphasis level="moderate">eh</emphasis>' },
    { pattern: /\b(mmm|Mmm|MMM)\b/gi, replacement: '<emphasis level="reduced">mmm</emphasis>' },
    { pattern: /\b(hmm|Hmm|HMM)\b/gi, replacement: '<emphasis level="reduced">hmm</emphasis>' },
  ];

  for (const { pattern, replacement } of interjections) {
    ssml = ssml.replace(pattern, replacement);
  }

  // Handle repeated letters for emphasis (e.g., "nooo", "síííí")
  ssml = ssml.replace(/([aeiouáéíóú])\1{2,}/gi, (match) => {
    const vowel = match[0];
    return `<prosody rate="slow">${vowel}${vowel}${vowel}</prosody>`;
  });

  // Words indicating emotion get slight prosody changes
  // Excitement/happiness
  ssml = ssml.replace(
    /\b(increíble|genial|maravilloso|fantástico|excelente|perfecto)\b/gi,
    '<prosody pitch="+10%">$1</prosody>'
  );
  
  // Sadness/worry
  ssml = ssml.replace(
    /\b(triste|preocupado|preocupada|nervioso|nerviosa|asustado|asustada)\b/gi,
    '<prosody pitch="-10%" rate="95%">$1</prosody>'
  );

  // Add slight pause before question words for natural rhythm
  ssml = ssml.replace(
    /(\s)(qué|cómo|cuándo|dónde|por qué|quién|cuál)/gi,
    '$1<break time="100ms"/>$2'
  );

  // Wrap in speak tags
  return `<speak>${ssml}</speak>`;
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

    const voiceConfig = VOICE_CONFIG[voiceType] || VOICE_CONFIG.ARGENTINA_SUAVE;
    
    // Limit text length
    const cleanText = text.slice(0, 1000);
    
    // Convert to SSML for natural speech
    const ssmlText = textToSSML(cleanText);

    const voices = await getVoices(apiKey);
    const pickedVoiceName = pickVoiceName(voices, voiceConfig);
    console.log(
      `Generating TTS with SSML for ${cleanText.length} chars, lang=${voiceConfig.languageCode}, picked=${pickedVoiceName ?? "(default)"}`
    );

    const requestBody = {
      input: { ssml: ssmlText },
      voice: {
        languageCode: voiceConfig.languageCode,
        ssmlGender: voiceConfig.ssmlGender,
        ...(pickedVoiceName ? { name: pickedVoiceName } : {}),
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: voiceConfig.speakingRate || 1.0,
        pitch: voiceConfig.pitch || 0,
        // Use headphone profile for better quality
        effectsProfileId: ["headphone-class-device"],
        // Enable volume gain for clarity
        volumeGainDb: 1.0,
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

    console.log(`Successfully generated ${bytes.length} bytes of audio with SSML`);

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