/**
 * Bouquet Types - Production Flower Catalog
 * 
 * Canonical type definitions for the flower delivery vertical.
 */

export interface SizeVariant {
  size: 'S' | 'M' | 'L';
  label_en: string;
  label_ru: string;
  price: number;
  flower_count: number;
}

export interface BouquetBase {
  id: string;
  shop_id: string;
  sku: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  composition_en: string | null;
  composition_ru: string | null;
  category: string | null;
  image: string | null;
  images: string[] | null;
  price: number; // Base price (Size S fallback)
  currency: string | null;
  flowers: string[] | null;
  colors: string[] | null;
  size: string | null; // Legacy single size
  size_variants: SizeVariant[] | null; // New S/M/L variants
  style: string | null;
  occasion_tags: string[] | null;
  color_palette: string | null;
  lifeos_tags: string[] | null;
  availability_note: string | null;
  preparation_time_minutes: number | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  stock_quantity: number | null;
  created_at: string;
}

export interface BouquetWithShop extends BouquetBase {
  shop?: {
    id: string;
    name_en: string;
    name_ru: string;
    delivery_fee: number | null;
    min_order_amount: number | null;
    provider_id: string | null;
  };
}

// Helper to get price for a specific size
export function getPriceForSize(
  bouquet: BouquetBase,
  size: 'S' | 'M' | 'L' = 'M'
): number {
  if (!bouquet.size_variants?.length) {
    return bouquet.price;
  }
  const variant = bouquet.size_variants.find(v => v.size === size);
  return variant?.price ?? bouquet.price;
}

// Helper to get flower count for a specific size
export function getFlowerCountForSize(
  bouquet: BouquetBase,
  size: 'S' | 'M' | 'L' = 'M'
): number | null {
  if (!bouquet.size_variants?.length) {
    return null;
  }
  const variant = bouquet.size_variants.find(v => v.size === size);
  return variant?.flower_count ?? null;
}

// Helper to get size label
export function getSizeLabel(
  size: 'S' | 'M' | 'L',
  language: 'en' | 'ru'
): string {
  const labels: Record<'S' | 'M' | 'L', { en: string; ru: string }> = {
    S: { en: 'Small', ru: 'Маленький' },
    M: { en: 'Medium', ru: 'Средний' },
    L: { en: 'Large', ru: 'Большой' },
  };
  return labels[size][language];
}

// Size availability note
export const SIZE_NOTE_EN = 'Bouquet size affects flower quantity. Style and color palette remain the same.';
export const SIZE_NOTE_RU = 'Размер букета влияет на количество цветов. Стиль и цветовая гамма остаются прежними.';
