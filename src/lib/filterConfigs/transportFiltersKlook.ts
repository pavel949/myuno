/**
 * Transport-specific Klook filter configuration
 * Aligned with Turo / Getaround rental patterns
 */

import { type UnifiedFiltersKlookConfig, type DatePreset } from '@/components/shared/UnifiedFiltersKlook';

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
  
  // Inline quick filters
  inlineQuickFilters: [
    { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🅰️' },
    { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
    { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: '🚚' },
  ],
  
  // Price filter
  showPriceFilter: true,
  pricePresets: [
    { min: 0, max: 500, labelEn: 'Under ฿500', labelRu: 'До ฿500' },
    { min: 500, max: 1000, labelEn: '฿500-1K', labelRu: '฿500-1K' },
    { min: 1000, max: 2000, labelEn: '฿1K-2K', labelRu: '฿1K-2K' },
    { min: 2000, max: 5000, labelEn: '฿2K+', labelRu: '฿2K+' },
  ],
  priceRange: { min: 0, max: 5000, step: 100 },
  currencySymbol: '฿/day',
  
  // Sort options
  sortOptions: [
    { id: 'price_asc', labelEn: 'Cheapest', labelRu: 'Дешевле' },
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'newest', labelEn: 'Newest', labelRu: 'Новые' },
  ],
  
  // Quick filter chips in drawer
  quickFilterOptions: [
    { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✓' },
    { id: 'instant', labelEn: 'Instant Booking', labelRu: 'Мгновенное', icon: '⚡' },
    { id: 'free-cancel', labelEn: 'Free Cancellation', labelRu: 'Бесплатная отмена', icon: '↩️' },
  ],
  
  // Drawer chip sections
  chipSections: [
    {
      id: 'vehicleType',
      titleEn: 'Vehicle Type',
      titleRu: 'Тип транспорта',
      options: [
        { id: 'car', labelEn: 'Car', labelRu: 'Авто', icon: '🚗' },
        { id: 'motorbike', labelEn: 'Motorbike', labelRu: 'Мотоцикл', icon: '🏍️' },
        { id: 'scooter', labelEn: 'Scooter', labelRu: 'Скутер', icon: '🛵' },
        { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚙' },
        { id: 'van', labelEn: 'Van', labelRu: 'Минивэн', icon: '🚐' },
        { id: 'luxury', labelEn: 'Luxury', labelRu: 'Премиум', icon: '🏎️' },
      ],
      initialVisible: 6,
    },
    {
      id: 'transmission',
      titleEn: 'Transmission',
      titleRu: 'Коробка',
      options: [
        { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🅰️' },
        { id: 'manual', labelEn: 'Manual', labelRu: 'Механика', icon: '⚙️' },
      ],
      initialVisible: 2,
    },
    {
      id: 'fuelType',
      titleEn: 'Fuel Type',
      titleRu: 'Тип топлива',
      options: [
        { id: 'petrol', labelEn: 'Petrol', labelRu: 'Бензин', icon: '⛽' },
        { id: 'diesel', labelEn: 'Diesel', labelRu: 'Дизель', icon: '🛢️' },
        { id: 'electric', labelEn: 'Electric', labelRu: 'Электро', icon: '🔋' },
        { id: 'hybrid', labelEn: 'Hybrid', labelRu: 'Гибрид', icon: '🌿' },
      ],
      initialVisible: 4,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      options: [
        { id: 'gps', labelEn: 'GPS', labelRu: 'GPS', icon: '📍' },
        { id: 'bluetooth', labelEn: 'Bluetooth', labelRu: 'Bluetooth', icon: '📶' },
        { id: 'dashcam', labelEn: 'Dashcam', labelRu: 'Видеорегистратор', icon: '📹' },
        { id: 'child-seat', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '🧒' },
        { id: 'luggage', labelEn: 'Luggage Space', labelRu: 'Багаж', icon: '🧳' },
        { id: 'air-con', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
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

// Category options for horizontal ribbon
export const TRANSPORT_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  { id: 'car', labelEn: 'Cars', labelRu: 'Авто', icon: '🚗' },
  { id: 'motorbike', labelEn: 'Bikes', labelRu: 'Мото', icon: '🏍️' },
  { id: 'scooter', labelEn: 'Scooters', labelRu: 'Скутеры', icon: '🛵' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожники', icon: '🚙' },
];
