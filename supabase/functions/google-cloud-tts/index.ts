import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
  * Google Cloud TTS - Sistema de Voces Neural2 y Chirp 3: HD
 * 
 * Catálogo completo de voces de alta calidad sin depender de Gemini.
 * Solo usa la API de Google Cloud Text-to-Speech.
 */

interface VoiceConfig {
  voiceName: string;
  languageCode: string;
  ssmlGender: "FEMALE" | "MALE";
  isChirp3?: boolean;
  // Configuración regional para acentos (pitch y rate)
  speakingRate?: number;
  pitch?: number;
}

// Catálogo completo de voces Neural2, Chirp 3: HD y Regionales
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // === NEURAL2 - ESPAÑOL LATINO (es-US) ===
  "es-US-Neural2-A": {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    speakingRate: 1.02,
    pitch: 0.5,
  },
  "es-US-Neural2-B": {
    voiceName: "es-US-Neural2-B",
    languageCode: "es-US",
    ssmlGender: "MALE",
    speakingRate: 0.98,
    pitch: -2,
  },
  "es-US-Neural2-C": {
    voiceName: "es-US-Neural2-C",
    languageCode: "es-US",
    ssmlGender: "MALE",
    speakingRate: 1.03,
    pitch: -1,
  },
  
  // === NEURAL2 - ESPAÑOL ESPAÑA (es-ES) ===
  "es-ES-Neural2-A": {
    voiceName: "es-ES-Neural2-A",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    speakingRate: 1.0,
    pitch: 0,
  },
  "es-ES-Neural2-B": {
    voiceName: "es-ES-Neural2-B",
    languageCode: "es-ES",
    ssmlGender: "MALE",
    speakingRate: 0.97,
    pitch: -1.5,
  },
  "es-ES-Neural2-C": {
    voiceName: "es-ES-Neural2-C",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    speakingRate: 1.03,
    pitch: 1,
  },
  "es-ES-Neural2-D": {
    voiceName: "es-ES-Neural2-D",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    speakingRate: 1.06,
    pitch: 2,
  },
  "es-ES-Neural2-E": {
    voiceName: "es-ES-Neural2-E",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    speakingRate: 0.99,
    pitch: -0.5,
  },
  "es-ES-Neural2-F": {
    voiceName: "es-ES-Neural2-F",
    languageCode: "es-ES",
    ssmlGender: "MALE",
    speakingRate: 1.01,
    pitch: -2.5,
  },
  
  // === NEURAL2 - ESPAÑOL MÉXICO (es-MX) ===
  "es-MX-Neural2-A": {
    voiceName: "es-MX-Neural2-A",
    languageCode: "es-MX",
    ssmlGender: "FEMALE",
    speakingRate: 1.02,
    pitch: 0.8,
  },
  "es-MX-Neural2-B": {
    voiceName: "es-MX-Neural2-B",
    languageCode: "es-MX",
    ssmlGender: "MALE",
    speakingRate: 1.0,
    pitch: -1.8,
  },
  
  // === CHIRP 3: HD - VOCES PREMIUM (es-US) ===
  "es-US-Chirp3-HD-Kore": {
    voiceName: "es-US-Chirp3-HD-Kore",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    isChirp3: true,
    speakingRate: 1.02,
    pitch: 1.5,
  },
  "es-US-Chirp3-HD-Aoede": {
    voiceName: "es-US-Chirp3-HD-Aoede",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    isChirp3: true,
    speakingRate: 0.99,
    pitch: 0.8,
  },
  "es-US-Chirp3-HD-Charon": {
    voiceName: "es-US-Chirp3-HD-Charon",
    languageCode: "es-US",
    ssmlGender: "MALE",
    isChirp3: true,
    speakingRate: 0.98,
    pitch: -2.2,
  },
  "es-US-Chirp3-HD-Puck": {
    voiceName: "es-US-Chirp3-HD-Puck",
    languageCode: "es-US",
    ssmlGender: "MALE",
    isChirp3: true,
    speakingRate: 1.04,
    pitch: -0.8,
  },
  
  // === CHIRP 3: HD - VOCES PREMIUM (es-ES) ===
  "es-ES-Chirp3-HD-Kore": {
    voiceName: "es-ES-Chirp3-HD-Kore",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    isChirp3: true,
    speakingRate: 1.02,
    pitch: 1.5,
  },
  "es-ES-Chirp3-HD-Aoede": {
    voiceName: "es-ES-Chirp3-HD-Aoede",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    isChirp3: true,
    speakingRate: 0.99,
    pitch: 0.8,
  },
  "es-ES-Chirp3-HD-Charon": {
    voiceName: "es-ES-Chirp3-HD-Charon",
    languageCode: "es-ES",
    ssmlGender: "MALE",
    isChirp3: true,
    speakingRate: 0.98,
    pitch: -2.2,
  },
  "es-ES-Chirp3-HD-Puck": {
    voiceName: "es-ES-Chirp3-HD-Puck",
    languageCode: "es-ES",
    ssmlGender: "MALE",
    isChirp3: true,
    speakingRate: 1.04,
    pitch: -0.8,
  },
};

// Mapeo de voces legacy a las nuevas (compatibilidad histórica)
const LEGACY_VOICE_MAP: Record<string, string> = {
  // Legacy antiguos
  "LATINA_CALIDA": "es-US-Neural2-A",
  "LATINA_COQUETA": "es-ES-Neural2-D",
  "MEXICANA_DULCE": "es-MX-Neural2-A",
  "LATINO_PROFUNDO": "es-US-Neural2-B",
  "LATINO_SUAVE": "es-US-Neural2-C",
  "VENEZOLANA": "es-ES-Neural2-C",
  "COLOMBIANA": "es-US-Neural2-A",
  "ARGENTINA": "es-ES-Neural2-B",
  
  // IDs históricos (mapeados a Google con variedad real)
  "COLOMBIANA_PAISA": "es-US-Neural2-A",
  "COLOMBIANA_SUAVE": "es-US-Chirp3-HD-Aoede",
  "VENEZOLANA_CARAQUEÑA": "es-ES-Neural2-D",
  "VENEZOLANA_GOCHA": "es-ES-Neural2-C",
  "LATINA_EXPRESIVA": "es-US-Chirp3-HD-Kore",
  "LATINA_FUERTE": "es-ES-Neural2-A",
  "MEXICANA_NATURAL": "es-MX-Neural2-A",
  "ARGENTINA_PORTEÑA": "es-ES-Neural2-B",
  "MASCULINA_PROFUNDA": "es-US-Neural2-B",
  "MASCULINA_SUAVE": "es-US-Neural2-C",
  "MASCULINA_LATINA": "es-US-Chirp3-HD-Charon",
};

// Voz por defecto
const DEFAULT_VOICE = "es-US-Neural2-A";

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

    // Resolver tipo de voz (soportar legacy y nuevos IDs)
    let resolvedVoiceType = voiceType || DEFAULT_VOICE;
    
    // Si es una voz legacy, mapear a la nueva
    if (LEGACY_VOICE_MAP[resolvedVoiceType]) {
      resolvedVoiceType = LEGACY_VOICE_MAP[resolvedVoiceType];
    }
    
    // Obtener configuración de voz
    const voiceConfig = VOICE_CONFIG[resolvedVoiceType] || VOICE_CONFIG[DEFAULT_VOICE];
    
    // Limpiar texto - límite ampliado para mensajes largos (Google TTS soporta hasta 5000 chars)
    const cleanText = String(text).slice(0, 3000);
    const ssml = textToSsml(cleanText);

    console.log(
      `TTS Request: ${cleanText.length} chars | Voice: ${voiceConfig.voiceName} | Lang: ${voiceConfig.languageCode} | Chirp3: ${voiceConfig.isChirp3 || false}`
    );

    // Construir request (siempre Cloud TTS estándar; Chirp3 usa voiceName completo)
    const requestBody = {
      input: { ssml },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.voiceName,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3",
        effectsProfileId: ["headphone-class-device"],
        speakingRate: voiceConfig.speakingRate ?? 1.0,
        pitch: voiceConfig.pitch ?? 0,
      },
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Cloud TTS error:", response.status, errorText);
      
      // Si falla con voces premium (Chirp3), intentar fallback a Neural2
      if (voiceConfig.isChirp3 || voiceConfig.voiceName.includes('Chirp3')) {
        console.log("Chirp3 failed, trying Neural2 fallback...");
        
        const fallbackVoice = voiceConfig.ssmlGender === "FEMALE" 
          ? VOICE_CONFIG["es-US-Neural2-A"] 
          : VOICE_CONFIG["es-US-Neural2-B"];
        
        const fallbackBody = {
          input: { ssml },
          voice: {
            languageCode: fallbackVoice.languageCode,
            name: fallbackVoice.voiceName,
            ssmlGender: fallbackVoice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            effectsProfileId: ["headphone-class-device"],
            speakingRate: fallbackVoice.speakingRate ?? 1.0,
            pitch: fallbackVoice.pitch ?? 0,
          },
        };
        
        const fallbackResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallbackBody),
          }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.audioContent) {
            console.log("Neural2 fallback successful");
            const binaryString = atob(fallbackData.audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
             return new Response(bytes.buffer, {
               headers: {
                 ...corsHeaders,
                 "Content-Type": "audio/mpeg",
                 "Access-Control-Expose-Headers": "x-tts-voice, x-tts-lang",
                 "x-tts-voice": fallbackVoice.voiceName,
                 "x-tts-lang": fallbackVoice.languageCode,
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

    // Decodificar audio base64
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`TTS Success: ${bytes.length} bytes of audio generated`);

    return new Response(bytes.buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Access-Control-Expose-Headers": "x-tts-voice, x-tts-lang",
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Convierte texto a SSML con pausas naturales (sin volverlo robótico)
function textToSsml(raw: string): string {
  let t = raw
    .replace(/[—–]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  // Unificar puntos suspensivos
  t = t.replace(/\.{3,}/g, "…");

  let s = escapeXml(t);

  // Pausas sutiles por puntuación
  s = s
    .replace(/…/g, "...<break time=\"320ms\"/>")
    .replace(/([!?])\s*/g, "$1<break time=\"260ms\"/>")
    .replace(/([.])\s*/g, "$1<break time=\"300ms\"/>")
    .replace(/([,])\s*/g, "$1<break time=\"160ms\"/>");

  return `<speak>${s}</speak>`;
}
