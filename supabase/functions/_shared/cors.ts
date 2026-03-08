/**
 * CORS headers for Edge Functions. Restrict origin on mutating endpoints.
 */
const ALLOWED_ORIGINS = [
  "https://app.myuno.com",
  "https://admin.myuno.com",
  "https://uno.ae",
  "https://id-preview--dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovable.app",
  "https://dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovableproject.com",
  ...(typeof Deno !== "undefined" && Deno.env.get("NODE_ENV") === "development"
    ? ["http://localhost:5173", "http://localhost:3000"]
    : []),
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
