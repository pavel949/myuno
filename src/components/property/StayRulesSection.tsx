/**
 * StayRulesSection — booking-window rules a guest needs before requesting dates
 * (Airbnb parity): min/max nights, advance notice, prep days between stays,
 * and how far ahead the calendar is open.
 *
 * Formatting is shared with the property cards via `@/lib/property/stayRulesDisplay`.
 */
import { CalendarClock, CalendarRange, Clock, Timer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  buildStayRuleRows,
  stayRulesTitle,
  toStayRuleLocale,
  type StayRuleId,
} from '@/lib/property/stayRulesDisplay';

interface StayRulesSectionProps {
  minStayNights?: number | string | null;
  maxStayNights?: number | string | null;
  advanceNoticeHours?: number | string | null;
  preparationDays?: number | string | null;
  bookingWindowMonths?: number | string | null;
}

const ICONS: Record<StayRuleId, typeof Clock> = {
  min_stay: CalendarRange,
  max_stay: CalendarRange,
  advance_notice: Clock,
  preparation_days: Timer,
  booking_window: CalendarClock,
};

export function StayRulesSection(props: StayRulesSectionProps = {}) {
  const { language } = useLanguage();
  const locale = toStayRuleLocale(language);
  const rows = buildStayRuleRows(props ?? {}, locale);

  if (rows.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl lg:text-2xl font-semibold mb-4">{stayRulesTitle(locale)}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map((row) => {
          const Icon = ICONS[row.id];
          return (
            <div key={row.id} className="flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden />
              <div>
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium text-foreground">{row.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
