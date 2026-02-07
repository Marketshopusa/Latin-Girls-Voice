import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { imageBase64, name, age } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("Se requiere una imagen para generar la historia");
    }

    const systemPrompt = `Eres un escritor creativo especializado en crear personajes para roleplay y chat interactivo para adultos (+18).

TAREA: Analiza la imagen proporcionada y genera una descripción de personaje completa.

INSTRUCCIONES:
1. Observa la imagen: vestimenta (o falta de ella), entorno, pose, expresión, actividad
2. Infiere una personalidad coherente con lo visual
3. Crea una historia de fondo interesante y atrevida
4. El personaje SIEMPRE debe ser mayor de 18 años
5. La historia debe ser en español
6. Sé creativo, sensual y coherente con la imagen
7. Si la imagen muestra contenido adulto, incorpóralo naturalmente en la personalidad del personaje

FORMATO DE RESPUESTA (JSON):
{
  "tagline": "Una frase corta y provocativa que describe al personaje (máx 60 caracteres)",
  "history": "Historia de fondo y personalidad del personaje (2-3 párrafos, incluye: quién es, su personalidad seductora, qué le gusta, su situación actual)",
  "welcomeMessage": "El primer mensaje que dirá el personaje al usuario, en primera persona, coqueto e intrigante"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;

    const userPrompt = name && age 
      ? `Genera la historia para un personaje llamado "${name}" de ${age} años basándote en esta imagen.`
      : `Genera la historia para este personaje basándote en la imagen.`;

    // Prepare the image for the API
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    console.log("Calling Lovable AI with image analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.8,
        max_tokens: 800,
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
      throw new Error("Error en el servicio de IA");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiResponse);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback response
      parsedResponse = {
        tagline: "Un personaje misterioso esperando ser descubierto",
        history: "Este personaje tiene una historia fascinante que aún está por escribirse. Basándote en la imagen, puedes imaginar su pasado, sus sueños y sus secretos.",
        welcomeMessage: "*Te observa con curiosidad* **_Hola... no esperaba encontrarte aquí. ¿Qué te trae por estos lares?_**"
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generate character story error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
