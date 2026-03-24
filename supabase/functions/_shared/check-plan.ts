import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Plan limits mirrored from client (source of truth for server-side enforcement)
const PLAN_LIMITS: Record<string, {
  hasTTS: boolean;
  hasPremiumVoices: boolean;
  hasVoiceCalls: boolean;
  maxImagesGenerated: number;
}> = {
  free:    { hasTTS: false, hasPremiumVoices: false, hasVoiceCalls: false, maxImagesGenerated: 0 },
  basic:   { hasTTS: true,  hasPremiumVoices: false, hasVoiceCalls: false, maxImagesGenerated: 40 },
  premium: { hasTTS: true,  hasPremiumVoices: false, hasVoiceCalls: false, maxImagesGenerated: 100 },
  ultra:   { hasTTS: true,  hasPremiumVoices: true,  hasVoiceCalls: true,  maxImagesGenerated: Infinity },
};

const PLAN_TIERS: Record<string, string> = {
  'prod_TtXZYs9IgzQygU': 'basic',
  'prod_TtXae9AMEE0rAk': 'premium',
  'prod_TtXahShhTUYtCz': 'ultra',
};

export interface PlanInfo {
  plan: string;
  hasTTS: boolean;
  hasPremiumVoices: boolean;
  hasVoiceCalls: boolean;
  maxImagesGenerated: number;
  isAdmin: boolean;
}

/**
 * Checks the user's subscription plan server-side.
 * Returns plan info or defaults to 'free' on any failure.
 */
export async function getUserPlan(userId: string, userEmail: string | undefined): Promise<PlanInfo> {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Check admin status
  const { data: isAdmin } = await sb.rpc("is_admin", { _user_id: userId });
  if (isAdmin) {
    return {
      plan: 'ultra',
      hasTTS: true,
      hasPremiumVoices: true,
      hasVoiceCalls: true,
      maxImagesGenerated: Infinity,
      isAdmin: true,
    };
  }

  // Check Stripe subscription
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey || !userEmail) {
    return { ...PLAN_LIMITS['free'], plan: 'free', isAdmin: false };
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) {
      return { ...PLAN_LIMITS['free'], plan: 'free', isAdmin: false };
    }

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    if (subs.data.length === 0) {
      return { ...PLAN_LIMITS['free'], plan: 'free', isAdmin: false };
    }

    const productId = subs.data[0].items.data[0].price.product as string;
    const plan = PLAN_TIERS[productId] || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free'];

    return { ...limits, plan, isAdmin: false };
  } catch (e) {
    console.error("[CHECK-PLAN] Stripe error:", e);
    // Allow on error to avoid blocking legitimate requests
    return { ...PLAN_LIMITS['free'], plan: 'free', isAdmin: false };
  }
}
