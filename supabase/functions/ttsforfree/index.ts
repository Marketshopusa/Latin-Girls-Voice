import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map our voice types to TTSForFree voice IDs (Azure Neural voices)
const VOICE_MAP: Record<string, { voice: string; lang: string }> = {
  COLOMBIANA_PAISA: { voice: "es-CO-SalomeNeural", lang: "es-CO" },
  VENEZOLANA_GOCHA: { voice: "es-VE-PaolaNeural", lang: "es-VE" },
  VENEZOLANA_CARACAS: { voice: "es-VE-SebastianNeural", lang: "es-VE" },
  ARGENTINA_SUAVE: { voice: "es-AR-ElenaNeural", lang: "es-AR" },
  MEXICANA_NORTENA: { voice: "es-MX-DaliaNeural", lang: "es-MX" },
  MASCULINA_PROFUNDA: { voice: "es-MX-JorgeNeural", lang: "es-MX" },
  MASCULINA_SUAVE: { voice: "es-AR-TomasNeural", lang: "es-AR" },
};

const DEFAULT_VOICE = { voice: "es-AR-ElenaNeural", lang: "es-AR" };

async function createTTSJob(text: string, voiceConfig: { voice: string; lang: string }): Promise<string> {
  const response = await fetch("https://ttsforfree.com/api/tts/createby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text,
      voice: voiceConfig.voice,
      language: voiceConfig.lang,
      format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("TTSForFree create error:", response.status, errorText);
    throw new Error(`Failed to create TTS job: ${response.status}`);
  }

  const data = await response.json();
  if (!data.jobId && !data.job_id && !data.id) {
    throw new Error("No job ID returned from TTSForFree");
  }
  return data.jobId || data.job_id || data.id;
}

async function pollForResult(jobId: string, maxAttempts = 30): Promise<ArrayBuffer> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://ttsforfree.com/api/tts/status/${jobId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("TTSForFree status check failed:", response.status);
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    const data = await response.json();

    if (data.status === "completed" || data.status === "done" || data.ready) {
      const audioUrl = data.url || data.audioUrl || data.download_url;
      if (audioUrl) {
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) throw new Error("Failed to download audio");
        return await audioResponse.arrayBuffer();
      }
      if (data.audio) {
        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
    }

    if (data.status === "failed" || data.status === "error") {
      throw new Error(data.error || "TTS generation failed");
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("TTS generation timed out");
}

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
  const _tk = authHeader.replace('Bearer ', '');
  const { data: _cl, error: _clErr } = await _sb.auth.getClaims(_tk);
  if (_clErr || !_cl?.claims) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // --- End auth check ---

  try {
    const { text, voiceType } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedText = text.slice(0, 5000);
    const voiceConfig = VOICE_MAP[voiceType] || DEFAULT_VOICE;

    console.log(`Generating TTS for voice ${voiceConfig.voice} with ${trimmedText.length} chars`);

    const jobId = await createTTSJob(trimmedText, voiceConfig);
    const audioBuffer = await pollForResult(jobId);

    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: "Error en el servicio de TTS", fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
