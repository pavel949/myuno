/**
 * Helpers for working with HSL design tokens that need runtime alpha.
 *
 * Tokens in `tokens.css` are stored as raw HSL components (e.g. `--cluster-live: 224 100% 65%;`).
 * In CSS we use them with `hsl(var(--cluster-live))` or `hsl(var(--cluster-live) / 0.15)`.
 * From inline `style={{}}` we sometimes need to compose the same string at runtime —
 * these helpers keep us off hardcoded hex values.
 *
 * Usage:
 *   style={{ color: tokenColor('cluster-live') }}
 *   style={{ background: tokenColor('cluster-live', 0.15) }}
 */

export function tokenColor(token: string, alpha?: number): string {
  if (alpha == null) return `hsl(var(--${token}))`;
  return `hsl(var(--${token}) / ${alpha})`;
}

/**
 * For static design tokens listed inside data arrays (e.g. landing-page step lists),
 * keep the token name string; resolve to a CSS color at render time.
 */
export type DesignTokenName = string;
