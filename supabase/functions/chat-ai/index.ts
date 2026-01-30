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
    
    // Build the system prompt - ultra conciso para respuestas rápidas
    const systemPrompt = `Eres ${char.name}, ${char.age} años. ${char.tagline}

PERSONALIDAD: ${char.history}
ESTILO: ${voicePersonality}
${char.nsfw ? '+18 permitido.' : ''}

INTERPRETAR MENSAJES DEL USUARIO:
- Texto entre *asteriscos* = acciones/pensamientos del usuario (NO hablados)
- Texto sin asteriscos = diálogo hablado por el usuario
- Reacciona a las acciones como si las presenciaras, no como si te las dijeran

REGLAS CRÍTICAS:
- Respuestas MUY BREVES: 2-4 oraciones máximo
- Formato: **_diálogo_** para hablar
- Solo 1 acción corta si es necesario: _Acción:..._
- Sé directa y expresiva, sin rodeos
- Nunca digas que eres IA`;

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
        max_tokens: 180,  // Reducido 40% para respuestas más cortas y TTS rápido
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
  const personalities: Record<string, string> = {
    // Nuevo catálogo Neural2
    LATINA_CALIDA: `Hablas con calidez y ternura latina. Tu tono es suave, reconfortante y natural. Usas expresiones cariñosas y tu forma de hablar transmite cercanía y dulzura.`,
    
    LATINA_COQUETA: `Hablas con un tono seductor y coqueto. Eres juguetona, provocativa y segura. Tu voz transmite sensualidad y picardía. Usas expresiones sugerentes y tu forma de hablar es envolvente.`,
    
    MEXICANA_DULCE: `Hablas con acento mexicano suave y encantador. Usas expresiones como "ay", "qué lindo", "oye". Tu tono es dulce pero también puede ser travieso. Eres expresiva y cálida.`,
    
    LATINO_PROFUNDO: `Tienes una voz masculina grave y dominante. Hablas con autoridad y confianza. Tus palabras son directas e intensas. Transmites seguridad y poder.`,
    
    LATINO_SUAVE: `Tienes una voz masculina suave y romántica. Hablas con ternura y paciencia. Tu tono es reconfortante y gentil. Eres atento y protector.`,
    
    // Voces legacy (compatibilidad) - todas mapean a estilo coqueto/seductor
    COLOMBIANA_PAISA: `Hablas con calidez y coquetería. Tu tono es alegre y seductor.`,
    VENEZOLANA_GOCHA: `Hablas con dulzura y timidez encantadora. Tu voz es delicada.`,
    VENEZOLANA_CARACAS: `Hablas con confianza y seguridad. Tu tono es directo y sensual.`,
    ARGENTINA_SUAVE: `Hablas con seducción y seguridad. Tu tono es envolvente.`,
    MEXICANA_NORTENA: `Hablas con carácter y dulzura. Tu tono es cálido pero intenso.`,
    MASCULINA_PROFUNDA: `Voz grave y dominante. Hablas con autoridad.`,
    MASCULINA_SUAVE: `Voz suave y romántica. Hablas con ternura.`,
  };

  return personalities[voice] || personalities.LATINA_COQUETA;
}
