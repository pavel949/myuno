import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== EVENT CATEGORIES (Entertainment focused) ======
export const eventCategoryOptions: FilterOption[] = [
  { id: 'concerts', labelEn: 'Concerts', labelRu: 'Концерты', icon: '🎤' },
  { id: 'shows', labelEn: 'Shows', labelRu: 'Шоу', icon: '🎭' },
  { id: 'parties', labelEn: 'Parties', labelRu: 'Вечеринки', icon: '🎉' },
  { id: 'clubs', labelEn: 'Clubs & Bars', labelRu: 'Клубы и бары', icon: '🍸' },
  { id: 'sports', labelEn: 'Sports Events', labelRu: 'Спортивные события', icon: '🥊' },
  { id: 'festivals', labelEn: 'Festivals', labelRu: 'Фестивали', icon: '🎪' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь', icon: '🌙' },
  { id: 'live-music', labelEn: 'Live Music', labelRu: 'Живая музыка', icon: '🎵' },
];

// ====== EVENT FEATURES ======
export const eventFeatureOptions: FilterOption[] = [
  { id: 'hot', labelEn: 'Hot & Trending', labelRu: 'Популярное', icon: '🔥' },
  { id: 'featured', labelEn: 'Featured', labelRu: 'Рекомендуем', icon: '⭐' },
  { id: 'free', labelEn: 'Free Entry', labelRu: 'Бесплатный вход', icon: '🆓' },
  { id: 'family', labelEn: 'Family Friendly', labelRu: 'Для семьи', icon: '👨‍👩‍👧' },
  { id: '18+', labelEn: '18+ Only', labelRu: 'Только 18+', icon: '🔞' },
  { id: 'outdoor', labelEn: 'Outdoor', labelRu: 'На открытом воздухе', icon: '☀️' },
  { id: 'beach', labelEn: 'Beach Party', labelRu: 'Пляжная вечеринка', icon: '🏖️' },
  { id: 'vip', labelEn: 'VIP Available', labelRu: 'Есть VIP', icon: '👑' },
];

// ====== DATE RANGE ======
export const eventDateOptions: FilterOption[] = [
  { id: 'today', labelEn: 'Today', labelRu: 'Сегодня', icon: '📅' },
  { id: 'tomorrow', labelEn: 'Tomorrow', labelRu: 'Завтра', icon: '📆' },
  { id: 'this-week', labelEn: 'This Week', labelRu: 'На этой неделе', icon: '🗓️' },
  { id: 'this-weekend', labelEn: 'This Weekend', labelRu: 'В эти выходные', icon: '🎊' },
  { id: 'this-month', labelEn: 'This Month', labelRu: 'В этом месяце', icon: '📅' },
];

// ====== TIME OF DAY (Entertainment focused) ======
export const eventTimeOptions: FilterOption[] = [
  { id: 'daytime', labelEn: 'Daytime', labelRu: 'Днём', icon: '☀️' },
  { id: 'evening', labelEn: 'Evening', labelRu: 'Вечером', icon: '🌆' },
  { id: 'night', labelEn: 'Night', labelRu: 'Ночью', icon: '🌙' },
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
