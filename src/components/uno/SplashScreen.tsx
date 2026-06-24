import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * SplashScreen — the branded startup screen shown once per app launch.
 *
 * Design (DS 2.1, "civic infrastructure"): a calm navy field that carries
 * straight over from the native/PWA launch icon, large editorial greetings
 * cycling through the languages myUNO serves, the brand lockup, and a thin
 * infrastructural progress rail that fills as the app boots. No glow, no
 * gradients — just disciplined motion and the cream/navy/orange palette.
 *
 * It mounts inside <AppContent>, plays a fixed ~2.6s timeline, fades out, and
 * removes itself from the DOM. SPA navigation never remounts it, so it only
 * appears at a genuine cold start. Respects `prefers-reduced-motion`.
 */

// Greetings ordered for visual rhythm — the three core audiences (EN/RU/TH)
// lead, then a sweep across the wider expat mix. `dir` flags RTL scripts.
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

// Theme-independent brand colours (defined in tokens.css). The splash is always
// navy — it is a brand moment, not a themed surface — so we read the brand
// aliases directly rather than the theme-flipping semantic tokens.
const NAVY = "hsl(var(--brand-navy-900))";
const NAVY_LINE = "hsl(var(--brand-navy-700))";
const CREAM = "hsl(var(--brand-cream))";
const ORANGE = "hsl(var(--brand-orange))";

/** The myUNO "Ü" mark — same geometry as /favicon.svg, drawn in brand orange. */
function UnoMark({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="myUNO"
      fill="none"
    >
      <circle cx="32" cy="14" r="4.2" fill={ORANGE} />
      <path
        d="M18 22 h7 v20 a7 7 0 0 0 14 0 V22 h7 v20 a14 14 0 0 1 -28 0 Z"
        fill={ORANGE}
      />
    </svg>
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
      intervalRef.current = window.setInterval(() => {
        advanceGreeting();
      }, GREETING_INTERVAL_MS);
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

  const current = GREETINGS[greetingIndex];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="uno-splash"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: NAVY, color: CREAM }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Faint infrastructural baseline grid — texture, no glow. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(${NAVY_LINE} 1px, transparent 1px)`,
              backgroundSize: "100% 56px",
            }}
          />

          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-9"
          >
            <UnoMark size={56} />
          </motion.div>

          {/* Cycling multilingual greeting */}
          <div className="relative flex h-[clamp(3.5rem,16vw,7rem)] items-center justify-center px-6">
            {prefersReducedMotion ? (
              <span
                className="text-center"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.75rem, 13vw, 6rem)",
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                Hello
              </span>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={greetingIndex}
                  dir={current.dir}
                  initial={{ opacity: 0, y: "0.5em" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "-0.5em" }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute text-center"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2.75rem, 13vw, 6rem)",
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {current.text}
                </motion.span>
              </AnimatePresence>
            )}
          </div>

          {/* Brand lockup + tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col items-center gap-2 px-6 text-center"
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(1.05rem, 4.5vw, 1.4rem)",
                fontWeight: 500,
              }}
            >
              one account. one you.
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                color: ORANGE,
                fontSize: "0.78rem",
                letterSpacing: "0.42em",
              }}
              className="uppercase"
            >
              abroad
            </p>
          </motion.div>

          {/* Infrastructural progress rail */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex w-full max-w-md items-center justify-between">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.66rem",
                  letterSpacing: "0.32em",
                  opacity: 0.7,
                }}
                className="uppercase"
              >
                myUNO
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.66rem",
                  letterSpacing: "0.32em",
                  opacity: 0.7,
                }}
                className="uppercase"
              >
                loading
              </span>
            </div>
            <div
              className="mx-auto h-[2px] w-full max-w-md overflow-hidden"
              style={{ backgroundColor: "rgba(247,245,241,0.14)" }}
            >
              <motion.div
                className="h-full"
                style={{ backgroundColor: ORANGE, transformOrigin: "left center" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: (prefersReducedMotion ? REDUCED_TIMELINE_MS : TIMELINE_MS) / 1000,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
