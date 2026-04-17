/**
 * Single registry for listing amenities, highlights, unit equipment keys, and project facilities.
 * Canonical IDs use snake_case. Use normalize* helpers on all read paths for legacy hyphen / alias keys.
 */

export type AttributeScope =
  | 'listing_amenity'
  | 'highlight'
  | 'unit_equipment'
  | 'project_facility';

/** Hyphen-form legacy listing amenity id → canonical snake_case */
const LEGACY_HYPHEN_LISTING: Record<string, string> = {
  'sea-view': 'sea_view',
  'ocean-view': 'ocean_view',
  'mountain-view': 'mountain_view',
  'pool-view': 'pool_view',
  'garden-view': 'garden_view',
  'beach-access': 'beach_access',
  'city-center': 'city_center',
  'quiet-area': 'quiet_area',
  'smart-home': 'smart_home',
  'security-24h': 'security_24h',
  'pet-friendly': 'pet_friendly',
  'kids-pool': 'kids_pool',
  'high-chair': 'high_chair',
  'air-conditioning': 'air_conditioning',
};

/**
 * Extra alias → canonical (listing amenities)
 * Covers legacy AMENITY_ALIASES + human-readable variants
 */
export const LISTING_AMENITY_ALIAS_TO_CANONICAL: Record<string, string> = {
  ...LEGACY_HYPHEN_LISTING,

  ac: 'air_conditioning',
  air_conditioning: 'air_conditioning',
  aircon: 'air_conditioning',
  'a/c': 'air_conditioning',
  'Air Conditioning': 'air_conditioning',
  AC: 'air_conditioning',

  sea_view: 'sea_view',
  seaview: 'sea_view',
  'Sea View': 'sea_view',

  ocean_view: 'ocean_view',
  oceanview: 'ocean_view',
  'Ocean View': 'ocean_view',

  mountain_view: 'mountain_view',
  'Mountain View': 'mountain_view',

  pool_view: 'pool_view',
  'Pool View': 'pool_view',

  garden_view: 'garden_view',
  'Garden View': 'garden_view',

  pets: 'pet_friendly',
  pets_allowed: 'pet_friendly',
  'Pets Allowed': 'pet_friendly',

  beach: 'beach_access',
  beach_access: 'beach_access',
  'Beach Access': 'beach_access',

  security: 'security_24h',
  '24h_security': 'security_24h',
  '24/7 Security': 'security_24h',

  'Pool': 'pool',
  'WiFi': 'wifi',
  'Wifi': 'wifi',
  WIFI: 'wifi',
  'Gym': 'gym',
  'Parking': 'parking',
  'Kitchen': 'kitchen',
  'Balcony': 'balcony',
  'Garden': 'garden',
  'Sauna': 'sauna',
  'Jacuzzi': 'jacuzzi',
  'Washer': 'washer',
  'Dryer': 'dryer',
  'Smart Home': 'smart_home',
  smart_home: 'smart_home',
  'Bathtub': 'bathtub',
  'Terrace': 'terrace',
  'BBQ': 'bbq',
  bbq_area: 'bbq',
  'Rooftop': 'rooftop',
  'CCTV': 'cctv',
  'Safe': 'safe',
  safe_box: 'safe',
  'Kids Pool': 'kids_pool',
  kids_pool: 'kids_pool',
  'Playground': 'playground',
  'Crib': 'crib',
  'High Chair': 'high_chair',
  high_chair: 'high_chair',

  'Fully Furnished': 'furnished',
  fully_furnished: 'furnished',

  'Beachfront': 'beachfront',
  'City Center': 'city_center',
  city_center: 'city_center',
  'Quiet Area': 'quiet_area',
  quiet_area: 'quiet_area',

  'Gated Community': 'gated',
  gated_community: 'gated',
};

/**
 * Grouped listing amenities (filters, fallback labels). Single source for ALL_AMENITIES in propertyTaxonomy.
 */
export const LISTING_AMENITY_UI_GROUPS = {
  essentials: [
    { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: '📶' },
    { id: 'air_conditioning', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
    { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: '🏊' },
    { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: '🅿️' },
    { id: 'kitchen', labelEn: 'Full Kitchen', labelRu: 'Полная кухня', icon: '🍳' },
  ],
  views: [
    { id: 'sea_view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊' },
    { id: 'ocean_view', labelEn: 'Ocean View', labelRu: 'Вид на океан', icon: '🌅' },
    { id: 'mountain_view', labelEn: 'Mountain View', labelRu: 'Вид на горы', icon: '⛰️' },
    { id: 'pool_view', labelEn: 'Pool View', labelRu: 'Вид на бассейн', icon: '🏊' },
    { id: 'garden_view', labelEn: 'Garden View', labelRu: 'Вид на сад', icon: '🌳' },
  ],
  location: [
    { id: 'beachfront', labelEn: 'Beachfront', labelRu: 'На пляже', icon: '🏖️' },
    { id: 'beach_access', labelEn: 'Beach Access', labelRu: 'Доступ к пляжу', icon: '🌴' },
    { id: 'city_center', labelEn: 'City Center', labelRu: 'Центр города', icon: '🏙️' },
    { id: 'quiet_area', labelEn: 'Quiet Area', labelRu: 'Тихий район', icon: '🌿' },
  ],
  comfort: [
    { id: 'furnished', labelEn: 'Fully Furnished', labelRu: 'С мебелью', icon: '🛋️' },
    { id: 'washer', labelEn: 'Washer', labelRu: 'Стиральная машина', icon: '🧺' },
    { id: 'dryer', labelEn: 'Dryer', labelRu: 'Сушилка', icon: '🌀' },
    { id: 'smart_home', labelEn: 'Smart Home', labelRu: 'Умный дом', icon: '🏠' },
    { id: 'bathtub', labelEn: 'Bathtub', labelRu: 'Ванна', icon: '🛁' },
    { id: 'balcony', labelEn: 'Balcony', labelRu: 'Балкон', icon: '🌅' },
    { id: 'terrace', labelEn: 'Terrace', labelRu: 'Терраса', icon: '🏡' },
  ],
  recreation: [
    { id: 'gym', labelEn: 'Gym', labelRu: 'Тренажёрный зал', icon: '🏋️' },
    { id: 'jacuzzi', labelEn: 'Jacuzzi', labelRu: 'Джакузи', icon: '🛁' },
    { id: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна', icon: '🧖' },
    { id: 'garden', labelEn: 'Garden', labelRu: 'Сад', icon: '🌳' },
    { id: 'rooftop', labelEn: 'Rooftop', labelRu: 'Терраса на крыше', icon: '🌅' },
    { id: 'bbq', labelEn: 'BBQ Area', labelRu: 'Зона барбекю', icon: '🍖' },
  ],
  security: [
    { id: 'security_24h', labelEn: '24h Security', labelRu: 'Охрана 24ч', icon: '🔒' },
    { id: 'cctv', labelEn: 'CCTV', labelRu: 'Видеонаблюдение', icon: '📹' },
    { id: 'gated', labelEn: 'Gated Community', labelRu: 'Закрытый посёлок', icon: '🚧' },
    { id: 'safe', labelEn: 'Safe Box', labelRu: 'Сейф', icon: '🔐' },
  ],
  family: [
    { id: 'pet_friendly', labelEn: 'Pet Friendly', labelRu: 'Можно с питомцами', icon: '🐕' },
    { id: 'kids_pool', labelEn: 'Kids Pool', labelRu: 'Детский бассейн', icon: '👶' },
    { id: 'playground', labelEn: 'Playground', labelRu: 'Детская площадка', icon: '🎠' },
    { id: 'crib', labelEn: 'Crib', labelRu: 'Детская кроватка', icon: '🛏️' },
    { id: 'high_chair', labelEn: 'High Chair', labelRu: 'Детский стульчик', icon: '🪑' },
  ],
} as const;

export const ALL_LISTING_AMENITY_UI_ITEMS = [
  ...LISTING_AMENITY_UI_GROUPS.essentials,
  ...LISTING_AMENITY_UI_GROUPS.views,
  ...LISTING_AMENITY_UI_GROUPS.location,
  ...LISTING_AMENITY_UI_GROUPS.comfort,
  ...LISTING_AMENITY_UI_GROUPS.recreation,
  ...LISTING_AMENITY_UI_GROUPS.security,
  ...LISTING_AMENITY_UI_GROUPS.family,
] as const;

const LISTING_AMENITY_CANONICAL = new Set<string>(
  ALL_LISTING_AMENITY_UI_ITEMS.map((a) => a.id),
);

/** Card / catalog highlights (property_highlight) — labels + icons */
export const HIGHLIGHT_UI_ITEMS = [
  { id: 'beach_close', labelEn: 'Near Beach', labelRu: 'У пляжа', icon: '🏖️', category: 'location' },
  { id: 'beachfront', labelEn: 'Beachfront', labelRu: 'На пляже', icon: '🌊', category: 'location' },
  { id: 'city_center', labelEn: 'City Center', labelRu: 'Центр города', icon: '🏙️', category: 'location' },
  { id: 'sea_view', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊', category: 'view' },
  { id: 'ocean_view', labelEn: 'Ocean View', labelRu: 'Вид на океан', icon: '🌅', category: 'view' },
  { id: 'amazing_view', labelEn: 'Amazing View', labelRu: 'Отличный вид', icon: '👀', category: 'view' },
  { id: 'private_pool', labelEn: 'Private Pool', labelRu: 'Частный бассейн', icon: '🏊', category: 'amenity' },
  { id: 'infinity_pool', labelEn: 'Infinity Pool', labelRu: 'Инфинити бассейн', icon: '♾️', category: 'amenity' },
  { id: 'fast_wifi', labelEn: 'Fast WiFi', labelRu: 'Быстрый WiFi', icon: '📶', category: 'amenity' },
  { id: 'luxury', labelEn: 'Luxury', labelRu: 'Люкс', icon: '✨', category: 'amenity' },
  { id: 'superhost', labelEn: 'Superhost', labelRu: 'Суперхост', icon: '🏆', category: 'trust' },
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверено', icon: '✅', category: 'trust' },
  { id: 'instant_book', labelEn: 'Instant Book', labelRu: 'Мгновенное бронирование', icon: '⚡', category: 'trust' },
] as const;

/** property_highlight ids + legacy hyphen keys */
export const HIGHLIGHT_ALIAS_TO_CANONICAL: Record<string, string> = {
  beach_close: 'beach_close',
  beachfront: 'beachfront',
  sea_view: 'sea_view',
  'sea-view': 'sea_view',
  ocean_view: 'ocean_view',
  'ocean-view': 'ocean_view',
  amazing_view: 'amazing_view',
  private_pool: 'private_pool',
  infinity_pool: 'infinity_pool',
  fast_wifi: 'fast_wifi',
  luxury: 'luxury',
  superhost: 'superhost',
  verified: 'verified',
  instant_book: 'instant_book',
  city_center: 'city_center',
  'city-center': 'city_center',
};

/** project_facility keys (ProjectInfoCard / projects.amenities) */
export const PROJECT_FACILITY_LABELS: Record<string, { en: string; ru: string }> = {
  pool: { en: 'Pool', ru: 'Бассейн' },
  gym: { en: 'Gym', ru: 'Спортзал' },
  security: { en: '24h Security', ru: 'Охрана 24ч' },
  parking: { en: 'Parking', ru: 'Парковка' },
  garden: { en: 'Garden', ru: 'Сад' },
  playground: { en: 'Playground', ru: 'Детская площадка' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  spa: { en: 'Spa', ru: 'Спа' },
  tennis: { en: 'Tennis Court', ru: 'Теннисный корт' },
  beach_access: { en: 'Beach Access', ru: 'Доступ к пляжу' },
  concierge: { en: 'Concierge', ru: 'Консьерж' },
  shuttle: { en: 'Shuttle Service', ru: 'Трансфер' },
};

export function normalizeListingAmenityId(raw: string): string {
  if (!raw?.trim()) return '';
  const t = raw.trim();
  const lower = t.toLowerCase();
  const direct =
    LISTING_AMENITY_ALIAS_TO_CANONICAL[t] ||
    LISTING_AMENITY_ALIAS_TO_CANONICAL[lower] ||
    LISTING_AMENITY_ALIAS_TO_CANONICAL[t.replace(/-/g, '_')] ||
    LISTING_AMENITY_ALIAS_TO_CANONICAL[lower.replace(/-/g, '_')];
  if (direct) return direct;
  const snake = lower.replace(/-/g, '_').replace(/\s+/g, '_');
  if (LISTING_AMENITY_CANONICAL.has(snake)) return snake;
  return snake;
}

export function normalizeHighlightId(raw: string): string {
  if (!raw?.trim()) return '';
  const t = raw.trim();
  const snake = t.toLowerCase().replace(/-/g, '_');
  return HIGHLIGHT_ALIAS_TO_CANONICAL[t] || HIGHLIGHT_ALIAS_TO_CANONICAL[snake] || snake;
}

export function normalizeEquipmentId(raw: string): string {
  if (!raw?.trim()) return '';
  return raw.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
}

export function normalizeProjectFacilityId(raw: string): string {
  return normalizeEquipmentId(raw);
}

/** Batch normalize for project / complex amenity arrays (hyphen→snake only; no listing-only aliases like security→security_24h). */
export function normalizeProjectFacilityIds(ids: string[]): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map(normalizeProjectFacilityId).filter(Boolean))];
}

export function normalizeListingAmenities(ids: string[]): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map(normalizeListingAmenityId).filter(Boolean))];
}

export function normalizeHighlightIds(ids: string[]): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map(normalizeHighlightId).filter(Boolean))];
}

export function normalizeEquipmentIds(ids: string[]): string[] {
  if (!ids?.length) return [];
  return [...new Set(ids.map(normalizeEquipmentId).filter(Boolean))];
}

export function isKnownListingAmenity(id: string): boolean {
  return LISTING_AMENITY_CANONICAL.has(normalizeListingAmenityId(id));
}

export function getProjectFacilityLabel(id: string, lang: 'en' | 'ru'): string {
  const k = normalizeProjectFacilityId(id);
  const row = PROJECT_FACILITY_LABELS[k];
  if (row) return lang === 'ru' ? row.ru : row.en;
  return id;
}

/** Normalize taxonomy arrays on property rows (read path; works before/after DB migration). */
export function normalizePropertyTaxonomyArrays<
  T extends {
    amenities?: string[] | null;
    highlights?: string[] | null;
    equipment?: string[] | null;
  },
>(p: T): T {
  const next = { ...p } as T;
  if (Array.isArray(next.amenities) && next.amenities.length) {
    next.amenities = normalizeListingAmenities(next.amenities);
  }
  if (Array.isArray(next.highlights) && next.highlights.length) {
    next.highlights = normalizeHighlightIds(next.highlights);
  }
  if (Array.isArray(next.equipment) && next.equipment.length) {
    next.equipment = normalizeEquipmentIds(next.equipment);
  }
  return next;
}
