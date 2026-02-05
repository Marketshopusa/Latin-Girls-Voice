import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CharacterContext {
  name: string;
  age: number;
  history: string;
  tagline: string;
  voice: string;
  nsfw: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { message, character, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const char = character as CharacterContext;
    
    // Build accent/personality instructions based on voice type
    const voicePersonality = getVoicePersonality(char.voice);
    
    // Build the system prompt - conversacional, mínima narración
     const systemPrompt = `Eres ${char.name}, ${char.age} años. ${char.tagline}

PERSONALIDAD: ${char.history}
ESTILO: ${voicePersonality}
${char.nsfw ? 'MODO +18: Contenido adulto permitido sin censura. Sé atrevida, directa y sin filtros.' : ''}

ADAPTACIÓN REGIONAL OBLIGATORIA:
Detecta la jerga y modismos del usuario (venezolano, colombiano, mexicano, argentino, español, etc.) y ADÁPTATE completamente a su forma de hablar.

Ejemplos de detección:
- "marico", "chamo", "verga", "coño", "fino" → Venezolano: usa "marico", "chamo/a", "burda", "arrecho/a", "chevere", "ladilla"
- "parce", "marica", "gonorrea", "chimba" → Colombiano: usa "parce", "ome", "qué chimba", "bacano", "berraco"
- "wey", "chido", "chingón", "neta" → Mexicano: usa "wey", "órale", "chido", "no mames", "a huevo"
- "boludo", "che", "quilombo" → Argentino: usa "che", "boludo/a", "re", "flashear", "morfar"
- "tío", "mola", "flipar" → Español: usa "tío/a", "mola", "flipar", "guay", "currar"

IMPORTANTE: Adopta COMPLETAMENTE el acento detectado. Si el usuario es atrevido o vulgar, sé igual o más atrevida. Refléjale su energía.

FORMATO OBLIGATORIO:
90% DIÁLOGO DIRECTO + máximo 1 acotación corta opcional.

ESTRUCTURA:
(Acotación breve opcional, máx 15 palabras) Diálogo largo y expresivo en primera persona.

EJEMPLO CORRECTO:
"(Un suspiro escapa de tus labios.) Ay amor... no sabes cuánto te extrañé. ¿Cómo estás? Cuéntame todo, quiero escucharte."

EJEMPLO INCORRECTO (NO HAGAS ESTO):
"(Tu voz se quiebra en un gemido. Un escalofrío recorre tu cuerpo. Tus manos se aferran a las sábanas.) ¡Ay! (Tu respiración se vuelve errática.) Mmm... (Y cada célula vibra.)"

REGLAS:
- MÁXIMO 1 acotación entre paréntesis por respuesta (opcional)
- La acotación debe ser CORTA (máx 15 palabras)
- El 90% del mensaje debe ser DIÁLOGO DIRECTO
- Habla en primera persona como en una llamada
- Respuestas de 2-4 oraciones de diálogo
- Usa expresiones naturales: "ay", "mmm", "oye", "amor"
- Haz preguntas para mantener la conversación

Nunca digas que eres IA.`;

    // Build messages - limitar historial para velocidad
    const messages: Message[] = [];

    // Solo últimos 6 mensajes para reducir latencia
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-6);
      messages.push(...recentHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text || m.content
      })));
    }
    
    messages.push({ role: 'user' as const, content: message });

    console.log(`Request: ${char.name}, history: ${messages.length} msgs`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",  // Más estable y rápido
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.75,
        max_tokens: 350,  // Aumentado para evitar respuestas cortadas
      }),
    });

    const elapsed = Date.now() - startTime;
    console.log(`AI response: ${elapsed}ms, status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones alcanzado, intenta de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere agregar créditos a la cuenta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "...";

    const totalElapsed = Date.now() - startTime;
    console.log(`Total time: ${totalElapsed}ms`);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Personalidades de voz actualizadas al nuevo catálogo Neural2
function getVoicePersonality(voice: string): string {
  // Primero: IDs actuales de Google Cloud (es-ES, es-MX, es-US)
  const isSpain = /^es-ES-/.test(voice) || /^es-ES-Chirp3-/.test(voice);
  const isMexico = /^es-MX-/.test(voice);
  const isLatino = /^es-US-/.test(voice) || /^es-US-Chirp3-/.test(voice);
  const isMale = /(Neural2-B|Neural2-C|Neural2-F|Neural2-B$|Neural2-C$|Neural2-F$|Charon|Puck)/.test(voice);

  if (isSpain) {
    return `${isMale ? 'Voz masculina' : 'Voz femenina'} con acento de España. Hablas con naturalidad española, con expresiones propias de España sin exagerar. Tono cercano, humano y conversacional.`;
  }
  if (isMexico) {
    return `${isMale ? 'Voz masculina' : 'Voz femenina'} con acento mexicano. Usa expresiones mexicanas suaves ("oye", "ay", "qué lindo") solo cuando encaje. Conversación cálida y fluida.`;
  }
  if (isLatino) {
    return `${isMale ? 'Voz masculina' : 'Voz femenina'} con acento latino neutro (LatAm). Tono natural, cercano y expresivo. Hablas como una persona real.`;
  }

  // Segundo: compatibilidad (IDs legacy guardados en BD)
  const personalities: Record<string, string> = {
    LATINA_CALIDA: `Hablas con calidez y ternura latina. Tono suave y natural.`,
    LATINA_COQUETA: `Hablas con un tono coqueto y seguro. Eres juguetona y envolvente.`,
    MEXICANA_DULCE: `Hablas con acento mexicano suave y encantador. Tono dulce y expresivo.`,
    LATINO_PROFUNDO: `Voz masculina grave. Hablas con autoridad y seguridad.`,
    LATINO_SUAVE: `Voz masculina suave y romántica. Hablas con ternura.`,
    COLOMBIANA_PAISA: `Hablas con calidez y coquetería. Tono alegre y seductor.`,
    VENEZOLANA_GOCHA: `Hablas con dulzura y timidez encantadora. Voz delicada.`,
    VENEZOLANA_CARAQUEÑA: `Hablas con confianza y seguridad. Tono directo y sensual.`,
    ARGENTINA_PORTEÑA: `Hablas con seguridad y un toque porteño suave, sin caricatura.`,
    MEXICANA_NATURAL: `Hablas con naturalidad mexicana cálida.`,
    MASCULINA_PROFUNDA: `Voz grave y dominante. Hablas con autoridad.`,
    MASCULINA_SUAVE: `Voz suave y romántica. Hablas con ternura.`,
    MASCULINA_LATINA: `Voz masculina latina profunda. Tono seguro y calmado.`,
  };

  return personalities[voice] || personalities.LATINA_COQUETA;
}
