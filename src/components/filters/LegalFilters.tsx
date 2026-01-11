import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== LEGAL SERVICE CATEGORIES ======
export const legalCategoryOptions: FilterOption[] = [
  { id: 'legal', labelEn: 'Legal', labelRu: 'Юридические', icon: '⚖️' },
  { id: 'accounting', labelEn: 'Accounting', labelRu: 'Бухгалтерия', icon: '📊' },
  { id: 'tax', labelEn: 'Tax', labelRu: 'Налоги', icon: '💰' },
  { id: 'visa', labelEn: 'Visa', labelRu: 'Визы', icon: '🛂' },
  { id: 'business', labelEn: 'Business Setup', labelRu: 'Регистрация', icon: '🏢' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страхование', icon: '🛡️' },
  { id: 'hr', labelEn: 'HR', labelRu: 'Кадры', icon: '👥' },
];

// ====== LANGUAGES ======
export const legalLanguageOptions: FilterOption[] = [
  { id: 'english', labelEn: 'English', labelRu: 'Английский', icon: '🇬🇧' },
  { id: 'russian', labelEn: 'Russian', labelRu: 'Русский', icon: '🇷🇺' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайский', icon: '🇹🇭' },
  { id: 'chinese', labelEn: 'Chinese', labelRu: 'Китайский', icon: '🇨🇳' },
];

// ====== FEATURES ======
export const legalFeatureOptions: FilterOption[] = [
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✅' },
  { id: 'online', labelEn: 'Online Consult', labelRu: 'Онлайн', icon: '💻' },
  { id: 'urgent', labelEn: 'Urgent Service', labelRu: 'Срочно', icon: '⚡' },
  { id: 'free-consult', labelEn: 'Free Consultation', labelRu: 'Бесплатная консультация', icon: '🆓' },
  { id: 'experience', labelEn: '10+ Years', labelRu: '10+ лет опыта', icon: '🏆' },
];

// ====== COMPLETE LEGAL FILTER CONFIG ======
export const legalFilterConfig: FilterConfig = {
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
      titleEn: 'Service Type',
      titleRu: 'Тип услуги',
      type: 'multi',
      options: legalCategoryOptions,
    },
    {
      id: 'languages',
      titleEn: 'Languages',
      titleRu: 'Языки',
      type: 'multi',
      options: legalLanguageOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: legalFeatureOptions,
    },
  ],
};
