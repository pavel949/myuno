import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== TOUR TYPES ======
export const tourTypeOptions: FilterOption[] = [
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова', icon: '🏝️' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура', icon: '🛕' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт', icon: '🏄' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🤿' },
  { id: 'city', labelEn: 'City Tour', labelRu: 'Город', icon: '🏙️' },
  { id: 'sunset', labelEn: 'Sunset', labelRu: 'Закат', icon: '🌅' },
];

// ====== DURATION OPTIONS ======
export const tourDurationOptions: FilterOption[] = [
  { id: 'half-day', labelEn: 'Half Day (4-5h)', labelRu: 'Полдня (4-5ч)', icon: '⏰' },
  { id: 'full-day', labelEn: 'Full Day (8-10h)', labelRu: 'Весь день (8-10ч)', icon: '📅' },
  { id: 'multi-day', labelEn: 'Multi-Day', labelRu: 'Несколько дней', icon: '🗓️' },
  { id: 'short', labelEn: 'Short (2-3h)', labelRu: 'Короткий (2-3ч)', icon: '⚡' },
];

// ====== GROUP SIZE ======
export const tourGroupOptions: FilterOption[] = [
  { id: 'private', labelEn: 'Private', labelRu: 'Приватный', icon: '👤' },
  { id: 'small-group', labelEn: 'Small Group (2-8)', labelRu: 'Малая группа (2-8)', icon: '👥' },
  { id: 'large-group', labelEn: 'Large Group (10+)', labelRu: 'Большая группа (10+)', icon: '👨‍👩‍👧‍👦' },
];

// ====== TOUR FEATURES ======
export const tourFeatureOptions: FilterOption[] = [
  { id: 'hotel-pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'meals-included', labelEn: 'Meals Included', labelRu: 'Питание включено', icon: '🍽️' },
  { id: 'english-guide', labelEn: 'English Guide', labelRu: 'Англ. гид', icon: '🇬🇧' },
  { id: 'russian-guide', labelEn: 'Russian Guide', labelRu: 'Русский гид', icon: '🇷🇺' },
  { id: 'photos-included', labelEn: 'Photos Included', labelRu: 'Фото включено', icon: '📸' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'kid-friendly', labelEn: 'Kid Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'wheelchair', labelEn: 'Wheelchair Access', labelRu: 'Для инвалидов', icon: '♿' },
];

// ====== DIFFICULTY ======
export const tourDifficultyOptions: FilterOption[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легкий', icon: '🟢' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средний', icon: '🟡' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложный', icon: '🔴' },
];

// ====== COMPLETE TOUR FILTER CONFIG ======
export const tourFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'tourType',
      titleEn: 'Tour Type',
      titleRu: 'Тип тура',
      type: 'multi',
      options: tourTypeOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: tourDurationOptions,
    },
    {
      id: 'groupSize',
      titleEn: 'Group Size',
      titleRu: 'Размер группы',
      type: 'single',
      options: tourGroupOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: tourFeatureOptions,
    },
    {
      id: 'difficulty',
      titleEn: 'Difficulty',
      titleRu: 'Сложность',
      type: 'single',
      options: tourDifficultyOptions,
    },
  ],
};
