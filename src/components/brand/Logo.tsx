/**
 * myUNO Brand Logo
 *
 * Single source of truth for the wordmark and symbol marks.
 * Paths come from /public/brand/*.svg (regenerate via /tmp/myuno-brand/build_svg.py).
 *
 * Usage:
 *   <Logo />                           — wordmark, navy on transparent
 *   <Logo variant="symbol" />          — symbol U
 *   <Logo tone="cream" />              — for dark surfaces (footer, dark headers)
 *   <Logo size={48} />                 — controls height in px (width auto)
 *   <Logo variant="symbol" size={32} className="rounded-sm bg-[#0A2240] p-1" />
 *
 * The mark inherits `currentColor` so you can also pass `text-…` classes:
 *   <Logo className="text-[#0A2240]" />
 *
 * Brand rules (see docs/canonical/05-visual-design-system.md §12):
 * - Never stretch, skew, rotate, or recolor outside the three sanctioned tones.
 * - Always preserve clear space ≥ height of the U on every side.
 * - Switch to <Logo variant="symbol" /> below 24px height or 120px container width.
 */
import * as React from "react";
import { LOGO_PATHS } from "./logoPaths";

type Variant = "wordmark" | "symbol";
type Tone = "navy" | "cream" | "ink" | "current";

const TONE_HEX: Record<Exclude<Tone, "current">, string> = {
  navy: "#0A2240",
  cream: "#F7F5F1",
  ink: "#1C1917",
};

export interface LogoProps extends Omit<React.SVGAttributes<SVGSVGElement>, "color"> {
  /** Wordmark "myUNO" or square symbol "U". Default: wordmark. */
  variant?: Variant;
  /** Tone — `current` lets the parent control via text-color. Default: navy. */
  tone?: Tone;
  /** Height in px. Width follows the viewBox aspect ratio. Default: 32. */
  size?: number;
  /** Optional accessible label override (default: "myUNO"). */
  title?: string;
}

export const Logo = React.forwardRef<SVGSVGElement, LogoProps>(function Logo(
  {
    variant = "wordmark",
    tone = "navy",
    size = 32,
    title = "myUNO",
    className,
    style,
    ...rest
  },
  ref
) {
  const def = LOGO_PATHS[variant];
  const [vbX, vbY, vbW, vbH] = def.viewBox.split(/\s+/).map(Number);
  const aspect = vbW / vbH;
  const width = Math.round(size * aspect);

  const fill = tone === "current" ? "currentColor" : TONE_HEX[tone];

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={def.viewBox}
      width={width}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      style={style}
      {...rest}
    >
      <title>{title}</title>
      <g fill={fill} dangerouslySetInnerHTML={{ __html: def.content }} />
    </svg>
  );
});

Logo.displayName = "Logo";

/**
 * Convenience: square brand badge (symbol on navy background, no padding).
 * Use for app icons, avatar fallbacks, share thumbnails.
 */
export const LogoBadge = React.forwardRef<HTMLDivElement, { size?: number; className?: string }>(
  function LogoBadge({ size = 40, className }, ref) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: size,
          height: size,
          background: TONE_HEX.navy,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="myUNO"
      >
        <Logo variant="symbol" tone="cream" size={size} />
      </div>
    );
  }
);
