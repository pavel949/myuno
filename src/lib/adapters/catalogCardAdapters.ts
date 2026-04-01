/**
 * Catalog Card Adapters — Map domain entities to CatalogCardProps.
 * 
 * Single source of truth for all vertical grid cards.
 */

import { Star, Users, Clock, Zap, Flame, Shield, CalendarDays } from 'lucide-react';
import type { CatalogCardProps, CatalogBadge, CatalogMeta } from '@/components/miniapp/CatalogCard';
import type { Yacht } from '@/hooks/useYachts';
import type { Experience } from '@/hooks/useExperiences';
import { formatDuration } from '@/hooks/useExperiences';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

// ─── Yacht ───────────────────────────────────────────────

export function mapYachtToCatalogCard(
  yacht: Yacht,
  language: string,
  navigate: (path: string) => void
): CatalogCardProps {
  const isRu = language === 'ru';
  const name = isRu ? yacht.name_ru : yacht.name_en;

  // Get lowest price
  const prices = [yacht.price_half_day, yacht.price_sunset, yacht.price_full_day, yacht.price_overnight]
    .filter((p): p is number => !!p && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const priceSuffix = minPrice === yacht.price_half_day ? (isRu ? '/полдня' : '/half day')
    : minPrice === yacht.price_sunset ? (isRu ? '/закат' : '/sunset')
    : minPrice === yacht.price_full_day ? (isRu ? '/день' : '/day')
    : (isRu ? '/ночь' : '/overnight');

  const meta: CatalogMeta[] = [];
  if (yacht.capacity) meta.push({ icon: Users, label: `${yacht.capacity} ${isRu ? 'гостей' : 'guests'}` });
  if (yacht.length_meters) meta.push({ icon: Clock, label: `${yacht.length_meters}m` });

  const badges: CatalogBadge[] = [];
  if (yacht.is_featured) badges.push({ text: isRu ? 'Рекомендуем' : 'Featured', icon: Star, className: 'bg-primary text-primary-foreground' });

  const statusBadge: CatalogCardProps['statusBadge'] = yacht.booking_flow === 'instant'
    ? { text: isRu ? 'Сразу' : 'Instant', icon: Zap, className: 'bg-success/90 text-white' }
    : { text: isRu ? 'Запрос' : 'Request', icon: Clock, className: 'bg-muted/90 text-foreground' };

  return {
    image: yacht.cover_image || PLACEHOLDER_IMAGES.yacht,
    title: name,
    onClick: () => navigate(`/yachts/${yacht.id}`),
    badges,
    statusBadge,
    rating: yacht.rating || undefined,
    reviewCount: yacht.review_count || undefined,
    meta,
    location: isRu ? (yacht.location_ru || yacht.location_name || undefined) : (yacht.location_name || undefined),
    price: minPrice,
    priceSuffix,
  };
}

// ─── Experience ──────────────────────────────────────────

export function mapExperienceToCatalogCard(
  exp: Experience,
  language: string,
  navigate: (path: string) => void
): CatalogCardProps {
  const isRu = language === 'ru';
  const isTour = exp.experience_type === 'tour';

  const badges: CatalogBadge[] = [
    {
      text: isTour ? (isRu ? 'Тур' : 'Tour') : (isRu ? 'Активность' : 'Activity'),
      className: isTour ? 'bg-warning text-warning-foreground' : 'bg-info text-info-foreground',
    },
  ];

  const statusBadge = exp.is_featured
    ? { text: isRu ? 'Топ' : 'Featured', icon: Star, className: 'bg-primary text-primary-foreground' }
    : undefined;

  const meta: CatalogMeta[] = [];
  if (exp.duration_minutes) meta.push({ icon: Clock, label: formatDuration(exp.duration_minutes, language) });

  return {
    image: exp.cover_image || PLACEHOLDER_IMAGES.experience,
    title: isRu ? exp.title_ru : exp.title_en,
    onClick: () => navigate(`/experiences/${exp.id}`),
    badges,
    statusBadge,
    rating: exp.rating > 0 ? exp.rating : undefined,
    reviewCount: exp.review_count,
    meta,
    location: exp.location_name || undefined,
    price: exp.price || undefined,
    priceSuffix: exp.price_per ? (isRu ? '/чел' : '/person') : undefined,
  };
}

// ─── Bouquet (Flowers) ───────────────────────────────────

export function mapBouquetToCatalogCard(
  bouquet: any,
  language: string,
  navigate: (path: string) => void
): CatalogCardProps {
  const isRu = language === 'ru';
  const name = isRu ? bouquet.name_ru : bouquet.name_en;
  const shortDesc = isRu ? bouquet.short_description_ru : bouquet.short_description_en;
  const hasVariants = bouquet.size_variants?.length;
  const displayPrice = hasVariants
    ? (bouquet.size_variants as any[])[0]?.price || bouquet.price
    : bouquet.price;

  const badges: CatalogBadge[] = [];
  if (bouquet.is_popular) badges.push({ text: isRu ? 'Хит' : 'Popular', icon: Flame, className: 'bg-primary text-primary-foreground' });
  if (bouquet.box_type && bouquet.box_type !== 'wrap') {
    const boxLabel = bouquet.box_type === 'velvet_box' ? (isRu ? '🎁 Бархатная' : '🎁 Velvet')
      : bouquet.box_type === 'luxury_box' ? (isRu ? '👑 Люкс' : '👑 Luxury')
      : bouquet.box_type;
    badges.push({ text: boxLabel, className: 'bg-secondary text-secondary-foreground' });
  }
  if (bouquet.scarcity_level === 'high') {
    badges.push({ text: isRu ? 'Мало' : 'Limited', className: 'bg-destructive text-destructive-foreground' });
  }

  const socialProof = bouquet.social_proof_badge
    ? (isRu
      ? (bouquet.social_proof_badge === 'Most ordered this week' ? 'Самый заказываемый' : bouquet.social_proof_badge === 'Customer favorite' ? 'Любимец покупателей' : bouquet.social_proof_badge)
      : bouquet.social_proof_badge)
    : undefined;

  return {
    image: bouquet.image || PLACEHOLDER_IMAGES.flower,
    title: name,
    onClick: () => navigate(`/flowers/bouquet/${bouquet.id}`),
    aspectRatio: '3:4',
    badges,
    socialProof,
    price: displayPrice,
    pricePrefix: hasVariants ? (isRu ? 'от' : 'from') : undefined,
    subtitle: shortDesc || undefined,
  };
}

// ─── Pet Service ─────────────────────────────────────────

export function mapPetServiceToCatalogCard(
  service: any,
  language: string,
  navigate: (path: string) => void,
  formatPrice: (price: number) => string
): CatalogCardProps {
  const isRu = language === 'ru';
  const name = isRu ? service.name_ru : service.name_en;

  const badges: CatalogBadge[] = [];
  if (service.is_verified) badges.push({ text: isRu ? 'Проверено' : 'Verified', className: 'bg-primary text-primary-foreground' });

  return {
    image: service.cover_image || PLACEHOLDER_IMAGES.pet,
    title: name,
    onClick: () => navigate(`/pets/${service.id}`),
    badges,
    rating: (service.rating ?? 0) > 0 ? service.rating : undefined,
    location: service.address || undefined,
    price: service.price_from || undefined,
    pricePrefix: service.price_from ? (isRu ? 'от' : 'from') : undefined,
  };
}

// ─── Restaurant ──────────────────────────────────────────

const PRICE_BAND_LABEL: Record<string, string> = {
  budget: '฿', mid: '฿฿', mid_high: '฿฿฿', premium: '฿฿฿฿',
};

export function mapRestaurantToCatalogCard(
  restaurant: any,
  language: string,
  navigate: (path: string) => void
): CatalogCardProps {
  const isRu = language === 'ru';
  const r = restaurant as any;
  const cuisineTags = r.cuisine_tags as string[] | null;
  const priceBand = r.price_band as string | null;
  const reservationUrl = r.reservation_url as string | null;
  const heroImage = r.hero_image_url || restaurant.cover_image;
  const area = r.area as string | null;

  const badges: CatalogBadge[] = [];
  if (priceBand) {
    badges.push({ text: PRICE_BAND_LABEL[priceBand] || '฿฿', className: 'bg-background/90 text-foreground font-semibold' });
  }

  const statusBadge = reservationUrl
    ? { text: isRu ? 'Бронь' : 'Reserve', icon: CalendarDays, className: 'bg-primary text-primary-foreground' }
    : undefined;

  const meta: CatalogMeta[] = [];
  // Add cuisine as subtitle instead

  const subtitle = cuisineTags?.slice(0, 2).join(', ') || undefined;

  return {
    image: heroImage || PLACEHOLDER_IMAGES.food,
    title: isRu ? restaurant.name_ru : restaurant.name_en,
    onClick: () => navigate(`/restaurants/${restaurant.id}`),
    badges,
    statusBadge,
    rating: restaurant.rating > 0 ? restaurant.rating : undefined,
    location: area || undefined,
    subtitle,
  };
}
