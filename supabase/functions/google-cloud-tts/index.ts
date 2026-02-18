import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Google Cloud TTS - Chirp 3: HD
 * 
 * Catálogo completo de voces Chirp 3 HD de alta calidad.
 * Usa el endpoint de Cloud TTS v1beta1 con voiceName corto.
 */

interface VoiceConfig {
  voiceName: string;
  languageCode: string;
  ssmlGender: "FEMALE" | "MALE";
}

// Catálogo completo Chirp 3: HD
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // === CHIRP 3: HD - LATINAS (es-US) FEMENINAS ===
  "es-US-Chirp3-HD-Achernar": { voiceName: "Achernar", languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Aoede":    { voiceName: "Aoede",    languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Leda":     { voiceName: "Leda",     languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Kore":     { voiceName: "Kore",     languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Sulafat":  { voiceName: "Sulafat",  languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Zephyr":   { voiceName: "Zephyr",   languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Gacrux":   { voiceName: "Gacrux",   languageCode: "es-US", ssmlGender: "FEMALE" },
  "es-US-Chirp3-HD-Callirrhoe": { voiceName: "Callirrhoe", languageCode: "es-US", ssmlGender: "FEMALE" },

  // === CHIRP 3: HD - LATINAS (es-US) MASCULINAS ===
  "es-US-Chirp3-HD-Achird":   { voiceName: "Achird",   languageCode: "es-US", ssmlGender: "MALE" },
  "es-US-Chirp3-HD-Charon":   { voiceName: "Charon",   languageCode: "es-US", ssmlGender: "MALE" },
  "es-US-Chirp3-HD-Fenrir":   { voiceName: "Fenrir",   languageCode: "es-US", ssmlGender: "MALE" },
  "es-US-Chirp3-HD-Orus":     { voiceName: "Orus",     languageCode: "es-US", ssmlGender: "MALE" },
  "es-US-Chirp3-HD-Puck":     { voiceName: "Puck",     languageCode: "es-US", ssmlGender: "MALE" },
  "es-US-Chirp3-HD-Schedar":  { voiceName: "Schedar",  languageCode: "es-US", ssmlGender: "MALE" },

  // === CHIRP 3: HD - ESPAÑA (es-ES) FEMENINAS ===
  "es-ES-Chirp3-HD-Achernar": { voiceName: "Achernar", languageCode: "es-ES", ssmlGender: "FEMALE" },
  "es-ES-Chirp3-HD-Aoede":    { voiceName: "Aoede",    languageCode: "es-ES", ssmlGender: "FEMALE" },
  "es-ES-Chirp3-HD-Leda":     { voiceName: "Leda",     languageCode: "es-ES", ssmlGender: "FEMALE" },
  "es-ES-Chirp3-HD-Kore":     { voiceName: "Kore",     languageCode: "es-ES", ssmlGender: "FEMALE" },

  // === CHIRP 3: HD - ESPAÑA (es-ES) MASCULINAS ===
  "es-ES-Chirp3-HD-Achird":   { voiceName: "Achird",   languageCode: "es-ES", ssmlGender: "MALE" },
  "es-ES-Chirp3-HD-Charon":   { voiceName: "Charon",   languageCode: "es-ES", ssmlGender: "MALE" },
  "es-ES-Chirp3-HD-Fenrir":   { voiceName: "Fenrir",   languageCode: "es-ES", ssmlGender: "MALE" },
  "es-ES-Chirp3-HD-Puck":     { voiceName: "Puck",     languageCode: "es-ES", ssmlGender: "MALE" },
};

// Legacy Neural2 → Chirp 3 HD migration
const LEGACY_VOICE_MAP: Record<string, string> = {
  "LATINA_CALIDA": "es-US-Chirp3-HD-Kore",
  "LATINA_COQUETA": "es-US-Chirp3-HD-Aoede",
  "MEXICANA_DULCE": "es-US-Chirp3-HD-Sulafat",
  "LATINO_PROFUNDO": "es-US-Chirp3-HD-Charon",
  "LATINO_SUAVE": "es-US-Chirp3-HD-Puck",
  "VENEZOLANA": "es-US-Chirp3-HD-Leda",
  "COLOMBIANA": "es-US-Chirp3-HD-Achernar",
  "ARGENTINA": "es-US-Chirp3-HD-Zephyr",
  "COLOMBIANA_PAISA": "es-US-Chirp3-HD-Achernar",
  "COLOMBIANA_SUAVE": "es-US-Chirp3-HD-Aoede",
  "VENEZOLANA_CARAQUEÑA": "es-US-Chirp3-HD-Callirrhoe",
  "VENEZOLANA_GOCHA": "es-US-Chirp3-HD-Leda",
  "LATINA_EXPRESIVA": "es-US-Chirp3-HD-Kore",
  "LATINA_FUERTE": "es-US-Chirp3-HD-Gacrux",
  "MEXICANA_NATURAL": "es-US-Chirp3-HD-Sulafat",
  "ARGENTINA_PORTEÑA": "es-US-Chirp3-HD-Zephyr",
  "MASCULINA_PROFUNDA": "es-US-Chirp3-HD-Charon",
  "MASCULINA_SUAVE": "es-US-Chirp3-HD-Puck",
  "MASCULINA_LATINA": "es-US-Chirp3-HD-Fenrir",
  // Neural2 legacy
  "es-US-Neural2-A": "es-US-Chirp3-HD-Kore",
  "es-US-Neural2-B": "es-US-Chirp3-HD-Charon",
  "es-US-Neural2-C": "es-US-Chirp3-HD-Puck",
  "es-ES-Neural2-A": "es-ES-Chirp3-HD-Kore",
  "es-ES-Neural2-B": "es-ES-Chirp3-HD-Charon",
  "es-ES-Neural2-C": "es-ES-Chirp3-HD-Aoede",
  "es-ES-Neural2-D": "es-ES-Chirp3-HD-Leda",
  "es-ES-Neural2-E": "es-ES-Chirp3-HD-Achernar",
  "es-ES-Neural2-F": "es-ES-Chirp3-HD-Puck",
  "es-MX-Neural2-A": "es-US-Chirp3-HD-Sulafat",
  "es-MX-Neural2-B": "es-US-Chirp3-HD-Orus",
};

const DEFAULT_VOICE = "es-US-Chirp3-HD-Kore";

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

    // Resolver tipo de voz
    let resolvedVoiceType = voiceType || DEFAULT_VOICE;
    if (LEGACY_VOICE_MAP[resolvedVoiceType]) {
      resolvedVoiceType = LEGACY_VOICE_MAP[resolvedVoiceType];
    }

    const voiceConfig = VOICE_CONFIG[resolvedVoiceType] || VOICE_CONFIG[DEFAULT_VOICE];
    const cleanText = String(text).slice(0, 3000);

    console.log(`TTS Request: ${cleanText.length} chars | Voice: ${voiceConfig.voiceName} | Lang: ${voiceConfig.languageCode}`);

    // Chirp 3: HD usa el endpoint v1beta1 con voiceName corto
    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.0,
        pitch: 0,
      },
      model: "chirp3-hd",
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Cloud TTS error:", response.status, errorText);

      // Fallback: intentar con Kore es-US si falla otra voz
      if (resolvedVoiceType !== DEFAULT_VOICE) {
        console.log("Trying fallback voice Kore...");
        const fallbackConfig = VOICE_CONFIG[DEFAULT_VOICE];
        const fallbackBody = {
          input: { text: cleanText },
          voice: {
            languageCode: fallbackConfig.languageCode,
            name: fallbackConfig.voiceName,
          },
          audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
          model: "chirp3-hd",
        };

        const fallbackResponse = await fetch(
          `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallbackBody),
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.audioContent) {
            console.log("Fallback to Kore successful");
            const binaryString = atob(fallbackData.audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return new Response(bytes.buffer, {
              headers: {
                ...corsHeaders,
                "Content-Type": "audio/mpeg",
                "x-tts-voice": fallbackConfig.voiceName,
                "x-tts-lang": fallbackConfig.languageCode,
              },
            });
          }
        }
      }

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

    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`TTS Success: ${bytes.length} bytes | Voice: ${voiceConfig.voiceName}`);

    return new Response(bytes.buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "x-tts-voice": voiceConfig.voiceName,
        "x-tts-lang": voiceConfig.languageCode,
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
