/**
 * @module LifecycleSmartTip
 * @description Home block that surfaces § 9.4 lifecycle-trigger nudges
 * (tax-residency, snowbird, family, pet). Fills the `LifecycleSmartTip`
 * section slot that `prioritizeHomeSections` already reserves.
 *
 * Regression-safe: renders `null` when there are no applicable nudges
 * (guests, no-signal profiles, or everything dismissed) — same contract as
 * `PendingPaymentsChip` / `ActiveSituation`.
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifecycleNudges } from '@/hooks/useLifecycleNudges';

const DISMISS_KEY = 'lifecycle_nudges_dismissed_v1';

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function LifecycleSmartTip() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang: 'en' | 'ru' = language === 'ru' ? 'ru' : 'en';

  const { nudges } = useLifecycleNudges({ limit: 2 });
  const [dismissed, setDismissed] = useState<string[]>(() => loadDismissed());

  const visible = useMemo(
    () => nudges.filter((n) => !dismissed.includes(n.id)),
    [nudges, dismissed],
  );

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep in-memory only */
      }
      return next;
    });
  }, []);

  if (visible.length === 0) return null;

  return (
    <section
      className="px-4 mt-4 space-y-2"
      data-testid="lifecycle-smart-tip"
      aria-label={lang === 'ru' ? 'Подсказки по этапу' : 'Lifecycle tips'}
    >
      {visible.map((n) => (
        <div key={n.id} className="flex items-start gap-3 border border-border bg-card p-3">
          <span className="text-xl leading-none shrink-0" aria-hidden>
            {n.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{n.title[lang]}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{n.body[lang]}</p>
            <button
              type="button"
              onClick={() => navigate(n.route)}
              className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {n.cta[lang]}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => dismiss(n.id)}
            aria-label={lang === 'ru' ? 'Скрыть' : 'Dismiss'}
            className="-my-1 -mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </section>
  );
}

export default LifecycleSmartTip;
