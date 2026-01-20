import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

export interface Venue {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  venue_type: string;
  capacity: number | null;
  address: string | null;
  address_ru: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: Record<string, string> | null;
  cover_image: string | null;
  images: string[];
  amenities: string[];
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

interface UseVenuesOptions {
  featured?: boolean;
  type?: string;
  limit?: number;
}

const transformVenue = (venue: unknown): Venue => {
  const v = venue as Record<string, unknown>;
  return {
    ...v,
    images: (v.images as string[]) || [],
    amenities: Array.isArray(v.amenities) ? v.amenities as string[] : [],
  } as Venue;
};

export const useVenues = (options: UseVenuesOptions = {}) => {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (options.featured) {
      result.push({ column: 'is_featured', value: true });
    }
    if (options.type && options.type !== 'all') {
      result.push({ column: 'venue_type', value: options.type });
    }
    return result;
  }, [options.featured, options.type]);

  const transform = useCallback((data: unknown[]) => data.map(transformVenue), []);

  const { data, isLoading, refetch } = useSupabaseQuery<Venue>({
    table: 'venues',
    filters,
    orderBy: { column: 'name_en', ascending: true },
    limit: options.limit,
    transform,
  });

  return { venues: data, isLoading, refetch };
};

export const useVenue = (venueId: string | undefined) => {
  const transform = useCallback((data: unknown) => transformVenue(data), []);

  const { data, isLoading, error } = useSupabaseSingle<Venue>({
    table: 'venues',
    id: venueId,
    transform,
  });

  return { venue: data, isLoading, error };
};

export const VENUE_TYPES = [
  { value: 'arena', label: 'Arena', labelRu: 'Арена' },
  { value: 'stadium', label: 'Stadium', labelRu: 'Стадион' },
  { value: 'club', label: 'Club', labelRu: 'Клуб' },
  { value: 'beach_club', label: 'Beach Club', labelRu: 'Пляжный клуб' },
  { value: 'theater', label: 'Theater', labelRu: 'Театр' },
  { value: 'outdoor', label: 'Outdoor', labelRu: 'Open Air' },
  { value: 'restaurant', label: 'Restaurant', labelRu: 'Ресторан' },
  { value: 'bar', label: 'Bar', labelRu: 'Бар' },
];

export const AMENITIES_MAP: Record<string, { en: string; ru: string; icon: string }> = {
  parking: { en: 'Parking', ru: 'Парковка', icon: 'Car' },
  vip_lounge: { en: 'VIP Lounge', ru: 'VIP Лаунж', icon: 'Crown' },
  bar: { en: 'Bar', ru: 'Бар', icon: 'Wine' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан', icon: 'UtensilsCrossed' },
  wheelchair_access: { en: 'Wheelchair Access', ru: 'Доступ для инвалидов', icon: 'Accessibility' },
  vip_tables: { en: 'VIP Tables', ru: 'VIP Столы', icon: 'Crown' },
  dance_floor: { en: 'Dance Floor', ru: 'Танцпол', icon: 'Music' },
  bars: { en: 'Multiple Bars', ru: 'Несколько баров', icon: 'Wine' },
  smoking_area: { en: 'Smoking Area', ru: 'Зона для курения', icon: 'Cigarette' },
  coat_check: { en: 'Coat Check', ru: 'Гардероб', icon: 'Shirt' },
  pool: { en: 'Pool', ru: 'Бассейн', icon: 'Waves' },
  beach_access: { en: 'Beach Access', ru: 'Выход на пляж', icon: 'Umbrella' },
  sunset_view: { en: 'Sunset View', ru: 'Вид на закат', icon: 'Sunset' },
  dj_booth: { en: 'DJ Booth', ru: 'DJ Будка', icon: 'Headphones' },
  air_conditioning: { en: 'Air Conditioning', ru: 'Кондиционер', icon: 'Wind' },
  gift_shop: { en: 'Gift Shop', ru: 'Сувенирный магазин', icon: 'Gift' },
  photo_zone: { en: 'Photo Zone', ru: 'Фотозона', icon: 'Camera' },
  multiple_bars: { en: 'Multiple Bars', ru: 'Несколько баров', icon: 'Wine' },
  food_stalls: { en: 'Food Stalls', ru: 'Фуд-корт', icon: 'UtensilsCrossed' },
  boat_transfer: { en: 'Boat Transfer', ru: 'Трансфер на лодке', icon: 'Ship' },
  betting_zone: { en: 'Betting Zone', ru: 'Зона ставок', icon: 'Ticket' },
  vip_ringside: { en: 'VIP Ringside', ru: 'VIP у ринга', icon: 'Crown' },
};
