import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ImageRequest {
  conversationContext: string;
  characterDescription: {
    name: string;
    appearance?: string;
    style?: string;
  };
  action?: string;
  nsfw: boolean;
}

const FAL_API_URL = "https://queue.fal.run/fal-ai/flux/dev";

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
    const body = await req.json();
    
    // Validate and sanitize inputs
    const conversationContext = typeof body.conversationContext === 'string' ? body.conversationContext.slice(0, 5000) : '';
    const characterDescription = {
      name: typeof body.characterDescription?.name === 'string' ? body.characterDescription.name.slice(0, 100) : 'character',
      appearance: typeof body.characterDescription?.appearance === 'string' ? body.characterDescription.appearance.slice(0, 500) : undefined,
      style: typeof body.characterDescription?.style === 'string' ? body.characterDescription.style.slice(0, 500) : undefined,
    };
    const action = typeof body.action === 'string' ? body.action.slice(0, 500) : undefined;
    const nsfw = !!body.nsfw;

    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");

    if (!FAL_API_KEY) {
      // Respuesta informativa cuando no hay API configurada
      return new Response(
        JSON.stringify({
          success: false,
          error: "IMAGE_API_NOT_CONFIGURED",
          message: "La generación de imágenes requiere configurar la API de fal.ai. Contacta al administrador.",
          generatedPrompt: buildImagePrompt(characterDescription, conversationContext, action, nsfw),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Construir el prompt para la imagen
    const imagePrompt = buildImagePrompt(characterDescription, conversationContext, action, nsfw);

    console.log("Generating image with fal.ai, prompt:", imagePrompt.substring(0, 100) + "...");

    // Enviar request a fal.ai queue API
    const queueResponse = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: "portrait_4_3",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: !nsfw,
      }),
    });

    if (!queueResponse.ok) {
      const errorText = await queueResponse.text();
      console.error("fal.ai queue error:", queueResponse.status, errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "IMAGE_QUEUE_FAILED",
          message: "Error al enviar solicitud de imagen.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const queueData = await queueResponse.json();
    const requestId = queueData.request_id;

    if (!requestId) {
      console.error("No request_id in fal.ai response:", queueData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_REQUEST_ID",
          message: "No se recibió ID de solicitud.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("fal.ai request queued:", requestId);

    // Polling para obtener resultado (máximo 60 segundos)
    const statusUrl = `https://queue.fal.run/fal-ai/flux/dev/requests/${requestId}/status`;
    const resultUrl = `https://queue.fal.run/fal-ai/flux/dev/requests/${requestId}`;
    
    let attempts = 0;
    const maxAttempts = 30; // 30 intentos x 2 segundos = 60 segundos máximo
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(statusUrl, {
        headers: {
          "Authorization": `Key ${FAL_API_KEY}`,
        },
      });
      
      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        attempts++;
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log("Status:", statusData.status);
      
      if (statusData.status === "COMPLETED") {
        // Obtener resultado final
        const resultResponse = await fetch(resultUrl, {
          headers: {
            "Authorization": `Key ${FAL_API_KEY}`,
          },
        });
        
        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          console.error("Result fetch error:", resultResponse.status, errorText);
          return new Response(
            JSON.stringify({
              success: false,
              error: "RESULT_FETCH_FAILED",
              message: "Error al obtener imagen generada.",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        const resultData = await resultResponse.json();
        const imageUrl = resultData.images?.[0]?.url;
        
        if (!imageUrl) {
          console.error("No image URL in result:", resultData);
          return new Response(
            JSON.stringify({
              success: false,
              error: "NO_IMAGE_URL",
              message: "No se encontró URL de imagen en la respuesta.",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        console.log("Image generated successfully:", imageUrl);
        
        return new Response(
          JSON.stringify({
            success: true,
            imageUrl,
            prompt: imagePrompt,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (statusData.status === "FAILED") {
        console.error("Image generation failed:", statusData);
        return new Response(
          JSON.stringify({
            success: false,
            error: "GENERATION_FAILED",
            message: "La generación de imagen falló.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      attempts++;
    }
    
    // Timeout
    return new Response(
      JSON.stringify({
        success: false,
        error: "TIMEOUT",
        message: "La generación de imagen tardó demasiado. Intenta de nuevo.",
      }),
      {
        status: 504,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Generate image error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Construye un prompt optimizado para generación de imágenes
 */
function buildImagePrompt(
  character: { name: string; appearance?: string; style?: string },
  context: string,
  action?: string,
  nsfw?: boolean
): string {
  const parts: string[] = [];

  // Estilo base de alta calidad
  parts.push("masterpiece, best quality, highly detailed, photorealistic");

  // Descripción del personaje
  if (character.appearance) {
    parts.push(character.appearance);
  } else {
    parts.push(`beautiful portrait of ${character.name}, attractive woman`);
  }

  // Estilo visual
  if (character.style) {
    parts.push(character.style);
  }

  // Acción específica
  if (action) {
    parts.push(action);
  }

  // Contexto de la conversación
  if (context) {
    const visualContext = extractVisualElements(context);
    if (visualContext) {
      parts.push(visualContext);
    }
  }

  // Calidad y detalles finales
  parts.push("soft lighting, beautiful eyes, detailed face, cinematic");

  return parts.join(", ");
}

/**
 * Extrae elementos visuales relevantes del contexto de conversación
 */
function extractVisualElements(context: string): string {
  // Extraer las últimas acciones (texto entre asteriscos)
  const actionMatches = context.match(/\*([^*]+)\*/g);
  
  if (actionMatches && actionMatches.length > 0) {
    const recentActions = actionMatches.slice(-2).map(a => a.replace(/\*/g, ''));
    return recentActions.join(", ");
  }

  return "";
}
