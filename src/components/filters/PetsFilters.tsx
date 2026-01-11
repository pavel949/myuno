import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== PET SERVICE TYPES ======
export const petServiceTypeOptions: FilterOption[] = [
  { id: 'transport', labelEn: 'Transport', labelRu: 'Перевозка', icon: '✈️' },
  { id: 'veterinary', labelEn: 'Veterinary', labelRu: 'Ветеринария', icon: '🏥' },
  { id: 'hotel', labelEn: 'Pet Hotel', labelRu: 'Гостиница', icon: '🏨' },
  { id: 'grooming', labelEn: 'Grooming', labelRu: 'Груминг', icon: '✂️' },
  { id: 'training', labelEn: 'Training', labelRu: 'Дрессировка', icon: '🎓' },
];

// ====== PET SERVICE FEATURES ======
export const petServiceFeatureOptions: FilterOption[] = [
  { id: '24h', labelEn: '24/7 Emergency', labelRu: 'Экстренная 24/7', icon: '🚨' },
  { id: 'certified', labelEn: 'Certified', labelRu: 'Сертифицировано', icon: '✅' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'pickup', labelEn: 'Pickup/Delivery', labelRu: 'Забор/Доставка', icon: '🚗' },
  { id: 'webcam', labelEn: 'Webcam Access', labelRu: 'Веб-камера', icon: '📹' },
  { id: 'organic', labelEn: 'Organic Products', labelRu: 'Органика', icon: '🌿' },
];

// ====== PET TYPES ======
export const petTypeOptions: FilterOption[] = [
  { id: 'dogs', labelEn: 'Dogs', labelRu: 'Собаки', icon: '🐕' },
  { id: 'cats', labelEn: 'Cats', labelRu: 'Кошки', icon: '🐱' },
  { id: 'birds', labelEn: 'Birds', labelRu: 'Птицы', icon: '🦜' },
  { id: 'exotic', labelEn: 'Exotic', labelRu: 'Экзотические', icon: '🦎' },
];

// ====== COMPLETE PETS FILTER CONFIG ======
export const petsFilterConfig: FilterConfig = {
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
      options: petServiceTypeOptions,
    },
    {
      id: 'petType',
      titleEn: 'Pet Type',
      titleRu: 'Тип питомца',
      type: 'multi',
      options: petTypeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: petServiceFeatureOptions,
    },
  ],
};
