/**
 * myUNO Brand Logo — canonical lockup
 *
 * Concept (locked 2026-04-24):
 *   "my" rendered in the active accent (theme-aware via `text-primary` →
 *   navy in light mode, brand-orange in dark mode) followed by "UNO" in the
 *   foreground display face. This mirrors the chrome wordmark used across
 *   the app (see `BrandWordmark.tsx`) and matches the home hero treatment.
 *
 * Variants:
 *   - `wordmark` (default) — inline "myUNO" text. Use in headers, footers,
 *     marketing copy, anywhere ≥ 16px height with horizontal room.
 *   - `badge` — rounded-square frame with `border-primary` and the wordmark
 *     centred inside. Mirrors the home top-left lockup. Use as the primary
 *     square brand mark in app shells, drawers, share cards.
 *   - `symbol` — minimalist "U" monogram. Reserved for ≤24px contexts and
 *     OS surfaces (favicon, PWA icon, avatar fallback) generated as static
 *     assets in /public; this React variant only renders a clean fallback.
 *
 * Tone (single source: `text-primary` token):
 *   - Light theme  → navy (#0A2240)
 *   - Dark theme   → brand-orange (#D96B1A)
 *   Pass `tone="navy" | "cream" | "ink"` to lock a specific colour when the
 *   surface is theme-agnostic (e.g. PDF export, fixed dark hero).
 *
 * Usage:
 *   <Logo />                          // wordmark, theme-aware
 *   <Logo variant="badge" size={48} /> // rounded-square mark
 *   <Logo tone="cream" />             // force cream (for navy backgrounds)
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "wordmark" | "badge" | "symbol";
type Tone = "auto" | "navy" | "cream" | "ink";

const TONE_CLASSES: Record<Tone, { accent: string; foreground: string; border: string }> = {
  // `auto` defers to the active theme via design tokens.
  auto:  { accent: "text-primary",          foreground: "text-foreground",        border: "border-primary" },
  navy:  { accent: "text-[#0A2240]",        foreground: "text-[#0A2240]",         border: "border-[#0A2240]" },
  cream: { accent: "text-[#F7F5F1]",        foreground: "text-[#F7F5F1]",         border: "border-[#F7F5F1]" },
  ink:   { accent: "text-[#1C1917]",        foreground: "text-[#1C1917]",         border: "border-[#1C1917]" },
};

export interface LogoProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  variant?: Variant;
  tone?: Tone;
  /** Approximate cap height in px. Drives font-size (badge: also frame size). */
  size?: number;
  title?: string;
}

export const Logo = React.forwardRef<HTMLSpanElement, LogoProps>(function Logo(
  {
    variant = "wordmark",
    tone = "auto",
    size = 16,
    title = "myUNO",
    className,
    style,
    ...rest
  },
  ref
) {
  const palette = TONE_CLASSES[tone];

  if (variant === "symbol") {
    // Minimal monogram for tiny contexts. Frame matches `badge` proportion
    // but renders only "U" so 16-24px favicons stay legible.
    const px = size;
    return (
      <span
        ref={ref}
        role="img"
        aria-label={title}
        className={cn(
          "inline-flex items-center justify-center rounded-none border-[1.5px] font-display font-bold leading-none",
          palette.border,
          palette.accent,
          className,
        )}
        style={{ width: px, height: px, fontSize: px * 0.55, ...style }}
        {...rest}
      >
        U
      </span>
    );
  }

  if (variant === "badge") {
    // Rounded-square frame (mirrors home top-left lockup).
    // size = cap height of the inner text; frame derives via padding.
    const padX = Math.round(size * 0.55);
    const padY = Math.round(size * 0.4);
    return (
      <span
        ref={ref}
        role="img"
        aria-label={title}
        className={cn(
          "inline-flex items-center rounded-none border-2 leading-none",
          palette.border,
          className,
        )}
        style={{ paddingInline: padX, paddingBlock: padY, ...style }}
        {...rest}
      >
        <span
          className={cn("font-bold", palette.accent)}
          style={{ fontSize: size, lineHeight: 1 }}
        >
          my
        </span>
        <span
          className={cn("font-bold font-display tracking-tight", palette.foreground)}
          style={{ fontSize: size * 1.1, lineHeight: 1, marginLeft: 2 }}
        >
          UNO
        </span>
      </span>
    );
  }

  // wordmark (default) — inline text, no frame.
  return (
    <span
      ref={ref}
      role="img"
      aria-label={title}
      className={cn("inline-flex items-baseline leading-none", className)}
      style={style}
      {...rest}
    >
      <span
        className={cn("font-bold", palette.accent)}
        style={{ fontSize: size, lineHeight: 1 }}
      >
        my
      </span>
      <span
        className={cn("font-bold font-display tracking-tight", palette.foreground)}
        style={{ fontSize: size * 1.1, lineHeight: 1, marginLeft: 2 }}
      >
        UNO
      </span>
    </span>
  );
});

Logo.displayName = "Logo";

/**
 * Convenience wrapper: square brand badge sized in px.
 * Equivalent to <Logo variant="badge" size={...} /> but exposes a numeric
 * `size` that targets *frame* height (not cap height), matching old API.
 */
export const LogoBadge = React.forwardRef<HTMLSpanElement, { size?: number; tone?: Tone; className?: string }>(
  function LogoBadge({ size = 56, tone = "auto", className }, ref) {
    // Solve for cap height from frame: frame = cap * 1.1 + 2*padY where padY = 0.4*cap
    // → frame ≈ cap * (1.1 + 0.8) = cap * 1.9
    const cap = Math.max(10, Math.round(size / 1.9));
    return <Logo ref={ref} variant="badge" size={cap} tone={tone} className={className} />;
  }
);
