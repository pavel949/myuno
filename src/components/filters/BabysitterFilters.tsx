import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== AGE GROUPS ======
export const babysitterAgeGroupOptions: FilterOption[] = [
  { id: 'newborn', labelEn: 'Newborn (0-1)', labelRu: '0-1 год', icon: '👶' },
  { id: 'toddler', labelEn: 'Toddler (1-3)', labelRu: '1-3 года', icon: '🧒' },
  { id: 'preschool', labelEn: 'Preschool (3-6)', labelRu: '3-6 лет', icon: '👧' },
  { id: 'school', labelEn: 'School age (6+)', labelRu: 'Школьники', icon: '🎒' },
];

// ====== LANGUAGES ======
export const babysitterLanguageOptions: FilterOption[] = [
  { id: 'russian', labelEn: 'Russian', labelRu: 'Русский', icon: '🇷🇺' },
  { id: 'english', labelEn: 'English', labelRu: 'Английский', icon: '🇬🇧' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайский', icon: '🇹🇭' },
  { id: 'other', labelEn: 'Other', labelRu: 'Другой', icon: '🌐' },
];

// ====== CERTIFICATIONS ======
export const babysitterCertOptions: FilterOption[] = [
  { id: 'first-aid', labelEn: 'First Aid', labelRu: 'Первая помощь', icon: '🩹' },
  { id: 'cpr', labelEn: 'CPR Certified', labelRu: 'СЛР', icon: '❤️' },
  { id: 'pedagogy', labelEn: 'Pedagogy Degree', labelRu: 'Педобразование', icon: '🎓' },
  { id: 'nurse', labelEn: 'Nursing', labelRu: 'Медсестра', icon: '👩‍⚕️' },
];

// ====== FEATURES ======
export const babysitterFeatureOptions: FilterOption[] = [
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✅' },
  { id: 'overnight', labelEn: 'Overnight', labelRu: 'На ночь', icon: '🌙' },
  { id: 'driving', labelEn: 'Can Drive', labelRu: 'Водит авто', icon: '🚗' },
  { id: 'cooking', labelEn: 'Cooking', labelRu: 'Готовит', icon: '🍳' },
  { id: 'homework', labelEn: 'Homework Help', labelRu: 'Уроки', icon: '📚' },
  { id: 'activities', labelEn: 'Activities', labelRu: 'Занятия', icon: '🎨' },
];

// ====== COMPLETE BABYSITTER FILTER CONFIG ======
export const babysitterFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'ageGroup',
      titleEn: 'Child Age',
      titleRu: 'Возраст ребёнка',
      type: 'multi',
      options: babysitterAgeGroupOptions,
    },
    {
      id: 'languages',
      titleEn: 'Languages',
      titleRu: 'Языки',
      type: 'multi',
      options: babysitterLanguageOptions,
    },
    {
      id: 'certifications',
      titleEn: 'Certifications',
      titleRu: 'Сертификаты',
      type: 'multi',
      options: babysitterCertOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: babysitterFeatureOptions,
    },
  ],
};
