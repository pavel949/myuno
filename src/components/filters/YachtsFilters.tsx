import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== YACHT TYPES ======
export const yachtTypeOptions: FilterOption[] = [
  { id: 'speedboat', labelEn: 'Speedboat', labelRu: 'Спидбот', icon: '🚤' },
  { id: 'catamaran', labelEn: 'Catamaran', labelRu: 'Катамаран', icon: '⛵' },
  { id: 'sailing', labelEn: 'Sailing Yacht', labelRu: 'Парусная яхта', icon: '🛳️' },
  { id: 'motor', labelEn: 'Motor Yacht', labelRu: 'Моторная яхта', icon: '🛥️' },
  { id: 'luxury', labelEn: 'Luxury Yacht', labelRu: 'Люкс яхта', icon: '💎' },
  { id: 'party', labelEn: 'Party Boat', labelRu: 'Пати бот', icon: '🎉' },
];

// ====== CAPACITY ======
export const yachtCapacityOptions: FilterOption[] = [
  { id: '2-6', labelEn: '2-6 Guests', labelRu: '2-6 гостей', icon: '👥' },
  { id: '7-12', labelEn: '7-12 Guests', labelRu: '7-12 гостей', icon: '👨‍👩‍👧‍👦' },
  { id: '13-20', labelEn: '13-20 Guests', labelRu: '13-20 гостей', icon: '🎭' },
  { id: '20+', labelEn: '20+ Guests', labelRu: '20+ гостей', icon: '🎊' },
];

// ====== TRIP DURATION ======
export const yachtDurationOptions: FilterOption[] = [
  { id: 'half-day', labelEn: 'Half Day (4-5h)', labelRu: 'Полдня (4-5ч)', icon: '⏰' },
  { id: 'full-day', labelEn: 'Full Day (8-10h)', labelRu: 'Весь день (8-10ч)', icon: '📅' },
  { id: 'sunset', labelEn: 'Sunset Cruise', labelRu: 'Закатный круиз', icon: '🌅' },
  { id: 'overnight', labelEn: 'Overnight', labelRu: 'С ночёвкой', icon: '🌙' },
  { id: 'multi-day', labelEn: 'Multi-Day', labelRu: 'Несколько дней', icon: '🗓️' },
];

// ====== AMENITIES ======
export const yachtAmenityOptions: FilterOption[] = [
  { id: 'crew', labelEn: 'With Crew', labelRu: 'С экипажем', icon: '👨‍✈️' },
  { id: 'catering', labelEn: 'Catering', labelRu: 'Кейтеринг', icon: '🍽️' },
  { id: 'snorkeling', labelEn: 'Snorkeling Gear', labelRu: 'Снорклинг', icon: '🤿' },
  { id: 'fishing', labelEn: 'Fishing Equipment', labelRu: 'Рыбалка', icon: '🎣' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл', icon: '🌊' },
  { id: 'paddleboard', labelEn: 'Paddleboard', labelRu: 'SUP доска', icon: '🏄' },
  { id: 'kayak', labelEn: 'Kayak', labelRu: 'Каяк', icon: '🛶' },
  { id: 'sound-system', labelEn: 'Sound System', labelRu: 'Аудиосистема', icon: '🔊' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
];

// ====== DESTINATIONS ======
export const yachtDestinationOptions: FilterOption[] = [
  { id: 'phi-phi', labelEn: 'Phi Phi Islands', labelRu: 'Острова Пхи-Пхи', icon: '🏝️' },
  { id: 'james-bond', labelEn: 'James Bond Island', labelRu: 'Джеймс Бонд', icon: '🎬' },
  { id: 'similan', labelEn: 'Similan Islands', labelRu: 'Симиланы', icon: '🐠' },
  { id: 'racha', labelEn: 'Racha Island', labelRu: 'Рача', icon: '🏖️' },
  { id: 'coral', labelEn: 'Coral Island', labelRu: 'Коралловый остров', icon: '🪸' },
  { id: 'maiton', labelEn: 'Maiton Island', labelRu: 'Майтон', icon: '🐬' },
];

// ====== COMPLETE YACHT FILTER CONFIG ======
export const yachtFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'yachtType',
      titleEn: 'Yacht Type',
      titleRu: 'Тип яхты',
      type: 'multi',
      options: yachtTypeOptions,
    },
    {
      id: 'capacity',
      titleEn: 'Capacity',
      titleRu: 'Вместимость',
      type: 'single',
      options: yachtCapacityOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: yachtDurationOptions,
    },
    {
      id: 'destination',
      titleEn: 'Destination',
      titleRu: 'Направление',
      type: 'multi',
      options: yachtDestinationOptions,
    },
    {
      id: 'amenities',
      titleEn: 'Amenities',
      titleRu: 'Удобства',
      type: 'multi',
      options: yachtAmenityOptions,
    },
  ],
};
