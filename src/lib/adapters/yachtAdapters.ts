/**
 * Yacht Adapters - Centralized mapping for yacht card props
 * Ensures consistency between DB schema and UI components
 */

import { Users, Anchor, Ruler, Calendar } from 'lucide-react';
import type { Yacht } from '@/hooks/useYachts';
import { getCurrencySymbol } from '@/lib/config/currencies';

export interface YachtCardProps {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  currency: string;
  priceLabel: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  meta: Array<{ icon: typeof Users; label: string }>;
  tags: string[];
  badge?: { text: string; className?: string };
  charterTypes: string[];
  location?: string;
}

const DEFAULT_YACHT_IMAGE = 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600';

const YACHT_TYPE_LABELS: Record<string, { en: string; ru: string }> = {
  motor_yacht: { en: 'Motor Yacht', ru: 'Моторная яхта' },
  catamaran: { en: 'Catamaran', ru: 'Катамаран' },
  speedboat: { en: 'Speedboat', ru: 'Спидбот' },
  superyacht: { en: 'Superyacht', ru: 'Суперяхта' },
};

/**
 * Get the lowest available price ("from" price logic)
 */
function getFromPrice(yacht: Yacht): { price: number; label: { en: string; ru: string } } {
  const prices = [
    { value: yacht.price_half_day, label: { en: '/half day', ru: '/полдня' } },
    { value: yacht.price_sunset, label: { en: '/sunset', ru: '/закат' } },
    { value: yacht.price_full_day, label: { en: '/day', ru: '/день' } },
    { value: yacht.price_overnight, label: { en: '/overnight', ru: '/ночь' } },
  ].filter(p => p.value && p.value > 0);

  if (prices.length === 0) return { price: 0, label: { en: '', ru: '' } };

  // Return cheapest option
  prices.sort((a, b) => (a.value || 0) - (b.value || 0));
  return { price: prices[0].value!, label: prices[0].label };
}

/**
 * Get available charter types for a yacht
 */
function getCharterTypes(yacht: Yacht): string[] {
  const types: string[] = [];
  if (yacht.price_half_day && yacht.price_half_day > 0) types.push('half_day');
  if (yacht.price_full_day && yacht.price_full_day > 0) types.push('full_day');
  if (yacht.price_sunset && yacht.price_sunset > 0) types.push('sunset');
  if (yacht.price_overnight && yacht.price_overnight > 0) types.push('overnight');
  return types;
}

/**
 * Map a Yacht from DB to card props
 */
export function mapYachtToCardProps(
  yacht: Yacht,
  language: string
): YachtCardProps {
  const lang = language === 'ru' ? 'ru' : 'en';
  const currencySymbol = getCurrencySymbol(yacht.currency || 'THB');
  const fromPrice = getFromPrice(yacht);
  const typeLabel = YACHT_TYPE_LABELS[yacht.yacht_type] || { en: yacht.yacht_type, ru: yacht.yacht_type };

  // Build meta array
  const meta: YachtCardProps['meta'] = [];

  if (yacht.capacity) {
    meta.push({ icon: Users, label: `${yacht.capacity} ${lang === 'ru' ? 'гостей' : 'guests'}` });
  }

  if (yacht.length_meters) {
    meta.push({ icon: Ruler, label: `${yacht.length_meters}m` });
  }

  if (yacht.cabins) {
    meta.push({ icon: Anchor, label: `${yacht.cabins} ${lang === 'ru' ? 'кают' : 'cabins'}` });
  }

  if (yacht.year_built) {
    meta.push({ icon: Calendar, label: `${yacht.year_built}` });
  }

  // Build subtitle
  const subtitleParts: string[] = [];
  if (yacht.year_built) subtitleParts.push(yacht.year_built.toString());
  subtitleParts.push(lang === 'ru' ? typeLabel.ru : typeLabel.en);
  if (yacht.length_meters) subtitleParts.push(`${yacht.length_meters}m`);

  // Tags from features
  const features = lang === 'ru' ? yacht.features_ru : yacht.features_en;
  const tags = (features || []).slice(0, 2);

  return {
    id: yacht.id,
    image: yacht.cover_image || DEFAULT_YACHT_IMAGE,
    title: lang === 'ru' ? yacht.name_ru : yacht.name_en,
    subtitle: subtitleParts.join(' • '),
    rating: yacht.rating || undefined,
    reviewCount: yacht.review_count || undefined,
    price: fromPrice.price || undefined,
    currency: currencySymbol,
    priceLabel: lang === 'ru' ? fromPrice.label.ru : fromPrice.label.en,
    isVerified: yacht.is_verified,
    isFeatured: yacht.is_featured,
    meta: meta.slice(0, 4),
    tags,
    badge: yacht.is_featured ? { text: lang === 'ru' ? 'Рекомендуем' : 'Featured' } : undefined,
    charterTypes: getCharterTypes(yacht),
    location: lang === 'ru' ? (yacht.location_ru || yacht.location_name || undefined) : (yacht.location_name || undefined),
  };
}

/**
 * Get yacht booking context for booking flow
 */
export function mapYachtToBookingContext(yacht: Yacht, language: string) {
  const lang = language === 'ru' ? 'ru' : 'en';
  return {
    id: yacht.id,
    name: lang === 'ru' ? yacht.name_ru : yacht.name_en,
    nameEn: yacht.name_en,
    nameRu: yacht.name_ru,
    priceHalfDay: yacht.price_half_day || 0,
    priceFullDay: yacht.price_full_day || 0,
    priceSunset: yacht.price_sunset || 0,
    priceOvernight: yacht.price_overnight || 0,
    image: yacht.cover_image || DEFAULT_YACHT_IMAGE,
    capacity: yacht.capacity,
    charterTypes: getCharterTypes(yacht),
    yachtType: yacht.yacht_type,
    providerId: yacht.provider_id,
  };
}
