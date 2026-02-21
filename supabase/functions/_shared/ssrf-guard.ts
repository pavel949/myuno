/**
 * SSRF Protection Guard
 * Validates URLs to prevent Server-Side Request Forgery attacks.
 */

// Allowlisted hostname patterns for image proxying
const ALLOWED_HOSTNAME_PATTERNS: RegExp[] = [
  // Supabase storage
  /\.supabase\.co$/,
  /\.supabase\.in$/,
  // Common image CDNs
  /\.cloudinary\.com$/,
  /\.imgix\.net$/,
  /\.unsplash\.com$/,
  /\.pexels\.com$/,
  /\.cloudfront\.net$/,
  /\.amazonaws\.com$/,
  /\.googleusercontent\.com$/,
  /\.ggpht\.com$/,
  /\.fbcdn\.net$/,
  /\.cdninstagram\.com$/,
  // Yandex
  /\.yandex\.(ru|net|com)$/,
  /\.yastatic\.net$/,
  // Common hosting
  /\.wp\.com$/,
  /\.wordpress\.com$/,
  /\.squarespace-cdn\.com$/,
  /\.wixstatic\.com$/,
  /\.shopify\.com$/,
];

// Blocked IP ranges (private, loopback, metadata)
const BLOCKED_IP_PATTERNS: RegExp[] = [
  /^127\./,                    // Loopback
  /^0\./,                      // 0.0.0.0/8
  /^10\./,                     // 10/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16/12
  /^192\.168\./,               // 192.168/16
  /^169\.254\./,               // Link-local / AWS metadata
  /^fc00:/i,                   // IPv6 ULA
  /^fe80:/i,                   // IPv6 link-local
  /^::1$/,                     // IPv6 loopback
  /^fd/i,                      // IPv6 ULA
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

export interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a URL for SSRF safety.
 * Returns { allowed: true } if safe, { allowed: false, reason } otherwise.
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

  // Block .local domains
  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { allowed: false, reason: `Domain '${hostname}' is blocked (local/internal)` };
  }

  // Block IP addresses in private ranges
  if (BLOCKED_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
    return { allowed: false, reason: `IP '${hostname}' is in a blocked range` };
  }

  // Check allowlist (if hostname looks like a public domain)
  const isAllowed = ALLOWED_HOSTNAME_PATTERNS.some(pattern => pattern.test(hostname));
  
  // If it's an IP address and not in the allowlist, block it
  const isIpAddress = /^[\d.:]+$/.test(hostname) || hostname.includes(":");
  if (isIpAddress && !isAllowed) {
    return { allowed: false, reason: `Direct IP access '${hostname}' is not allowed` };
  }

  // For non-allowlisted domains, still allow but log
  // This allows fetching from arbitrary public domains while blocking private ones
  return { allowed: true };
}
