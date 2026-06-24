import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * SplashScreen — the branded startup screen shown once per app launch.
 *
 * Design (DS 2.1, "civic infrastructure"): a calm navy field carried over from the
 * native/PWA launch icon, large editorial greetings cycling through the languages
 * myUNO serves, the brand lockup, and a thin infrastructural progress rail that fills
 * as the app boots. No glow, no gradients — disciplined motion in cream/navy/orange.
 *
 * It mounts inside <AppContent>, plays a fixed ~2.6s timeline, fades out, and removes
 * itself from the DOM. SPA navigation never remounts it, so it only appears at a cold
 * start. Respects `prefers-reduced-motion`.
 *
 * Layout note: the greeting sits in a fixed-height, overflow-clipped row whose height
 * is always larger than the glyph box, so tall scripts (한국어, हिन्दी) can never bleed
 * into the brand lockup below it.
 */

// Greetings ordered for visual rhythm — the three core audiences (EN/RU/TH) lead, then
// a sweep across the wider expat mix. `dir` flags RTL scripts.
const GREETINGS: ReadonlyArray<{ text: string; lang: string; dir?: "rtl" }> = [
  { text: "Hello", lang: "English" },
  { text: "Привет", lang: "Русский" },
  { text: "สวัสดี", lang: "ไทย" },
  { text: "你好", lang: "中文" },
  { text: "Bonjour", lang: "Français" },
  { text: "مرحبا", lang: "العربية", dir: "rtl" },
  { text: "नमस्ते", lang: "हिन्दी" },
  { text: "안녕하세요", lang: "한국어" },
];

const GREETING_INTERVAL_MS = 320;
const HOLD_AFTER_GREETINGS_MS = 560;
// Total visible time before the exit fade kicks in.
const TIMELINE_MS = GREETINGS.length * GREETING_INTERVAL_MS + HOLD_AFTER_GREETINGS_MS;
const REDUCED_TIMELINE_MS = 900;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Theme-independent brand colours (defined in tokens.css). The splash is always navy —
// a brand moment, not a themed surface — so we read the brand aliases directly rather
// than the theme-flipping semantic tokens.
const COLOR = {
  navy: "hsl(var(--brand-navy-900))",
  navyLine: "hsl(var(--brand-navy-700))",
  cream: "hsl(var(--brand-cream))",
  orange: "hsl(var(--brand-orange))",
} as const;

const FONT = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
} as const;

/** The myUNO "Ü" mark — same geometry as /favicon.svg, drawn in brand orange. */
function UnoMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="myUNO" fill="none">
      <circle cx="32" cy="14" r="4.2" fill={COLOR.orange} />
      <path d="M18 22 h7 v20 a7 7 0 0 0 14 0 V22 h7 v20 a14 14 0 0 1 -28 0 Z" fill={COLOR.orange} />
    </svg>
  );
}

/**
 * The cycling multilingual greeting. The row height (16vw, capped 7.5rem) is always
 * taller than the glyph box (11vw, capped 5.5rem) and clips overflow, so no script can
 * overlap the lockup beneath it.
 */
function GreetingCycle({ reducedMotion, index }: { reducedMotion: boolean; index: number }) {
  const greetingStyle = {
    fontFamily: FONT.display,
    fontSize: "clamp(2.5rem, 11vw, 5.5rem)",
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-0.01em",
  } as const;

  return (
    <div className="relative flex h-[clamp(4.5rem,16vw,7.5rem)] w-full items-center justify-center overflow-hidden px-6">
      {reducedMotion ? (
        <span className="text-center" style={greetingStyle}>
          Hello
        </span>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.span
            key={index}
            dir={GREETINGS[index].dir}
            initial={{ opacity: 0, y: "0.5em" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-0.5em" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="absolute text-center"
            style={greetingStyle}
          >
            {GREETINGS[index].text}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}

/** "one account. one you." + the ABROAD wordmark, in normal flow below the greeting. */
function BrandLockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6, ease: EASE_OUT }}
      className="mt-8 flex flex-col items-center gap-2 px-6 text-center"
    >
      <p style={{ fontFamily: FONT.body, fontSize: "clamp(1.05rem, 4.5vw, 1.4rem)", fontWeight: 500 }}>
        one account. one you.
      </p>
      <p
        className="uppercase"
        style={{ fontFamily: FONT.mono, color: COLOR.orange, fontSize: "0.78rem", letterSpacing: "0.42em" }}
      >
        abroad
      </p>
    </motion.div>
  );
}

/** Infrastructural progress rail pinned to the bottom, scanning left→right over the boot. */
function ProgressRail({ durationMs }: { durationMs: number }) {
  const labelStyle = {
    fontFamily: FONT.mono,
    fontSize: "0.66rem",
    letterSpacing: "0.32em",
    opacity: 0.7,
  } as const;

  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <span className="uppercase" style={labelStyle}>
          myUNO
        </span>
        <span className="uppercase" style={labelStyle}>
          loading
        </span>
      </div>
      <div
        className="mx-auto h-[2px] w-full max-w-md overflow-hidden"
        style={{ backgroundColor: "rgba(247,245,241,0.14)" }}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: COLOR.orange, transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: durationMs / 1000, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

export function SplashScreen() {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [greetingIndex, advanceGreeting] = useReducer(
    (i: number) => Math.min(i + 1, GREETINGS.length - 1),
    0,
  );
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const total = prefersReducedMotion ? REDUCED_TIMELINE_MS : TIMELINE_MS;

    if (!prefersReducedMotion) {
      intervalRef.current = window.setInterval(advanceGreeting, GREETING_INTERVAL_MS);
    }

    const exitTimer = window.setTimeout(() => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      setVisible(false);
    }, total);

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      window.clearTimeout(exitTimer);
    };
  }, [prefersReducedMotion]);

  const timelineMs = prefersReducedMotion ? REDUCED_TIMELINE_MS : TIMELINE_MS;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="uno-splash"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          style={{ backgroundColor: COLOR.navy, color: COLOR.cream }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Faint infrastructural baseline grid — texture, no glow. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(${COLOR.navyLine} 1px, transparent 1px)`,
              backgroundSize: "100% 56px",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="relative mb-9"
          >
            <UnoMark size={56} />
          </motion.div>

          <GreetingCycle reducedMotion={!!prefersReducedMotion} index={greetingIndex} />
          <BrandLockup />
          <ProgressRail durationMs={timelineMs} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
