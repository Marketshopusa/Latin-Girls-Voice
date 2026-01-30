import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ImageRequest {
  // Contexto de la conversación para generar el prompt
  conversationContext: string;
  // Descripción del personaje para mantener consistencia
  characterDescription: {
    name: string;
    appearance?: string;
    style?: string;
  };
  // Acción específica a visualizar
  action?: string;
  // Si es contenido NSFW (requiere usuario autenticado y mayor de edad)
  nsfw: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationContext, characterDescription, action, nsfw } = await req.json() as ImageRequest;

    // ============================================================
    // CONFIGURACIÓN DE API EXTERNA
    // ============================================================
    // Para habilitar generación de imágenes, configura tu propia API:
    // 
    // 1. Agrega tu API key como secret en Lovable Cloud:
    //    - IMAGE_API_KEY: Tu clave de API
    //    - IMAGE_API_URL: URL base de tu servicio (opcional)
    //
    // 2. Servicios compatibles sugeridos:
    //    - Stability AI (stable-diffusion)
    //    - Replicate
    //    - Cualquier servicio que acepte prompts de texto
    //
    // 3. Descomenta y adapta el código de abajo según tu servicio
    // ============================================================

    const IMAGE_API_KEY = Deno.env.get("IMAGE_API_KEY");
    const IMAGE_API_URL = Deno.env.get("IMAGE_API_URL") || "https://api.your-service.com/generate";

    if (!IMAGE_API_KEY) {
      // Respuesta informativa cuando no hay API configurada
      return new Response(
        JSON.stringify({
          success: false,
          error: "IMAGE_API_NOT_CONFIGURED",
          message: "La generación de imágenes requiere configurar una API externa. Contacta al administrador.",
          // Devolver el prompt generado para uso futuro
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

    console.log("Generating image with prompt:", imagePrompt.substring(0, 100) + "...");

    // ============================================================
    // EJEMPLO: Llamada a API externa (adaptar según el servicio)
    // ============================================================
    
    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${IMAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        // Parámetros comunes - adaptar según el servicio
        width: 768,
        height: 1024,
        steps: 30,
        cfg_scale: 7,
        // Agregar más parámetros según necesidad
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image API error:", response.status, errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "IMAGE_GENERATION_FAILED",
          message: "Error al generar la imagen. Intenta de nuevo.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Adaptar según la estructura de respuesta del servicio
    // Ejemplo genérico:
    const imageUrl = data.output?.[0] || data.image_url || data.url || data.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_IMAGE_RETURNED",
          message: "El servicio no devolvió una imagen.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
 * basado en el contexto de la conversación y el personaje
 */
function buildImagePrompt(
  character: { name: string; appearance?: string; style?: string },
  context: string,
  action?: string,
  nsfw?: boolean
): string {
  const parts: string[] = [];

  // Estilo base
  parts.push("high quality, detailed, professional photography style");

  // Descripción del personaje
  if (character.appearance) {
    parts.push(character.appearance);
  } else {
    parts.push(`portrait of ${character.name}`);
  }

  // Estilo visual
  if (character.style) {
    parts.push(character.style);
  }

  // Acción específica
  if (action) {
    parts.push(action);
  }

  // Contexto de la conversación (simplificado)
  if (context) {
    // Extraer elementos visuales del contexto
    const visualContext = extractVisualElements(context);
    if (visualContext) {
      parts.push(visualContext);
    }
  }

  // Calidad y detalles
  parts.push("cinematic lighting, sharp focus, 8k uhd");

  return parts.join(", ");
}

/**
 * Extrae elementos visuales relevantes del contexto de conversación
 */
function extractVisualElements(context: string): string {
  // Extraer las últimas acciones (texto entre asteriscos)
  const actionMatches = context.match(/\*([^*]+)\*/g);
  
  if (actionMatches && actionMatches.length > 0) {
    // Tomar las últimas 2 acciones
    const recentActions = actionMatches.slice(-2).map(a => a.replace(/\*/g, ''));
    return recentActions.join(", ");
  }

  return "";
}
