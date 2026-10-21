/**
 * PropertyReviewRatings — Airbnb-style sub-rating breakdown for a listing:
 * cleanliness, accuracy, communication, location, check-in, value.
 * Renders nothing until at least one review carries sub-scores.
 */
import { Star, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyReviewSummary } from '@/hooks/usePropertyListingQuality';

const LABELS = {
  cleanliness: { en: 'Cleanliness', ru: 'Чистота', th: 'ความสะอาด' },
  accuracy: { en: 'Accuracy', ru: 'Точность описания', th: 'ความตรงตามคำบรรยาย' },
  communication: { en: 'Communication', ru: 'Общение', th: 'การสื่อสาร' },
  location: { en: 'Location', ru: 'Расположение', th: 'ที่ตั้ง' },
  checkin: { en: 'Check-in', ru: 'Заселение', th: 'การเช็คอิน' },
  value: { en: 'Value', ru: 'Цена/качество', th: 'ความคุ้มค่า' },
} as const;

type SubKey = keyof typeof LABELS;

interface PropertyReviewRatingsProps {
  propertyId?: string;
}

export function PropertyReviewRatings({ propertyId }: PropertyReviewRatingsProps) {
  const { language } = useLanguage();
  const locale = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';
  const { data: summary } = usePropertyReviewSummary(propertyId);

  if (!summary || summary.count === 0) return null;

  const entries = (Object.keys(LABELS) as SubKey[])
    .map((key) => ({ key, value: summary.subRatings[key] }))
    .filter((entry): entry is { key: SubKey; value: number } => entry.value !== null);

  if (entries.length === 0) return null;

  return (
    <section aria-label={locale === 'ru' ? 'Оценки гостей' : 'Guest ratings'}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <span className="flex items-center gap-1.5 text-xl lg:text-2xl font-semibold">
          <Star className="w-5 h-5 text-primary fill-primary" aria-hidden />
          {summary.overall?.toFixed(1) ?? '—'}
        </span>
        <span className="text-sm text-muted-foreground">
          {summary.count}{' '}
          {locale === 'ru' ? 'отзывов' : locale === 'th' ? 'รีวิว' : 'reviews'}
        </span>
        {summary.verifiedCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-primary">
            <ShieldCheck className="w-4 h-4" aria-hidden />
            {locale === 'ru'
              ? `${summary.verifiedCount} подтверждённых проживаний`
              : locale === 'th'
                ? `เข้าพักยืนยันแล้ว ${summary.verifiedCount}`
                : `${summary.verifiedCount} verified stays`}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {entries.map(({ key, value }) => (
          <div key={key} className="flex items-center gap-3">
            <dt className="text-sm text-muted-foreground w-40 shrink-0">{LABELS[key][locale]}</dt>
            <div
              className="h-1 flex-1 bg-muted"
              role="img"
              aria-label={`${LABELS[key][locale]}: ${value.toFixed(1)} / 5`}
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (value / 5) * 100)}%` }}
              />
            </div>
            <dd className="text-sm font-medium tabular-nums w-8 text-right">{value.toFixed(1)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
