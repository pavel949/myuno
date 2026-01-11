import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== ACTIVITY TYPES ======
export const waterActivityTypeOptions: FilterOption[] = [
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🤿' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🥽' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл', icon: '🚤' },
  { id: 'kayaking', labelEn: 'Kayaking', labelRu: 'Каякинг', icon: '🛶' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Серфинг', icon: '🏄' },
  { id: 'parasailing', labelEn: 'Parasailing', labelRu: 'Парасейлинг', icon: '🪂' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣' },
  { id: 'wakeboarding', labelEn: 'Wakeboarding', labelRu: 'Вейкбординг', icon: '🏂' },
];

// ====== DIFFICULTY ======
export const waterDifficultyOptions: FilterOption[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легкий', icon: '🟢' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средний', icon: '🟡' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложный', icon: '🟠' },
  { id: 'expert', labelEn: 'Expert', labelRu: 'Эксперт', icon: '🔴' },
];

// ====== DURATION ======
export const waterDurationOptions: FilterOption[] = [
  { id: '1h', labelEn: '1 hour', labelRu: '1 час', icon: '⏱️' },
  { id: '2h', labelEn: '2 hours', labelRu: '2 часа', icon: '⏱️' },
  { id: 'half-day', labelEn: 'Half Day', labelRu: 'Полдня', icon: '🌤️' },
  { id: 'full-day', labelEn: 'Full Day', labelRu: 'Весь день', icon: '☀️' },
];

// ====== FEATURES ======
export const waterFeatureOptions: FilterOption[] = [
  { id: 'equipment', labelEn: 'Equipment Included', labelRu: 'Снаряжение включено', icon: '🎒' },
  { id: 'certified', labelEn: 'Certified Instructor', labelRu: 'Сертифицированный инструктор', icon: '📜' },
  { id: 'pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'photos', labelEn: 'Photos Included', labelRu: 'Фото включены', icon: '📸' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'beginner', labelEn: 'Beginner Friendly', labelRu: 'Для начинающих', icon: '👶' },
];

// ====== COMPLETE WATER FILTER CONFIG ======
export const waterFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'activityType',
      titleEn: 'Activity Type',
      titleRu: 'Тип активности',
      type: 'multi',
      options: waterActivityTypeOptions,
    },
    {
      id: 'difficulty',
      titleEn: 'Difficulty',
      titleRu: 'Сложность',
      type: 'single',
      options: waterDifficultyOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: waterDurationOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: waterFeatureOptions,
    },
  ],
};
