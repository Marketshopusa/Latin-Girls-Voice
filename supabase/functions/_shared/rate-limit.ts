import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limits per function (requests per window)
const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  "chat-ai": { maxRequests: 30, windowSeconds: 60 },          // 30/min
  "generate-image": { maxRequests: 5, windowSeconds: 3600 },   // 5/hour
  "elevenlabs-tts": { maxRequests: 60, windowSeconds: 3600 },  // 60/hour
  "google-cloud-tts": { maxRequests: 100, windowSeconds: 3600 },
  "gemini-tts": { maxRequests: 100, windowSeconds: 3600 },
  "gemini-cloud-tts": { maxRequests: 100, windowSeconds: 3600 },
  "generate-character-story": { maxRequests: 10, windowSeconds: 3600 },
  "elevenlabs-sfx": { maxRequests: 30, windowSeconds: 3600 },
};

const DEFAULT_LIMIT = { maxRequests: 60, windowSeconds: 3600 };

export async function checkRateLimit(userId: string, functionName: string): Promise<boolean> {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const limits = RATE_LIMITS[functionName] || DEFAULT_LIMIT;

  const { data, error } = await sb.rpc("check_rate_limit", {
    _user_id: userId,
    _function_name: functionName,
    _max_requests: limits.maxRequests,
    _window_seconds: limits.windowSeconds,
  });

  if (error) {
    console.error(`[RATE-LIMIT] Error checking rate limit for ${functionName}:`, error);
    return true; // Allow on error to avoid blocking legitimate requests
  }

  return data === true;
}
