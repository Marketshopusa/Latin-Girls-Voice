import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = (claims.claims as Record<string, unknown>).sub as string;

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length === 0 || code.trim().length > 50) {
      return new Response(JSON.stringify({ error: "Código inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Look up code using service role (no public read needed)
    const { data: promoCode, error: promoErr } = await sb
      .from("promo_codes")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (promoErr || !promoCode) {
      return new Response(JSON.stringify({ error: "Código inválido o expirado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already redeemed
    const { data: existing } = await sb
      .from("user_promo_redemptions")
      .select("id")
      .eq("user_id", userId)
      .eq("promo_code_id", promoCode.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Ya has utilizado este código promocional" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Redeem
    const { error: insertErr } = await sb
      .from("user_promo_redemptions")
      .insert({
        user_id: userId,
        promo_code_id: promoCode.id,
        tts_responses_remaining: promoCode.tts_responses,
        voice_call_seconds_remaining: promoCode.voice_call_minutes * 60,
        expires_at: promoCode.expires_at,
      });

    if (insertErr) {
      console.error("[VALIDATE-PROMO] Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Error al canjear el código" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      tts_responses: promoCode.tts_responses,
      voice_call_minutes: promoCode.voice_call_minutes,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[VALIDATE-PROMO] Error:", err);
    return new Response(JSON.stringify({ error: "Error inesperado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
