/**
 * Restaurant-specific Klook filter configuration
 * Now uses database-driven options via useRestaurantFilterOptions hook
 */

import { type UnifiedFiltersKlookConfig, type DatePreset } from '@/components/shared/UnifiedFiltersKlook';

// Re-export the dynamic hook
export { useRestaurantFilterOptions } from '@/hooks/useDynamicFilterOptions';

// Static configuration
export const RESTAURANT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  // Date filters for reservations
  showDateFilters: true,
  datePresets: [
    { id: 'today' as DatePreset, labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow' as DatePreset, labelEn: 'Tomorrow', labelRu: 'Завтра' },
  ],
  
  // Inline quick filters (static - timing based)
  inlineQuickFilters: [
    { id: 'open-now', labelEn: 'Open Now', labelRu: 'Открыто', icon: '🕐' },
    { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатно', icon: '🚴' },
    { id: 'fast-delivery', labelEn: 'Under 30 min', labelRu: 'До 30 мин', icon: '⚡' },
  ],
  
  // Price filter (static - currency based)
  showPriceFilter: true,
  pricePresets: [
    { min: 0, max: 200, labelEn: 'Under ฿200', labelRu: 'До ฿200' },
    { min: 200, max: 500, labelEn: '฿200-500', labelRu: '฿200-500' },
    { min: 500, max: 1000, labelEn: '฿500-1K', labelRu: '฿500-1K' },
    { min: 1000, max: 5000, labelEn: '฿1K+', labelRu: '฿1K+' },
  ],
  priceRange: { min: 0, max: 5000, step: 100 },
  currencySymbol: '฿',
  
  // Sort options (static)
  sortOptions: [
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'delivery_time', labelEn: 'Fastest Delivery', labelRu: 'Быстрая доставка' },
    { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена ↑' },
    { id: 'distance', labelEn: 'Nearest', labelRu: 'Ближайшие' },
  ],
  
  // Quick filter chips in drawer (static - popularity based)
  quickFilterOptions: [
    { id: 'popular', labelEn: 'Popular', labelRu: 'Популярное', icon: '🔥' },
    { id: 'promo', labelEn: 'Promotions', labelRu: 'Акции', icon: '🎁' },
    { id: 'new', labelEn: 'New', labelRu: 'Новое', icon: '✨' },
  ],
  
  // Drawer chip sections - will be populated dynamically
  chipSections: [
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      options: [], // Populated from useTaxonomy('cuisine')
      initialVisible: 6,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary',
      titleRu: 'Диета',
      options: [], // Populated from useTaxonomy('dietary_option')
      initialVisible: 4,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      options: [], // Populated from useTaxonomy('restaurant_feature')
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

// Legacy static categories - use useRestaurantFilterOptions().categoryRibbon instead
export const RESTAURANT_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🍜' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
  { id: 'western', labelEn: 'Western', labelRu: 'Западная', icon: '🍔' },
];
