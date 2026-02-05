 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * ElevenLabs Voice Search - Busca voces reales en la biblioteca
  * Utiliza la API v2/voices con filtros de idioma/acento/género
  */
 
 interface VoiceLabel {
   accent?: string;
   gender?: string;
   age?: string;
   use_case?: string;
   description?: string;
 }
 
 interface ElevenLabsVoice {
   voice_id: string;
   name: string;
   labels: VoiceLabel;
   description?: string;
   preview_url?: string;
   category?: string;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const apiKey = Deno.env.get("ELEVENLABS_API_KEY_OVERRIDE") || Deno.env.get("ELEVENLABS_API_KEY");
     
     if (!apiKey) {
       return new Response(
         JSON.stringify({ error: "API key not configured" }),
         { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { language, accent, gender, search } = await req.json();
 
     // Construir query params
     const params = new URLSearchParams();
     params.append("show_legacy", "false");
     params.append("page_size", "100");
     
     if (language) params.append("language", language);
     if (gender) params.append("gender", gender);
     if (search) params.append("search", search);
 
     console.log(`Searching voices: language=${language}, accent=${accent}, gender=${gender}, search=${search}`);
 
     const response = await fetch(
       `https://api.elevenlabs.io/v2/voices?${params.toString()}`,
       {
         headers: {
           "xi-api-key": apiKey,
         },
       }
     );
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("ElevenLabs voice search error:", response.status, errorText);
       return new Response(
         JSON.stringify({ error: `Search failed: ${response.status}`, details: errorText }),
         { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const data = await response.json();
     const voices: ElevenLabsVoice[] = data.voices || [];
 
     // Filtrar por acento si se especifica (la API no filtra por acento directamente)
     let filteredVoices = voices;
     if (accent) {
       const accentLower = accent.toLowerCase();
       filteredVoices = voices.filter((v: ElevenLabsVoice) => {
         const voiceAccent = v.labels?.accent?.toLowerCase() || "";
         const voiceDesc = (v.description || "").toLowerCase();
         const voiceName = v.name.toLowerCase();
         return voiceAccent.includes(accentLower) || 
                voiceDesc.includes(accentLower) || 
                voiceName.includes(accentLower);
       });
     }
 
     // Formatear respuesta
     const result = filteredVoices.map((v: ElevenLabsVoice) => ({
       voice_id: v.voice_id,
       name: v.name,
       accent: v.labels?.accent || "unknown",
       gender: v.labels?.gender || "unknown",
       age: v.labels?.age || "unknown",
       use_case: v.labels?.use_case || "unknown",
       description: v.description || v.labels?.description || "",
       preview_url: v.preview_url,
       category: v.category,
     }));
 
     console.log(`Found ${result.length} voices matching criteria`);
 
     return new Response(
       JSON.stringify({ voices: result, total: result.length }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Voice search error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });