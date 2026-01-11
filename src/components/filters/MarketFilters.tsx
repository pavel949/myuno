import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== STORE CATEGORIES ======
export const storeCategoryOptions: FilterOption[] = [
  { id: 'grocery', labelEn: 'Grocery', labelRu: 'Продукты', icon: '🛒' },
  { id: 'organic', labelEn: 'Organic', labelRu: 'Органика', icon: '🌿' },
  { id: 'asian', labelEn: 'Asian Products', labelRu: 'Азиатские продукты', icon: '🍜' },
  { id: 'european', labelEn: 'European Products', labelRu: 'Европейские продукты', icon: '🧀' },
  { id: 'russian', labelEn: 'Russian Products', labelRu: 'Русские продукты', icon: '🇷🇺' },
  { id: 'alcohol', labelEn: 'Alcohol', labelRu: 'Алкоголь', icon: '🍷' },
  { id: 'frozen', labelEn: 'Frozen Foods', labelRu: 'Заморозка', icon: '🧊' },
  { id: 'bakery', labelEn: 'Bakery', labelRu: 'Выпечка', icon: '🥐' },
];

// ====== DELIVERY OPTIONS ======
export const marketDeliveryOptions: FilterOption[] = [
  { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🆓' },
  { id: 'express', labelEn: 'Express (1h)', labelRu: 'Экспресс (1ч)', icon: '⚡' },
  { id: 'same-day', labelEn: 'Same Day', labelRu: 'В тот же день', icon: '📅' },
  { id: 'scheduled', labelEn: 'Scheduled', labelRu: 'По расписанию', icon: '🗓️' },
  { id: 'no-minimum', labelEn: 'No Minimum Order', labelRu: 'Без минимума', icon: '✅' },
];

// ====== STORE FEATURES ======
export const storeFeatureOptions: FilterOption[] = [
  { id: 'open-late', labelEn: 'Open Late', labelRu: 'Работает допоздна', icon: '🌙' },
  { id: 'open-early', labelEn: 'Open Early', labelRu: 'Открыт рано', icon: '🌅' },
  { id: '24h', labelEn: '24 Hours', labelRu: 'Круглосуточно', icon: '🕐' },
  { id: 'self-pickup', labelEn: 'Self Pickup', labelRu: 'Самовывоз', icon: '🏃' },
  { id: 'loyalty', labelEn: 'Loyalty Program', labelRu: 'Программа лояльности', icon: '⭐' },
  { id: 'cashback', labelEn: 'Cashback', labelRu: 'Кешбэк', icon: '💰' },
];

// ====== COMPLETE MARKET FILTER CONFIG ======
export const marketFilterConfig: FilterConfig = {
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
      titleEn: 'Store Type',
      titleRu: 'Тип магазина',
      type: 'multi',
      options: storeCategoryOptions,
    },
    {
      id: 'delivery',
      titleEn: 'Delivery',
      titleRu: 'Доставка',
      type: 'multi',
      options: marketDeliveryOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: storeFeatureOptions,
    },
  ],
};
