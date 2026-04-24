import React, { ReactNode } from 'react';
import { ArrowRight, Clock, Wallet, UserCheck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StartPageLayout — GOV.UK-style "start page" pattern for any service entry.
 *
 * Every flagship vertical (visas, off-plan purchase, relocation, listing a
 * property) opens with this layout. It answers, above the fold:
 *   1. What is this service
 *   2. Who can use it (eligibility)
 *   3. What you'll need
 *   4. How much it costs
 *   5. How long it takes
 *   6. A single, primary "Start" call to action
 *
 * Reuses semantic design tokens — never hardcode colours.
 * Mobile-first (375px). Desktop expands the meta grid to 4 columns.
 *
 * @see docs/CONTENT_STYLE.md for copy rules
 * @see docs/INFO_ARCHITECTURE.md for which services need a start page
 */

export interface StartPageMeta {
  /** Short label, e.g. "От 15 минут" */
  duration?: string;
  /** Short label, e.g. "Бесплатно" or "от ฿2,500" */
  cost?: string;
  /** Short label, e.g. "Все туристы" */
  eligibility?: string;
  /** Short label, e.g. "Паспорт, бронь жилья" */
  requirements?: string;
}

export interface StartPageLayoutProps {
  /** H1 — under 60 chars, starts with the task verb. */
  title: string;
  /** One-sentence summary that answers "what is this and who is it for". */
  summary: string;
  /** Optional eyebrow label, e.g. cluster name. */
  cluster?: string;
  /** 4 meta facts shown in a grid. Omit any that don't apply. */
  meta: StartPageMeta;
  /** Optional bulleted "What you'll need" list. */
  requirements?: string[];
  /** Optional bulleted "Who can use this" list. */
  eligibility?: string[];
  /** Primary action — usually starts the step-by-step flow. */
  startLabel: string;
  onStart: () => void;
  /** Optional secondary action (e.g. "Talk to an advisor"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Optional last-updated date for trust. */
  lastUpdated?: string;
  /** Optional extra content (FAQs, related services) below the fold. */
  children?: ReactNode;
  className?: string;
}

const META_ICONS = {
  duration: Clock,
  cost: Wallet,
  eligibility: UserCheck,
  requirements: FileText,
} as const;

const META_LABELS_EN: Record<keyof StartPageMeta, string> = {
  duration: 'Time',
  cost: 'Cost',
  eligibility: 'For',
  requirements: 'You need',
};

export function StartPageLayout({
  title,
  summary,
  cluster,
  meta,
  requirements,
  eligibility,
  startLabel,
  onStart,
  secondaryLabel,
  onSecondary,
  lastUpdated,
  children,
  className,
}: StartPageLayoutProps) {
  const metaEntries = (Object.keys(META_LABELS_EN) as Array<keyof StartPageMeta>)
    .filter((key) => meta[key])
    .map((key) => ({ key, label: META_LABELS_EN[key], value: meta[key]!, Icon: META_ICONS[key] }));

  return (
    <article className={cn('px-4 pt-6 pb-10 max-w-[760px] mx-auto', className)}>
      {cluster && (
        <div className="text-[10.5px] tracking-[0.12em] uppercase text-muted-foreground font-semibold mb-3">
          {cluster}
        </div>
      )}

      <h1 className="font-display text-[26px] sm:text-[32px] font-semibold text-foreground tracking-[-0.015em] leading-[1.15]">
        {title}
      </h1>

      <p className="mt-3 text-[15px] sm:text-[16px] text-muted-foreground leading-relaxed">
        {summary}
      </p>

      {metaEntries.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {metaEntries.map(({ key, label, value, Icon }) => (
            <div
              key={key}
              className="rounded-none border border-border bg-card/40 px-3 py-2.5"
            >
              <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-foreground leading-tight">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-7 flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onStart}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-none',
            'bg-primary text-primary-foreground font-semibold text-[15px]',
            'min-h-[48px] active:scale-[0.99] transition-transform',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          {startLabel}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>

        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className={cn(
              'inline-flex items-center justify-center px-6 py-3.5 rounded-none',
              'bg-card border border-border text-foreground font-medium text-[14.5px]',
              'min-h-[48px] active:scale-[0.99] transition-transform',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            {secondaryLabel}
          </button>
        )}
      </div>

      {(eligibility?.length || requirements?.length) && (
        <div className="mt-9 grid sm:grid-cols-2 gap-6">
          {eligibility?.length ? (
            <section aria-labelledby="who-can-use">
              <h2
                id="who-can-use"
                className="font-display text-[16px] font-semibold text-foreground mb-2.5"
              >
                Who can use this
              </h2>
              <ul className="space-y-1.5 text-[14px] text-muted-foreground leading-relaxed list-disc pl-5">
                {eligibility.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {requirements?.length ? (
            <section aria-labelledby="what-you-need">
              <h2
                id="what-you-need"
                className="font-display text-[16px] font-semibold text-foreground mb-2.5"
              >
                What you'll need
              </h2>
              <ul className="space-y-1.5 text-[14px] text-muted-foreground leading-relaxed list-disc pl-5">
                {requirements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      {children && <div className="mt-9">{children}</div>}

      {lastUpdated && (
        <p className="mt-10 text-[11.5px] text-muted-foreground/70">
          Last updated: {lastUpdated}
        </p>
      )}
    </article>
  );
}
