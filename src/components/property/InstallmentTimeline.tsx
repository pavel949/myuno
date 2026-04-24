/**
 * InstallmentTimeline — visualises payment milestones from properties.installment_plan jsonb.
 *
 * Shape stored in DB matches InstallmentMilestone[] from src/lib/real-estate/installmentPresets.ts:
 *   [{ id, labelEn, labelRu, percent, dueAt?, dueAtRu? }]
 *
 * If totalPrice is provided, also shows absolute amount per milestone in the active currency.
 */

import React from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type InstallmentMilestone,
  isInstallmentPlanValid,
  sumInstallmentPercent,
} from '@/lib/real-estate/installmentPresets';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface InstallmentTimelineProps {
  milestones: InstallmentMilestone[] | null | undefined;
  totalPrice?: number | null;
  isRu: boolean;
  /** Optional preset id to display as title. */
  presetLabel?: string;
  className?: string;
}

export function InstallmentTimeline({
  milestones,
  totalPrice,
  isRu,
  presetLabel,
  className,
}: InstallmentTimelineProps) {
  const { formatPrice } = useCurrency();

  if (!milestones || milestones.length === 0) return null;

  const total = sumInstallmentPercent(milestones);
  const valid = isInstallmentPlanValid(milestones);

  return (
    <section
      className={cn('border border-border/60 bg-card p-4 rounded-none', className)}
      aria-label={isRu ? 'Платёжный график' : 'Payment schedule'}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {isRu ? 'Платёжный график' : 'Payment schedule'}
          </h3>
          {presetLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{presetLabel}</p>
          )}
        </div>
        {!valid && (
          <span
            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
            title={isRu ? `Сумма платежей = ${total}%` : `Sum = ${total}%`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {isRu ? `${total}% ≠ 100%` : `${total}% ≠ 100%`}
          </span>
        )}
      </header>

      {/* Stacked progress bar */}
      <div className="flex w-full h-2 mb-4 overflow-hidden bg-muted">
        {milestones.map((m, i) => (
          <div
            key={m.id}
            className={cn(
              'h-full',
              i % 2 === 0 ? 'bg-primary/80' : 'bg-primary/50',
            )}
            style={{ width: `${m.percent}%` }}
            title={`${m.percent}%`}
          />
        ))}
      </div>

      {/* Milestone list */}
      <ol className="space-y-2.5">
        {milestones.map((m, i) => {
          const label = isRu ? m.labelRu : m.labelEn;
          const due = isRu ? m.dueAtRu || m.dueAt : m.dueAt;
          const amount =
            totalPrice && totalPrice > 0
              ? formatPrice((totalPrice * m.percent) / 100)
              : null;
          return (
            <li key={m.id} className="flex items-start gap-3">
              <div className="shrink-0 w-7 h-7 flex items-center justify-center text-xs font-mono font-semibold border border-border/60 bg-muted/40">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{label}</p>
                  <p className="text-sm font-mono font-semibold text-primary tabular-nums">
                    {m.percent}%
                  </p>
                </div>
                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                  {due ? (
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {due}
                    </p>
                  ) : (
                    <span />
                  )}
                  {amount && (
                    <p className="text-xs font-mono text-muted-foreground tabular-nums">{amount}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {totalPrice ? (
        <div className="mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            {isRu ? 'Итого' : 'Total'}
          </span>
          <span className="text-base font-mono font-bold text-foreground tabular-nums">
            {formatPrice(totalPrice)}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export default InstallmentTimeline;
