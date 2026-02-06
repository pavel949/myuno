/**
 * Transport-specific Klook filter configuration
 * Now uses database-driven options via useTransportFilterOptions hook
 */

import { type UnifiedFiltersKlookConfig, type DatePreset } from '@/components/shared/UnifiedFiltersKlook';

// Re-export the dynamic hook
export { useTransportFilterOptions } from '@/hooks/useDynamicFilterOptions';

// Static configuration
export const TRANSPORT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  // Date range for vehicle rental
  showDateFilters: true,
  showDateRange: true,
  dateRangeLabels: {
    fromEn: 'Pick-up',
    fromRu: 'Получение',
    toEn: 'Return',
    toRu: 'Возврат',
  },
  datePresets: [
    { id: 'today' as DatePreset, labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow' as DatePreset, labelEn: 'Tomorrow', labelRu: 'Завтра' },
    { id: 'this-week' as DatePreset, labelEn: 'This week', labelRu: 'Эта неделя' },
  ],
  
  // Inline quick filters (static - booking options)
  inlineQuickFilters: [
    { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🅰️' },
    { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
    { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: '🚚' },
  ],
  
  // Price filter (static - currency based)
  showPriceFilter: true,
  pricePresets: [
    { min: 0, max: 500, labelEn: 'Under ฿500', labelRu: 'До ฿500' },
    { min: 500, max: 1000, labelEn: '฿500-1K', labelRu: '฿500-1K' },
    { min: 1000, max: 2000, labelEn: '฿1K-2K', labelRu: '฿1K-2K' },
    { min: 2000, max: 5000, labelEn: '฿2K+', labelRu: '฿2K+' },
  ],
  priceRange: { min: 0, max: 5000, step: 100 },
  currencySymbol: '฿/day',
  
  // Sort options (static)
  sortOptions: [
    { id: 'price_asc', labelEn: 'Cheapest', labelRu: 'Дешевле' },
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'newest', labelEn: 'Newest', labelRu: 'Новые' },
  ],
  
  // Quick filter chips in drawer (static - booking options)
  quickFilterOptions: [
    { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✓' },
    { id: 'instant', labelEn: 'Instant Booking', labelRu: 'Мгновенное', icon: '⚡' },
    { id: 'free-cancel', labelEn: 'Free Cancellation', labelRu: 'Бесплатная отмена', icon: '↩️' },
  ],
  
  // Drawer chip sections - will be populated dynamically
  chipSections: [
    {
      id: 'vehicleType',
      titleEn: 'Vehicle Type',
      titleRu: 'Тип транспорта',
      options: [], // Populated from useTaxonomy('vehicle_type')
      initialVisible: 6,
    },
    {
      id: 'transmission',
      titleEn: 'Transmission',
      titleRu: 'Коробка',
      options: [], // Populated from useTaxonomy('transmission_type')
      initialVisible: 2,
    },
    {
      id: 'fuelType',
      titleEn: 'Fuel Type',
      titleRu: 'Тип топлива',
      options: [], // Populated from useTaxonomy('fuel_type')
      initialVisible: 4,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      options: [], // Populated from useTaxonomy('vehicle_feature')
      initialVisible: 6,
    },
  ],
  
  // Custom labels
  labels: {
    filtersEn: 'Filters',
    filtersRu: 'Фильтры',
    resetEn: 'Reset',
    resetRu: 'Сбросить',
    budgetEn: 'Daily rate',
    budgetRu: 'Цена за день',
    quickFiltersEn: 'Quick filters',
    quickFiltersRu: 'Быстрые фильтры',
    resultsEn: 'vehicles',
    resultsRu: 'вариантов',
    showResultsEn: 'Show',
    showResultsRu: 'Показать',
    allEn: 'All',
    allRu: 'Все',
    pickDateEn: 'Pick date',
    pickDateRu: 'Выбрать дату',
  },
};

// ============= DEPRECATED =============
// Use useTransportFilterOptions().categoryRibbon instead of this static array
// Keeping for backward compatibility only
export const TRANSPORT_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  // Dynamic categories loaded from DB via useTransportFilterOptions
];
