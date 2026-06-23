import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

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

  // --- Rate limit check ---
  const _userId = _cl.claims.sub as string;
  const allowedRL = await checkRateLimit(_userId, "generate-character-story");
  if (!allowedRL) {
    return new Response(JSON.stringify({ error: "Límite de generación alcanzado. Intenta de nuevo más tarde." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // --- End rate limit ---

  try {
    const body = await req.json();
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    const name = typeof body.name === 'string' ? body.name.slice(0, 100) : '';
    const age = typeof body.age === 'number' ? Math.min(Math.max(Math.floor(body.age), 1), 150) : undefined;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("Neither GEMINI_API_KEY nor LOVABLE_API_KEY is configured");
    }
    const useGeminiDirect = !!GEMINI_API_KEY;

    if (!imageBase64) {
      throw new Error("Se requiere una imagen para generar la historia");
    }

    // Validate image size (max ~10MB base64)
    if (imageBase64.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Imagen demasiado grande (máx 10MB)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `Eres un escritor creativo experto en descripciones de personajes e historias de rol.
Genera la historia detallada del personaje basándote en la imagen provista.
Tu respuesta debe ser un objeto JSON con los siguientes campos en español:
{
  "name": "Nombre sugerido para el personaje (basado en su apariencia o estilo)",
  "tagline": "Una frase corta, coqueta e intrigante que describa su personalidad",
  "history": "Un perfil detallado del personaje de al menos 3 párrafos. Describe su origen, personalidad, pasatiempos, deseos y estilo de vida de forma inmersiva.",
  "welcome_message": "El primer mensaje de bienvenida que enviará al usuario para abrir la conversación, muy coqueta y provocativa"
}
IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;

    const userPrompt = name && age 
      ? `Genera la historia para un personaje llamado "${name}" de ${age} años basándote en esta imagen.`
      : name
        ? `Genera la historia para un personaje llamado "${name}" basándote en esta imagen.`
        : `Genera la historia para este personaje basándote en la imagen.`;

    // Prepare the image for the API
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    let aiResponse = "";

    if (useGeminiDirect) {
      // Clean base64 and mime type
      let mimeType = "image/jpeg";
      let cleanBase64 = imageBase64;
      if (imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          mimeType = match[1];
          cleanBase64 = match[2];
        }
      }

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const geminiPayload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: userPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
        ],
      };

      console.log("Calling Gemini Direct API for story generation with safety threshold BLOCK_NONE...");
      const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gemini Direct API error: ${response.status}`, errText);
        throw new Error(`Gemini Direct API error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // Lovable API Proxy mode
      const apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      const finalModel = "google/gemini-2.5-flash";

      console.log("Calling Lovable AI gateway with image analysis...");
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: finalModel,
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
      aiResponse = data.choices?.[0]?.message?.content || "";
    }
    
    console.log("AI Response length:", aiResponse.length);

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
        welcome_message: "*Te observa con curiosidad* **_Hola... no esperaba encontrarte aquí. ¿Qué te trae por estos lares?_**"
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
