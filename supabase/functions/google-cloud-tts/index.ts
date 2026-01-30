import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

// Catálogo completo de voces Neural2 y Chirp 3: HD
const VOICE_CONFIG: Record<string, VoiceConfig> = {
  // === NEURAL2 - ESPAÑOL LATINO (es-US) ===
  "es-US-Neural2-A": {
    voiceName: "es-US-Neural2-A",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
  },
  "es-US-Neural2-B": {
    voiceName: "es-US-Neural2-B",
    languageCode: "es-US",
    ssmlGender: "MALE",
  },
  "es-US-Neural2-C": {
    voiceName: "es-US-Neural2-C",
    languageCode: "es-US",
    ssmlGender: "MALE",
  },
  
  // === NEURAL2 - ESPAÑOL ESPAÑA (es-ES) ===
  "es-ES-Neural2-A": {
    voiceName: "es-ES-Neural2-A",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
  },
  "es-ES-Neural2-B": {
    voiceName: "es-ES-Neural2-B",
    languageCode: "es-ES",
    ssmlGender: "MALE",
  },
  "es-ES-Neural2-C": {
    voiceName: "es-ES-Neural2-C",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
  },
  "es-ES-Neural2-D": {
    voiceName: "es-ES-Neural2-D",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
  },
  "es-ES-Neural2-E": {
    voiceName: "es-ES-Neural2-E",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
  },
  "es-ES-Neural2-F": {
    voiceName: "es-ES-Neural2-F",
    languageCode: "es-ES",
    ssmlGender: "MALE",
  },
  
  // === NEURAL2 - ESPAÑOL MÉXICO (es-MX) ===
  "es-MX-Neural2-A": {
    voiceName: "es-MX-Neural2-A",
    languageCode: "es-MX",
    ssmlGender: "FEMALE",
  },
  "es-MX-Neural2-B": {
    voiceName: "es-MX-Neural2-B",
    languageCode: "es-MX",
    ssmlGender: "MALE",
  },
  
  // === CHIRP 3: HD - VOCES PREMIUM (es-US) ===
  "es-US-Chirp3-HD-Kore": {
    voiceName: "Kore",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    isChirp3: true,
  },
  "es-US-Chirp3-HD-Aoede": {
    voiceName: "Aoede",
    languageCode: "es-US",
    ssmlGender: "FEMALE",
    isChirp3: true,
  },
  "es-US-Chirp3-HD-Charon": {
    voiceName: "Charon",
    languageCode: "es-US",
    ssmlGender: "MALE",
    isChirp3: true,
  },
  "es-US-Chirp3-HD-Puck": {
    voiceName: "Puck",
    languageCode: "es-US",
    ssmlGender: "MALE",
    isChirp3: true,
  },
  
  // === CHIRP 3: HD - VOCES PREMIUM (es-ES) ===
  "es-ES-Chirp3-HD-Kore": {
    voiceName: "Kore",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    isChirp3: true,
  },
  "es-ES-Chirp3-HD-Aoede": {
    voiceName: "Aoede",
    languageCode: "es-ES",
    ssmlGender: "FEMALE",
    isChirp3: true,
  },
  "es-ES-Chirp3-HD-Charon": {
    voiceName: "Charon",
    languageCode: "es-ES",
    ssmlGender: "MALE",
    isChirp3: true,
  },
  "es-ES-Chirp3-HD-Puck": {
    voiceName: "Puck",
    languageCode: "es-ES",
    ssmlGender: "MALE",
    isChirp3: true,
  },
};

// Mapeo de voces legacy a las nuevas
const LEGACY_VOICE_MAP: Record<string, string> = {
  "LATINA_CALIDA": "es-US-Neural2-A",
  "LATINA_COQUETA": "es-US-Neural2-A",
  "MEXICANA_DULCE": "es-MX-Neural2-A",
  "LATINO_PROFUNDO": "es-US-Neural2-B",
  "LATINO_SUAVE": "es-US-Neural2-C",
  "VENEZOLANA": "es-US-Neural2-A",
  "COLOMBIANA": "es-US-Neural2-A",
  "ARGENTINA": "es-US-Neural2-A",
};

// Voz por defecto
const DEFAULT_VOICE = "es-US-Neural2-A";

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
    
    // Limpiar texto
    const cleanText = text.slice(0, 2000);

    console.log(
      `TTS Request: ${cleanText.length} chars | Voice: ${voiceConfig.voiceName} | Lang: ${voiceConfig.languageCode} | Chirp3: ${voiceConfig.isChirp3 || false}`
    );

    // Construir request según el tipo de voz
    let requestBody: any;
    
    if (voiceConfig.isChirp3) {
      // Para Chirp 3: HD usamos el endpoint de Generative Language API
      // pero solo para síntesis de voz, no para generación de contenido
      requestBody = {
        input: { text: cleanText },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: `${voiceConfig.languageCode}-Studio-${voiceConfig.voiceName}`,
          ssmlGender: voiceConfig.ssmlGender,
        },
        audioConfig: {
          audioEncoding: "MP3",
          effectsProfileId: ["headphone-class-device"],
          speakingRate: 1.0,
          pitch: 0,
        },
      };
    } else {
      // Para Neural2 usamos el endpoint estándar de Cloud TTS
      requestBody = {
        input: { text: cleanText },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.voiceName,
          ssmlGender: voiceConfig.ssmlGender,
        },
        audioConfig: {
          audioEncoding: "MP3",
          effectsProfileId: ["headphone-class-device"],
        },
      };
    }

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
      
      // Si falla con Chirp3, intentar fallback a Neural2
      if (voiceConfig.isChirp3) {
        console.log("Chirp3 failed, trying Neural2 fallback...");
        
        const fallbackVoice = voiceConfig.ssmlGender === "FEMALE" 
          ? VOICE_CONFIG["es-US-Neural2-A"] 
          : VOICE_CONFIG["es-US-Neural2-B"];
        
        const fallbackBody = {
          input: { text: cleanText },
          voice: {
            languageCode: fallbackVoice.languageCode,
            name: fallbackVoice.voiceName,
            ssmlGender: fallbackVoice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            effectsProfileId: ["headphone-class-device"],
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
              headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
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
