/**
 * StayRulesSection — booking-window rules a guest needs before requesting dates
 * (Airbnb parity): min/max nights, advance notice, prep days between stays,
 * and how far ahead the calendar is open.
 */
import { CalendarClock, CalendarRange, Clock, Timer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StayRulesSectionProps {
  minStayNights?: number | string | null;
  maxStayNights?: number | string | null;
  advanceNoticeHours?: number | string | null;
  preparationDays?: number | string | null;
  bookingWindowMonths?: number | string | null;
}

/**
 * Coerce a possibly missing / string / NaN value from the database into a
 * positive finite number, or `null` when the field is absent or unusable.
 */
function positive(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export function StayRulesSection(props: StayRulesSectionProps = {}) {
  const minStayNights = positive(props?.minStayNights);
  const maxStayNights = positive(props?.maxStayNights);
  const advanceNoticeHours = positive(props?.advanceNoticeHours);
  const preparationDays = positive(props?.preparationDays);
  const bookingWindowMonths = positive(props?.bookingWindowMonths);
  const { language } = useLanguage();
  const locale = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';

  const rows: Array<{ icon: typeof Clock; label: string; value: string }> = [];

  if (minStayNights !== null) {
    rows.push({
      icon: CalendarRange,
      label: locale === 'ru' ? 'Минимальный срок' : locale === 'th' ? 'พักขั้นต่ำ' : 'Minimum stay',
      value: nights(locale, minStayNights),
    });
  }
  if (maxStayNights !== null) {
    rows.push({
      icon: CalendarRange,
      label: locale === 'ru' ? 'Максимальный срок' : locale === 'th' ? 'พักสูงสุด' : 'Maximum stay',
      value: nights(locale, maxStayNights),
    });
  }
  if (advanceNoticeHours !== null) {
    rows.push({
      icon: Clock,
      label:
        locale === 'ru'
          ? 'Бронирование заранее'
          : locale === 'th'
            ? 'จองล่วงหน้า'
            : 'Advance notice',
      value:
        advanceNoticeHours >= 24
          ? days(locale, Math.round(advanceNoticeHours / 24))
          : locale === 'ru'
            ? `${advanceNoticeHours} ч`
            : `${advanceNoticeHours} h`,
    });
  }
  if (preparationDays !== null) {
    rows.push({
      icon: Timer,
      label:
        locale === 'ru'
          ? 'Подготовка между гостями'
          : locale === 'th'
            ? 'เตรียมห้องระหว่างการเข้าพัก'
            : 'Preparation between stays',
      value: days(locale, preparationDays),
    });
  }
  if (bookingWindowMonths !== null) {
    rows.push({
      icon: CalendarClock,
      label:
        locale === 'ru'
          ? 'Календарь открыт на'
          : locale === 'th'
            ? 'ปฏิทินเปิดล่วงหน้า'
            : 'Calendar open for',
      value:
        locale === 'ru'
          ? `${bookingWindowMonths} мес.`
          : locale === 'th'
            ? `${bookingWindowMonths} เดือน`
            : `${bookingWindowMonths} months`,
    });
  }

  if (rows.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl lg:text-2xl font-semibold mb-4">
        {locale === 'ru' ? 'Условия проживания' : locale === 'th' ? 'เงื่อนไขการเข้าพัก' : 'Stay rules'}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <row.icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden />
            <div>
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function nights(locale: 'ru' | 'en' | 'th', count: number): string {
  if (locale === 'ru') return `${count} ноч.`;
  if (locale === 'th') return `${count} คืน`;
  return count === 1 ? '1 night' : `${count} nights`;
}

function days(locale: 'ru' | 'en' | 'th', count: number): string {
  if (locale === 'ru') return `${count} дн.`;
  if (locale === 'th') return `${count} วัน`;
  return count === 1 ? '1 day' : `${count} days`;
}
