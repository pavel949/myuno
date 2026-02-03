/**
 * Yacht-specific Klook filter configuration
 * Now uses database-driven options via useYachtFilterOptions hook
 */

import { type UnifiedFiltersKlookConfig, type DatePreset } from '@/components/shared/UnifiedFiltersKlook';

// Re-export the dynamic hook
export { useYachtFilterOptions } from '@/hooks/useDynamicFilterOptions';

// Static configuration that doesn't need DB
export const YACHT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  // Date filters are critical for yacht booking
  showDateFilters: true,
  datePresets: [
    { id: 'today' as DatePreset, labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow' as DatePreset, labelEn: 'Tomorrow', labelRu: 'Завтра' },
    { id: 'this-week' as DatePreset, labelEn: 'This week', labelRu: 'Эта неделя' },
  ],
  
  // Inline quick filters for duration (static - timing based)
  inlineQuickFilters: [
    { id: 'half-day', labelEn: 'Half Day', labelRu: 'Полдня', icon: '⏱️' },
    { id: 'full-day', labelEn: 'Full Day', labelRu: 'Весь день', icon: '☀️' },
    { id: 'overnight', labelEn: 'Overnight', labelRu: 'С ночёвкой', icon: '🌙' },
  ],
  
  // Price filter (static - currency based)
  showPriceFilter: true,
  pricePresets: [
    { min: 0, max: 50000, labelEn: 'Under ฿50K', labelRu: 'До ฿50K' },
    { min: 50000, max: 150000, labelEn: '฿50K-150K', labelRu: '฿50K-150K' },
    { min: 150000, max: 300000, labelEn: '฿150K-300K', labelRu: '฿150K-300K' },
    { min: 300000, max: 500000, labelEn: '฿300K+', labelRu: '฿300K+' },
  ],
  priceRange: { min: 0, max: 500000, step: 5000 },
  currencySymbol: '฿',
  
  // Sort options (static)
  sortOptions: [
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена ↑' },
    { id: 'price_desc', labelEn: 'Price: High to Low', labelRu: 'Цена ↓' },
    { id: 'capacity', labelEn: 'Capacity', labelRu: 'Вместимость' },
  ],
  
  // Quick filter chips in drawer (static - booking options)
  quickFilterOptions: [
    { id: 'instant', labelEn: 'Instant Booking', labelRu: 'Мгновенное бронирование', icon: '⚡' },
    { id: 'crew', labelEn: 'With Crew', labelRu: 'С экипажем', icon: '👨‍✈️' },
    { id: 'catering', labelEn: 'Catering Available', labelRu: 'Кейтеринг', icon: '🍽️' },
  ],
  
  // Drawer chip sections - will be populated dynamically from useYachtFilterOptions
  // These are fallbacks for when hook data is not yet loaded
  chipSections: [
    {
      id: 'experiences',
      titleEn: 'Experiences',
      titleRu: 'Впечатления',
      options: [], // Will be populated from useTaxonomy('yacht_experience')
      initialVisible: 6,
    },
    {
      id: 'capacity',
      titleEn: 'Capacity',
      titleRu: 'Вместимость',
      options: [
        { id: '2-6', labelEn: '2-6 guests', labelRu: '2-6 гостей', icon: '👥' },
        { id: '7-12', labelEn: '7-12 guests', labelRu: '7-12 гостей', icon: '👨‍👩‍👧‍👦' },
        { id: '13-20', labelEn: '13-20 guests', labelRu: '13-20 гостей', icon: '👨‍👩‍👧‍👦' },
        { id: '20+', labelEn: '20+ guests', labelRu: '20+ гостей', icon: '🎊' },
      ],
      initialVisible: 4,
    },
    {
      id: 'amenities',
      titleEn: 'Amenities',
      titleRu: 'Удобства',
      options: [], // Will be populated from useTaxonomy('yacht_amenity')
      initialVisible: 6,
    },
  ],
  
  // Custom labels
  labels: {
    filtersEn: 'Filters',
    filtersRu: 'Фильтры',
    resetEn: 'Reset',
    resetRu: 'Сбросить',
    budgetEn: 'Budget',
    budgetRu: 'Бюджет',
    quickFiltersEn: 'Booking options',
    quickFiltersRu: 'Опции бронирования',
    resultsEn: 'yachts',
    resultsRu: 'яхт',
    showResultsEn: 'Show',
    showResultsRu: 'Показать',
    allEn: 'All',
    allRu: 'Все',
    pickDateEn: 'Pick date',
    pickDateRu: 'Выбрать дату',
  },
};

// Legacy static categories - use useYachtFilterOptions().categoryRibbon instead
export const YACHT_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  { id: 'yacht', labelEn: 'Yachts', labelRu: 'Яхты', icon: '🛥️' },
  { id: 'catamaran', labelEn: 'Catamarans', labelRu: 'Катамараны', icon: '⛵' },
  { id: 'speedboat', labelEn: 'Speedboats', labelRu: 'Катера', icon: '🚤' },
  { id: 'sailing', labelEn: 'Sailing', labelRu: 'Парусные', icon: '⛵' },
];
