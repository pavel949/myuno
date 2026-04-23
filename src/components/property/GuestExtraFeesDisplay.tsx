/**
 * GuestExtraFeesDisplay — public, read-only block on the property detail page.
 *
 * Shows the list of extra fees the host configured (electricity, water,
 * internet, cleaning, etc) with rate, estimate range, and the moment of
 * payment. Mirrors Airbnb's "Additional fees" pattern — informational only,
 * never auto-added to the booking total because metered utilities are
 * settled at check-out.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { Receipt, Info } from 'lucide-react';
import {
  GUEST_FEE_KIND_PRESETS,
  PAYMENT_MOMENT_LABELS,
  getFeeLabel,
  parseGuestExtraFees,
} from '@/lib/property/guestExtraFees';

interface GuestExtraFeesDisplayProps {
  fees: unknown;
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = { THB: '฿', USD: '$', EUR: '€' };

function formatRate(rate: number, currency: string, unit?: string, isRu = false): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const u = unit?.trim();
  const perUnit = u ? `/${u}` : '';
  return `${symbol}${rate.toLocaleString(isRu ? 'ru-RU' : 'en-US')}${perUnit}`;
}

function formatRange(min: number | null, max: number | null, currency: string, isRu = false): string | null {
  if (min == null && max == null) return null;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const fmt = (n: number) => n.toLocaleString(isRu ? 'ru-RU' : 'en-US');
  if (min != null && max != null) return `~${symbol}${fmt(min)}–${symbol}${fmt(max)}`;
  if (min != null) return `${isRu ? 'от' : 'from'} ${symbol}${fmt(min)}`;
  return `${isRu ? 'до' : 'up to'} ${symbol}${fmt(max!)}`;
}

export function GuestExtraFeesDisplay({ fees, className }: GuestExtraFeesDisplayProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const parsed = parseGuestExtraFees(fees);
  if (parsed.length === 0) return null;

  return (
    <section className={className} aria-labelledby="guest-extra-fees-heading">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="h-5 w-5 text-primary" />
        <h2 id="guest-extra-fees-heading" className="text-lg font-semibold">
          {isRu ? 'Оплачивается отдельно' : 'Paid separately'}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {isRu
          ? 'Эти позиции не включены в стоимость бронирования и оплачиваются хосту по факту использования.'
          : 'These items are not included in the booking total and are paid to the host based on actual usage.'}
      </p>

      <ul className="divide-y divide-border/60 rounded-none border border-border/60 overflow-hidden">
        {parsed.map((fee) => {
          const preset = GUEST_FEE_KIND_PRESETS[fee.kind];
          const label = getFeeLabel(fee, isRu);
          const currency = fee.currency || 'THB';
          const rateStr = fee.rate != null && fee.rate > 0 ? formatRate(fee.rate, currency, fee.unit, isRu) : null;
          const range = formatRange(fee.estimate_min ?? null, fee.estimate_max ?? null, currency, isRu);
          const note = isRu ? fee.notes_ru : fee.notes_en;
          const moment = isRu
            ? PAYMENT_MOMENT_LABELS[fee.when_paid].labelRu
            : PAYMENT_MOMENT_LABELS[fee.when_paid].labelEn;

          return (
            <li key={fee.id} className="p-3 flex items-start gap-3 bg-card/40">
              <div className="text-xl leading-none mt-0.5" aria-hidden>
                {preset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground">{label}</span>
                  {rateStr && (
                    <span className="text-sm font-semibold text-foreground tabular-nums">{rateStr}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
                    {moment}
                  </span>
                  {range && (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
                      {isRu ? 'обычно' : 'typically'} {range}
                    </span>
                  )}
                </div>
                {note && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{note}</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
