/**
 * Listing-quality data hooks (Zillow/Airbnb parity, phase 1).
 *
 * Reads the structured listing tables introduced alongside the legacy
 * `properties.images` / `properties.amenities` arrays:
 *  - `property_media`      → captioned, ordered, room-tagged gallery
 *  - `property_amenities`  → amenity codes joined to `amenity_catalog`
 *  - `property_reviews`    → Airbnb-style sub-rating breakdown
 *
 * All three degrade gracefully: when a property has no structured rows yet,
 * the caller keeps using the legacy arrays.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MediaLocale = 'ru' | 'en' | 'th';

export interface PropertyMediaItem {
  id: string;
  url: string;
  kind: string;
  room_tag: string | null;
  caption_en: string | null;
  caption_ru: string | null;
  caption_th: string | null;
  alt_en: string | null;
  alt_ru: string | null;
  display_order: number;
  is_cover: boolean;
}

export interface PropertyAmenityItem {
  code: string;
  category: string;
  name_en: string;
  name_ru: string;
  name_th: string | null;
  icon: string | null;
  is_highlight: boolean;
  sort_order: number;
  note_en: string | null;
  note_ru: string | null;
}

export interface ReviewSubRatings {
  cleanliness: number | null;
  accuracy: number | null;
  communication: number | null;
  location: number | null;
  checkin: number | null;
  value: number | null;
}

export interface PropertyReviewSummary {
  overall: number | null;
  count: number;
  verifiedCount: number;
  subRatings: ReviewSubRatings;
}

/** Pick the caption for the active locale, falling back EN → RU → TH. */
export function mediaCaption(item: PropertyMediaItem, locale: MediaLocale): string | null {
  if (locale === 'ru') return item.caption_ru || item.caption_en || item.caption_th || null;
  if (locale === 'th') return item.caption_th || item.caption_en || item.caption_ru || null;
  return item.caption_en || item.caption_ru || item.caption_th || null;
}

/** Alt text for a media item; falls back to the caption, then the given default. */
export function mediaAlt(item: PropertyMediaItem, locale: MediaLocale, fallback: string): string {
  const alt = locale === 'ru' ? item.alt_ru || item.alt_en : item.alt_en || item.alt_ru;
  return alt || mediaCaption(item, locale) || fallback;
}

export function amenityName(item: PropertyAmenityItem, locale: MediaLocale): string {
  if (locale === 'ru') return item.name_ru || item.name_en;
  if (locale === 'th') return item.name_th || item.name_en;
  return item.name_en || item.name_ru;
}

export function usePropertyMedia(propertyId?: string) {
  return useQuery({
    queryKey: ['property-media', propertyId],
    enabled: !!propertyId,
    queryFn: async (): Promise<PropertyMediaItem[]> => {
      const { data, error } = await supabase
        .from('property_media')
        .select(
          'id, url, kind, room_tag, caption_en, caption_ru, caption_th, alt_en, alt_ru, display_order, is_cover',
        )
        .eq('property_id', propertyId!)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as PropertyMediaItem[];
    },
  });
}

export function usePropertyAmenities(propertyId?: string) {
  return useQuery({
    queryKey: ['property-amenities', propertyId],
    enabled: !!propertyId,
    queryFn: async (): Promise<PropertyAmenityItem[]> => {
      const { data, error } = await supabase
        .from('property_amenities')
        .select(
          'note_en, note_ru, amenity_catalog!inner(code, category, name_en, name_ru, name_th, icon, is_highlight, sort_order, is_active)',
        )
        .eq('property_id', propertyId!);

      if (error) throw error;

      type Row = {
        note_en: string | null;
        note_ru: string | null;
        amenity_catalog: {
          code: string;
          category: string;
          name_en: string;
          name_ru: string;
          name_th: string | null;
          icon: string | null;
          is_highlight: boolean;
          sort_order: number;
          is_active: boolean;
        } | null;
      };

      return ((data ?? []) as unknown as Row[])
        .filter((row) => row.amenity_catalog?.is_active)
        .map((row) => ({
          code: row.amenity_catalog!.code,
          category: row.amenity_catalog!.category,
          name_en: row.amenity_catalog!.name_en,
          name_ru: row.amenity_catalog!.name_ru,
          name_th: row.amenity_catalog!.name_th,
          icon: row.amenity_catalog!.icon,
          is_highlight: row.amenity_catalog!.is_highlight,
          sort_order: row.amenity_catalog!.sort_order,
          note_en: row.note_en,
          note_ru: row.note_ru,
        }))
        .sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

const avg = (values: Array<number | null>): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 10) / 10;
};

export function usePropertyReviewSummary(propertyId?: string) {
  return useQuery({
    queryKey: ['property-review-summary', propertyId],
    enabled: !!propertyId,
    queryFn: async (): Promise<PropertyReviewSummary> => {
      const { data, error } = await supabase
        .from('property_reviews')
        .select(
          'rating, rating_cleanliness, rating_accuracy, rating_communication, rating_location, rating_checkin, rating_value, is_verified_stay',
        )
        .eq('property_id', propertyId!)
        .eq('is_public', true);

      if (error) throw error;

      const rows = data ?? [];
      return {
        overall: avg(rows.map((r) => r.rating)),
        count: rows.length,
        verifiedCount: rows.filter((r) => r.is_verified_stay).length,
        subRatings: {
          cleanliness: avg(rows.map((r) => r.rating_cleanliness)),
          accuracy: avg(rows.map((r) => r.rating_accuracy)),
          communication: avg(rows.map((r) => r.rating_communication)),
          location: avg(rows.map((r) => r.rating_location)),
          checkin: avg(rows.map((r) => r.rating_checkin)),
          value: avg(rows.map((r) => r.rating_value)),
        },
      };
    },
  });
}
