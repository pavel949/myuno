import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== CLEANING SERVICE TYPES ======
export const cleaningTypeOptions: FilterOption[] = [
  { id: 'home', labelEn: 'Home Cleaning', labelRu: 'Уборка дома', icon: '🏠' },
  { id: 'office', labelEn: 'Office', labelRu: 'Офис', icon: '🏢' },
  { id: 'deep', labelEn: 'Deep Cleaning', labelRu: 'Генеральная', icon: '✨' },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная', icon: '👔' },
  { id: 'dry-clean', labelEn: 'Dry Cleaning', labelRu: 'Химчистка', icon: '🧥' },
  { id: 'move', labelEn: 'Move-in/out', labelRu: 'При переезде', icon: '📦' },
];

// ====== CLEANING FEATURES ======
export const cleaningFeatureOptions: FilterOption[] = [
  { id: 'eco', labelEn: 'Eco Products', labelRu: 'Эко средства', icon: '🌿' },
  { id: 'express', labelEn: 'Express Service', labelRu: 'Срочно', icon: '⚡' },
  { id: 'regular', labelEn: 'Regular Schedule', labelRu: 'Регулярно', icon: '📅' },
  { id: 'weekend', labelEn: 'Weekend Available', labelRu: 'Выходные', icon: '🗓️' },
  { id: 'equipment', labelEn: 'Own Equipment', labelRu: 'Своё оборудование', icon: '🧹' },
  { id: 'verified', labelEn: 'Verified Staff', labelRu: 'Проверенные', icon: '✅' },
];

// ====== FREQUENCY OPTIONS ======
export const cleaningFrequencyOptions: FilterOption[] = [
  { id: 'one-time', labelEn: 'One-time', labelRu: 'Разово', icon: '1️⃣' },
  { id: 'weekly', labelEn: 'Weekly', labelRu: 'Еженедельно', icon: '🔄' },
  { id: 'biweekly', labelEn: 'Bi-weekly', labelRu: 'Раз в 2 недели', icon: '📆' },
  { id: 'monthly', labelEn: 'Monthly', labelRu: 'Ежемесячно', icon: '📅' },
];

// ====== COMPLETE CLEANING FILTER CONFIG ======
export const cleaningFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'serviceType',
      titleEn: 'Service Type',
      titleRu: 'Тип услуги',
      type: 'multi',
      options: cleaningTypeOptions,
    },
    {
      id: 'frequency',
      titleEn: 'Frequency',
      titleRu: 'Периодичность',
      type: 'single',
      options: cleaningFrequencyOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: cleaningFeatureOptions,
    },
  ],
};
