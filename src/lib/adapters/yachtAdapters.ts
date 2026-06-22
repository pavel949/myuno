/**
 * Yacht Adapters - Centralized mapping for yacht card props
 * Ensures consistency between DB schema and UI components
 */

import { Users, Anchor, Ruler, Calendar, Clock } from 'lucide-react';
import type { Yacht } from '@/hooks/useYachts';
import { getCurrencySymbol } from '@/lib/config/currencies';

export interface YachtCardProps {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  experienceLabel?: string;
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

import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const DEFAULT_YACHT_IMAGE = PLACEHOLDER_IMAGES.yacht;

type YachtLang = 'en' | 'ru' | 'th';

const YACHT_TYPE_LABELS: Record<string, { en: string; ru: string; th: string }> = {
  motor_yacht: { en: 'Motor Yacht', ru: 'Моторная яхта', th: 'เรือยอชต์เครื่องยนต์' },
  catamaran: { en: 'Catamaran', ru: 'Катамаран', th: 'เรือคาตามารัน' },
  speedboat: { en: 'Speedboat', ru: 'Спидбот', th: 'สปีดโบ๊ท' },
  superyacht: { en: 'Superyacht', ru: 'Суперяхта', th: 'ซูเปอร์ยอชต์' },
};

/**
 * Derive an experience label based on yacht attributes
 * This creates intent-based framing instead of asset-based
 */
function getExperienceLabel(yacht: Yacht, lang: YachtLang): string | undefined {
  const cap = yacht.capacity || 0;
  const hasSunset = yacht.price_sunset && yacht.price_sunset > 0;
  const hasOvernight = yacht.price_overnight && yacht.price_overnight > 0;
  const isLuxury = yacht.yacht_type === 'superyacht' || (yacht.length_meters && yacht.length_meters >= 25);
  const isSmall = cap <= 6;
  const isFamily = cap >= 8 && cap <= 15;
  const isBig = cap > 15;

  if (hasSunset && isSmall) return lang === 'ru' ? '🌅 Романтический закат' : lang === 'th' ? '🌅 ชมพระอาทิตย์ตกสุดโรแมนติก' : '🌅 Perfect for sunset';
  if (hasOvernight && isLuxury) return lang === 'ru' ? '✨ VIP-круиз с ночёвкой' : lang === 'th' ? '✨ ล่องเรือ VIP ค้างคืน' : '✨ VIP overnight cruise';
  if (isLuxury) return lang === 'ru' ? '💎 Премиум-опыт' : lang === 'th' ? '💎 ประสบการณ์ระดับพรีเมียม' : '💎 Premium experience';
  if (isFamily) return lang === 'ru' ? '👨‍👩‍👧‍👦 Семейный день на море' : lang === 'th' ? '👨‍👩‍👧‍👦 วันครอบครัวกลางทะเล' : '👨‍👩‍👧‍👦 Family sea day';
  if (isBig) return lang === 'ru' ? '🎉 Идеально для праздника' : lang === 'th' ? '🎉 เหมาะสำหรับงานเฉลิมฉลอง' : '🎉 Great for celebrations';
  if (hasSunset) return lang === 'ru' ? '🌅 Закатный круиз' : lang === 'th' ? '🌅 ล่องเรือชมพระอาทิตย์ตก' : '🌅 Sunset cruise';
  if (isSmall) return lang === 'ru' ? '🏝️ Уютный побег' : lang === 'th' ? '🏝️ พักผ่อนเงียบสงบ' : '🏝️ Cozy escape';
  return undefined;
}

/**
 * Get the lowest available price ("from" price logic)
 */
function getFromPrice(yacht: Yacht): { price: number; label: { en: string; ru: string; th: string } } {
  const prices = [
    { value: yacht.price_half_day, label: { en: '/half day', ru: '/полдня', th: '/ครึ่งวัน' } },
    { value: yacht.price_sunset, label: { en: '/sunset', ru: '/закат', th: '/พระอาทิตย์ตก' } },
    { value: yacht.price_full_day, label: { en: '/day', ru: '/день', th: '/วัน' } },
    { value: yacht.price_overnight, label: { en: '/overnight', ru: '/ночь', th: '/ค้างคืน' } },
  ].filter(p => p.value && p.value > 0);

  if (prices.length === 0) return { price: 0, label: { en: '', ru: '', th: '' } };
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
 * Duration summary for card display
 */
function getDurationLabel(yacht: Yacht, lang: YachtLang): string | undefined {
  const types = getCharterTypes(yacht);
  if (types.length === 0) return undefined;
  const durationMap: Record<string, { en: string; ru: string; th: string }> = {
    half_day: { en: '4h', ru: '4ч', th: '4 ชม.' },
    full_day: { en: '8h', ru: '8ч', th: '8 ชม.' },
    sunset: { en: '3h', ru: '3ч', th: '3 ชม.' },
    overnight: { en: '24h', ru: '24ч', th: '24 ชม.' },
  };
  const shortest = types[0];
  const longest = types[types.length - 1];
  if (shortest === longest) return durationMap[shortest]?.[lang];
  return `${durationMap[shortest]?.[lang]}–${durationMap[longest]?.[lang]}`;
}

/**
 * Map a Yacht from DB to card props
 */
export function mapYachtToCardProps(
  yacht: Yacht,
  language: string
): YachtCardProps {
  const lang: YachtLang = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';
  const currencySymbol = getCurrencySymbol(yacht.currency || 'THB');
  const fromPrice = getFromPrice(yacht);
  const typeLabel = YACHT_TYPE_LABELS[yacht.yacht_type] || { en: yacht.yacht_type, ru: yacht.yacht_type, th: yacht.yacht_type };

  const meta: YachtCardProps['meta'] = [];

  if (yacht.capacity) {
    const guestsLabel = lang === 'ru' ? 'гостей' : lang === 'th' ? 'ที่นั่ง' : 'guests';
    meta.push({ icon: Users, label: `${yacht.capacity} ${guestsLabel}` });
  }

  const duration = getDurationLabel(yacht, lang);
  if (duration) {
    meta.push({ icon: Clock, label: duration });
  }

  if (yacht.length_meters) {
    meta.push({ icon: Ruler, label: `${yacht.length_meters}m` });
  }

  if (yacht.cabins) {
    const cabinsLabel = lang === 'ru' ? 'кают' : lang === 'th' ? 'ห้องนอน' : 'cabins';
    meta.push({ icon: Anchor, label: `${yacht.cabins} ${cabinsLabel}` });
  }

  // Subtitle
  const subtitleParts: string[] = [];
  if (yacht.year_built) subtitleParts.push(yacht.year_built.toString());
  // typeLabel always has th; static-only field, safe to index by lang
  subtitleParts.push(typeLabel[lang] ?? typeLabel.en);
  if (yacht.length_meters) subtitleParts.push(`${yacht.length_meters}m`);

  // Tags from features (max 2). DB has only RU/EN — Thai falls back to EN.
  const features = lang === 'ru' ? yacht.features_ru : yacht.features_en;
  const tags = (features || []).slice(0, 2);

  return {
    id: yacht.id,
    image: yacht.cover_image || DEFAULT_YACHT_IMAGE,
    // DB-sourced name: only RU/EN exist — Thai falls back to EN.
    title: lang === 'ru' ? yacht.name_ru : yacht.name_en,
    subtitle: subtitleParts.join(' • '),
    experienceLabel: getExperienceLabel(yacht, lang),
    rating: yacht.rating || undefined,
    reviewCount: yacht.review_count || undefined,
    price: fromPrice.price || undefined,
    currency: currencySymbol,
    priceLabel: fromPrice.label[lang] ?? fromPrice.label.en,
    isVerified: yacht.is_verified,
    isFeatured: yacht.is_featured,
    meta: meta.slice(0, 4),
    tags,
    badge: yacht.is_featured ? { text: lang === 'ru' ? 'Рекомендуем' : lang === 'th' ? 'แนะนำ' : 'Featured' } : undefined,
    charterTypes: getCharterTypes(yacht),
    // DB-sourced location: only RU/EN exist — Thai falls back to EN/location_name.
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
