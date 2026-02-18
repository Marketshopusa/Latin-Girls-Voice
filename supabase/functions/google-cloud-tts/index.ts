import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VOICE_MAP: Record<string, { name: string; languageCode: string; gender: string }> = {
  // Chirp3-HD — es-US (acento latino) FEMENINAS
  "es-US-Chirp3-HD-Achernar": { name: "es-US-Chirp3-HD-Achernar", languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Aoede":    { name: "es-US-Chirp3-HD-Aoede",    languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Leda":     { name: "es-US-Chirp3-HD-Leda",     languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Kore":     { name: "es-US-Chirp3-HD-Kore",     languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Sulafat":  { name: "es-US-Chirp3-HD-Sulafat",  languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Zephyr":   { name: "es-US-Chirp3-HD-Zephyr",   languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Gacrux":   { name: "es-US-Chirp3-HD-Gacrux",   languageCode: "es-US", gender: "FEMALE" },
  "es-US-Chirp3-HD-Callirrhoe": { name: "es-US-Chirp3-HD-Callirrhoe", languageCode: "es-US", gender: "FEMALE" },
  // Chirp3-HD — es-US (acento latino) MASCULINAS
  "es-US-Chirp3-HD-Achird":   { name: "es-US-Chirp3-HD-Achird",   languageCode: "es-US", gender: "MALE" },
  "es-US-Chirp3-HD-Charon":   { name: "es-US-Chirp3-HD-Charon",   languageCode: "es-US", gender: "MALE" },
  "es-US-Chirp3-HD-Fenrir":   { name: "es-US-Chirp3-HD-Fenrir",   languageCode: "es-US", gender: "MALE" },
  "es-US-Chirp3-HD-Orus":     { name: "es-US-Chirp3-HD-Orus",     languageCode: "es-US", gender: "MALE" },
  "es-US-Chirp3-HD-Puck":     { name: "es-US-Chirp3-HD-Puck",     languageCode: "es-US", gender: "MALE" },
  "es-US-Chirp3-HD-Schedar":  { name: "es-US-Chirp3-HD-Schedar",  languageCode: "es-US", gender: "MALE" },
  // Chirp3-HD — es-ES (acento España) FEMENINAS
  "es-ES-Chirp3-HD-Achernar": { name: "es-ES-Chirp3-HD-Achernar", languageCode: "es-ES", gender: "FEMALE" },
  "es-ES-Chirp3-HD-Aoede":    { name: "es-ES-Chirp3-HD-Aoede",    languageCode: "es-ES", gender: "FEMALE" },
  "es-ES-Chirp3-HD-Leda":     { name: "es-ES-Chirp3-HD-Leda",     languageCode: "es-ES", gender: "FEMALE" },
  "es-ES-Chirp3-HD-Kore":     { name: "es-ES-Chirp3-HD-Kore",     languageCode: "es-ES", gender: "FEMALE" },
  // Chirp3-HD — es-ES (acento España) MASCULINAS
  "es-ES-Chirp3-HD-Achird":   { name: "es-ES-Chirp3-HD-Achird",   languageCode: "es-ES", gender: "MALE" },
  "es-ES-Chirp3-HD-Charon":   { name: "es-ES-Chirp3-HD-Charon",   languageCode: "es-ES", gender: "MALE" },
  "es-ES-Chirp3-HD-Fenrir":   { name: "es-ES-Chirp3-HD-Fenrir",   languageCode: "es-ES", gender: "MALE" },
  "es-ES-Chirp3-HD-Puck":     { name: "es-ES-Chirp3-HD-Puck",     languageCode: "es-ES", gender: "MALE" },
  // Legacy Neural2 (fallback)
  "es-US-Neural2-A": { name: "es-US-Neural2-A", languageCode: "es-US", gender: "FEMALE" },
  "es-US-Neural2-B": { name: "es-US-Neural2-B", languageCode: "es-US", gender: "MALE" },
  "es-US-Neural2-C": { name: "es-US-Neural2-C", languageCode: "es-US", gender: "MALE" },
  "es-ES-Neural2-A": { name: "es-ES-Neural2-A", languageCode: "es-ES", gender: "FEMALE" },
  "es-ES-Neural2-B": { name: "es-ES-Neural2-B", languageCode: "es-ES", gender: "MALE" },
  // Legacy aliases
  "LATINA_CALIDA": { name: "es-US-Chirp3-HD-Kore", languageCode: "es-US", gender: "FEMALE" },
  "LATINA_COQUETA": { name: "es-US-Chirp3-HD-Aoede", languageCode: "es-US", gender: "FEMALE" },
  "MEXICANA_DULCE": { name: "es-US-Chirp3-HD-Sulafat", languageCode: "es-US", gender: "FEMALE" },
  "LATINO_PROFUNDO": { name: "es-US-Chirp3-HD-Charon", languageCode: "es-US", gender: "MALE" },
  "LATINO_SUAVE": { name: "es-US-Chirp3-HD-Puck", languageCode: "es-US", gender: "MALE" },
  "VENEZOLANA": { name: "es-US-Chirp3-HD-Leda", languageCode: "es-US", gender: "FEMALE" },
  "COLOMBIANA": { name: "es-US-Chirp3-HD-Achernar", languageCode: "es-US", gender: "FEMALE" },
  "ARGENTINA": { name: "es-US-Chirp3-HD-Zephyr", languageCode: "es-US", gender: "FEMALE" },
  "COLOMBIANA_PAISA": { name: "es-US-Chirp3-HD-Achernar", languageCode: "es-US", gender: "FEMALE" },
  "COLOMBIANA_SUAVE": { name: "es-US-Chirp3-HD-Aoede", languageCode: "es-US", gender: "FEMALE" },
  "VENEZOLANA_CARAQUEÑA": { name: "es-US-Chirp3-HD-Callirrhoe", languageCode: "es-US", gender: "FEMALE" },
  "VENEZOLANA_GOCHA": { name: "es-US-Chirp3-HD-Leda", languageCode: "es-US", gender: "FEMALE" },
  "LATINA_EXPRESIVA": { name: "es-US-Chirp3-HD-Kore", languageCode: "es-US", gender: "FEMALE" },
  "LATINA_FUERTE": { name: "es-US-Chirp3-HD-Gacrux", languageCode: "es-US", gender: "FEMALE" },
  "MEXICANA_NATURAL": { name: "es-US-Chirp3-HD-Sulafat", languageCode: "es-US", gender: "FEMALE" },
  "ARGENTINA_PORTEÑA": { name: "es-US-Chirp3-HD-Zephyr", languageCode: "es-US", gender: "FEMALE" },
  "MASCULINA_PROFUNDA": { name: "es-US-Chirp3-HD-Charon", languageCode: "es-US", gender: "MALE" },
  "MASCULINA_SUAVE": { name: "es-US-Chirp3-HD-Puck", languageCode: "es-US", gender: "MALE" },
  "MASCULINA_LATINA": { name: "es-US-Chirp3-HD-Fenrir", languageCode: "es-US", gender: "MALE" },
};

const DEFAULT_VOICE = "es-US-Chirp3-HD-Achernar";
const DEFAULT_LANG = "es-US";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceType } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const API_KEY = Deno.env.get("GOOGLE_CLOUD_TTS_API_KEY");
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Cloud TTS API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const voiceConfig = VOICE_MAP[voiceType || ""] || VOICE_MAP[DEFAULT_VOICE];
    const voiceName = voiceConfig?.name || DEFAULT_VOICE;
    const languageCode = voiceConfig?.languageCode || DEFAULT_LANG;
    const ssmlGender = voiceConfig?.gender || "FEMALE";

    // Limpiar texto para TTS
    let cleanText = text
      .replace(/\([^)]*\)/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*[^*]+\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return new Response(
        JSON.stringify({ error: "Text is empty after cleaning" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ssmlText = `<speak>${cleanText.slice(0, 2500)}</speak>`;

    console.log(`TTS Request: ${cleanText.length} chars | Voice: ${voiceName} | Lang: ${languageCode}`);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { ssml: ssmlText },
          voice: { languageCode, name: voiceName, ssmlGender },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0,
            effectsProfileId: ["small-bluetooth-speaker-class-device"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Google TTS error: ${response.status}`, errText);
      throw new Error(`Google TTS failed: ${response.status}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    if (!audioContent) throw new Error("No audio content in response");

    // Decodificar base64 a binario
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`TTS Success: ${bytes.length} bytes | Voice: ${voiceName}`);

    return new Response(bytes.buffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("Google Cloud TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown TTS error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
