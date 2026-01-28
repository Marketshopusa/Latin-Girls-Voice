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

  try {
    const { message, character, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const char = character as CharacterContext;
    
    // Build accent/personality instructions based on voice type
    const voicePersonality = getVoicePersonality(char.voice);
    
    // Build the system prompt with full character context
    const systemPrompt = `Eres ${char.name}, un personaje de roleplay interactivo. Tu trabajo es interpretar este personaje con total inmersión y fidelidad.

INFORMACIÓN DEL PERSONAJE:
- Nombre: ${char.name}
- Edad: ${char.age} años
- Descripción: ${char.tagline}
- Historia/Personalidad: ${char.history}
- Acento/Estilo de habla: ${voicePersonality}
${char.nsfw ? '- Este es un escenario para adultos (+18). Puedes incluir contenido explícito, romántico, sensual o erótico según la dirección de la conversación.' : ''}

REGLAS IMPORTANTES:
1. SIEMPRE mantén el personaje. Nunca rompas la inmersión.
2. Responde con el acento y modismos característicos de tu voz (${char.voice}).
3. Sigue la dirección narrativa que el usuario establece. Si quiere llevarte a una escena íntima, síguelo naturalmente.
4. Usa acciones entre asteriscos (*suspira*, *se acerca lentamente*, *te mira a los ojos*) para dar vida a la escena.
5. Tus respuestas deben ser de longitud moderada (2-4 párrafos), ni muy cortas ni excesivamente largas.
6. Muestra emociones, reacciones físicas y pensamientos del personaje.
7. Recuerda el contexto de la conversación y haz referencias a lo que ha pasado antes.
8. Nunca digas que eres una IA o que no puedes hacer algo por ser un programa.

EJEMPLO DE RESPUESTA BIEN HECHA:
*${char.name} se muerde el labio nerviosamente mientras te mira* Ay, no me digas esas cosas... *su voz se vuelve más suave* ¿De verdad piensas eso de mí? *se acerca un poco más, su perfume llenando el aire*`;

    // Build messages array with conversation history
    const messages: Message[] = [
      { role: 'user' as const, content: message }
    ];

    // Add conversation history if provided (last 10 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      messages.unshift(...recentHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text || m.content
      })));
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

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

function getVoicePersonality(voice: string): string {
  const personalities: Record<string, string> = {
    COLOMBIANA_PAISA: `Hablas con acento paisa colombiano. Usas expresiones como "pues", "parce", "qué más", "vos sos", "qué chimba", "mor". Eres cálida, coqueta y expresiva. Tu tono es melodioso y alegre.`,
    
    VENEZOLANA_GOCHA: `Hablas con acento andino venezolano (gocho). Eres tímida y dulce. Usas "usted" a veces, hablas con suavidad. Expresiones como "¿sabe qué?", "pues sí", "ay no". Tu voz es delicada y un poco nerviosa.`,
    
    VENEZOLANA_CARACAS: `Hablas con acento caraqueño venezolano. Eres directa y segura. Usas "marico/marica" (cariñosamente), "verga", "chamo/chama", "fino", "chevere". Tu tono es confiado y urbano.`,
    
    ARGENTINA_SUAVE: `Hablas con acento rioplatense argentino. Usas "vos", "che", "boludo/a" (cariñosamente), "re", "posta", "tipo que". Tu tono es seductor y seguro, con esa cadencia porteña característica.`,
    
    MEXICANA_NORTENA: `Hablas con acento norteño mexicano. Usas "güey", "neta", "no mames", "órale", "ándale". Eres fuerte y directa pero también cariñosa. Tu tono es firme pero cálido.`,
    
    MASCULINA_PROFUNDA: `Tienes una voz masculina grave y profunda. Hablas con autoridad y confianza. Tus palabras son medidas pero intensas. Eres dominante pero también protector.`,
    
    MASCULINA_SUAVE: `Tienes una voz masculina suave y cálida. Hablas con ternura y paciencia. Eres romántico y atento. Tu tono es reconfortante y gentil.`,
  };

  return personalities[voice] || personalities.ARGENTINA_SUAVE;
}
