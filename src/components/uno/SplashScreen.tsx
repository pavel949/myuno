import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * SplashScreen — minimal branded loading screen shown once per cold start.
 *
 * Design (DS 2.1): light cream background (the platform's default light mode),
 * centered logo with a calm rotating spinner ring, and a short "Loading" label.
 * No multilingual greeting cycle, no decorative grid — just a quiet boot signal.
 *
 * It mounts inside <AppContent>, plays a fixed boot timeline, fades out, and removes
 * itself from the DOM. SPA navigation never remounts it. Respects `prefers-reduced-motion`.
 */

// Total visible time before the exit fade kicks in.
const BOOT_TIMELINE_MS = 2600;
const REDUCED_TIMELINE_MS = 900;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const COLOR = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
} as const;

const FONT = {
  body: "var(--font-body)",
  mono: "var(--font-mono)",
} as const;

/** The myUNO "Ü" mark — same geometry as /favicon.svg, drawn in the current primary colour. */
function UnoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="myUNO" fill="none">
      <circle cx="32" cy="14" r="4.2" fill={COLOR.primary} />
      <path d="M18 22 h7 v20 a7 7 0 0 0 14 0 V22 h7 v20 a14 14 0 0 1 -28 0 Z" fill={COLOR.primary} />
    </svg>
  );
}

/** Calm rotating ring around the logo. The accent colour is carried only on the top edge. */
function SpinnerRing({ size = 72 }: { size?: number }) {
  return (
    <div
      className="absolute rounded-full border-2 border-t-accent border-r-foreground/10 border-b-foreground/10 border-l-foreground/10 animate-spin"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function SplashScreen() {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const total = prefersReducedMotion ? REDUCED_TIMELINE_MS : BOOT_TIMELINE_MS;

    exitTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, total);

    return () => {
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    };
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="uno-splash"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          style={{ backgroundColor: COLOR.background, color: COLOR.foreground }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="relative flex flex-col items-center gap-8"
          >
            <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
              <SpinnerRing size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <UnoMark size={36} />
              </div>
            </div>

            <p
              className="uppercase"
              style={{
                fontFamily: FONT.mono,
                fontSize: "0.75rem",
                letterSpacing: "0.32em",
                opacity: 0.7,
              }}
            >
              {t("message.loading")}
            </p>
          </motion.div>

          <p
            className="absolute inset-x-0 bottom-0 pb-[max(2rem,env(safe-area-inset-bottom))] text-center"
            style={{
              fontFamily: FONT.body,
              fontSize: "0.75rem",
              opacity: 0.4,
            }}
            aria-hidden="true"
          >
            myUNO
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
