/**
 * CORS headers for Edge Functions. Echoes back the request Origin when it's
 * in the allow-list; otherwise falls back to the production canonical origin.
 *
 * Update this list when adding new preview/custom domains.
 */
const ALLOWED_ORIGINS: string[] = [
  // Production custom domains
  "https://myuno.app",
  "https://www.myuno.app",

  // Lovable hosting
  "https://uno-connect-hub.lovable.app",
  "https://id-preview--dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovable.app",
  "https://dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovableproject.com",

  // Legacy / future
  "https://app.myuno.com",
  "https://admin.myuno.com",
  "https://uno.ae",

  // Local dev — always allowed (cheap, never reaches prod requests)
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

/**
 * Allow any *.lovable.app or *.lovableproject.com sandbox preview without
 * needing to enumerate every per-PR/per-session host.
 */
function isLovablePreview(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".lovable.app") ||
        url.hostname.endsWith(".lovableproject.com"))
    );
  } catch {
    return false;
  }
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed =
    ALLOWED_ORIGINS.includes(origin) || isLovablePreview(origin)
      ? origin
      : "https://myuno.app";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}
