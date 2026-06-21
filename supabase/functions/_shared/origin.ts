import { getAllowedOrigin } from "./cors.ts";

/**
 * Shared origin helper for Edge Functions.
 * Centralizes the fallback URL logic so we don't hardcode preview URLs everywhere.
 *
 * The raw `origin` header is attacker-controlled and is used to build Stripe
 * success/cancel redirect URLs, so it MUST be validated against the allow-list
 * (open-redirect after payment otherwise). `getAllowedOrigin` returns the origin
 * only when trusted, else the canonical site URL.
 */
export function getOrigin(req: Request): string {
  return getAllowedOrigin(req.headers.get("origin"));
}
