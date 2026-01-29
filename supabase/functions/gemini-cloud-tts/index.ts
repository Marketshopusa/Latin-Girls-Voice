import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Gemini-TTS vía Google Cloud TTS - Voces expresivas con control por prompts
 * 
 * Modelo: gemini-2.5-flash-tts (150 req/min - 15x más que API generativa)
 * 
 * Voces disponibles:
 * - Kore: Voz femenina brillante y expresiva
 * - Aoede: Voz femenina brillante (alternativa)
 * - Puck: Voz masculina cálida y amigable
 * - Charon: Voz masculina profunda y autoritaria
 * - Fenrir: Voz masculina excitable y animada
 */

interface VoiceConfig {
  voiceName: string;
  accentPrompt: string;
}

// Mapeo de voces del proyecto a configuración Gemini-TTS
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // Voces femeninas latinas
  LATINA_CALIDA: {
    voiceName: "Kore",
    accentPrompt: "Habla con acento latinoamericano cálido y suave, como una mujer venezolana o colombiana. Tono dulce, reconfortante y maternal.",
  },
  LATINA_COQUETA: {
    voiceName: "Kore",
    accentPrompt: "Habla con acento latinoamericano seductor y coqueto, como una mujer colombiana o venezolana. Tono juguetón, sensual y provocativo.",
  },
  MEXICANA_DULCE: {
    voiceName: "Aoede",
    accentPrompt: "Habla con acento mexicano suave y encantador. Usa expresiones mexicanas naturalmente. Tono dulce pero travieso.",
  },
  // Voces masculinas latinas
  LATINO_PROFUNDO: {
    voiceName: "Charon",
    accentPrompt: "Habla con acento latinoamericano masculino profundo y dominante. Voz que transmite autoridad y confianza.",
  },
  LATINO_SUAVE: {
    voiceName: "Puck",
    accentPrompt: "Habla con acento latinoamericano masculino suave y romántico. Tono gentil, protector y tierno.",
  },
  // Acentos regionales específicos
  VENEZOLANA: {
    voiceName: "Kore",
    accentPrompt: "Habla con acento venezolano auténtico, con musicalidad y expresividad característica. Usa expresiones como 'chamo', 'vale', 'burda'.",
  },
  COLOMBIANA: {
    voiceName: "Kore",
    accentPrompt: "Habla con acento colombiano paisa, con calidez y alegría de Medellín. Usa expresiones como 'parce', 'qué más pues', 'bacano'.",
  },
  ARGENTINA: {
    voiceName: "Aoede",
    accentPrompt: "Habla con acento argentino rioplatense, con voseo característico. Usa expresiones como 'che', 'boludo', 'dale'.",
  },
};

const DEFAULT_VOICE: VoiceConfig = VOICE_CONFIG.LATINA_COQUETA;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar GEMINI_API_KEY para Gemini-TTS (150 req/min con generativelanguage.googleapis.com)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
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
      `Gemini Cloud TTS: ${cleanText.length} chars, voice=${voiceConfig.voiceName}, type=${voiceType || 'default'}`
    );

    // Construir prompt con instrucciones de acento
    const speechPrompt = `${voiceConfig.accentPrompt}

Lee el siguiente texto con naturalidad y emoción:

"${cleanText}"`;

    // Request a Gemini-TTS vía Cloud TTS API
    const requestBody = {
      contents: [
        {
          parts: [{ text: speechPrompt }]
        }
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceConfig.voiceName
            }
          }
        }
      }
    };

    // Usar el endpoint de Cloud TTS para Gemini-TTS
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Cloud TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `TTS failed: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extraer audio de la respuesta
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";
    
    if (!audioData) {
      console.error("No audio content in response:", JSON.stringify(data, null, 2));
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

    console.log(`Gemini Cloud TTS Success: ${bytes.length} bytes, format: ${mimeType}`);

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
      headers: { 
        ...corsHeaders, 
        "Content-Type": outputMime
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
