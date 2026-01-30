import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Gemini-TTS con Sistema de Acentos y Tonos Expresivos
 * 
 * Usa voces Gemini (Kore, Puck, Charon, Aoede) con instrucciones de estilo
 * para controlar acentos regionales y tonos expresivos.
 */

// Instrucciones de acento regional
const ACCENT_PROMPTS: Record<string, string> = {
  VENEZOLANA: "Habla con acento venezolano caraqueño, usando expresiones como 'chamo', 'pana', 'chévere'. Musicalidad caribeña característica.",
  COLOMBIANA: "Habla con acento colombiano paisa de Medellín, usando 'pues', 'parce', 'qué más'. Tono cálido y melódico.",
  MEXICANA: "Habla con acento mexicano suave, usando diminutivos como 'ahorita', 'tantito'. Entonación característica mexicana.",
  ARGENTINA: "Habla con acento argentino rioplatense, usando voseo como 'vos sos', 'dale', 'che'. Pronunciación característica de la 'll' y 'y'.",
  CHILENA: "Habla con acento chileno, usando 'po', 'cachai', 'wena'. Ritmo rápido característico.",
  PERUANA: "Habla con acento limeño peruano, suave y melodioso. Usa expresiones como 'pe', 'causa'.",
  NEUTRAL: "Habla en español latino neutro, claro y sin acento regional marcado.",
};

// Instrucciones de tono expresivo
const TONE_PROMPTS: Record<string, string> = {
  // Coqueta y Seductora
  COQUETA: "Voz juguetona e insinuante, con picardía y coqueteo sutil. Risitas traviesas ocasionales.",
  SEDUCTORA: "Voz provocativa y atrevida, tentadora y envolvente. Pausas sugerentes entre frases.",
  // Sexy e Intensa
  SEXY: "Voz sensual y apasionada, ardiente y envolvente. Respiración audible, tono grave seductor.",
  INTENSA: "Voz apasionada con intensidad emocional, dominante y poderosa. Énfasis dramático.",
  // Juvenil y Dulce
  JUVENIL: "Voz fresca y alegre, enérgica y vivaz. Entusiasmo juvenil, tono optimista.",
  DULCE: "Voz tierna y cariñosa, maternal y reconfortante. Suavidad en cada palabra.",
  // Susurrante e Íntima
  SUSURRANTE: "Habla en susurros suaves, como si estuvieras al oído del oyente. Voz muy baja y cercana.",
  INTIMA: "Voz personal y confidencial, como compartiendo un secreto. Cercanía emocional.",
  // Neutro
  NEUTRAL: "Tono natural y conversacional, sin estilo expresivo particular.",
};

// Mapeo de voceType legacy a accent+tone
const LEGACY_VOICE_MAP: Record<string, { accent: string; tone: string; geminiVoice: string }> = {
  LATINA_CALIDA: { accent: "NEUTRAL", tone: "DULCE", geminiVoice: "Aoede" },
  LATINA_COQUETA: { accent: "NEUTRAL", tone: "COQUETA", geminiVoice: "Kore" },
  MEXICANA_DULCE: { accent: "MEXICANA", tone: "DULCE", geminiVoice: "Kore" },
  LATINO_PROFUNDO: { accent: "NEUTRAL", tone: "INTENSA", geminiVoice: "Charon" },
  LATINO_SUAVE: { accent: "NEUTRAL", tone: "INTIMA", geminiVoice: "Puck" },
  VENEZOLANA: { accent: "VENEZOLANA", tone: "COQUETA", geminiVoice: "Kore" },
  COLOMBIANA: { accent: "COLOMBIANA", tone: "DULCE", geminiVoice: "Aoede" },
  ARGENTINA: { accent: "ARGENTINA", tone: "JUVENIL", geminiVoice: "Kore" },
};

// Mapeo de género/estilo a voz Gemini
const getGeminiVoice = (tone: string): string => {
  // Tonos más intensos/sensuales usan Kore (más expresiva)
  if (["COQUETA", "SEDUCTORA", "SEXY", "INTENSA"].includes(tone)) {
    return "Kore";
  }
  // Tonos suaves/dulces usan Aoede (más cálida)
  if (["DULCE", "SUSURRANTE", "INTIMA"].includes(tone)) {
    return "Aoede";
  }
  // Juvenil usa Kore (más vivaz)
  if (tone === "JUVENIL") {
    return "Kore";
  }
  // Default
  return "Kore";
};

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

    const { text, voiceType, accent, tone } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolver configuración de voz
    let resolvedAccent = accent || "NEUTRAL";
    let resolvedTone = tone || "NEUTRAL";
    let geminiVoice = "Kore";

    // Si viene voiceType legacy, mapear a accent+tone
    if (voiceType && LEGACY_VOICE_MAP[voiceType]) {
      const legacy = LEGACY_VOICE_MAP[voiceType];
      resolvedAccent = accent || legacy.accent;
      resolvedTone = tone || legacy.tone;
      geminiVoice = legacy.geminiVoice;
    } else {
      geminiVoice = getGeminiVoice(resolvedTone);
    }

    // Construir prompt de estilo
    const accentInstruction = ACCENT_PROMPTS[resolvedAccent] || ACCENT_PROMPTS.NEUTRAL;
    const toneInstruction = TONE_PROMPTS[resolvedTone] || TONE_PROMPTS.NEUTRAL;
    
    // Combinar texto con instrucciones de estilo
    const styledText = `[Instrucciones de voz: ${accentInstruction} ${toneInstruction}]\n\n${text.slice(0, 1800)}`;
    
    console.log(
      `Gemini-TTS: ${text.length} chars | Voice: ${geminiVoice} | Accent: ${resolvedAccent} | Tone: ${resolvedTone}`
    );

    // Request a Gemini TTS
    const requestBody = {
      contents: [
        {
          parts: [{ text: styledText }]
        }
      ],
      generationConfig: {
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: geminiVoice
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
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
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

    // Si es PCM, convertir a WAV
    let finalBuffer: ArrayBuffer = buffer;
    let outputMime = mimeType;
    
    if (mimeType.includes("L16") || mimeType.includes("pcm")) {
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
      finalBuffer = createWavFromPcm(bytes, sampleRate, 1, 16);
      outputMime = "audio/wav";
      console.log(`Converted to WAV: ${finalBuffer.byteLength} bytes at ${sampleRate}Hz`);
    }

    console.log(`Gemini-TTS Success: ${finalBuffer.byteLength} bytes`);

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
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  output.set(pcmData, headerSize);
  
  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
