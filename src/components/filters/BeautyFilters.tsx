import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== SERVICE TYPES ======
export const beautyServiceOptions: FilterOption[] = [
  { id: 'hair', labelEn: 'Hair', labelRu: 'Волосы', icon: '💇' },
  { id: 'nails', labelEn: 'Nails', labelRu: 'Ногти', icon: '💅' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж', icon: '💆' },
  { id: 'facial', labelEn: 'Facial', labelRu: 'Лицо', icon: '🧖' },
  { id: 'waxing', labelEn: 'Waxing', labelRu: 'Депиляция', icon: '✨' },
  { id: 'makeup', labelEn: 'Makeup', labelRu: 'Макияж', icon: '💄' },
  { id: 'brows-lashes', labelEn: 'Brows & Lashes', labelRu: 'Брови и ресницы', icon: '👁️' },
  { id: 'body-treatments', labelEn: 'Body Treatments', labelRu: 'Уход за телом', icon: '🧴' },
];

// ====== SALON FEATURES ======
export const beautyFeatureOptions: FilterOption[] = [
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'wifi', labelEn: 'Free WiFi', labelRu: 'WiFi', icon: '📶' },
  { id: 'tea-coffee', labelEn: 'Tea/Coffee', labelRu: 'Чай/Кофе', icon: '☕' },
  { id: 'organic', labelEn: 'Organic Products', labelRu: 'Органика', icon: '🌿' },
  { id: 'premium-brands', labelEn: 'Premium Brands', labelRu: 'Премиум бренды', icon: '👑' },
  { id: 'couples', labelEn: 'Couples Room', labelRu: 'Для пар', icon: '💑' },
  { id: 'men-friendly', labelEn: 'Men Friendly', labelRu: 'Для мужчин', icon: '👨' },
];

// ====== AVAILABILITY ======
export const beautyAvailabilityOptions: FilterOption[] = [
  { id: 'available-today', labelEn: 'Available Today', labelRu: 'Свободно сегодня', icon: '📅' },
  { id: 'evening-hours', labelEn: 'Evening Hours', labelRu: 'Вечерние часы', icon: '🌙' },
  { id: 'weekend', labelEn: 'Open Weekends', labelRu: 'Работает в выходные', icon: '🗓️' },
  { id: 'open-now', labelEn: 'Open Now', labelRu: 'Открыто сейчас', icon: '🟢' },
];

// ====== PRICE RANGE ======
export const beautyPriceOptions: FilterOption[] = [
  { id: 'budget', labelEn: 'Budget', labelRu: 'Бюджетно', icon: '💰' },
  { id: 'mid-range', labelEn: 'Mid-Range', labelRu: 'Средний', icon: '💵' },
  { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум', icon: '💎' },
  { id: 'luxury', labelEn: 'Luxury', labelRu: 'Люкс', icon: '👑' },
];

// ====== COMPLETE BEAUTY FILTER CONFIG ======
export const beautyFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'services',
      titleEn: 'Services',
      titleRu: 'Услуги',
      type: 'multi',
      options: beautyServiceOptions,
    },
    {
      id: 'features',
      titleEn: 'Salon Features',
      titleRu: 'Особенности салона',
      type: 'multi',
      options: beautyFeatureOptions,
    },
    {
      id: 'availability',
      titleEn: 'Availability',
      titleRu: 'Доступность',
      type: 'multi',
      options: beautyAvailabilityOptions,
    },
  ],
};
