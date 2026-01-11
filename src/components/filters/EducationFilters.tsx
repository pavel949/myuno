import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== EDUCATION CATEGORIES ======
export const educationCategoryOptions: FilterOption[] = [
  { id: 'languages', labelEn: 'Languages', labelRu: 'Языки', icon: '🌍' },
  { id: 'creative', labelEn: 'Creative', labelRu: 'Творчество', icon: '🎨' },
  { id: 'technology', labelEn: 'Technology', labelRu: 'Технологии', icon: '💻' },
  { id: 'sports', labelEn: 'Sports', labelRu: 'Спорт', icon: '⚽' },
  { id: 'music', labelEn: 'Music', labelRu: 'Музыка', icon: '🎵' },
  { id: 'academic', labelEn: 'Academic', labelRu: 'Академический', icon: '📚' },
];

// ====== AGE GROUPS ======
export const educationAgeOptions: FilterOption[] = [
  { id: 'kids', labelEn: 'Kids (5-12)', labelRu: 'Дети (5-12)', icon: '👧' },
  { id: 'teens', labelEn: 'Teens (13-17)', labelRu: 'Подростки (13-17)', icon: '🧑' },
  { id: 'adults', labelEn: 'Adults', labelRu: 'Взрослые', icon: '👨' },
];

// ====== LESSON TYPE ======
export const educationTypeOptions: FilterOption[] = [
  { id: 'individual', labelEn: 'Individual', labelRu: 'Индивидуально', icon: '👤' },
  { id: 'group', labelEn: 'Group', labelRu: 'Групповые', icon: '👥' },
  { id: 'online', labelEn: 'Online', labelRu: 'Онлайн', icon: '💻' },
];

// ====== FEATURES ======
export const educationFeatureOptions: FilterOption[] = [
  { id: 'certified', labelEn: 'Certified Teacher', labelRu: 'Сертификат', icon: '🎓' },
  { id: 'native', labelEn: 'Native Speaker', labelRu: 'Носитель языка', icon: '🗣️' },
  { id: 'materials', labelEn: 'Materials Included', labelRu: 'Материалы', icon: '📖' },
  { id: 'trial', labelEn: 'Free Trial', labelRu: 'Пробное занятие', icon: '🆓' },
  { id: 'flexible', labelEn: 'Flexible Schedule', labelRu: 'Гибкий график', icon: '📅' },
];

// ====== COMPLETE EDUCATION FILTER CONFIG ======
export const educationFilterConfig: FilterConfig = {
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
      titleEn: 'Subject',
      titleRu: 'Предмет',
      type: 'multi',
      options: educationCategoryOptions,
    },
    {
      id: 'ageGroup',
      titleEn: 'Age Group',
      titleRu: 'Возраст',
      type: 'multi',
      options: educationAgeOptions,
    },
    {
      id: 'lessonType',
      titleEn: 'Lesson Type',
      titleRu: 'Формат',
      type: 'multi',
      options: educationTypeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: educationFeatureOptions,
    },
  ],
};
