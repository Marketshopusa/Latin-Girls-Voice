import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function transcribeWithGemini(audio: File): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const bytes = new Uint8Array(await audio.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Transcribe exactamente la voz humana en este audio. Devuelve solo las palabras habladas en español. Si no hay voz clara, devuelve una cadena vacía.",
              },
              {
                inlineData: {
                  mimeType: audio.type || "audio/webm",
                  data: btoa(binary),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 160,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini STT failed ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return String(data?.candidates?.[0]?.content?.parts?.[0]?.text || "")
    .replace(/^['"“”]+|['"“”]+$/g, "")
    .trim();
}

async function transcribeWithElevenLabs(audio: File): Promise<string> {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY_OVERRIDE") || Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const sttForm = new FormData();
  sttForm.append("file", audio, audio.name || "voice-call.webm");
  sttForm.append("model_id", "scribe_v2");
  sttForm.append("language_code", "spa");
  sttForm.append("tag_audio_events", "false");
  sttForm.append("diarize", "false");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: sttForm,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs STT failed ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return String(data?.text || "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: userError } = await sb.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { getUserPlan } = await import("../_shared/check-plan.ts");
  const planInfo = await getUserPlan(user.id, user.email);
  if (!planInfo.hasVoiceCalls && !planInfo.isAdmin) {
    return new Response(JSON.stringify({ error: "Llamadas no disponibles en tu plan actual", text: "" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const allowed = await checkRateLimit(user.id, "transcribe-voice-call");
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Límite de transcripción alcanzado", text: "" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size < 1000) {
      return new Response(JSON.stringify({ text: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let text = "";
    try {
      text = await transcribeWithElevenLabs(audio);
      console.log(`Voice call ElevenLabs Scribe success: ${audio.size} bytes -> ${text.length} chars`);
    } catch (elevenLabsError) {
      console.warn("Voice call ElevenLabs STT failed, trying Gemini fallback:", elevenLabsError);
      try {
        text = await transcribeWithGemini(audio);
        console.log(`Voice call Gemini STT fallback success: ${audio.size} bytes -> ${text.length} chars`);
      } catch (geminiError) {
        console.warn("Voice call Gemini STT fallback failed:", geminiError);
      }
    }


    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.warn("Voice call STT error:", error);
    return new Response(JSON.stringify({ error: "Error de transcripción", text: "" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});