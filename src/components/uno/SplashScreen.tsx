import { useEffect, useMemo, useState } from "react";
import "./splash.css";

/**
 * SplashScreen — the branded startup screen shown once per app launch.
 *
 * Design (DS 2.1, "civic infrastructure"): a calm navy field that carries
 * straight over from the native/PWA launch icon, large editorial greetings
 * cycling through the languages myUNO serves, the brand lockup, and a thin
 * infrastructural progress rail. No glow, no gradients — just disciplined
 * motion in the cream/navy/orange palette.
 *
 * IMPORTANT (perf): the splash is on screen during the heaviest part of boot
 * (bundle parse, provider mount, first data fetches), when the main thread is
 * saturated. So all motion is pure CSS on compositor-only properties
 * (transform/opacity) — see splash.css. There is no JS animation loop and no
 * framer-motion here; a single timer just unmounts the node after the CSS
 * fade-out. This keeps it smooth on real production phones, where the previous
 * JS-driven version (setInterval + AnimatePresence) stuttered badly.
 *
 * It mounts inside <AppContent>; SPA navigation never remounts it, so it only
 * appears at a genuine cold start. Respects `prefers-reduced-motion`.
 */

// Greetings ordered for visual rhythm — the three core audiences (EN/RU/TH)
// lead, then a sweep across the wider expat mix. `dir` flags RTL scripts.
const GREETINGS: ReadonlyArray<{ text: string; dir?: "rtl" }> = [
  { text: "Hello" },
  { text: "Привет" },
  { text: "สวัสดี" },
  { text: "你好" },
  { text: "Bonjour" },
  { text: "مرحبا", dir: "rtl" },
  { text: "नमस्ते" },
  { text: "안녕하세요" },
];

const GREETING_INTERVAL_MS = 320;
const HOLD_AFTER_GREETINGS_MS = 560;
// Time before the CSS fade-out starts (kept in sync with .uno-greet delays).
const TIMELINE_MS = GREETINGS.length * GREETING_INTERVAL_MS + HOLD_AFTER_GREETINGS_MS;
const REDUCED_TIMELINE_MS = 700;
const FADE_MS = 600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The myUNO "Ü" mark — same geometry as /favicon.svg, drawn in brand orange. */
function UnoMark() {
  return (
    <svg width={56} height={56} viewBox="0 0 64 64" role="img" aria-label="myUNO" fill="none">
      <circle cx="32" cy="14" r="4.2" fill="hsl(var(--brand-orange))" />
      <path
        d="M18 22 h7 v20 a7 7 0 0 0 14 0 V22 h7 v20 a14 14 0 0 1 -28 0 Z"
        fill="hsl(var(--brand-orange))"
      />
    </svg>
  );
}

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);

  // Resolved once at mount — reduced-motion preference doesn't change mid-splash.
  const total = useMemo(
    () => (prefersReducedMotion() ? REDUCED_TIMELINE_MS : TIMELINE_MS),
    [],
  );

  useEffect(() => {
    // The CSS handles the fade-out (animation-delay: var(--uno-total)); this
    // timer just removes the node from the DOM once that fade has finished.
    const timer = window.setTimeout(() => setMounted(false), total + FADE_MS);
    return () => window.clearTimeout(timer);
  }, [total]);

  if (!mounted) return null;

  const lastIndex = GREETINGS.length - 1;

  return (
    <div
      className="uno-splash-screen"
      aria-hidden="true"
      style={{ "--uno-total": `${total}ms` } as React.CSSProperties}
    >
      <div className="uno-splash-grid" aria-hidden />

      <div className="uno-splash-mark">
        <UnoMark />
      </div>

      <div className="uno-greet-wrap">
        {GREETINGS.map((greeting, index) => (
          <span
            key={greeting.text}
            className={index === lastIndex ? "uno-greet is-last" : "uno-greet"}
            dir={greeting.dir}
            style={{ "--i": index } as React.CSSProperties}
          >
            {greeting.text}
          </span>
        ))}
      </div>

      <div className="uno-lockup">
        <p className="uno-lockup-tag">one account. one you.</p>
        <p className="uno-lockup-abroad">abroad</p>
      </div>

      <div className="uno-rail">
        <div className="uno-rail-labels">
          <span>myUNO</span>
          <span>loading</span>
        </div>
        <div className="uno-track">
          <div className="uno-fill" />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
