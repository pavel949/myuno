import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== SERVICE CATEGORIES ======
export const serviceCategoryOptions: FilterOption[] = [
  { id: 'cleaning', labelEn: 'Cleaning', labelRu: 'Уборка', icon: '🧹' },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Стирка', icon: '🧺' },
  { id: 'repair', labelEn: 'Repair', labelRu: 'Ремонт', icon: '🔧' },
  { id: 'plumbing', labelEn: 'Plumbing', labelRu: 'Сантехник', icon: '🚿' },
  { id: 'electrical', labelEn: 'Electrical', labelRu: 'Электрик', icon: '⚡' },
  { id: 'ac-service', labelEn: 'AC Service', labelRu: 'Кондиционеры', icon: '❄️' },
  { id: 'pest-control', labelEn: 'Pest Control', labelRu: 'Дезинсекция', icon: '🐜' },
  { id: 'gardening', labelEn: 'Gardening', labelRu: 'Садовник', icon: '🌿' },
  { id: 'moving', labelEn: 'Moving', labelRu: 'Переезд', icon: '📦' },
  { id: 'handyman', labelEn: 'Handyman', labelRu: 'Мастер на час', icon: '🔨' },
];

// ====== SERVICE FEATURES ======
export const serviceFeatureOptions: FilterOption[] = [
  { id: 'same-day', labelEn: 'Same Day', labelRu: 'В тот же день', icon: '⚡' },
  { id: 'weekend', labelEn: 'Weekend Available', labelRu: 'Работают в выходные', icon: '🗓️' },
  { id: 'english', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
  { id: 'russian', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверенные', icon: '✅' },
  { id: 'insured', labelEn: 'Insured', labelRu: 'Застрахованы', icon: '🛡️' },
  { id: 'eco-friendly', labelEn: 'Eco Friendly', labelRu: 'Эко средства', icon: '🌱' },
  { id: 'guaranteed', labelEn: 'Work Guaranteed', labelRu: 'Гарантия работ', icon: '💯' },
];

// ====== BOOKING TYPE ======
export const bookingTypeOptions: FilterOption[] = [
  { id: 'hourly', labelEn: 'Hourly', labelRu: 'Почасовая', icon: '⏰' },
  { id: 'fixed', labelEn: 'Fixed Price', labelRu: 'Фикс цена', icon: '💵' },
  { id: 'subscription', labelEn: 'Subscription', labelRu: 'Подписка', icon: '🔄' },
];

// ====== COMPLETE SERVICES FILTER CONFIG ======
export const servicesFilterConfig: FilterConfig = {
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
      options: serviceCategoryOptions,
    },
    {
      id: 'bookingType',
      titleEn: 'Pricing',
      titleRu: 'Оплата',
      type: 'single',
      options: bookingTypeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: serviceFeatureOptions,
    },
  ],
};
