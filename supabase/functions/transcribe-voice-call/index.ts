import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const allowed = await checkRateLimit(user.id, "transcribe-voice-call");
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Límite de transcripción alcanzado", text: "" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY_OVERRIDE") || Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Servicio de transcripción no configurado", text: "" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size < 1000) {
      return new Response(JSON.stringify({ text: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sttForm = new FormData();
    sttForm.append("file", audio, audio.name || "voice-call.webm");
    sttForm.append("model_id", "scribe_v2");
    sttForm.append("language_code", "spa");
    sttForm.append("tag_audio_events", "false");
    sttForm.append("diarize", "false");

    const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: sttForm,
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.warn("Voice call STT failed:", sttResponse.status, errorText);
      return new Response(JSON.stringify({ error: "No se pudo transcribir", text: "" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await sttResponse.json();
    const text = String(data?.text || "").trim();
    console.log(`Voice call STT success: ${audio.size} bytes -> ${text.length} chars`);

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