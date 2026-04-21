import React, { ReactNode } from 'react';
import { Check, Circle, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StepByStepNav — GOV.UK-style numbered checklist for multi-stage processes.
 *
 * Use for any flow that takes more than one screen, has a fixed order, and
 * benefits from showing the user how far they've come and what's left.
 *
 * Examples in myUNO:
 *   - Relocate to Phuket (9 steps)
 *   - First off-plan purchase (7 steps)
 *   - Visa application (variable)
 *   - List property for short-term rental (6 steps)
 *
 * Each step has one of three states:
 *   - `done`     — user has completed it (green check)
 *   - `current`  — the step the user is on (filled circle, primary colour)
 *   - `todo`     — not yet reached (outline)
 *   - `locked`   — gated behind earlier steps (padlock)
 *
 * Reuses semantic tokens. Mobile-first. Each row is a 44px+ tap target.
 *
 * @see docs/CONTENT_STYLE.md for step copy rules
 */

export type StepStatus = 'done' | 'current' | 'todo' | 'locked';

export interface Step {
  /** Stable id for keys and analytics. */
  id: string;
  /** Short title, ≤6 words, starts with a verb. */
  title: string;
  /** Optional one-sentence description. */
  description?: string;
  status: StepStatus;
  /** Optional duration label, e.g. "5 min". */
  duration?: string;
  /** Optional cost label, e.g. "฿2,500". */
  cost?: string;
  /** Action when the user taps the step. Disabled if locked. */
  onClick?: () => void;
  /** Optional inline content shown when the step is current. */
  children?: ReactNode;
}

export interface StepByStepNavProps {
  /** Optional H2 above the list. */
  title?: string;
  steps: Step[];
  className?: string;
}

function StatusIndicator({ status, index }: { status: StepStatus; index: number }) {
  const base = 'flex-none w-8 h-8 rounded-full flex items-center justify-center font-mono text-[12px] font-semibold';

  if (status === 'done') {
    return (
      <div
        className={cn(base, 'bg-primary text-primary-foreground')}
        aria-label="Completed"
      >
        <Check className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (status === 'current') {
    return (
      <div
        className={cn(base, 'bg-primary/15 text-primary border-2 border-primary')}
        aria-label="Current step"
      >
        {index + 1}
      </div>
    );
  }
  if (status === 'locked') {
    return (
      <div
        className={cn(base, 'bg-muted/40 text-muted-foreground/60')}
        aria-label="Locked"
      >
        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div
      className={cn(base, 'bg-card border border-border text-muted-foreground')}
      aria-label="Not started"
    >
      {index + 1}
    </div>
  );
}

export function StepByStepNav({ title, steps, className }: StepByStepNavProps) {
  const completed = steps.filter((s) => s.status === 'done').length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section
      aria-label={title ?? 'Steps'}
      className={cn('px-4 py-5 max-w-[760px] mx-auto', className)}
    >
      {title && (
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-[18px] font-semibold text-foreground tracking-[-0.01em]">
            {title}
          </h2>
          <span className="text-[12px] text-muted-foreground font-medium tabular-nums">
            {completed} / {total}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div
        className="h-1 w-full bg-muted/40 rounded-full overflow-hidden mb-5"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${pct}%`}
      >
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="relative">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const interactive = step.status !== 'locked' && Boolean(step.onClick);
          const isCurrent = step.status === 'current';

          const Wrapper = interactive ? 'button' : 'div';

          return (
            <li key={step.id} className="relative">
              {/* Connector line */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-4 top-8 bottom-0 w-px -translate-x-1/2',
                    step.status === 'done' ? 'bg-primary/40' : 'bg-border'
                  )}
                />
              )}

              <Wrapper
                {...(interactive
                  ? { type: 'button' as const, onClick: step.onClick, 'aria-current': isCurrent ? 'step' : undefined }
                  : {})}
                className={cn(
                  'w-full text-left flex items-start gap-3 py-3 min-h-[44px]',
                  interactive && 'active:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
                  step.status === 'locked' && 'opacity-50'
                )}
                disabled={interactive ? false : undefined}
              >
                <StatusIndicator status={step.status} index={i} />

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-[14.5px] font-semibold tracking-[-0.005em]',
                        step.status === 'done' ? 'text-muted-foreground line-through decoration-1' : 'text-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                    {(step.duration || step.cost) && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {[step.duration, step.cost].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground leading-snug">
                      {step.description}
                    </p>
                  )}

                  {isCurrent && step.children && (
                    <div className="mt-3 rounded-[12px] border border-border bg-card/50 p-3">
                      {step.children}
                    </div>
                  )}
                </div>

                {interactive && !isCurrent && (
                  <ArrowRight
                    className="w-4 h-4 text-muted-foreground/50 mt-2.5 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </Wrapper>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
