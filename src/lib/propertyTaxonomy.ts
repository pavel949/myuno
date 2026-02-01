/**
 * @module PropertyTaxonomy
 * @description Unified taxonomy for property listings - Phuket-specific
 * Single source of truth for all property types, districts, amenities, and booking terms
 */

// ============= PROPERTY TYPES =============
export const PROPERTY_TYPES = [
  { id: 'villa', labelEn: 'Villa', labelRu: 'Вилла', icon: '🏡', popular: true },
  { id: 'condo', labelEn: 'Condo', labelRu: 'Кондо', icon: '🏢', popular: true },
  { id: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира', icon: '🏬', popular: false },
  { id: 'house', labelEn: 'House', labelRu: 'Дом', icon: '🏠', popular: true },
  { id: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус', icon: '🏘️', popular: false },
  { id: 'penthouse', labelEn: 'Penthouse', labelRu: 'Пентхаус', icon: '🌆', popular: false },
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия', icon: '🛏️', popular: true },
  { id: 'bungalow', labelEn: 'Bungalow', labelRu: 'Бунгало', icon: '🌴', popular: false },
] as const;

// ============= PHUKET DISTRICTS =============
export const PHUKET_DISTRICTS = [
  // West Coast - Туристические
  { id: 'patong', labelEn: 'Patong', labelRu: 'Патонг', icon: '🏖️', zone: 'west', popular: true },
  { id: 'kata', labelEn: 'Kata', labelRu: 'Ката', icon: '🌴', zone: 'west', popular: true },
  { id: 'karon', labelEn: 'Karon', labelRu: 'Карон', icon: '🌊', zone: 'west', popular: true },
  { id: 'kamala', labelEn: 'Kamala', labelRu: 'Камала', icon: '🌅', zone: 'west', popular: true },
  { id: 'surin', labelEn: 'Surin', labelRu: 'Сурин', icon: '🏝️', zone: 'west', popular: true },
  { id: 'bang-tao', labelEn: 'Bang Tao', labelRu: 'Банг Тао', icon: '⛱️', zone: 'west', popular: true },
  { id: 'laguna', labelEn: 'Laguna', labelRu: 'Лагуна', icon: '🏌️', zone: 'west', popular: false },
  { id: 'layan', labelEn: 'Layan', labelRu: 'Лаян', icon: '🌿', zone: 'west', popular: false },
  { id: 'naithon', labelEn: 'Nai Thon', labelRu: 'Най Тон', icon: '🐢', zone: 'north', popular: false },
  { id: 'nai-harn', labelEn: 'Nai Harn', labelRu: 'Най Харн', icon: '⛵', zone: 'south', popular: true },
  { id: 'kata-noi', labelEn: 'Kata Noi', labelRu: 'Ката Ной', icon: '🏊', zone: 'west', popular: false },
  // South
  { id: 'rawai', labelEn: 'Rawai', labelRu: 'Равай', icon: '🐚', zone: 'south', popular: true },
  { id: 'chalong', labelEn: 'Chalong', labelRu: 'Чалонг', icon: '⚓', zone: 'south', popular: true },
  { id: 'cape-panwa', labelEn: 'Cape Panwa', labelRu: 'Мыс Панва', icon: '🌊', zone: 'south', popular: false },
  // Central & Town
  { id: 'phuket-town', labelEn: 'Phuket Town', labelRu: 'Пхукет Таун', icon: '🏙️', zone: 'central', popular: true },
  { id: 'kathu', labelEn: 'Kathu', labelRu: 'Кату', icon: '🏠', zone: 'central', popular: false },
  { id: 'cherngtalay', labelEn: 'Cherngtalay', labelRu: 'Чернгталай', icon: '🌳', zone: 'central', popular: false },
  { id: 'thalang', labelEn: 'Thalang', labelRu: 'Таланг', icon: '🏡', zone: 'central', popular: false },
  { id: 'koh-kaew', labelEn: 'Koh Kaew', labelRu: 'Ко Кео', icon: '🏝️', zone: 'central', popular: false },
  // East Coast
  { id: 'ao-po', labelEn: 'Ao Po', labelRu: 'Ао По', icon: '🚤', zone: 'east', popular: false },
  // Airport Area
  { id: 'mai-khao', labelEn: 'Mai Khao', labelRu: 'Май Кхао', icon: '✈️', zone: 'north', popular: false },
  { id: 'nai-yang', labelEn: 'Nai Yang', labelRu: 'Най Янг', icon: '🛫', zone: 'north', popular: false },
] as const;

// ============= BEDROOMS =============
export const BEDROOM_OPTIONS = [
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия', value: 0, icon: '🛏️' },
  { id: '1', labelEn: '1 Bedroom', labelRu: '1 спальня', value: 1, icon: '1️⃣' },
  { id: '2', labelEn: '2 Bedrooms', labelRu: '2 спальни', value: 2, icon: '2️⃣' },
  { id: '3', labelEn: '3 Bedrooms', labelRu: '3 спальни', value: 3, icon: '3️⃣' },
  { id: '4', labelEn: '4 Bedrooms', labelRu: '4 спальни', value: 4, icon: '4️⃣' },
  { id: '5+', labelEn: '5+ Bedrooms', labelRu: '5+ спален', value: 5, icon: '5️⃣' },
] as const;

// ============= LISTING TYPES =============
export const LISTING_TYPES = [
  { id: 'rent', labelEn: 'For Rent', labelRu: 'Аренда', icon: '🔑' },
  { id: 'sale', labelEn: 'For Sale', labelRu: 'Продажа', icon: '🏷️' },
] as const;

// ============= AMENITIES =============
export const PROPERTY_AMENITIES = {
  // Essential - самые популярные
  essentials: [
    { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
    { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
    { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: '🏊' },
    { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
    { id: 'kitchen', labelEn: 'Full Kitchen', labelRu: 'Полная кухня', icon: '🍳' },
  ],
  // Views - важно для Пхукета
  views: [
    { id: 'sea-view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
    { id: 'ocean-view', labelEn: 'Ocean View', labelRu: 'Вид на океан', icon: '🌅' },
    { id: 'mountain-view', labelEn: 'Mountain View', labelRu: 'Вид на горы', icon: '⛰️' },
    { id: 'pool-view', labelEn: 'Pool View', labelRu: 'Вид на бассейн', icon: '🏊' },
    { id: 'garden-view', labelEn: 'Garden View', labelRu: 'Вид на сад', icon: '🌳' },
  ],
  // Location features
  location: [
    { id: 'beachfront', labelEn: 'Beachfront', labelRu: 'На пляже', icon: '🏖️' },
    { id: 'beach-access', labelEn: 'Beach Access', labelRu: 'Доступ к пляжу', icon: '🌴' },
    { id: 'city-center', labelEn: 'City Center', labelRu: 'Центр города', icon: '🏙️' },
    { id: 'quiet-area', labelEn: 'Quiet Area', labelRu: 'Тихий район', icon: '🌿' },
  ],
  // Comfort
  comfort: [
    { id: 'furnished', labelEn: 'Fully Furnished', labelRu: 'С мебелью', icon: '🛋️' },
    { id: 'washer', labelEn: 'Washer', labelRu: 'Стиральная машина', icon: '🧺' },
    { id: 'dryer', labelEn: 'Dryer', labelRu: 'Сушилка', icon: '🌀' },
    { id: 'smart-home', labelEn: 'Smart Home', labelRu: 'Умный дом', icon: '🏠' },
    { id: 'bathtub', labelEn: 'Bathtub', labelRu: 'Ванна', icon: '🛁' },
    { id: 'balcony', labelEn: 'Balcony', labelRu: 'Балкон', icon: '🌅' },
    { id: 'terrace', labelEn: 'Terrace', labelRu: 'Терраса', icon: '🏡' },
  ],
  // Recreation
  recreation: [
    { id: 'gym', labelEn: 'Gym', labelRu: 'Тренажёрный зал', icon: '🏋️' },
    { id: 'jacuzzi', labelEn: 'Jacuzzi', labelRu: 'Джакузи', icon: '🛁' },
    { id: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна', icon: '🧖' },
    { id: 'garden', labelEn: 'Garden', labelRu: 'Сад', icon: '🌳' },
    { id: 'rooftop', labelEn: 'Rooftop', labelRu: 'Терраса на крыше', icon: '🌅' },
    { id: 'bbq', labelEn: 'BBQ Area', labelRu: 'Зона барбекю', icon: '🍖' },
  ],
  // Security
  security: [
    { id: 'security-24h', labelEn: '24h Security', labelRu: 'Охрана 24ч', icon: '🔒' },
    { id: 'cctv', labelEn: 'CCTV', labelRu: 'Видеонаблюдение', icon: '📹' },
    { id: 'gated', labelEn: 'Gated Community', labelRu: 'Закрытый посёлок', icon: '🚧' },
    { id: 'safe', labelEn: 'Safe Box', labelRu: 'Сейф', icon: '🔐' },
  ],
  // Family
  family: [
    { id: 'pet-friendly', labelEn: 'Pet Friendly', labelRu: 'Можно с питомцами', icon: '🐕' },
    { id: 'kids-pool', labelEn: 'Kids Pool', labelRu: 'Детский бассейн', icon: '👶' },
    { id: 'playground', labelEn: 'Playground', labelRu: 'Детская площадка', icon: '🎠' },
    { id: 'crib', labelEn: 'Crib', labelRu: 'Детская кроватка', icon: '🛏️' },
    { id: 'high-chair', labelEn: 'High Chair', labelRu: 'Детский стульчик', icon: '🪑' },
  ],
} as const;

// Flat list of all amenities for filters
export const ALL_AMENITIES = [
  ...PROPERTY_AMENITIES.essentials,
  ...PROPERTY_AMENITIES.views,
  ...PROPERTY_AMENITIES.location,
  ...PROPERTY_AMENITIES.comfort,
  ...PROPERTY_AMENITIES.recreation,
  ...PROPERTY_AMENITIES.security,
  ...PROPERTY_AMENITIES.family,
];

// ============= INCLUDED SERVICES (что входит в стоимость) =============
export const INCLUDED_SERVICES = [
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶', category: 'utilities' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️', category: 'utilities' },
  { id: 'water', labelEn: 'Water', labelRu: 'Вода', icon: '💧', category: 'utilities' },
  { id: 'electricity', labelEn: 'Electricity', labelRu: 'Электричество', icon: '⚡', category: 'utilities' },
  { id: 'gas', labelEn: 'Gas', labelRu: 'Газ', icon: '🔥', category: 'utilities' },
  { id: 'tv', labelEn: 'Cable TV', labelRu: 'Кабельное ТВ', icon: '📺', category: 'entertainment' },
  { id: 'netflix', labelEn: 'Netflix', labelRu: 'Netflix', icon: '🎬', category: 'entertainment' },
  { id: 'pool', labelEn: 'Pool Access', labelRu: 'Бассейн', icon: '🏊', category: 'facilities' },
  { id: 'gym', labelEn: 'Gym Access', labelRu: 'Тренажёрный зал', icon: '🏋️', category: 'facilities' },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️', category: 'facilities' },
  { id: 'security', labelEn: '24/7 Security', labelRu: 'Охрана 24/7', icon: '🛡️', category: 'facilities' },
  { id: 'cleaning_weekly', labelEn: 'Weekly Cleaning', labelRu: 'Уборка еженедельно', icon: '🧹', category: 'cleaning' },
  { id: 'cleaning_biweekly', labelEn: 'Biweekly Cleaning', labelRu: 'Уборка раз в 2 недели', icon: '🧹', category: 'cleaning' },
  { id: 'cleaning_daily', labelEn: 'Daily Cleaning', labelRu: 'Уборка ежедневно', icon: '🧹', category: 'cleaning' },
  { id: 'linen', labelEn: 'Linen Change', labelRu: 'Смена белья', icon: '🛏️', category: 'cleaning' },
] as const;

// ============= EXTRA SERVICES (за дополнительную плату) =============
export const EXTRA_SERVICES = [
  { id: 'extra_cleaning', labelEn: 'Extra Cleaning', labelRu: 'Доп. уборка', icon: '🧹', unit: 'per_visit' },
  { id: 'linen_change', labelEn: 'Linen Change', labelRu: 'Смена белья', icon: '🛏️', unit: 'per_change' },
  { id: 'airport_transfer', labelEn: 'Airport Transfer', labelRu: 'Трансфер аэропорт', icon: '✈️', unit: 'one_way' },
  { id: 'early_checkin', labelEn: 'Early Check-in', labelRu: 'Ранний заезд', icon: '⏰', unit: 'per_booking' },
  { id: 'late_checkout', labelEn: 'Late Check-out', labelRu: 'Поздний выезд', icon: '🌙', unit: 'per_booking' },
  { id: 'pool_heating', labelEn: 'Pool Heating', labelRu: 'Подогрев бассейна', icon: '🔥', unit: 'per_day' },
  { id: 'babysitter', labelEn: 'Babysitter', labelRu: 'Няня', icon: '👶', unit: 'per_hour' },
  { id: 'chef', labelEn: 'Private Chef', labelRu: 'Личный повар', icon: '👨‍🍳', unit: 'per_event' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж', icon: '💆', unit: 'per_session' },
  { id: 'driver', labelEn: 'Personal Driver', labelRu: 'Личный водитель', icon: '🚗', unit: 'per_day' },
  { id: 'tour_guide', labelEn: 'Tour Guide', labelRu: 'Гид', icon: '🗺️', unit: 'per_tour' },
  { id: 'bike_rental', labelEn: 'Motorbike Rental', labelRu: 'Аренда байка', icon: '🏍️', unit: 'per_day' },
  { id: 'car_rental', labelEn: 'Car Rental', labelRu: 'Аренда авто', icon: '🚙', unit: 'per_day' },
  { id: 'laundry', labelEn: 'Laundry Service', labelRu: 'Стирка', icon: '🧺', unit: 'per_load' },
  { id: 'grocery_delivery', labelEn: 'Grocery Delivery', labelRu: 'Доставка продуктов', icon: '🛒', unit: 'per_order' },
] as const;

// ============= PROPERTY HIGHLIGHTS (USP для карточек) =============
export const PROPERTY_HIGHLIGHTS = [
  // Location
  { id: 'beach_close', labelEn: 'Near Beach', labelRu: 'У пляжа', icon: '🏖️', category: 'location' },
  { id: 'beachfront', labelEn: 'Beachfront', labelRu: 'На пляже', icon: '🌊', category: 'location' },
  { id: 'city_center', labelEn: 'City Center', labelRu: 'Центр города', icon: '🏙️', category: 'location' },
  // Views
  { id: 'sea_view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊', category: 'view' },
  { id: 'ocean_view', labelEn: 'Ocean View', labelRu: 'Вид на океан', icon: '🌅', category: 'view' },
  { id: 'amazing_view', labelEn: 'Amazing View', labelRu: 'Отличный вид', icon: '👀', category: 'view' },
  // Amenities
  { id: 'private_pool', labelEn: 'Private Pool', labelRu: 'Частный бассейн', icon: '🏊', category: 'amenity' },
  { id: 'infinity_pool', labelEn: 'Infinity Pool', labelRu: 'Инфинити бассейн', icon: '♾️', category: 'amenity' },
  { id: 'fast_wifi', labelEn: 'Fast WiFi', labelRu: 'Быстрый WiFi', icon: '📶', category: 'amenity' },
  { id: 'luxury', labelEn: 'Luxury', labelRu: 'Люкс', icon: '✨', category: 'amenity' },
  // Trust
  { id: 'superhost', labelEn: 'Superhost', labelRu: 'Суперхост', icon: '🏆', category: 'trust' },
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✅', category: 'trust' },
  { id: 'instant_book', labelEn: 'Instant Book', labelRu: 'Мгновенное бронирование', icon: '⚡', category: 'trust' },
] as const;

// ============= VIEW TYPES =============
export const VIEW_TYPES = [
  { id: 'sea', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
  { id: 'ocean', labelEn: 'Ocean View', labelRu: 'Вид на океан', icon: '🌅' },
  { id: 'pool', labelEn: 'Pool View', labelRu: 'Вид на бассейн', icon: '🏊' },
  { id: 'garden', labelEn: 'Garden View', labelRu: 'Вид на сад', icon: '🌳' },
  { id: 'city', labelEn: 'City View', labelRu: 'Вид на город', icon: '🏙️' },
  { id: 'mountain', labelEn: 'Mountain View', labelRu: 'Вид на горы', icon: '⛰️' },
  { id: 'lagoon', labelEn: 'Lagoon View', labelRu: 'Вид на лагуну', icon: '🌴' },
] as const;

// ============= FURNISHING LEVELS =============
export const FURNISHING_LEVELS = [
  { id: 'unfurnished', labelEn: 'Unfurnished', labelRu: 'Без мебели', icon: '🏠' },
  { id: 'partially', labelEn: 'Partially Furnished', labelRu: 'Частично меблировано', icon: '🪑' },
  { id: 'fully', labelEn: 'Fully Furnished', labelRu: 'Полностью меблировано', icon: '🛋️' },
  { id: 'luxury', labelEn: 'Luxury Furnished', labelRu: 'Люкс меблировка', icon: '✨' },
] as const;

// ============= KEY HANDOVER METHODS =============
export const KEY_HANDOVER_METHODS = [
  { id: 'in_person', labelEn: 'In Person', labelRu: 'Лично', icon: '🤝', description: { en: 'Meet the host or manager', ru: 'Встреча с хозяином или менеджером' } },
  { id: 'lockbox', labelEn: 'Lockbox', labelRu: 'Сейф с кодом', icon: '🔐', description: { en: 'Self check-in with code', ru: 'Самостоятельный заезд по коду' } },
  { id: 'doorman', labelEn: 'Doorman', labelRu: 'Консьерж', icon: '🛎️', description: { en: 'Keys from building staff', ru: 'Ключи у сотрудников здания' } },
  { id: 'smart_lock', labelEn: 'Smart Lock', labelRu: 'Умный замок', icon: '📱', description: { en: 'App or code access', ru: 'Доступ через приложение или код' } },
] as const;

// ============= DEPOSIT TYPES =============
export const DEPOSIT_TYPES = [
  { id: 'fixed', labelEn: 'Fixed Amount', labelRu: 'Фиксированная сумма', icon: '💰' },
  { id: 'percentage', labelEn: 'Percentage', labelRu: 'Процент от стоимости', icon: '📊' },
  { id: 'per_night', labelEn: 'Per Night', labelRu: 'За ночь', icon: '🌙' },
  { id: 'none', labelEn: 'No Deposit', labelRu: 'Без депозита', icon: '✅' },
] as const;

// ============= CLEANING FREQUENCIES =============
export const CLEANING_FREQUENCIES = [
  { id: 'daily', labelEn: 'Daily', labelRu: 'Ежедневно', icon: '🧹' },
  { id: 'every_other_day', labelEn: 'Every Other Day', labelRu: 'Через день', icon: '🧹' },
  { id: 'twice_weekly', labelEn: 'Twice Weekly', labelRu: '2 раза в неделю', icon: '🧹' },
  { id: 'weekly', labelEn: 'Weekly', labelRu: 'Еженедельно', icon: '🧹' },
  { id: 'biweekly', labelEn: 'Biweekly', labelRu: 'Раз в 2 недели', icon: '🧹' },
  { id: 'checkout_only', labelEn: 'At Checkout Only', labelRu: 'Только при выезде', icon: '🧹' },
] as const;

// ============= PAYMENT MODELS =============
export const PAYMENT_MODELS = [
  { 
    id: 'prepay_10', 
    labelEn: '10% Deposit + Balance on Arrival', 
    labelRu: '10% предоплата + остаток при заезде',
    icon: '💳',
    prepayPercent: 10,
    default: true
  },
  { 
    id: 'prepay_50', 
    labelEn: '50% Deposit + Balance on Arrival', 
    labelRu: '50% предоплата + остаток при заезде',
    icon: '💳',
    prepayPercent: 50 
  },
  { 
    id: 'full_prepay', 
    labelEn: 'Full Prepayment', 
    labelRu: 'Полная предоплата',
    icon: '💰',
    prepayPercent: 100 
  },
  { 
    id: 'pay_on_arrival', 
    labelEn: 'Pay on Arrival', 
    labelRu: 'Оплата при заезде',
    icon: '🏠',
    prepayPercent: 0 
  },
] as const;

// ============= HOUSE RULES PRESETS =============
export const HOUSE_RULES_PRESETS = [
  { id: 'no_smoking', labelEn: 'No smoking', labelRu: 'Не курить', icon: '🚭', default: true },
  { id: 'no_parties', labelEn: 'No parties or events', labelRu: 'Без вечеринок', icon: '🎉', default: true },
  { id: 'no_pets', labelEn: 'No pets', labelRu: 'Без питомцев', icon: '🐕', default: false },
  { id: 'quiet_hours', labelEn: 'Quiet hours 22:00-08:00', labelRu: 'Тишина 22:00-08:00', icon: '🤫', default: true },
  { id: 'no_shoes', labelEn: 'No shoes indoors', labelRu: 'Без обуви в помещении', icon: '👟', default: false },
  { id: 'max_guests', labelEn: 'Max guests as booked', labelRu: 'Не больше указанного числа гостей', icon: '👥', default: true },
  { id: 'check_out_clean', labelEn: 'Leave property tidy', labelRu: 'Оставьте чистоту', icon: '🧹', default: true },
  { id: 'trash_rules', labelEn: 'Take out trash before checkout', labelRu: 'Вынести мусор перед выездом', icon: '🗑️', default: false },
] as const;

// ============= NORMALIZATION ALIASES =============
// Map legacy/variant keys to canonical keys

const AMENITY_ALIASES: Record<string, string> = {
  // Air conditioning variants
  'ac': 'air-conditioning',
  'air_conditioning': 'air-conditioning',
  'aircon': 'air-conditioning',
  'a/c': 'air-conditioning',
  'Air Conditioning': 'air-conditioning',
  'AC': 'air-conditioning',
  // View variants
  'sea_view': 'sea-view',
  'seaview': 'sea-view',
  'Sea View': 'sea-view',
  'ocean_view': 'ocean-view',
  'oceanview': 'ocean-view',
  'Ocean View': 'ocean-view',
  'mountain_view': 'mountain-view',
  'Mountain View': 'mountain-view',
  'pool_view': 'pool-view',
  'Pool View': 'pool-view',
  'garden_view': 'garden-view',
  'Garden View': 'garden-view',
  // Pet variants
  'pets': 'pet-friendly',
  'pets_allowed': 'pet-friendly',
  'Pets Allowed': 'pet-friendly',
  // Beach variants
  'beach': 'beach-access',
  'beach_access': 'beach-access',
  'Beach Access': 'beach-access',
  // Security variants
  'security': 'security-24h',
  '24h_security': 'security-24h',
  '24/7 Security': 'security-24h',
  // Other common variants
  'Pool': 'pool',
  'WiFi': 'wifi',
  'Wifi': 'wifi',
  'WIFI': 'wifi',
  'Gym': 'gym',
  'Parking': 'parking',
  'Kitchen': 'kitchen',
  'Balcony': 'balcony',
  'Garden': 'garden',
  'Sauna': 'sauna',
  'Jacuzzi': 'jacuzzi',
  'Washer': 'washer',
  'Dryer': 'dryer',
  'Smart Home': 'smart-home',
  'smart_home': 'smart-home',
  'Bathtub': 'bathtub',
  'Terrace': 'terrace',
  'BBQ': 'bbq',
  'bbq_area': 'bbq',
  'Rooftop': 'rooftop',
  'CCTV': 'cctv',
  'Safe': 'safe',
  'safe_box': 'safe',
  'Kids Pool': 'kids-pool',
  'kids_pool': 'kids-pool',
  'Playground': 'playground',
  'Crib': 'crib',
  'High Chair': 'high-chair',
  'high_chair': 'high-chair',
  // Furnished variants
  'Fully Furnished': 'furnished',
  'fully_furnished': 'furnished',
  // Location variants
  'Beachfront': 'beachfront',
  'City Center': 'city-center',
  'city_center': 'city-center',
  'Quiet Area': 'quiet-area',
  'quiet_area': 'quiet-area',
  // Gated community
  'Gated Community': 'gated',
  'gated_community': 'gated',
};

const DISTRICT_ALIASES: Record<string, string> = {
  // Case normalization
  'Patong': 'patong',
  'PATONG': 'patong',
  'Kata': 'kata',
  'KATA': 'kata',
  'Karon': 'karon',
  'KARON': 'karon',
  'Rawai': 'rawai',
  'RAWAI': 'rawai',
  'Chalong': 'chalong',
  'CHALONG': 'chalong',
  'Kamala': 'kamala',
  'KAMALA': 'kamala',
  'Surin': 'surin',
  'SURIN': 'surin',
  'Bang Tao': 'bang-tao',
  'Bangtao': 'bang-tao',
  'bang_tao': 'bang-tao',
  'Laguna': 'laguna',
  'LAGUNA': 'laguna',
  'Cherngtalay': 'cherngtalay',
  'Cherng Talay': 'cherngtalay',
  'cherng_talay': 'cherngtalay',
  'Phuket Town': 'phuket-town',
  'phuket_town': 'phuket-town',
  'Kathu': 'kathu',
  'KATHU': 'kathu',
  'Nai Harn': 'nai-harn',
  'Naiharn': 'nai-harn',
  'nai_harn': 'nai-harn',
  'Mai Khao': 'mai-khao',
  'Maikhao': 'mai-khao',
  'mai_khao': 'mai-khao',
  'Nai Yang': 'nai-yang',
  'nai_yang': 'nai-yang',
  'Nai Thon': 'naithon',
  'nai_thon': 'naithon',
  'Kata Noi': 'kata-noi',
  'kata_noi': 'kata-noi',
  'Cape Panwa': 'cape-panwa',
  'cape_panwa': 'cape-panwa',
  'Ao Po': 'ao-po',
  'ao_po': 'ao-po',
  'Koh Kaew': 'koh-kaew',
  'koh_kaew': 'koh-kaew',
  'Thalang': 'thalang',
  'THALANG': 'thalang',
  'Layan': 'layan',
  'LAYAN': 'layan',
};

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  'Villa': 'villa',
  'VILLA': 'villa',
  'Condo': 'condo',
  'CONDO': 'condo',
  'condominium': 'condo',
  'Condominium': 'condo',
  'Apartment': 'apartment',
  'APARTMENT': 'apartment',
  'apt': 'apartment',
  'House': 'house',
  'HOUSE': 'house',
  'Townhouse': 'townhouse',
  'TOWNHOUSE': 'townhouse',
  'town_house': 'townhouse',
  'Penthouse': 'penthouse',
  'PENTHOUSE': 'penthouse',
  'Studio': 'studio',
  'STUDIO': 'studio',
  'Bungalow': 'bungalow',
  'BUNGALOW': 'bungalow',
};

// ============= NORMALIZATION FUNCTIONS =============

/**
 * Normalize amenity ID to canonical format
 * @example normalizeAmenityId('ac') => 'air-conditioning'
 * @example normalizeAmenityId('sea_view') => 'sea-view'
 */
export function normalizeAmenityId(id: string): string {
  if (!id) return '';
  const trimmed = id.trim();
  return AMENITY_ALIASES[trimmed] || trimmed.toLowerCase().replace(/_/g, '-');
}

/**
 * Normalize an array of amenity IDs
 */
export function normalizeAmenities(amenities: string[]): string[] {
  if (!amenities || !Array.isArray(amenities)) return [];
  return [...new Set(amenities.map(normalizeAmenityId).filter(Boolean))];
}

/**
 * Normalize district ID to canonical format
 * @example normalizeDistrictId('Patong') => 'patong'
 * @example normalizeDistrictId('Bang Tao') => 'bang-tao'
 */
export function normalizeDistrictId(id: string): string {
  if (!id) return '';
  const trimmed = id.trim();
  return DISTRICT_ALIASES[trimmed] || trimmed.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
}

/**
 * Normalize property type ID
 * @example normalizePropertyType('Villa') => 'villa'
 */
export function normalizePropertyType(type: string): string {
  if (!type) return '';
  const trimmed = type.trim();
  return PROPERTY_TYPE_ALIASES[trimmed] || trimmed.toLowerCase();
}

/**
 * Check if amenity ID is valid (exists in taxonomy)
 */
export function isValidAmenity(id: string): boolean {
  const normalized = normalizeAmenityId(id);
  return ALL_AMENITIES.some(a => a.id === normalized);
}

/**
 * Check if district ID is valid
 */
export function isValidDistrict(id: string): boolean {
  const normalized = normalizeDistrictId(id);
  return PHUKET_DISTRICTS.some(d => d.id === normalized);
}

/**
 * Get amenity details by ID (with normalization)
 */
export function getAmenityById(id: string) {
  const normalized = normalizeAmenityId(id);
  return ALL_AMENITIES.find(a => a.id === normalized);
}

/**
 * Get district details by ID (with normalization)
 */
export function getDistrictById(id: string) {
  const normalized = normalizeDistrictId(id);
  return PHUKET_DISTRICTS.find(d => d.id === normalized);
}

// ============= UTILITY HELPERS =============

export function getPropertyTypeLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const normalized = normalizePropertyType(id);
  const type = PROPERTY_TYPES.find(t => t.id === normalized);
  return type ? (lang === 'ru' ? type.labelRu : type.labelEn) : id;
}

export function getDistrictLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const normalized = normalizeDistrictId(id);
  const district = PHUKET_DISTRICTS.find(d => d.id === normalized);
  return district ? (lang === 'ru' ? district.labelRu : district.labelEn) : id;
}

export function getAmenityLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const normalized = normalizeAmenityId(id);
  const amenity = ALL_AMENITIES.find(a => a.id === normalized);
  return amenity ? (lang === 'ru' ? amenity.labelRu : amenity.labelEn) : id;
}

export function getAmenityIcon(id: string): string {
  const normalized = normalizeAmenityId(id);
  const amenity = ALL_AMENITIES.find(a => a.id === normalized);
  return amenity?.icon || '✓';
}

export function getIncludedServiceLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const service = INCLUDED_SERVICES.find(s => s.id === id);
  return service ? (lang === 'ru' ? service.labelRu : service.labelEn) : id;
}

export function getExtraServiceLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const service = EXTRA_SERVICES.find(s => s.id === id);
  return service ? (lang === 'ru' ? service.labelRu : service.labelEn) : id;
}

export function getHighlightLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const highlight = PROPERTY_HIGHLIGHTS.find(h => h.id === id);
  return highlight ? (lang === 'ru' ? highlight.labelRu : highlight.labelEn) : id;
}

export function getViewTypeLabel(id: string, lang: 'en' | 'ru' = 'en'): string {
  const view = VIEW_TYPES.find(v => v.id === id);
  return view ? (lang === 'ru' ? view.labelRu : view.labelEn) : id;
}

// Popular districts for quick filters
export const POPULAR_DISTRICTS = PHUKET_DISTRICTS.filter(d => d.popular);

// District zones for grouping
export const DISTRICT_ZONES = {
  west: { labelEn: 'West Coast', labelRu: 'Западное побережье' },
  south: { labelEn: 'South', labelRu: 'Юг' },
  central: { labelEn: 'Central', labelRu: 'Центр' },
  north: { labelEn: 'North', labelRu: 'Север' },
  east: { labelEn: 'East Coast', labelRu: 'Восточное побережье' },
} as const;

// Get districts by zone
export function getDistrictsByZone(zone: keyof typeof DISTRICT_ZONES) {
  return PHUKET_DISTRICTS.filter(d => d.zone === zone);
}

// Type exports for TypeScript
export type PropertyType = typeof PROPERTY_TYPES[number]['id'];
export type DistrictId = typeof PHUKET_DISTRICTS[number]['id'];
export type AmenityId = typeof ALL_AMENITIES[number]['id'];
export type IncludedServiceId = typeof INCLUDED_SERVICES[number]['id'];
export type ExtraServiceId = typeof EXTRA_SERVICES[number]['id'];
export type HighlightId = typeof PROPERTY_HIGHLIGHTS[number]['id'];
export type ViewTypeId = typeof VIEW_TYPES[number]['id'];
export type FurnishingLevel = typeof FURNISHING_LEVELS[number]['id'];
export type KeyHandoverMethod = typeof KEY_HANDOVER_METHODS[number]['id'];
export type DepositType = typeof DEPOSIT_TYPES[number]['id'];
export type CleaningFrequency = typeof CLEANING_FREQUENCIES[number]['id'];
export type PaymentModel = typeof PAYMENT_MODELS[number]['id'];
