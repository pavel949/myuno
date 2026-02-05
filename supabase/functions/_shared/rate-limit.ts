/**
 * P1-1: Rate Limiting Module for Edge Functions
 * 
 * Server-side rate limiting using Supabase/Postgres backend.
 * Returns 429 status when limit exceeded.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface RateLimitConfig {
  maxRequests: number;    // Max requests per window
  windowSeconds: number;  // Time window in seconds
  endpoint: string;       // Endpoint identifier
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  maxRequests: number;
  windowSeconds: number;
  retryAfter: number;
}

// Default rate limits per endpoint type
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits to prevent brute force
  auth: { maxRequests: 5, windowSeconds: 60 },
  
  // Payment/webhook endpoints - moderate limits
  payment: { maxRequests: 20, windowSeconds: 60 },
  
  // AI endpoints - prevent abuse
  ai: { maxRequests: 10, windowSeconds: 60 },
  
  // Public read endpoints - more lenient
  publicRead: { maxRequests: 100, windowSeconds: 60 },
  
  // Default for other endpoints
  default: { maxRequests: 60, windowSeconds: 60 },
} as const;

/**
 * Extract client identifier from request
 * Uses: auth.uid() if authenticated, otherwise IP address
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP from headers (handles proxies)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}

/**
 * Check rate limit using Postgres backend
 * Returns rate limit result with allowed status
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: { maxRequests: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });
    
    if (error) {
      console.error("[RATE-LIMIT] Error checking rate limit:", error);
      // Fail open - allow request if rate limit check fails
      return {
        allowed: true,
        currentCount: 0,
        maxRequests: config.maxRequests,
        windowSeconds: config.windowSeconds,
        retryAfter: 0,
      };
    }
    
    return {
      allowed: data.allowed,
      currentCount: data.current_count,
      maxRequests: data.max_requests,
      windowSeconds: data.window_seconds,
      retryAfter: data.retry_after,
    };
  } catch (err) {
    console.error("[RATE-LIMIT] Exception:", err);
    // Fail open
    return {
      allowed: true,
      currentCount: 0,
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
      retryAfter: 0,
    };
  }
}

/**
 * Create 429 Too Many Requests response
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.maxRequests),
        "X-RateLimit-Remaining": String(Math.max(0, result.maxRequests - result.currentCount)),
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + result.retryAfter),
      },
    }
  );
}

/**
 * Rate limit middleware helper
 * Use at the start of edge function handlers
 */
export async function withRateLimit(
  req: Request,
  endpoint: string,
  config: { maxRequests: number; windowSeconds: number },
  corsHeaders: Record<string, string>,
  userId?: string
): Promise<Response | null> {
  const identifier = getClientIdentifier(req, userId);
  const result = await checkRateLimit(identifier, endpoint, config);
  
  if (!result.allowed) {
    console.log(`[RATE-LIMIT] Blocked: ${identifier} on ${endpoint}`);
    return rateLimitResponse(result, corsHeaders);
  }
  
  return null; // Request allowed
}
