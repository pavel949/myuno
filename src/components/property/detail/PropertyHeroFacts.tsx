/**
 * PropertyHeroFacts — single-line summary under the title in the hero.
 *
 * Mirrors Airbnb's "1 queen bed · Shared bathroom · Sleeps 4" line.
 * Composes from bedrooms / beds / bathrooms / max_guests in a stable order.
 * Bilingual via taxonomy. Renders nothing if no facts are available.
 */
import { useLanguage } from '@/contexts/LanguageContext';

interface PropertyHeroFactsProps {
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  maxGuests?: number | null;
  className?: string;
}

export function PropertyHeroFacts({
  bedrooms,
  beds,
  bathrooms,
  maxGuests,
  className,
}: PropertyHeroFactsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const parts: string[] = [];

  if (maxGuests && maxGuests > 0) {
    parts.push(
      isRu
        ? `${maxGuests} ${maxGuests === 1 ? 'гость' : maxGuests < 5 ? 'гостя' : 'гостей'}`
        : `${maxGuests} ${maxGuests === 1 ? 'guest' : 'guests'}`,
    );
  }

  if (bedrooms && bedrooms > 0) {
    parts.push(
      isRu
        ? `${bedrooms} ${bedrooms === 1 ? 'спальня' : bedrooms < 5 ? 'спальни' : 'спален'}`
        : `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`,
    );
  }

  if (beds && beds > 0) {
    parts.push(
      isRu
        ? `${beds} ${beds === 1 ? 'кровать' : beds < 5 ? 'кровати' : 'кроватей'}`
        : `${beds} ${beds === 1 ? 'bed' : 'beds'}`,
    );
  }

  if (bathrooms && bathrooms > 0) {
    parts.push(
      isRu
        ? `${bathrooms} ${bathrooms === 1 ? 'ванная' : bathrooms < 5 ? 'ванных' : 'ванных'}`
        : `${bathrooms} ${bathrooms === 1 ? 'bathroom' : 'bathrooms'}`,
    );
  }

  if (parts.length === 0) return null;

  return (
    <p className={className ?? 'text-sm text-muted-foreground mt-1'}>
      {parts.join(' · ')}
    </p>
  );
}
