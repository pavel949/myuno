import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== EVENT CATEGORIES ======
export const eventCategoryOptions: FilterOption[] = [
  { id: 'party', labelEn: 'Party', labelRu: 'Вечеринки', icon: '🎉' },
  { id: 'concert', labelEn: 'Concert', labelRu: 'Концерты', icon: '🎵' },
  { id: 'show', labelEn: 'Show', labelRu: 'Шоу', icon: '🎭' },
  { id: 'sports', labelEn: 'Sports', labelRu: 'Спорт', icon: '⚽' },
  { id: 'cultural', labelEn: 'Cultural', labelRu: 'Культурные', icon: '🏛️' },
  { id: 'festival', labelEn: 'Festival', labelRu: 'Фестивали', icon: '🎪' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь', icon: '🌙' },
  { id: 'food-drink', labelEn: 'Food & Drink', labelRu: 'Еда и напитки', icon: '🍸' },
];

// ====== EVENT FEATURES ======
export const eventFeatureOptions: FilterOption[] = [
  { id: 'free', labelEn: 'Free Entry', labelRu: 'Бесплатный вход', icon: '🆓' },
  { id: 'family', labelEn: 'Family Friendly', labelRu: 'Для семьи', icon: '👨‍👩‍👧' },
  { id: '18+', labelEn: '18+ Only', labelRu: 'Только 18+', icon: '🔞' },
  { id: 'outdoor', labelEn: 'Outdoor', labelRu: 'На открытом воздухе', icon: '☀️' },
  { id: 'indoor', labelEn: 'Indoor', labelRu: 'В помещении', icon: '🏠' },
  { id: 'beach', labelEn: 'Beach Party', labelRu: 'Пляжная вечеринка', icon: '🏖️' },
  { id: 'vip', labelEn: 'VIP Available', labelRu: 'Есть VIP', icon: '👑' },
  { id: 'transfer', labelEn: 'Transfer Included', labelRu: 'Трансфер включён', icon: '🚐' },
];

// ====== DATE RANGE ======
export const eventDateOptions: FilterOption[] = [
  { id: 'today', labelEn: 'Today', labelRu: 'Сегодня', icon: '📅' },
  { id: 'tomorrow', labelEn: 'Tomorrow', labelRu: 'Завтра', icon: '📆' },
  { id: 'this-week', labelEn: 'This Week', labelRu: 'На этой неделе', icon: '🗓️' },
  { id: 'this-weekend', labelEn: 'This Weekend', labelRu: 'В эти выходные', icon: '🎊' },
  { id: 'this-month', labelEn: 'This Month', labelRu: 'В этом месяце', icon: '📅' },
];

// ====== TIME OF DAY ======
export const eventTimeOptions: FilterOption[] = [
  { id: 'morning', labelEn: 'Morning', labelRu: 'Утро', icon: '🌅' },
  { id: 'afternoon', labelEn: 'Afternoon', labelRu: 'День', icon: '☀️' },
  { id: 'evening', labelEn: 'Evening', labelRu: 'Вечер', icon: '🌆' },
  { id: 'night', labelEn: 'Night', labelRu: 'Ночь', icon: '🌙' },
];

// ====== COMPLETE EVENTS FILTER CONFIG ======
export const eventsFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'category',
      titleEn: 'Category',
      titleRu: 'Категория',
      type: 'multi',
      options: eventCategoryOptions,
    },
    {
      id: 'date',
      titleEn: 'Date',
      titleRu: 'Дата',
      type: 'single',
      options: eventDateOptions,
    },
    {
      id: 'time',
      titleEn: 'Time',
      titleRu: 'Время',
      type: 'multi',
      options: eventTimeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: eventFeatureOptions,
    },
  ],
};
