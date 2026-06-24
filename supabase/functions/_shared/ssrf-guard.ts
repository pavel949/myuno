/**
 * SSRF Protection Guard
 * Validates URLs against a strict allowlist to prevent Server-Side Request Forgery.
 * Non-allowlisted hostnames are BLOCKED (no "allow but log").
 */

// Strict allowlist — only these hostname patterns are permitted
const ALLOWED_HOSTNAME_PATTERNS: RegExp[] = [
  /\.supabase\.co$/i,
  /\.supabase\.in$/i,
];

// Blocked IP ranges (private, loopback, metadata, link-local)
const BLOCKED_IP_PATTERNS: RegExp[] = [
  /^127\./,                          // Loopback
  /^0\./,                            // 0.0.0.0/8
  /^10\./,                           // 10/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16/12
  /^192\.168\./,                     // 192.168/16
  /^169\.254\./,                     // Link-local / AWS metadata
  /^fc00:/i,                         // IPv6 ULA
  /^fe80:/i,                         // IPv6 link-local
  /^::1$/,                           // IPv6 loopback
  /^fd/i,                            // IPv6 ULA
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "metadata.google.internal",
  "metadata.google",
]);

export interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a URL for SSRF safety.
 * Returns { allowed: true } only if the hostname matches the allowlist.
 */
export function validateUrlForSSRF(rawUrl: string): SSRFValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: "Invalid URL format" };
  }

  // Protocol check
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { allowed: false, reason: `Protocol '${parsed.protocol}' not allowed. Only http/https.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { allowed: false, reason: `Hostname '${hostname}' is blocked` };
  }

  // Block .local / .internal domains
  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { allowed: false, reason: `Domain '${hostname}' is blocked (local/internal)` };
  }

  // Block IP addresses in private ranges
  if (BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return { allowed: false, reason: `IP '${hostname}' is in a blocked range` };
  }

  // Block all bare IP literals (v4 and v6) unless they match the allowlist
  const isIpAddress = /^[\d.:]+$/.test(hostname) || hostname.includes(":");
  if (isIpAddress) {
    return { allowed: false, reason: `Direct IP access '${hostname}' is not allowed` };
  }

  // Require allowlist match — NO fallback "allow but log"
  const isAllowed = ALLOWED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
  if (!isAllowed) {
    return { allowed: false, reason: `Hostname '${hostname}' is not allowlisted` };
  }

  return { allowed: true };
}

/**
 * Validate a USER-PROVIDED EXTERNAL url for SSRF safety using a DENY-list.
 *
 * Unlike `validateUrlForSSRF` (strict allow-list, Supabase-only), this permits
 * any *public* hostname but blocks loopback, private/link-local ranges, cloud
 * metadata endpoints, *.local/*.internal, and bare IP literals. Use this for
 * features that legitimately fetch arbitrary third-party URLs — partner iCal
 * calendars (Airbnb/Booking), remote image extraction, etc. — where a strict
 * allow-list is not viable.
 *
 * NOTE: hostname-based filtering does not by itself defeat DNS-rebinding (a
 * public hostname resolving to a private IP). It is a meaningful first layer;
 * pair with redirect-following limits / resolved-IP checks for defence in depth.
 */
export function validateExternalUrlForSSRF(rawUrl: string): SSRFValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: "Invalid URL format" };
  }

  // Protocol — only http/https (also blocks webcal:, file:, gopher:, etc.).
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { allowed: false, reason: `Protocol '${parsed.protocol}' not allowed. Only http/https.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { allowed: false, reason: `Hostname '${hostname}' is blocked` };
  }

  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { allowed: false, reason: `Domain '${hostname}' is blocked (local/internal)` };
  }

  if (BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return { allowed: false, reason: `IP '${hostname}' is in a blocked range` };
  }

  // Block ALL bare IP literals (v4/v6) — external integrations should target
  // hostnames, and IP literals are the primary SSRF metadata vector.
  const isIpAddress = /^[\d.]+$/.test(hostname) || hostname.includes(":");
  if (isIpAddress) {
    return { allowed: false, reason: `Direct IP access '${hostname}' is not allowed` };
  }

  // Require a dotted public hostname (rejects single-label hosts like "intranet").
  if (!hostname.includes(".")) {
    return { allowed: false, reason: `Hostname '${hostname}' is not a public domain` };
  }

  return { allowed: true };
}
