/**
 * @module filterRegistry
 * @description Consolidated filter configuration for all verticals.
 * Replaces 20 separate XxxFilters.tsx files with a single registry.
 * All named exports preserved for backward compatibility.
 */

import { FilterConfig, FilterOption } from '@/components/filters/UniversalFilter';

// Re-export dynamic filter hooks
export { usePropertyFilterOptions, useTransportFilterOptions, useHomeServiceFilterOptions } from '@/hooks/useDynamicFilterOptions';


// ═══════════════ PropertyFilters ═══════════════
// Property filters are fully database-driven via usePropertyFilterOptions hook.
// No static config needed — use the hook directly.

// ═══════════════ RestaurantFilters ═══════════════
// Restaurant-specific filter configuration


// ====== CUISINE OPTIONS ======
export const cuisineOptions: FilterOption[] = [
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🥢' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
  { id: 'american', labelEn: 'American', labelRu: 'Американская', icon: '🍔' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
  { id: 'chinese', labelEn: 'Chinese', labelRu: 'Китайская', icon: '🥡' },
  { id: 'french', labelEn: 'French', labelRu: 'Французская', icon: '🥐' },
  { id: 'mexican', labelEn: 'Mexican', labelRu: 'Мексиканская', icon: '🌮' },
  { id: 'mediterranean', labelEn: 'Mediterranean', labelRu: 'Средиземноморская', icon: '🫒' },
  { id: 'korean', labelEn: 'Korean', labelRu: 'Корейская', icon: '🍜' },
];

// ====== RESTAURANT FEATURES ======
export const featureOptions: FilterOption[] = [
  { id: 'sea_view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
  { id: 'terrace', labelEn: 'Terrace', labelRu: 'Терраса', icon: '☀️' },
  { id: 'rooftop', labelEn: 'Rooftop', labelRu: 'Крыша', icon: '🏙️' },
  { id: 'live_music', labelEn: 'Live Music', labelRu: 'Живая музыка', icon: '🎵' },
  { id: 'private_room', labelEn: 'Private Room', labelRu: 'Отдельный зал', icon: '🚪' },
  { id: 'kids_friendly', labelEn: 'Kids Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'pet_friendly', labelEn: 'Pet Friendly', labelRu: 'С питомцами', icon: '🐕' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'wifi', labelEn: 'Free WiFi', labelRu: 'Бесплатный WiFi', icon: '📶' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
];

// ====== OCCASIONS ======
export const occasionOptions: FilterOption[] = [
  { id: 'romantic', labelEn: 'Romantic Dinner', labelRu: 'Романтический ужин', icon: '💕' },
  { id: 'birthday', labelEn: 'Birthday', labelRu: 'День Рождения', icon: '🎂' },
  { id: 'business', labelEn: 'Business Meeting', labelRu: 'Деловая встреча', icon: '💼' },
  { id: 'family', labelEn: 'Family Gathering', labelRu: 'Семейный обед', icon: '👨‍👩‍👧‍👦' },
  { id: 'group', labelEn: 'Large Group', labelRu: 'Большая компания', icon: '👥' },
  { id: 'date', labelEn: 'First Date', labelRu: 'Первое свидание', icon: '❤️' },
  { id: 'celebration', labelEn: 'Celebration', labelRu: 'Праздник', icon: '🎉' },
];

// ====== DIETARY OPTIONS ======
export const dietaryOptions: FilterOption[] = [
  { id: 'vegetarian', labelEn: 'Vegetarian', labelRu: 'Вегетарианское', icon: '🥗' },
  { id: 'vegan', labelEn: 'Vegan', labelRu: 'Веганское', icon: '🌱' },
  { id: 'halal', labelEn: 'Halal', labelRu: 'Халяль', icon: '☪️' },
  { id: 'gluten_free', labelEn: 'Gluten Free', labelRu: 'Без глютена', icon: '🌾' },
  { id: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты', icon: '🦐' },
];

// ====== DELIVERY SPECIFIC ======
export const deliveryOptions: FilterOption[] = [
  { id: 'free_delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🆓' },
  { id: 'fast_delivery', labelEn: 'Fast (< 30 min)', labelRu: 'Быстрая (< 30 мин)', icon: '⚡' },
  { id: 'no_min_order', labelEn: 'No Min Order', labelRu: 'Без мин. заказа', icon: '💰' },
];

// ====== SORT OPTIONS ======
export const sortOptions: FilterOption[] = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые', icon: '⭐' },
  { id: 'rating', labelEn: 'Highest Rating', labelRu: 'По рейтингу', icon: '🏆' },
  { id: 'price_low', labelEn: 'Price: Low to High', labelRu: 'Цена: по возрастанию', icon: '💵' },
  { id: 'price_high', labelEn: 'Price: High to Low', labelRu: 'Цена: по убыванию', icon: '💎' },
  { id: 'distance', labelEn: 'Nearest First', labelRu: 'Ближайшие', icon: '📍' },
  { id: 'delivery_time', labelEn: 'Fastest Delivery', labelRu: 'Быстрая доставка', icon: '🚀' },
];

// ====== FULL RESTAURANT FILTER CONFIG ======
export const restaurantFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      type: 'multi',
      options: cuisineOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: featureOptions,
    },
    {
      id: 'occasion',
      titleEn: 'Good For',
      titleRu: 'Подходит для',
      type: 'multi',
      options: occasionOptions,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary',
      titleRu: 'Диета',
      type: 'multi',
      options: dietaryOptions,
    },
  ],
};

// ====== DELIVERY MODE FILTER CONFIG ======
export const deliveryFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      type: 'multi',
      options: cuisineOptions,
    },
    {
      id: 'delivery',
      titleEn: 'Delivery Options',
      titleRu: 'Опции доставки',
      type: 'multi',
      options: deliveryOptions,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary',
      titleRu: 'Диета',
      type: 'multi',
      options: dietaryOptions,
    },
  ],
};

// ====== RESERVATION MODE FILTER CONFIG ======
export const reservationFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'cuisine',
      titleEn: 'Cuisine',
      titleRu: 'Кухня',
      type: 'multi',
      options: cuisineOptions,
    },
    {
      id: 'features',
      titleEn: 'Restaurant Features',
      titleRu: 'Особенности ресторана',
      type: 'multi',
      options: featureOptions,
    },
    {
      id: 'occasion',
      titleEn: 'Perfect For',
      titleRu: 'Идеально для',
      type: 'multi',
      options: occasionOptions,
    },
    {
      id: 'dietary',
      titleEn: 'Dietary Options',
      titleRu: 'Диетические опции',
      type: 'multi',
      options: dietaryOptions,
    },
  ],
};

// Export filter index

// ═══════════════ BeautyFilters ═══════════════

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

// ═══════════════ YachtsFilters ═══════════════

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

// ═══════════════ FlowersFilters ═══════════════

// ====== FLOWER OCCASIONS ======
export const flowerOccasionOptions: FilterOption[] = [
  { id: 'birthday', labelEn: 'Birthday', labelRu: 'День рождения', icon: '🎂' },
  { id: 'anniversary', labelEn: 'Anniversary', labelRu: 'Годовщина', icon: '💑' },
  { id: 'romantic', labelEn: 'Romantic', labelRu: 'Романтика', icon: '❤️' },
  { id: 'wedding', labelEn: 'Wedding', labelRu: 'Свадьба', icon: '💒' },
  { id: 'sympathy', labelEn: 'Sympathy', labelRu: 'Соболезнование', icon: '🕊️' },
  { id: 'congratulations', labelEn: 'Congratulations', labelRu: 'Поздравления', icon: '🎉' },
  { id: 'thank-you', labelEn: 'Thank You', labelRu: 'Благодарность', icon: '🙏' },
  { id: 'new-baby', labelEn: 'New Baby', labelRu: 'Новорожденный', icon: '👶' },
];

// ====== FLOWER TYPES ======
export const flowerTypeOptions: FilterOption[] = [
  { id: 'roses', labelEn: 'Roses', labelRu: 'Розы', icon: '🌹' },
  { id: 'peonies', labelEn: 'Peonies', labelRu: 'Пионы', icon: '🌸' },
  { id: 'tulips', labelEn: 'Tulips', labelRu: 'Тюльпаны', icon: '🌷' },
  { id: 'orchids', labelEn: 'Orchids', labelRu: 'Орхидеи', icon: '🪻' },
  { id: 'lilies', labelEn: 'Lilies', labelRu: 'Лилии', icon: '🌺' },
  { id: 'sunflowers', labelEn: 'Sunflowers', labelRu: 'Подсолнухи', icon: '🌻' },
  { id: 'mixed', labelEn: 'Mixed', labelRu: 'Микс', icon: '💐' },
  { id: 'exotic', labelEn: 'Exotic', labelRu: 'Экзотика', icon: '🌴' },
];

// ====== FLOWER COLORS ======
export const flowerColorOptions: FilterOption[] = [
  { id: 'red', labelEn: 'Red', labelRu: 'Красный', icon: '🔴' },
  { id: 'pink', labelEn: 'Pink', labelRu: 'Розовый', icon: '🩷' },
  { id: 'white', labelEn: 'White', labelRu: 'Белый', icon: '⚪' },
  { id: 'yellow', labelEn: 'Yellow', labelRu: 'Желтый', icon: '🟡' },
  { id: 'purple', labelEn: 'Purple', labelRu: 'Фиолетовый', icon: '🟣' },
  { id: 'orange', labelEn: 'Orange', labelRu: 'Оранжевый', icon: '🟠' },
  { id: 'multicolor', labelEn: 'Multicolor', labelRu: 'Многоцветный', icon: '🌈' },
];

// ====== FLOWER FEATURES ======
export const flowerFeatureOptions: FilterOption[] = [
  { id: 'gift-box', labelEn: 'Gift Box', labelRu: 'Подарочная коробка', icon: '🎁' },
  { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум', icon: '👑' },
  { id: 'eco-friendly', labelEn: 'Eco Friendly', labelRu: 'Эко', icon: '🌿' },
  { id: 'long-lasting', labelEn: 'Long Lasting', labelRu: 'Долго стоят', icon: '⏳' },
  { id: 'fragrant', labelEn: 'Fragrant', labelRu: 'Ароматные', icon: '🌸' },
  { id: 'with-vase', labelEn: 'With Vase', labelRu: 'С вазой', icon: '🏺' },
];

// ====== DELIVERY OPTIONS ======
export const flowerDeliveryOptions: FilterOption[] = [
  { id: 'express-2h', labelEn: 'Express 2h', labelRu: 'Экспресс 2ч', icon: '⚡' },
  { id: 'same-day', labelEn: 'Same Day', labelRu: 'В тот же день', icon: '📅' },
  { id: 'scheduled', labelEn: 'Scheduled', labelRu: 'По расписанию', icon: '🗓️' },
  { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🆓' },
];

// ====== COMPLETE FLOWER FILTER CONFIG ======
export const flowerFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'occasion',
      titleEn: 'Occasion',
      titleRu: 'Повод',
      type: 'multi',
      options: flowerOccasionOptions,
    },
    {
      id: 'flowerType',
      titleEn: 'Flower Type',
      titleRu: 'Тип цветов',
      type: 'multi',
      options: flowerTypeOptions,
    },
    {
      id: 'color',
      titleEn: 'Color',
      titleRu: 'Цвет',
      type: 'multi',
      options: flowerColorOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: flowerFeatureOptions,
    },
    {
      id: 'delivery',
      titleEn: 'Delivery',
      titleRu: 'Доставка',
      type: 'multi',
      options: flowerDeliveryOptions,
    },
  ],
};

// ═══════════════ ToursFilters ═══════════════

// ====== TOUR TYPES ======
export const tourTypeOptions: FilterOption[] = [
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова', icon: '🏝️' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура', icon: '🛕' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт', icon: '🏄' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🤿' },
  { id: 'city', labelEn: 'City Tour', labelRu: 'Город', icon: '🏙️' },
  { id: 'sunset', labelEn: 'Sunset', labelRu: 'Закат', icon: '🌅' },
];

// ====== DURATION OPTIONS ======
export const tourDurationOptions: FilterOption[] = [
  { id: 'half-day', labelEn: 'Half Day (4-5h)', labelRu: 'Полдня (4-5ч)', icon: '⏰' },
  { id: 'full-day', labelEn: 'Full Day (8-10h)', labelRu: 'Весь день (8-10ч)', icon: '📅' },
  { id: 'multi-day', labelEn: 'Multi-Day', labelRu: 'Несколько дней', icon: '🗓️' },
  { id: 'short', labelEn: 'Short (2-3h)', labelRu: 'Короткий (2-3ч)', icon: '⚡' },
];

// ====== GROUP SIZE ======
export const tourGroupOptions: FilterOption[] = [
  { id: 'private', labelEn: 'Private', labelRu: 'Приватный', icon: '👤' },
  { id: 'small-group', labelEn: 'Small Group (2-8)', labelRu: 'Малая группа (2-8)', icon: '👥' },
  { id: 'large-group', labelEn: 'Large Group (10+)', labelRu: 'Большая группа (10+)', icon: '👨‍👩‍👧‍👦' },
];

// ====== TOUR FEATURES ======
export const tourFeatureOptions: FilterOption[] = [
  { id: 'hotel-pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'meals-included', labelEn: 'Meals Included', labelRu: 'Питание включено', icon: '🍽️' },
  { id: 'english-guide', labelEn: 'English Guide', labelRu: 'Англ. гид', icon: '🇬🇧' },
  { id: 'russian-guide', labelEn: 'Russian Guide', labelRu: 'Русский гид', icon: '🇷🇺' },
  { id: 'photos-included', labelEn: 'Photos Included', labelRu: 'Фото включено', icon: '📸' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'kid-friendly', labelEn: 'Kid Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'wheelchair', labelEn: 'Wheelchair Access', labelRu: 'Для инвалидов', icon: '♿' },
];

// ====== DIFFICULTY ======
export const tourDifficultyOptions: FilterOption[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легкий', icon: '🟢' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средний', icon: '🟡' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложный', icon: '🔴' },
];

// ====== COMPLETE TOUR FILTER CONFIG ======
export const tourFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'tourType',
      titleEn: 'Tour Type',
      titleRu: 'Тип тура',
      type: 'multi',
      options: tourTypeOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: tourDurationOptions,
    },
    {
      id: 'groupSize',
      titleEn: 'Group Size',
      titleRu: 'Размер группы',
      type: 'single',
      options: tourGroupOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: tourFeatureOptions,
    },
    {
      id: 'difficulty',
      titleEn: 'Difficulty',
      titleRu: 'Сложность',
      type: 'single',
      options: tourDifficultyOptions,
    },
  ],
};

// ═══════════════ ExperiencesFilters ═══════════════

// ====== EXPERIENCE TYPE ======
export const experienceTypeOptions: FilterOption[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  { id: 'tour', labelEn: 'Tours', labelRu: 'Туры', icon: '🧭' },
  { id: 'activity', labelEn: 'Activities', labelRu: 'Активности', icon: '🏄' },
];

// ====== CATEGORY OPTIONS (Unified - synced with database) ======
export const experienceCategoryOptions: FilterOption[] = [
  // Tours
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова', icon: '🏝️' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура', icon: '🛕' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт', icon: '🏄' },
  { id: 'city-tour', labelEn: 'City Tour', labelRu: 'Городской тур', icon: '🏛️' },
  { id: 'food-tour', labelEn: 'Food Tour', labelRu: 'Гастротур', icon: '🍜' },
  // Activities
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🤿' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🥽' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣' },
  { id: 'kayaking', labelEn: 'Kayaking', labelRu: 'Каякинг', icon: '🛶' },
  { id: 'parasailing', labelEn: 'Parasailing', labelRu: 'Парасейлинг', icon: '🪂' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл', icon: '🚤' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Серфинг', icon: '🏄‍♂️' },
  { id: 'wakeboarding', labelEn: 'Wakeboarding', labelRu: 'Вейкбординг', icon: '🏂' },
  { id: 'extreme', labelEn: 'Extreme', labelRu: 'Экстрим', icon: '🤸' },
  { id: 'shooting', labelEn: 'Shooting Range', labelRu: 'Тир', icon: '🎯' },
  { id: 'escape-room', labelEn: 'Escape Room', labelRu: 'Квест-комната', icon: '🔐' },
  { id: 'golf', labelEn: 'Golf', labelRu: 'Гольф', icon: '⛳' },
  { id: 'paintball', labelEn: 'Paintball', labelRu: 'Пейнтбол', icon: '🎨' },
  { id: 'martial-arts', labelEn: 'Martial Arts', labelRu: 'Единоборства', icon: '🥊' },
  { id: 'wildlife', labelEn: 'Wildlife', labelRu: 'Животные', icon: '🐘' },
];

// ====== DURATION OPTIONS ======
export const experienceDurationOptions: FilterOption[] = [
  { id: 'short', labelEn: '1-2 hours', labelRu: '1-2 часа', icon: '⚡' },
  { id: 'half-day', labelEn: 'Half Day (3-5h)', labelRu: 'Полдня (3-5ч)', icon: '⏰' },
  { id: 'full-day', labelEn: 'Full Day (6-10h)', labelRu: 'Весь день (6-10ч)', icon: '📅' },
  { id: 'multi-day', labelEn: 'Multi-Day', labelRu: 'Несколько дней', icon: '🗓️' },
];

// ====== DIFFICULTY OPTIONS ======
export const experienceDifficultyOptions: FilterOption[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легкий', icon: '🟢' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средний', icon: '🟡' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложный', icon: '🟠' },
  { id: 'expert', labelEn: 'Expert', labelRu: 'Эксперт', icon: '🔴' },
];

// ====== FEATURES OPTIONS (Combined from Tours + Water) ======
export const experienceFeatureOptions: FilterOption[] = [
  { id: 'hotel-pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'meals-included', labelEn: 'Meals Included', labelRu: 'Питание включено', icon: '🍽️' },
  { id: 'equipment', labelEn: 'Equipment Included', labelRu: 'Снаряжение включено', icon: '🎒' },
  { id: 'certified', labelEn: 'Certified Instructor', labelRu: 'Сертифицированный инструктор', icon: '📜' },
  { id: 'english-guide', labelEn: 'English Guide', labelRu: 'Англ. гид', icon: '🇬🇧' },
  { id: 'russian-guide', labelEn: 'Russian Guide', labelRu: 'Русский гид', icon: '🇷🇺' },
  { id: 'photos-included', labelEn: 'Photos Included', labelRu: 'Фото включено', icon: '📸' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'kid-friendly', labelEn: 'Kid Friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'beginner', labelEn: 'Beginner Friendly', labelRu: 'Для начинающих', icon: '🌱' },
];

// ====== GROUP SIZE OPTIONS ======
export const experienceGroupOptions: FilterOption[] = [
  { id: 'private', labelEn: 'Private', labelRu: 'Приватный', icon: '👤' },
  { id: 'small-group', labelEn: 'Small Group (2-8)', labelRu: 'Малая группа (2-8)', icon: '👥' },
  { id: 'large-group', labelEn: 'Large Group (10+)', labelRu: 'Большая группа (10+)', icon: '👨‍👩‍👧‍👦' },
];

// ====== COMPLETE EXPERIENCE FILTER CONFIG ======
export const experienceFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'experienceType',
      titleEn: 'Type',
      titleRu: 'Тип',
      type: 'single',
      options: experienceTypeOptions,
    },
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'category',
      titleEn: 'Category',
      titleRu: 'Категория',
      type: 'multi',
      options: experienceCategoryOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: experienceDurationOptions,
    },
    {
      id: 'difficulty',
      titleEn: 'Difficulty',
      titleRu: 'Сложность',
      type: 'single',
      options: experienceDifficultyOptions,
    },
    {
      id: 'groupSize',
      titleEn: 'Group Size',
      titleRu: 'Размер группы',
      type: 'single',
      options: experienceGroupOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: experienceFeatureOptions,
    },
  ],
};


// ═══════════════ EventsFilters ═══════════════

// ====== EVENT CATEGORIES (Platform taxonomy) ======
export const eventCategoryOptions: FilterOption[] = [
  { id: 'music_live', labelEn: 'Live Music', labelRu: 'Живая музыка', icon: '🎵' },
  { id: 'dj_party', labelEn: 'DJ Party', labelRu: 'DJ вечеринка', icon: '🎧' },
  { id: 'beach_club', labelEn: 'Beach Club', labelRu: 'Пляжный клуб', icon: '🏖️' },
  { id: 'festival', labelEn: 'Festivals', labelRu: 'Фестивали', icon: '🎪' },
  { id: 'cultural', labelEn: 'Culture & Shows', labelRu: 'Культура и шоу', icon: '🎭' },
  { id: 'sports_fitness', labelEn: 'Sports', labelRu: 'Спорт', icon: '🥊' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь', icon: '🌙' },
  { id: 'food_drink', labelEn: 'Food & Drink', labelRu: 'Еда и напитки', icon: '🍸' },
  { id: 'wellness', labelEn: 'Wellness', labelRu: 'Велнес', icon: '🧘' },
  { id: 'kids_family', labelEn: 'Family', labelRu: 'Для семьи', icon: '👨‍👩‍👧' },
  { id: 'business_networking', labelEn: 'Networking', labelRu: 'Нетворкинг', icon: '🤝' },
  { id: 'community', labelEn: 'Community', labelRu: 'Сообщество', icon: '🌍' },
];

// ====== EVENT FEATURES ======
export const eventFeatureOptions: FilterOption[] = [
  { id: 'hot', labelEn: 'Hot & Trending', labelRu: 'Популярное', icon: '🔥' },
  { id: 'featured', labelEn: 'Featured', labelRu: 'Рекомендуем', icon: '⭐' },
  { id: 'global', labelEn: 'Global Artists', labelRu: 'Мировые звёзды', icon: '🌍' },
  { id: 'recurring', labelEn: 'Weekly Events', labelRu: 'Еженедельные', icon: '🔄' },
  { id: 'last-minute', labelEn: 'Last Tickets!', labelRu: 'Последние билеты!', icon: '⚡' },
  { id: 'free', labelEn: 'Free Entry', labelRu: 'Бесплатный вход', icon: '🆓' },
  { id: 'vip', labelEn: 'VIP Available', labelRu: 'Есть VIP', icon: '👑' },
];

// ====== DATE RANGE ======
export const eventDateOptions: FilterOption[] = [
  { id: 'today', labelEn: 'Today', labelRu: 'Сегодня', icon: '📅' },
  { id: 'tomorrow', labelEn: 'Tomorrow', labelRu: 'Завтра', icon: '📆' },
  { id: 'this-week', labelEn: 'This Week', labelRu: 'На этой неделе', icon: '🗓️' },
  { id: 'this-weekend', labelEn: 'This Weekend', labelRu: 'В эти выходные', icon: '🎊' },
  { id: 'this-month', labelEn: 'This Month', labelRu: 'В этом месяце', icon: '📅' },
];

// ====== AGE POLICY ======
export const eventAgePolicyOptions: FilterOption[] = [
  { id: 'all_ages', labelEn: 'All Ages', labelRu: 'Все возрасты', icon: '👶' },
  { id: '18+', labelEn: '18+', labelRu: '18+', icon: '🔞' },
  { id: '20+', labelEn: '20+', labelRu: '20+', icon: '🔞' },
];

// ====== COMPLETE EVENTS FILTER CONFIG ======
export const eventsFilterConfig: FilterConfig = {
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
      titleEn: 'Category',
      titleRu: 'Категория',
      type: 'multi',
      options: eventCategoryOptions,
    },
    {
      id: 'date',
      titleEn: 'Date',
      titleRu: 'Дата',
      type: 'single',
      options: eventDateOptions,
    },
    {
      id: 'agePolicy',
      titleEn: 'Age Policy',
      titleRu: 'Возраст',
      type: 'single',
      options: eventAgePolicyOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: eventFeatureOptions,
    },
  ],
};

// ═══════════════ FitnessFilters ═══════════════

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

// ═══════════════ WaterFilters ═══════════════

// ====== ACTIVITY TYPES ======
export const waterActivityTypeOptions: FilterOption[] = [
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🤿' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🥽' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл', icon: '🚤' },
  { id: 'kayaking', labelEn: 'Kayaking', labelRu: 'Каякинг', icon: '🛶' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Серфинг', icon: '🏄' },
  { id: 'parasailing', labelEn: 'Parasailing', labelRu: 'Парасейлинг', icon: '🪂' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣' },
  { id: 'wakeboarding', labelEn: 'Wakeboarding', labelRu: 'Вейкбординг', icon: '🏂' },
];

// ====== DIFFICULTY ======
export const waterDifficultyOptions: FilterOption[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легкий', icon: '🟢' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средний', icon: '🟡' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложный', icon: '🟠' },
  { id: 'expert', labelEn: 'Expert', labelRu: 'Эксперт', icon: '🔴' },
];

// ====== DURATION ======
export const waterDurationOptions: FilterOption[] = [
  { id: '1h', labelEn: '1 hour', labelRu: '1 час', icon: '⏱️' },
  { id: '2h', labelEn: '2 hours', labelRu: '2 часа', icon: '⏱️' },
  { id: 'half-day', labelEn: 'Half Day', labelRu: 'Полдня', icon: '🌤️' },
  { id: 'full-day', labelEn: 'Full Day', labelRu: 'Весь день', icon: '☀️' },
];

// ====== FEATURES ======
export const waterFeatureOptions: FilterOption[] = [
  { id: 'equipment', labelEn: 'Equipment Included', labelRu: 'Снаряжение включено', icon: '🎒' },
  { id: 'certified', labelEn: 'Certified Instructor', labelRu: 'Сертифицированный инструктор', icon: '📜' },
  { id: 'pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'photos', labelEn: 'Photos Included', labelRu: 'Фото включены', icon: '📸' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'beginner', labelEn: 'Beginner Friendly', labelRu: 'Для начинающих', icon: '👶' },
];

// ====== COMPLETE WATER FILTER CONFIG ======
export const waterFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'activityType',
      titleEn: 'Activity Type',
      titleRu: 'Тип активности',
      type: 'multi',
      options: waterActivityTypeOptions,
    },
    {
      id: 'difficulty',
      titleEn: 'Difficulty',
      titleRu: 'Сложность',
      type: 'single',
      options: waterDifficultyOptions,
    },
    {
      id: 'duration',
      titleEn: 'Duration',
      titleRu: 'Продолжительность',
      type: 'single',
      options: waterDurationOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: waterFeatureOptions,
    },
  ],
};

// ═══════════════ MedicalFilters ═══════════════

// ====== SPECIALTIES ======
export const medicalSpecialtyOptions: FilterOption[] = [
  { id: 'general', labelEn: 'General Practice', labelRu: 'Терапевт', icon: '🏥' },
  { id: 'dentist', labelEn: 'Dentist', labelRu: 'Стоматолог', icon: '🦷' },
  { id: 'dermatology', labelEn: 'Dermatology', labelRu: 'Дерматолог', icon: '🧴' },
  { id: 'pediatrics', labelEn: 'Pediatrics', labelRu: 'Педиатр', icon: '👶' },
  { id: 'orthopedics', labelEn: 'Orthopedics', labelRu: 'Ортопед', icon: '🦴' },
  { id: 'cardiology', labelEn: 'Cardiology', labelRu: 'Кардиолог', icon: '❤️' },
  { id: 'ophthalmology', labelEn: 'Ophthalmology', labelRu: 'Офтальмолог', icon: '👁️' },
  { id: 'gynecology', labelEn: 'Gynecology', labelRu: 'Гинеколог', icon: '👩‍⚕️' },
  { id: 'ent', labelEn: 'ENT', labelRu: 'ЛОР', icon: '👂' },
  { id: 'psychology', labelEn: 'Psychology', labelRu: 'Психолог', icon: '🧠' },
];

// ====== CLINIC FEATURES ======
export const clinicFeatureOptions: FilterOption[] = [
  { id: 'english-speaking', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
  { id: 'russian-speaking', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
  { id: '24-7', labelEn: '24/7 Available', labelRu: 'Круглосуточно', icon: '🕐' },
  { id: 'insurance', labelEn: 'Insurance Accepted', labelRu: 'Принимают страховку', icon: '🛡️' },
  { id: 'lab', labelEn: 'Lab On-Site', labelRu: 'Лаборатория', icon: '🧪' },
  { id: 'pharmacy', labelEn: 'Pharmacy On-Site', labelRu: 'Аптека', icon: '💊' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
  { id: 'home-visit', labelEn: 'Home Visit', labelRu: 'Визит на дом', icon: '🏠' },
];

// ====== CLINIC TYPES ======
export const clinicTypeOptions: FilterOption[] = [
  { id: 'hospital', labelEn: 'Hospital', labelRu: 'Госпиталь', icon: '🏥' },
  { id: 'clinic', labelEn: 'Clinic', labelRu: 'Клиника', icon: '🩺' },
  { id: 'dental', labelEn: 'Dental Clinic', labelRu: 'Стоматология', icon: '🦷' },
  { id: 'diagnostic', labelEn: 'Diagnostic Center', labelRu: 'Диагностика', icon: '🔬' },
  { id: 'wellness', labelEn: 'Wellness Center', labelRu: 'Велнес центр', icon: '🧘' },
];

// ====== AVAILABILITY ======
export const medicalAvailabilityOptions: FilterOption[] = [
  { id: 'today', labelEn: 'Available Today', labelRu: 'Есть запись сегодня', icon: '📅' },
  { id: 'emergency', labelEn: 'Emergency', labelRu: 'Срочный приём', icon: '🚨' },
  { id: 'weekend', labelEn: 'Weekend Hours', labelRu: 'Работает в выходные', icon: '🗓️' },
];

// ====== COMPLETE MEDICAL FILTER CONFIG ======
export const medicalFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'specialty',
      titleEn: 'Specialty',
      titleRu: 'Специализация',
      type: 'multi',
      options: medicalSpecialtyOptions,
    },
    {
      id: 'clinicType',
      titleEn: 'Clinic Type',
      titleRu: 'Тип учреждения',
      type: 'single',
      options: clinicTypeOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: clinicFeatureOptions,
    },
    {
      id: 'availability',
      titleEn: 'Availability',
      titleRu: 'Доступность',
      type: 'multi',
      options: medicalAvailabilityOptions,
    },
  ],
};

// ═══════════════ MarketFilters ═══════════════

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

// ═══════════════ CleaningFilters ═══════════════

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

// ═══════════════ LegalFilters ═══════════════

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

// ═══════════════ PetsFilters ═══════════════

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

// ═══════════════ PharmacyFilters ═══════════════

// ====== PHARMACY CATEGORIES ======
export const pharmacyCategoryOptions: FilterOption[] = [
  { id: 'general', labelEn: 'General', labelRu: 'Общие', icon: '💊' },
  { id: 'prescription', labelEn: 'Prescription', labelRu: 'По рецепту', icon: '📋' },
  { id: 'vitamins', labelEn: 'Vitamins', labelRu: 'Витамины', icon: '🌿' },
  { id: 'skincare', labelEn: 'Skincare', labelRu: 'Уход за кожей', icon: '✨' },
  { id: 'baby', labelEn: 'Baby Care', labelRu: 'Детское', icon: '👶' },
  { id: 'first-aid', labelEn: 'First Aid', labelRu: 'Первая помощь', icon: '🩹' },
];

// ====== PHARMACY FEATURES ======
export const pharmacyFeatureOptions: FilterOption[] = [
  { id: '24h', labelEn: '24/7 Open', labelRu: 'Круглосуточно', icon: '🕐' },
  { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: '🚚' },
  { id: 'pharmacist', labelEn: 'Pharmacist Consult', labelRu: 'Консультация', icon: '👨‍⚕️' },
  { id: 'express', labelEn: 'Express Delivery', labelRu: 'Экспресс', icon: '⚡' },
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✅' },
];

// ====== DISTANCE OPTIONS ======
export const pharmacyDistanceOptions: FilterOption[] = [
  { id: '1km', labelEn: 'Within 1 km', labelRu: 'До 1 км', icon: '📍' },
  { id: '3km', labelEn: 'Within 3 km', labelRu: 'До 3 км', icon: '📍' },
  { id: '5km', labelEn: 'Within 5 km', labelRu: 'До 5 км', icon: '📍' },
  { id: 'any', labelEn: 'Any Distance', labelRu: 'Любое', icon: '🌐' },
];

// ====== COMPLETE PHARMACY FILTER CONFIG ======
export const pharmacyFilterConfig: FilterConfig = {
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
      titleEn: 'Category',
      titleRu: 'Категория',
      type: 'multi',
      options: pharmacyCategoryOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: pharmacyFeatureOptions,
    },
    {
      id: 'distance',
      titleEn: 'Distance',
      titleRu: 'Расстояние',
      type: 'single',
      options: pharmacyDistanceOptions,
    },
  ],
};

// ═══════════════ EducationFilters ═══════════════

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

// ═══════════════ BabysitterFilters ═══════════════

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

// ═══════════════ ServicesFilters ═══════════════
// Services filters are database-driven via useHomeServiceFilterOptions hook.

// Service features - static as they're platform-wide
export const serviceFeatureOptions: FilterOption[] = [
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверенные', icon: '✅' },
  { id: 'insured', labelEn: 'Insured', labelRu: 'Застрахованы', icon: '🛡️' },
  { id: 'guaranteed', labelEn: 'Guaranteed', labelRu: 'Гарантия работ', icon: '💯' },
  { id: 'fast-response', labelEn: 'Fast Response', labelRu: 'Быстрый отклик', icon: '⚡' },
  { id: 'english', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
  { id: 'russian', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
];

// Booking type options - static
export const bookingTypeOptions: FilterOption[] = [
  { id: 'hourly', labelEn: 'Hourly', labelRu: 'Почасовая', icon: '⏰' },
  { id: 'fixed', labelEn: 'Fixed Price', labelRu: 'Фикс цена', icon: '💵' },
  { id: 'subscription', labelEn: 'Subscription', labelRu: 'Подписка', icon: '🔄' },
];

// ═══════════════ TransportFilters ═══════════════
// Transport filters are database-driven via useTransportFilterOptions hook.

// Transfer types - static as they're specific to booking flow
export const transferTypeOptions: FilterOption[] = [
  { id: 'airport', labelEn: 'Airport Transfer', labelRu: 'Трансфер аэропорт', icon: '✈️' },
  { id: 'hotel', labelEn: 'Hotel Transfer', labelRu: 'Трансфер отель', icon: '🏨' },
  { id: 'hourly', labelEn: 'Hourly Rental', labelRu: 'Почасовая аренда', icon: '⏰' },
  { id: 'day-trip', labelEn: 'Day Trip', labelRu: 'На весь день', icon: '📅' },
];

// Passenger options - static as numeric
export const passengerOptions: FilterOption[] = [
  { id: '1-2', labelEn: '1-2 Passengers', labelRu: '1-2 пассажира', icon: '👤' },
  { id: '3-4', labelEn: '3-4 Passengers', labelRu: '3-4 пассажира', icon: '👥' },
  { id: '5-7', labelEn: '5-7 Passengers', labelRu: '5-7 пассажиров', icon: '👨‍👩‍👧' },
  { id: '8+', labelEn: '8+ Passengers', labelRu: '8+ пассажиров', icon: '👨‍👩‍👧‍👦' },
];

// Vehicle features - static fallback
export const vehicleFeatureOptions: FilterOption[] = [
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🔄' },
  { id: 'gps', labelEn: 'GPS Navigation', labelRu: 'GPS навигатор', icon: '📍' },
  { id: 'child-seat', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '👶' },
  { id: 'insurance', labelEn: 'Full Insurance', labelRu: 'Полная страховка', icon: '🛡️' },
  { id: 'driver', labelEn: 'With Driver', labelRu: 'С водителем', icon: '👨‍✈️' },
  { id: 'unlimited-km', labelEn: 'Unlimited KM', labelRu: 'Без лимита км', icon: '∞' },
];
