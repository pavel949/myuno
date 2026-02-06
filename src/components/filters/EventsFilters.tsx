import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== EVENT CATEGORIES (Platform taxonomy) ======
export const eventCategoryOptions: FilterOption[] = [
  { id: 'music_live', labelEn: 'Live Music', labelRu: 'Живая музыка', icon: '🎵' },
  { id: 'dj_party', labelEn: 'DJ Party', labelRu: 'DJ вечеринка', icon: '🎧' },
  { id: 'beach_club', labelEn: 'Beach Club', labelRu: 'Пляжный клуб', icon: '🏖️' },
  { id: 'festival', labelEn: 'Festivals', labelRu: 'Фестивали', icon: '🎪' },
  { id: 'cultural', labelEn: 'Culture & Shows', labelRu: 'Культура и шоу', icon: '🎭' },
  { id: 'sports_fitness', labelEn: 'Sports', labelRu: 'Спорт', icon: '🥊' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь', icon: '🌙' },
  { id: 'food_drink', labelEn: 'Food & Drink', labelRu: 'Еда и напитки', icon: '🍸' },
  { id: 'wellness', labelEn: 'Wellness', labelRu: 'Велнес', icon: '🧘' },
  { id: 'kids_family', labelEn: 'Family', labelRu: 'Для семьи', icon: '👨‍👩‍👧' },
  { id: 'business_networking', labelEn: 'Networking', labelRu: 'Нетворкинг', icon: '🤝' },
  { id: 'community', labelEn: 'Community', labelRu: 'Сообщество', icon: '🌍' },
];

// ====== EVENT FEATURES ======
export const eventFeatureOptions: FilterOption[] = [
  { id: 'hot', labelEn: 'Hot & Trending', labelRu: 'Популярное', icon: '🔥' },
  { id: 'featured', labelEn: 'Featured', labelRu: 'Рекомендуем', icon: '⭐' },
  { id: 'global', labelEn: 'Global Artists', labelRu: 'Мировые звёзды', icon: '🌍' },
  { id: 'recurring', labelEn: 'Weekly Events', labelRu: 'Еженедельные', icon: '🔄' },
  { id: 'last-minute', labelEn: 'Last Tickets!', labelRu: 'Последние билеты!', icon: '⚡' },
  { id: 'free', labelEn: 'Free Entry', labelRu: 'Бесплатный вход', icon: '🆓' },
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

// ====== AGE POLICY ======
export const eventAgePolicyOptions: FilterOption[] = [
  { id: 'all_ages', labelEn: 'All Ages', labelRu: 'Все возрасты', icon: '👶' },
  { id: '18+', labelEn: '18+', labelRu: '18+', icon: '🔞' },
  { id: '20+', labelEn: '20+', labelRu: '20+', icon: '🔞' },
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
      id: 'agePolicy',
      titleEn: 'Age Policy',
      titleRu: 'Возраст',
      type: 'single',
      options: eventAgePolicyOptions,
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
