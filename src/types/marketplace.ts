// Unified marketplace types that work with database

export interface MarketplaceProduct {
  id: string;
  category_slug: string;
  subcategory: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  unit: string;
  unit_ru: string;
  cover_image: string | null;
  images: string[] | null;
  in_stock: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_active: boolean;
  rating: number | null;
  review_count: number;
  vendor_name: string | null;
  vendor_name_ru: string | null;
  tags: string[] | null;
  sort_order: number;
  // International shipping fields
  is_shippable_international: boolean;
  weight_kg: number;
}

export interface MarketplaceCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  icon: string | null;
  image_url: string | null;
  gradient: string | null;
  sort_order: number;
  is_active: boolean;
  category_group: string | null;
}

export interface MarketplaceSubcategory {
  id: string;
  category_slug: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DeliverySetting {
  id: string;
  zone_name_en: string;
  zone_name_ru: string;
  base_fee: number;
  free_delivery_threshold: number | null;
  min_order_amount: number;
  estimated_time_minutes: number;
  is_default: boolean;
  is_active: boolean;
}

export interface InternationalShippingZone {
  id: string;
  zone_code: string;
  zone_name_en: string;
  zone_name_ru: string;
  base_fee: number;
  per_kg_fee: number;
  estimated_days_min: number;
  estimated_days_max: number;
  min_order_amount: number;
  is_active: boolean;
}

export type DeliveryType = 'local' | 'international';

// Vendor interface for professional vendor registry
export interface MarketplaceVendor {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  logo_url: string | null;
  cover_image: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  address_ru: string | null;
  rating: number | null;
  review_count: number;
  verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product with vendor relationship
export interface MarketplaceProductWithVendor extends MarketplaceProduct {
  vendor_id: string | null;
  vendor?: MarketplaceVendor | null;
}

// For backward compatibility - maps subcategory to old format
export interface Subcategory {
  id: string;
  label_en: string;
  label_ru: string;
  icon?: string;
}

// Convert DB subcategory to legacy format
export function toSubcategory(dbSub: MarketplaceSubcategory): Subcategory {
  return {
    id: dbSub.slug,
    label_en: dbSub.name_en,
    label_ru: dbSub.name_ru,
    icon: dbSub.icon || undefined,
  };
}
