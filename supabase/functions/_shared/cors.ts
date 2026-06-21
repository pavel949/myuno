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
 * This project's Lovable id (see CLAUDE.md / ALLOWED_ORIGINS above).
 * Used to scope preview-host matching to OUR project only — we must not trust
 * arbitrary *.lovable.app / *.lovableproject.com hosts belonging to other
 * Lovable projects, since they could forge a request from a credentialed user.
 */
const LOVABLE_PROJECT_ID = "dcc2b024-7627-4ad9-a915-a3df3dd839f0";

/**
 * Allow per-PR/per-session preview hosts for THIS project only. Lovable preview
 * hostnames for a given project embed its id, e.g.
 *   https://id-preview--<projectId>.lovable.app
 *   https://<projectId>.lovableproject.com
 *   https://preview--<branch>--<projectId>.lovable.app
 * so we require the project id to appear in the hostname. A bare
 * `endsWith(".lovable.app")` would trust every other tenant's preview.
 */
function isLovablePreview(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) &&
      host.includes(LOVABLE_PROJECT_ID)
    );
  } catch {
    return false;
  }
}

/** Canonical site URL fallback when the request origin is not trusted. */
export const CANONICAL_SITE_URL = "https://myuno.app";

/**
 * Returns the request Origin only if it's in the allow-list (or a valid preview
 * host for THIS project); otherwise the canonical site URL. Use this anywhere an
 * origin is reflected back to the user — e.g. building Stripe success/cancel URLs
 * — to prevent open-redirect via a forged `origin` header.
 */
export function getAllowedOrigin(origin: string | null | undefined): string {
  const o = origin ?? "";
  if (ALLOWED_ORIGINS.includes(o) || isLovablePreview(o)) {
    return o;
  }
  return Deno.env.get("SITE_URL") || CANONICAL_SITE_URL;
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
