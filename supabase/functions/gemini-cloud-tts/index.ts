import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Gemini-TTS via Generative Language API (Cloud-enabled)
 * Usa voces expresivas Gemini (Kore, Puck, Charon, Aoede) 
 * con GOOGLE_CLOUD_TTS_API_KEY a través del endpoint de Generative Language
 * 
 * Requiere: Generative Language API habilitada en Google Cloud Console
 */

interface VoiceConfig {
  voiceName: string;
}

// Mapeo de voces del proyecto a voces Gemini
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // Voces femeninas - Kore (brillante, expresiva) y Aoede (alternativa)
  LATINA_CALIDA: { voiceName: "Aoede" },
  LATINA_COQUETA: { voiceName: "Kore" },
  MEXICANA_DULCE: { voiceName: "Kore" },
  // Voces masculinas - Puck (cálida) y Charon (profunda)
  LATINO_PROFUNDO: { voiceName: "Charon" },
  LATINO_SUAVE: { voiceName: "Puck" },
  // Acentos regionales
  VENEZOLANA: { voiceName: "Kore" },
  COLOMBIANA: { voiceName: "Aoede" },
  ARGENTINA: { voiceName: "Kore" },
};

const DEFAULT_VOICE: VoiceConfig = { voiceName: "Kore" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar la API key de Google Cloud (con Generative Language API habilitada)
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

    const voiceConfig = VOICE_CONFIG[voiceType] || DEFAULT_VOICE;
    const cleanText = text.slice(0, 2000);

    console.log(
      `Gemini-TTS Request: ${cleanText.length} chars, voice=${voiceConfig.voiceName}`
    );

    // Request a Gemini TTS model via Generative Language API
    const requestBody = {
      contents: [
        {
          parts: [{ text: cleanText }]
        }
      ],
      generationConfig: {
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: voiceConfig.voiceName
            }
          }
        }
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini-TTS error:", response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `TTS failed: ${response.status}`, 
          details: errorText,
          fallback_recommended: true 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extraer audio de la respuesta de Gemini
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";
    
    if (!audioData) {
      console.error("No audio content in Gemini response:", JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({ error: "No audio generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decodificar audio base64
    const binaryString = atob(audioData);
    const buffer = new ArrayBuffer(binaryString.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`Gemini-TTS Success: ${bytes.length} bytes, format: ${mimeType}`);

    // Si es PCM, convertir a WAV
    let finalBuffer: ArrayBuffer = buffer;
    let outputMime = mimeType;
    
    if (mimeType.includes("L16") || mimeType.includes("pcm")) {
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
      finalBuffer = createWavFromPcm(bytes, sampleRate, 1, 16);
      outputMime = "audio/wav";
      console.log(`Converted PCM to WAV: ${finalBuffer.byteLength} bytes at ${sampleRate}Hz`);
    }

    return new Response(finalBuffer, {
      headers: { ...corsHeaders, "Content-Type": outputMime },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Crea un archivo WAV válido a partir de datos PCM raw
 */
function createWavFromPcm(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): ArrayBuffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);
  const output = new Uint8Array(buffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Copy PCM data
  output.set(pcmData, headerSize);
  
  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
