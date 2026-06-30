/**
 * ReviewSubScores — category breakdown bars (Cleanliness, Location, Staff,
 * Value, Comfort, Facilities) shown alongside the aggregate review stats.
 *
 * Display-ready ahead of the data: the underlying columns/aggregates do not
 * exist yet, so this renders NOTHING when no sub-score is present. When a future
 * migration starts populating `review_subscores` (or per-category aggregates),
 * passing them here lights the component up with no further wiring.
 *
 * Scores are on a 0–5 scale.
 */
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

/** Canonical category keys, in display order. */
export type ReviewSubScoreKey =
  | 'cleanliness'
  | 'location'
  | 'staff'
  | 'value'
  | 'comfort'
  | 'facilities';

export type ReviewSubScores = Partial<Record<ReviewSubScoreKey, number | null>>;

interface ReviewSubScoresProps {
  /** Optional map of category → average (0–5). Absent/empty renders nothing. */
  subscores?: ReviewSubScores | null;
  className?: string;
}

const CATEGORY_ORDER: ReviewSubScoreKey[] = [
  'cleanliness',
  'location',
  'staff',
  'value',
  'comfort',
  'facilities',
];

const CATEGORY_LABELS: Record<ReviewSubScoreKey, { en: string; ru: string }> = {
  cleanliness: { en: 'Cleanliness', ru: 'Чистота' },
  location: { en: 'Location', ru: 'Расположение' },
  staff: { en: 'Staff', ru: 'Персонал' },
  value: { en: 'Value', ru: 'Цена/качество' },
  comfort: { en: 'Comfort', ru: 'Комфорт' },
  facilities: { en: 'Facilities', ru: 'Удобства' },
};

const MAX_SCORE = 5;

export function ReviewSubScores({ subscores, className }: ReviewSubScoresProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!subscores) return null;

  const rows = CATEGORY_ORDER.map((key) => ({ key, value: subscores[key] })).filter(
    (row): row is { key: ReviewSubScoreKey; value: number } =>
      typeof row.value === 'number' && row.value > 0,
  );

  if (rows.length === 0) return null;

  return (
    <div className={className ?? 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5'}>
      {rows.map(({ key, value }) => {
        const label = isRu ? CATEGORY_LABELS[key].ru : CATEGORY_LABELS[key].en;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-foreground w-32 flex-shrink-0">{label}</span>
            <Progress value={(value / MAX_SCORE) * 100} className="flex-1 h-2" />
            <span className="text-sm font-mono text-muted-foreground w-9 text-right tabular-nums">
              {value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
