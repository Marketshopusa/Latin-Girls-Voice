import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google Translate TTS - free, no API key needed
// Supports multiple Spanish variants
const VOICE_LANG_MAP: Record<string, string> = {
  COLOMBIANA_PAISA: "es",
  VENEZOLANA_GOCHA: "es",
  VENEZOLANA_CARACAS: "es",
  ARGENTINA_SUAVE: "es",
  MEXICANA_NORTENA: "es",
  MASCULINA_PROFUNDA: "es",
  MASCULINA_SUAVE: "es",
};

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

    const lang = VOICE_LANG_MAP[voiceType] || "es";
    // Split text into smaller chunks for smoother audio (Google has ~200 char limit per request)
    const maxChunkSize = 180;
    const cleanText = text.slice(0, 500); // Total limit
    
    // For shorter texts, use single request
    if (cleanText.length <= maxChunkSize) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(cleanText)}&ttsspeed=0.9`;
      
      console.log(`Generating TTS with Google Translate for ${cleanText.length} chars`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://translate.google.com/",
        },
      });

      if (!response.ok) {
        console.error("Google TTS error:", response.status);
        return new Response(
          JSON.stringify({ error: `TTS failed: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const audioBuffer = await response.arrayBuffer();
      return new Response(audioBuffer, {
        headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
      });
    }

    // For longer texts, split into sentences and concatenate audio
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const audioChunks: ArrayBuffer[] = [];
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(trimmed)}&ttsspeed=0.9`;
      console.log(`Generating TTS chunk: ${trimmed.length} chars`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://translate.google.com/",
        },
      });

      if (!response.ok) {
        console.error("Google TTS chunk error:", response.status);
        continue;
      }

      const chunk = await response.arrayBuffer();
      audioChunks.push(chunk);
    }

    if (audioChunks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No audio generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concatenate all audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return new Response(combined.buffer, {
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
