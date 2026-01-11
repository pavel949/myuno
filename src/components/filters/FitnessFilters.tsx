import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== FITNESS TYPES ======
export const fitnessTypeOptions: FilterOption[] = [
  { id: 'gym', labelEn: 'Gym', labelRu: 'Тренажёрный зал', icon: '🏋️' },
  { id: 'yoga', labelEn: 'Yoga', labelRu: 'Йога', icon: '🧘' },
  { id: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит', icon: '💪' },
  { id: 'martial-arts', labelEn: 'Martial Arts', labelRu: 'Единоборства', icon: '🥊' },
  { id: 'muay-thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай', icon: '🥋' },
  { id: 'pilates', labelEn: 'Pilates', labelRu: 'Пилатес', icon: '🤸' },
  { id: 'dance', labelEn: 'Dance', labelRu: 'Танцы', icon: '💃' },
  { id: 'swimming', labelEn: 'Swimming', labelRu: 'Плавание', icon: '🏊' },
];

// ====== AMENITIES ======
export const fitnessAmenityOptions: FilterOption[] = [
  { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: '🏊' },
  { id: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна', icon: '🧖' },
  { id: 'locker', labelEn: 'Lockers', labelRu: 'Раздевалки', icon: '🔐' },
  { id: 'shower', labelEn: 'Showers', labelRu: 'Душевые', icon: '🚿' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'trainer', labelEn: 'Personal Trainer', labelRu: 'Персональный тренер', icon: '👨‍🏫' },
  { id: 'group-classes', labelEn: 'Group Classes', labelRu: 'Групповые занятия', icon: '👥' },
  { id: 'cafe', labelEn: 'Cafe/Juice Bar', labelRu: 'Кафе', icon: '🥤' },
];

// ====== MEMBERSHIP OPTIONS ======
export const membershipOptions: FilterOption[] = [
  { id: 'day-pass', labelEn: 'Day Pass', labelRu: 'Разовое посещение', icon: '📅' },
  { id: 'weekly', labelEn: 'Weekly', labelRu: 'На неделю', icon: '🗓️' },
  { id: 'monthly', labelEn: 'Monthly', labelRu: 'На месяц', icon: '📆' },
  { id: 'annual', labelEn: 'Annual', labelRu: 'Годовой', icon: '📅' },
];

// ====== SCHEDULE ======
export const scheduleOptions: FilterOption[] = [
  { id: '24h', labelEn: '24 Hours', labelRu: '24 часа', icon: '🌙' },
  { id: 'early-morning', labelEn: 'Early Morning (5-7)', labelRu: 'Раннее утро (5-7)', icon: '🌅' },
  { id: 'late-evening', labelEn: 'Late Evening (21-24)', labelRu: 'Поздний вечер (21-24)', icon: '🌃' },
  { id: 'weekends', labelEn: 'Open Weekends', labelRu: 'Работает в выходные', icon: '🗓️' },
];

// ====== COMPLETE FITNESS FILTER CONFIG ======
export const fitnessFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'fitnessType',
      titleEn: 'Type',
      titleRu: 'Тип',
      type: 'multi',
      options: fitnessTypeOptions,
    },
    {
      id: 'amenities',
      titleEn: 'Amenities',
      titleRu: 'Удобства',
      type: 'multi',
      options: fitnessAmenityOptions,
    },
    {
      id: 'membership',
      titleEn: 'Membership',
      titleRu: 'Абонемент',
      type: 'single',
      options: membershipOptions,
    },
    {
      id: 'schedule',
      titleEn: 'Schedule',
      titleRu: 'Расписание',
      type: 'multi',
      options: scheduleOptions,
    },
  ],
};
