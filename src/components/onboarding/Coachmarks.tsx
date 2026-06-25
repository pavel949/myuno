/**
 * Coachmarks — Wave 5 lightweight onboarding tour for IndexV2.
 *
 * Zero-dependency spotlight overlay: finds elements by `[data-coach="<id>"]`,
 * paints a dim backdrop with a transparent cutout around the target, and
 * shows a 3-step tooltip card.
 *
 * Progress is local-only (`localStorage`), no DB schema change:
 *   - completed → never show again
 *   - dismissed → re-show after 30 days
 *
 * Show conditions (caller's responsibility): mount only when the user is
 * authenticated and Home V2 is the active home variant.
 */
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'myuno.coach.home_v2';
const REPLAY_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

interface CoachState {
  completed_at?: number;
  dismissed_at?: number;
}

function readState(): CoachState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CoachState) : {};
  } catch {
    return {};
  }
}

function writeState(next: CoachState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

interface Step {
  /** matches data-coach="..." on the target element */
  target: string;
  title: { ru: string; en: string };
  body: { ru: string; en: string };
}

const STEPS: Step[] = [
  {
    target: 'why-chip',
    title: { ru: 'Это ваша экосистема', en: 'Your personal ecosystem' },
    body: {
      ru: 'Подборка подстраивается под вашу активную роль. Тап по чипу — сменить.',
      en: 'The feed adapts to your active role. Tap the chip to switch.',
    },
  },
  {
    target: 'next-best-action',
    title: { ru: 'Что сделать сейчас', en: 'What to do now' },
    body: {
      ru: 'Здесь появляются приоритетные действия: платежи, бронирования, советы по жизненной фазе.',
      en: 'Priority actions appear here: payments, bookings, lifecycle tips.',
    },
  },
  {
    target: 'all-apps',
    title: { ru: 'Все приложения под рукой', en: 'All apps at hand' },
    body: {
      ru: 'Откройте полный каталог или нажмите ⌘K для мгновенного поиска по сервисам.',
      en: 'Open the full catalog, or press ⌘K to search every service instantly.',
    },
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useTargetRect(target: string, dep: number): SpotlightRect | null {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-coach="${target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [target, dep]);

  return rect;
}

export const Coachmarks: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  // Decide whether to surface the tour at mount.
  useEffect(() => {
    const state = readState();
    if (state.completed_at) return;
    if (state.dismissed_at && Date.now() - state.dismissed_at < REPLAY_AFTER_MS) return;
    // Wait one tick so target elements are mounted.
    const t = window.setTimeout(() => setActive(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const current = STEPS[step];
  const rect = useTargetRect(current?.target ?? '', step);

  // Lock body scroll while overlay is open.
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  const dismiss = () => {
    writeState({ ...readState(), dismissed_at: Date.now() });
    setActive(false);
  };

  const complete = () => {
    writeState({ ...readState(), completed_at: Date.now() });
    setActive(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      complete();
    } else {
      setStep((s) => s + 1);
    }
  };

  // Skip silently if a target is missing from the DOM (graceful degradation).
  if (active && !rect && step < STEPS.length) {
    // try advancing once, then bail.
    if (step >= STEPS.length - 1) {
      complete();
      return null;
    }
  }

  const tooltipPos = useMemo(() => {
    if (!rect) return null;
    const pad = 12;
    const tooltipHeight = 160;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const below = rect.top - window.scrollY + rect.height + pad;
    const showBelow = below + tooltipHeight < viewportH;
    return {
      top: showBelow
        ? rect.top + rect.height + pad
        : rect.top - tooltipHeight - pad,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 320 - 12)),
    };
  }, [rect]);

  if (!active || !current) return null;

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 pointer-events-auto"
        onClick={dismiss}
      />

      {/* Spotlight cutout */}
      {rect && (
        <div
          aria-hidden
          className="absolute pointer-events-none border-2 border-accent"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px hsl(var(--foreground) / 0.6)',
            background: 'transparent',
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          className="absolute w-[320px] max-w-[calc(100vw-24px)] bg-card border border-border p-4 pointer-events-auto"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              {isRu ? current.title.ru : current.title.en}
            </h3>
            <button
              type="button"
              aria-label={isRu ? 'Закрыть подсказку' : 'Close tip'}
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground p-1 -m-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            {isRu ? current.body.ru : current.body.en}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {step + 1} / {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="text-[12px] text-muted-foreground hover:text-foreground px-2 py-1"
              >
                {isRu ? 'Пропустить' : 'Skip'}
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[13px] font-medium px-3 py-2 hover:opacity-90"
              >
                {step >= STEPS.length - 1
                  ? (isRu ? 'Понял' : 'Got it')
                  : (isRu ? 'Дальше' : 'Next')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
