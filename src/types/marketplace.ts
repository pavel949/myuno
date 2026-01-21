// Unified marketplace types that work with both DB and mock data
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

// Subcategory definition
export interface Subcategory {
  id: string;
  label_en: string;
  label_ru: string;
}

// Hardcoded subcategories (can be moved to DB later)
export const subcategoriesByCategory: Record<string, Subcategory[]> = {
  groceries: [
    { id: 'all', label_en: 'All', label_ru: 'Все' },
    { id: 'farm', label_en: 'Farm Products', label_ru: 'Фермерские' },
    { id: 'russian', label_en: 'Russian Foods', label_ru: 'Русские продукты' },
    { id: 'organic', label_en: 'Organic', label_ru: 'Органические' },
    { id: 'dairy', label_en: 'Dairy', label_ru: 'Молочные' },
    { id: 'meat', label_en: 'Meat & Fish', label_ru: 'Мясо и рыба' },
  ],
  cosmetics: [
    { id: 'all', label_en: 'All', label_ru: 'Все' },
    { id: 'skincare', label_en: 'Skincare', label_ru: 'Уход за кожей' },
    { id: 'haircare', label_en: 'Haircare', label_ru: 'Уход за волосами' },
    { id: 'bodycare', label_en: 'Body Care', label_ru: 'Уход за телом' },
    { id: 'thai-herbs', label_en: 'Thai Herbs', label_ru: 'Тайские травы' },
  ],
  souvenirs: [
    { id: 'all', label_en: 'All', label_ru: 'Все' },
    { id: 'traditional', label_en: 'Traditional', label_ru: 'Традиционные' },
    { id: 'handicrafts', label_en: 'Handicrafts', label_ru: 'Ремёсла' },
    { id: 'textiles', label_en: 'Textiles', label_ru: 'Текстиль' },
    { id: 'jewelry', label_en: 'Jewelry', label_ru: 'Украшения' },
  ],
  'home-decor': [
    { id: 'all', label_en: 'All', label_ru: 'Все' },
    { id: 'furniture', label_en: 'Furniture', label_ru: 'Мебель' },
    { id: 'lighting', label_en: 'Lighting', label_ru: 'Освещение' },
    { id: 'textiles', label_en: 'Textiles', label_ru: 'Текстиль' },
    { id: 'decor', label_en: 'Decor', label_ru: 'Декор' },
  ],
};
