// Restaurant-specific filter configuration

import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== CUISINE OPTIONS ======
export const cuisineOptions: FilterOption[] = [
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🥢' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
  { id: 'american', labelEn: 'American', labelRu: 'Американская', icon: '🍔' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
  { id: 'chinese', labelEn: 'Chinese', labelRu: 'Китайская', icon: '🥡' },
  { id: 'french', labelEn: 'French', labelRu: 'Французская', icon: '🥐' },
  { id: 'mexican', labelEn: 'Mexican', labelRu: 'Мексиканская', icon: '🌮' },
  { id: 'mediterranean', labelEn: 'Mediterranean', labelRu: 'Средиземноморская', icon: '🫒' },
  { id: 'korean', labelEn: 'Korean', labelRu: 'Корейская', icon: '🍜' },
];

// ====== RESTAURANT FEATURES ======
export const featureOptions: FilterOption[] = [
  { id: 'sea_view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
  { id: 'terrace', labelEn: 'Terrace', labelRu: 'Терраса', icon: '☀️' },
  { id: 'rooftop', labelEn: 'Rooftop', labelRu: 'Крыша', icon: '🏙️' },
  { id: 'live_music', labelEn: 'Live Music', labelRu: 'Живая музыка', icon: '🎵' },
  { id: 'private_room', labelEn: 'Private Room', labelRu: 'Отдельный зал', icon: '🚪' },
  { id: 'kids_friendly', labelEn: 'Kids Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'pet_friendly', labelEn: 'Pet Friendly', labelRu: 'С питомцами', icon: '🐕' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'wifi', labelEn: 'Free WiFi', labelRu: 'Бесплатный WiFi', icon: '📶' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
];

// ====== OCCASIONS ======
export const occasionOptions: FilterOption[] = [
  { id: 'romantic', labelEn: 'Romantic Dinner', labelRu: 'Романтический ужин', icon: '💕' },
  { id: 'birthday', labelEn: 'Birthday', labelRu: 'День Рождения', icon: '🎂' },
  { id: 'business', labelEn: 'Business Meeting', labelRu: 'Деловая встреча', icon: '💼' },
  { id: 'family', labelEn: 'Family Gathering', labelRu: 'Семейный обед', icon: '👨‍👩‍👧‍👦' },
  { id: 'group', labelEn: 'Large Group', labelRu: 'Большая компания', icon: '👥' },
  { id: 'date', labelEn: 'First Date', labelRu: 'Первое свидание', icon: '❤️' },
  { id: 'celebration', labelEn: 'Celebration', labelRu: 'Праздник', icon: '🎉' },
];

// ====== DIETARY OPTIONS ======
export const dietaryOptions: FilterOption[] = [
  { id: 'vegetarian', labelEn: 'Vegetarian', labelRu: 'Вегетарианское', icon: '🥗' },
  { id: 'vegan', labelEn: 'Vegan', labelRu: 'Веганское', icon: '🌱' },
  { id: 'halal', labelEn: 'Halal', labelRu: 'Халяль', icon: '☪️' },
  { id: 'gluten_free', labelEn: 'Gluten Free', labelRu: 'Без глютена', icon: '🌾' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐' },
];

// ====== DELIVERY SPECIFIC ======
export const deliveryOptions: FilterOption[] = [
  { id: 'free_delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🆓' },
  { id: 'fast_delivery', labelEn: 'Fast (< 30 min)', labelRu: 'Быстрая (< 30 мин)', icon: '⚡' },
  { id: 'no_min_order', labelEn: 'No Min Order', labelRu: 'Без мин. заказа', icon: '💰' },
];

// ====== SORT OPTIONS ======
export const sortOptions: FilterOption[] = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые', icon: '⭐' },
  { id: 'rating', labelEn: 'Highest Rating', labelRu: 'По рейтингу', icon: '🏆' },
  { id: 'price_low', labelEn: 'Price: Low to High', labelRu: 'Цена: по возрастанию', icon: '💵' },
  { id: 'price_high', labelEn: 'Price: High to Low', labelRu: 'Цена: по убыванию', icon: '💎' },
  { id: 'distance', labelEn: 'Nearest First', labelRu: 'Ближайшие', icon: '📍' },
  { id: 'delivery_time', labelEn: 'Fastest Delivery', labelRu: 'Быстрая доставка', icon: '🚀' },
];

// ====== FULL RESTAURANT FILTER CONFIG ======
export const restaurantFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      type: 'multi',
      options: cuisineOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: featureOptions,
    },
    {
      id: 'occasion',
      titleEn: 'Good For',
      titleRu: 'Подходит для',
      type: 'multi',
      options: occasionOptions,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary',
      titleRu: 'Диета',
      type: 'multi',
      options: dietaryOptions,
    },
  ],
};

// ====== DELIVERY MODE FILTER CONFIG ======
export const deliveryFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      type: 'multi',
      options: cuisineOptions,
    },
    {
      id: 'delivery',
      titleEn: 'Delivery Options',
      titleRu: 'Опции доставки',
      type: 'multi',
      options: deliveryOptions,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary',
      titleRu: 'Диета',
      type: 'multi',
      options: dietaryOptions,
    },
  ],
};

// ====== RESERVATION MODE FILTER CONFIG ======
export const reservationFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      type: 'multi',
      options: cuisineOptions,
    },
    {
      id: 'features',
      titleEn: 'Restaurant Features',
      titleRu: 'Особенности ресторана',
      type: 'multi',
      options: featureOptions,
    },
    {
      id: 'occasion',
      titleEn: 'Perfect For',
      titleRu: 'Идеально для',
      type: 'multi',
      options: occasionOptions,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary Options',
      titleRu: 'Диетические опции',
      type: 'multi',
      options: dietaryOptions,
    },
  ],
};

// Export filter index
export { UniversalFilter, QuickFilterBar, ActiveFilters } from './UniversalFilter';
export type { FilterConfig, FilterOption, FilterValues, FilterSection } from './UniversalFilter';
