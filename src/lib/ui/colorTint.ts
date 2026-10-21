/**
 * @module colorTint
 * @description Safe tint helper for data-driven accent colours.
 *
 * DB-stored colours (e.g. `life_situations.color`) are free-form strings.
 * `hexTint` only trusts a strict 6-digit hex and converts it to an `rgba()`
 * tint; anything else (3/4/8-digit hex, `hsl()`, named colours, null) falls
 * back to the design-system primary token so the value is always valid CSS
 * and theme-aware.
 *
 * Note (DS 2.1): per-row colours bypass semantic tokens and do not adapt to
 * dark mode. Keep accent usage subtle (low-alpha tints) and verify any new
 * `*.color` values in both themes.
 */

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/**
 * Returns an `rgba(...)` tint for a strict 6-digit hex, else an
 * `hsl(var(--primary) / alpha)` token fallback.
 */
export function hexTint(hex: string | null | undefined, alpha: number): string {
  if (hex && HEX6.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `hsl(var(--primary) / ${alpha})`;
}

/**
 * Returns a usable foreground colour: a valid hex/CSS colour string when one is
 * provided, else the primary token. (Validation is light — invalid CSS is
 * ignored by the browser and falls back to `currentColor`.)
 */
export function accentColor(hex: string | null | undefined): string {
  return hex ?? 'hsl(var(--primary))';
}
