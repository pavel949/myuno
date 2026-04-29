/**
 * Image Proxy Edge Function
 * PUBLIC_ENDPOINT: Proxies external images for CORS bypass.
 * Protected by: rate limiting, SSRF allowlist, redirect block, timeout, size limit, content-type check.
 */

// Using Deno.serve (native edge runtime)
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { validateUrlForSSRF } from "../_shared/ssrf-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const FETCH_TIMEOUT_MS = 8000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[proxy-image] ${req.method} ${req.url}`);

  // Rate limit: public read endpoint
  const rateLimitResponse = await withRateLimit(req, "proxy-image", RATE_LIMITS.publicRead, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  // Health check
  const reqUrl = new URL(req.url);
  if (req.method === "GET" && reqUrl.searchParams.get("health") === "1") {
    return new Response(
      JSON.stringify({ ok: true, fn: "proxy-image", ts: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Extract URL from query param or POST body
    let imageUrl: string | null = null;
    imageUrl = reqUrl.searchParams.get("url");

    if (!imageUrl && req.method === "POST") {
      const body = await req.json();
      imageUrl = body.url;
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SSRF protection (strict allowlist)
    const ssrfCheck = validateUrlForSSRF(imageUrl);
    if (!ssrfCheck.allowed) {
      console.warn(`[PROXY-IMAGE] SSRF blocked: ${ssrfCheck.reason} — ${imageUrl}`);
      return new Response(
        JSON.stringify({ error: "URL not allowed", reason: ssrfCheck.reason }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Proxying image:", imageUrl.substring(0, 120));

    // Fetch with no redirects + abort signal
    const response = await fetch(imageUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*,*/*",
      },
    });

    // Block redirects
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      return new Response(
        JSON.stringify({ error: "Redirects not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Content-Type check — only images
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "Only image content-type allowed" }),
        { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Size check via Content-Length header (fast path)
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: "Image too large", maxBytes: MAX_SIZE }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream body with hard size cap
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_SIZE) {
        reader.cancel();
        return new Response(
          JSON.stringify({ error: "Image too large", maxBytes: MAX_SIZE }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      chunks.push(value);
    }

    // Combine chunks
    const imageData = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      imageData.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timed out" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    clearTimeout(timeout);
  }
});
