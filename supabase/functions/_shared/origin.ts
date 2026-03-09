/**
 * Shared origin helper for Edge Functions.
 * Centralizes the fallback URL logic so we don't hardcode preview URLs everywhere.
 */
export function getOrigin(req: Request): string {
  return req.headers.get("origin")
    || Deno.env.get("SITE_URL")
    || "https://uno.ae";
}
