import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== EXPERIENCE TYPE ======
export const experienceTypeOptions: FilterOption[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  { id: 'tour', labelEn: 'Tours', labelRu: 'Туры', icon: '🧭' },
  { id: 'activity', labelEn: 'Activities', labelRu: 'Активности', icon: '🏄' },
];

// ====== CATEGORY OPTIONS (Unified) ======
export const experienceCategoryOptions: FilterOption[] = [
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова', icon: '🏝️' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт', icon: '🏄' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура', icon: '🛕' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿' },
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🤿' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🥽' },
  { id: 'sunset', labelEn: 'Sunset', labelRu: 'Закаты', icon: '🌅' },
  { id: 'city', labelEn: 'City Tour', labelRu: 'Город', icon: '🏙️' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣' },
];

// ====== DURATION OPTIONS ======
export const experienceDurationOptions: FilterOption[] = [
  { id: 'short', labelEn: '1-2 hours', labelRu: '1-2 часа', icon: '⚡' },
  { id: 'half-day', labelEn: 'Half Day (3-5h)', labelRu: 'Полдня (3-5ч)', icon: '⏰' },
  { id: 'full-day', labelEn: 'Full Day (6-10h)', labelRu: 'Весь день (6-10ч)', icon: '📅' },
  { id: 'multi-day', labelEn: 'Multi-Day', labelRu: 'Несколько дней', icon: '🗓️' },
];

// ====== DIFFICULTY OPTIONS ======
export const experienceDifficultyOptions: FilterOption[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легкий', icon: '🟢' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средний', icon: '🟡' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложный', icon: '🟠' },
  { id: 'expert', labelEn: 'Expert', labelRu: 'Эксперт', icon: '🔴' },
];

// ====== FEATURES OPTIONS (Combined from Tours + Water) ======
export const experienceFeatureOptions: FilterOption[] = [
  { id: 'hotel-pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'meals-included', labelEn: 'Meals Included', labelRu: 'Питание включено', icon: '🍽️' },
  { id: 'equipment', labelEn: 'Equipment Included', labelRu: 'Снаряжение включено', icon: '🎒' },
  { id: 'certified', labelEn: 'Certified Instructor', labelRu: 'Сертифицированный инструктор', icon: '📜' },
  { id: 'english-guide', labelEn: 'English Guide', labelRu: 'Англ. гид', icon: '🇬🇧' },
  { id: 'russian-guide', labelEn: 'Russian Guide', labelRu: 'Русский гид', icon: '🇷🇺' },
  { id: 'photos-included', labelEn: 'Photos Included', labelRu: 'Фото включено', icon: '📸' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'kid-friendly', labelEn: 'Kid Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'beginner', labelEn: 'Beginner Friendly', labelRu: 'Для начинающих', icon: '🌱' },
];

// ====== GROUP SIZE OPTIONS ======
export const experienceGroupOptions: FilterOption[] = [
  { id: 'private', labelEn: 'Private', labelRu: 'Приватный', icon: '👤' },
  { id: 'small-group', labelEn: 'Small Group (2-8)', labelRu: 'Малая группа (2-8)', icon: '👥' },
  { id: 'large-group', labelEn: 'Large Group (10+)', labelRu: 'Большая группа (10+)', icon: '👨‍👩‍👧‍👦' },
];

// ====== COMPLETE EXPERIENCE FILTER CONFIG ======
export const experienceFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'experienceType',
      titleEn: 'Type',
      titleRu: 'Тип',
      type: 'single',
      options: experienceTypeOptions,
    },
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
      options: experienceCategoryOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: experienceDurationOptions,
    },
    {
      id: 'difficulty',
      titleEn: 'Difficulty',
      titleRu: 'Сложность',
      type: 'single',
      options: experienceDifficultyOptions,
    },
    {
      id: 'groupSize',
      titleEn: 'Group Size',
      titleRu: 'Размер группы',
      type: 'single',
      options: experienceGroupOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: experienceFeatureOptions,
    },
  ],
};

// Export for backward compatibility
export {
  experienceTypeOptions as typeOptions,
  experienceCategoryOptions as categoryOptions,
  experienceDurationOptions as durationOptions,
  experienceDifficultyOptions as difficultyOptions,
  experienceFeatureOptions as featureOptions,
  experienceGroupOptions as groupOptions,
};
