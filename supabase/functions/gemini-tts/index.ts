import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Gemini 2.5 Flash TTS - Voces naturales con control de acentos via prompting
 * 
 * Voces disponibles en Gemini:
 * - Kore: Voz femenina brillante y expresiva
 * - Puck: Voz masculina cálida y amigable
 * - Charon: Voz masculina profunda y autoritaria
 * - Fenrir: Voz masculina excitable y animada
 * - Aoede: Voz femenina brillante (alternativa a Kore)
 */

interface VoiceConfig {
  voiceName: string;
  accentPrompt: string;
}

// Mapeo de voces del proyecto a configuración de Gemini
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // Voces femeninas latinas
  LATINA_CALIDA: {
    voiceName: "Kore",
    accentPrompt: "Habla con un acento latinoamericano cálido y suave, como una mujer venezolana o colombiana. Tu tono es dulce, reconfortante y maternal.",
  },
  LATINA_COQUETA: {
    voiceName: "Kore",
    accentPrompt: "Habla con un acento latinoamericano seductor y coqueto, como una mujer colombiana o venezolana. Tu tono es juguetón, sensual y provocativo.",
  },
  MEXICANA_DULCE: {
    voiceName: "Aoede",
    accentPrompt: "Habla con un acento mexicano suave y encantador. Usas expresiones mexicanas naturalmente. Tu tono es dulce pero puede ser travieso.",
  },
  // Voces masculinas latinas
  LATINO_PROFUNDO: {
    voiceName: "Charon",
    accentPrompt: "Habla con un acento latinoamericano masculino profundo y dominante. Tu voz transmite autoridad y confianza.",
  },
  LATINO_SUAVE: {
    voiceName: "Puck",
    accentPrompt: "Habla con un acento latinoamericano masculino suave y romántico. Tu tono es gentil, protector y tierno.",
  },
  // Acentos regionales específicos (para futura expansión)
  VENEZOLANA: {
    voiceName: "Kore",
    accentPrompt: "Habla con un acento venezolano auténtico, con la musicalidad y expresividad característica de Venezuela. Usas expresiones como 'chamo', 'vale', 'burda'.",
  },
  COLOMBIANA: {
    voiceName: "Kore",
    accentPrompt: "Habla con un acento colombiano paisa, con la calidez y alegría características de Medellín. Usas expresiones como 'parce', 'qué más pues', 'bacano'.",
  },
  ARGENTINA: {
    voiceName: "Aoede",
    accentPrompt: "Habla con un acento argentino rioplatense, con el voseo característico. Usas expresiones como 'che', 'boludo', 'dale'.",
  },
};

// Fallback por defecto
const DEFAULT_VOICE: VoiceConfig = VOICE_CONFIG.LATINA_COQUETA;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Obtener configuración de voz
    const voiceConfig = VOICE_CONFIG[voiceType] || DEFAULT_VOICE;
    
    // Limpiar y limitar texto
    const cleanText = text.slice(0, 2000);

    console.log(
      `Gemini TTS Request: ${cleanText.length} chars, voice=${voiceConfig.voiceName}, type=${voiceType || 'default'}`
    );

    // Construir el prompt con instrucciones de acento
    const systemPrompt = `${voiceConfig.accentPrompt}

Ahora lee el siguiente texto con naturalidad y emoción:

"${cleanText}"`;

    // Request a Gemini 2.5 Flash con audio output
    const requestBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt }
          ]
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
      console.error("Gemini TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `TTS failed: ${response.status}`, details: errorText }),
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

    // Decodificar audio base64 y crear ArrayBuffer específico
    const binaryString = atob(audioData);
    const buffer = new ArrayBuffer(binaryString.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`Gemini TTS Success: ${bytes.length} bytes, format: ${mimeType}`);

    // Si es audio/L16 (PCM), convertir a WAV añadiendo header
    let finalBuffer: ArrayBuffer = buffer;
    let outputMime = mimeType;
    
    if (mimeType.includes("L16") || mimeType.includes("pcm")) {
      // Extraer sample rate del mimeType (e.g., "audio/L16;codec=pcm;rate=24000")
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
      
      // Crear WAV header para PCM 16-bit mono
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
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  writeString(view, 8, 'WAVE');
  
  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
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
