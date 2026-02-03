/**
 * Restaurant-specific Klook filter configuration
 * Aligned with Uber Eats / DoorDash patterns
 */

import { type UnifiedFiltersKlookConfig, type DatePreset } from '@/components/shared/UnifiedFiltersKlook';

export const RESTAURANT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  // Date filters for reservations
  showDateFilters: true,
  datePresets: [
    { id: 'today' as DatePreset, labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow' as DatePreset, labelEn: 'Tomorrow', labelRu: 'Завтра' },
  ],
  
  // Inline quick filters (visible in sticky bar, not drawer)
  inlineQuickFilters: [
    { id: 'open-now', labelEn: 'Open Now', labelRu: 'Открыто', icon: '🕐' },
    { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатно', icon: '🚴' },
    { id: 'fast-delivery', labelEn: 'Under 30 min', labelRu: 'До 30 мин', icon: '⚡' },
  ],
  
  // Price filter
  showPriceFilter: true,
  pricePresets: [
    { min: 0, max: 200, labelEn: 'Under ฿200', labelRu: 'До ฿200' },
    { min: 200, max: 500, labelEn: '฿200-500', labelRu: '฿200-500' },
    { min: 500, max: 1000, labelEn: '฿500-1K', labelRu: '฿500-1K' },
    { min: 1000, max: 5000, labelEn: '฿1K+', labelRu: '฿1K+' },
  ],
  priceRange: { min: 0, max: 5000, step: 100 },
  currencySymbol: '฿',
  
  // Sort options
  sortOptions: [
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'delivery_time', labelEn: 'Fastest Delivery', labelRu: 'Быстрая доставка' },
    { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена ↑' },
    { id: 'distance', labelEn: 'Nearest', labelRu: 'Ближайшие' },
  ],
  
  // Quick filter chips in drawer
  quickFilterOptions: [
    { id: 'popular', labelEn: 'Popular', labelRu: 'Популярное', icon: '🔥' },
    { id: 'promo', labelEn: 'Promotions', labelRu: 'Акции', icon: '🎁' },
    { id: 'new', labelEn: 'New', labelRu: 'Новое', icon: '✨' },
  ],
  
  // Drawer chip sections
  chipSections: [
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      options: [
        { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🍜' },
        { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
        { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
        { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
        { id: 'chinese', labelEn: 'Chinese', labelRu: 'Китайская', icon: '🥡' },
        { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐' },
        { id: 'western', labelEn: 'Western', labelRu: 'Западная', icon: '🍔' },
        { id: 'korean', labelEn: 'Korean', labelRu: 'Корейская', icon: '🍱' },
      ],
      initialVisible: 6,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary',
      titleRu: 'Диета',
      options: [
        { id: 'vegetarian', labelEn: 'Vegetarian', labelRu: 'Вегетарианское', icon: '🥗' },
        { id: 'vegan', labelEn: 'Vegan', labelRu: 'Веган', icon: '🌱' },
        { id: 'halal', labelEn: 'Halal', labelRu: 'Халяль', icon: '☪️' },
        { id: 'gluten-free', labelEn: 'Gluten Free', labelRu: 'Без глютена', icon: '🌾' },
      ],
      initialVisible: 4,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      options: [
        { id: 'outdoor', labelEn: 'Outdoor seating', labelRu: 'На улице', icon: '🌴' },
        { id: 'romantic', labelEn: 'Romantic', labelRu: 'Романтика', icon: '🥂' },
        { id: 'family', labelEn: 'Family-friendly', labelRu: 'Для семьи', icon: '👨‍👩‍👧' },
        { id: 'view', labelEn: 'Sea view', labelRu: 'Вид на море', icon: '🌊' },
        { id: 'live-music', labelEn: 'Live music', labelRu: 'Живая музыка', icon: '🎵' },
        { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
      ],
      initialVisible: 6,
    },
  ],
  
  // Custom labels
  labels: {
    filtersEn: 'Filters',
    filtersRu: 'Фильтры',
    resetEn: 'Reset',
    resetRu: 'Сбросить',
    budgetEn: 'Budget per person',
    budgetRu: 'Бюджет на человека',
    quickFiltersEn: 'Quick filters',
    quickFiltersRu: 'Быстрые фильтры',
    resultsEn: 'restaurants',
    resultsRu: 'ресторанов',
    showResultsEn: 'Show',
    showResultsRu: 'Показать',
    allEn: 'All',
    allRu: 'Все',
    pickDateEn: 'Pick date',
    pickDateRu: 'Выбрать дату',
  },
};

// Category options for horizontal ribbon
export const RESTAURANT_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🍜' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
  { id: 'western', labelEn: 'Western', labelRu: 'Западная', icon: '🍔' },
];
