/**
 * GuestFavoriteBadge — Airbnb-style "Guest favorite" award.
 *
 * Pure derived component. Shows nothing unless rating ≥ 4.8 AND reviewsCount ≥ 10.
 * Two visual variants:
 *   - 'pill'  (default) — rounded-none white pill with award icon, used inside hero/header.
 *   - 'inline' — small chip with no background, used inline in card metadata.
 *
 * No DB change required: the threshold is computed from the existing
 * `rating` and `review_count` fields on properties.
 */
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface GuestFavoriteBadgeProps {
  rating?: number | null;
  reviewsCount?: number | null;
  variant?: 'pill' | 'inline';
  className?: string;
}

const RATING_THRESHOLD = 4.8;
const REVIEWS_THRESHOLD = 10;

export function isGuestFavorite(
  rating?: number | null,
  reviewsCount?: number | null,
): boolean {
  return (
    typeof rating === 'number' &&
    rating >= RATING_THRESHOLD &&
    typeof reviewsCount === 'number' &&
    reviewsCount >= REVIEWS_THRESHOLD
  );
}

export function GuestFavoriteBadge({
  rating,
  reviewsCount,
  variant = 'pill',
  className,
}: GuestFavoriteBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!isGuestFavorite(rating, reviewsCount)) return null;

  const label = isRu ? 'Любимец гостей' : 'Guest favorite';

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[11px] font-semibold text-foreground',
          className,
        )}
        title={label}
      >
        <Award className="w-3.5 h-3.5 text-primary" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1',
        'text-[11px] font-semibold text-foreground shadow-sm border border-border/40',
        className,
      )}
      title={isRu ? `Рейтинг ${rating} из ${reviewsCount} отзывов` : `${rating} from ${reviewsCount} reviews`}
    >
      <Award className="w-3.5 h-3.5 text-primary" />
      {label}
    </span>
  );
}
