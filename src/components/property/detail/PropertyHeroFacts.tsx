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
  /** When true, render the hotel summary (rooms · stars · brand) instead. */
  isHotel?: boolean;
  hotelKeys?: number | null;
  hotelStarRating?: number | null;
  hotelBrand?: string | null;
}

export function PropertyHeroFacts({
  bedrooms,
  beds,
  bathrooms,
  maxGuests,
  className,
  isHotel = false,
  hotelKeys,
  hotelStarRating,
  hotelBrand,
}: PropertyHeroFactsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const parts: string[] = [];

  // Hotel variant: "120 rooms · 4★ · Marriott" (omit missing parts).
  if (isHotel) {
    if (hotelKeys && hotelKeys > 0) {
      parts.push(
        isRu
          ? `${hotelKeys} ${hotelKeys === 1 ? 'номер' : hotelKeys < 5 ? 'номера' : 'номеров'}`
          : `${hotelKeys} ${hotelKeys === 1 ? 'room' : 'rooms'}`,
      );
    }
    if (hotelStarRating && hotelStarRating > 0) {
      parts.push(`${hotelStarRating}★`);
    }
    if (hotelBrand && hotelBrand.trim().length > 0) {
      parts.push(hotelBrand.trim());
    }

    if (parts.length === 0) return null;

    return (
      <p className={className ?? 'text-sm text-muted-foreground mt-1'}>
        {parts.join(' · ')}
      </p>
    );
  }

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
