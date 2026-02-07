/**
 * Experiences Taxonomy - Unified Tours & Water Activities
 * Single source of truth for all experience categories
 */

export type ExperienceCategory = 
  | 'island-hopping'
  | 'snorkeling'
  | 'diving'
  | 'jet-ski'
  | 'kayak'
  | 'fishing'
  | 'sailing'
  | 'sunset-cruise'
  | 'cultural'
  | 'adventure'
  | 'nature'
  | 'food-tour'
  | 'private-charter'
  | 'waterpark'
  | 'karting'
  | 'attraction'
  | 'playground'
  | 'wildlife'
  | 'zipline'
  | 'surfing';

export type DifficultyLevel = 'easy' | 'moderate' | 'challenging';

export interface ExperienceCategoryConfig {
  id: ExperienceCategory;
  labelEn: string;
  labelRu: string;
  icon: string;
  type: 'water' | 'land' | 'both';
  popular?: boolean;
}

export interface DifficultyConfig {
  id: DifficultyLevel;
  labelEn: string;
  labelRu: string;
  icon: string;
  color: string;
}

// ====== EXPERIENCE CATEGORIES ======
export const EXPERIENCE_CATEGORIES: ExperienceCategoryConfig[] = [
  // Water activities
  { id: 'island-hopping', labelEn: 'Island Hopping', labelRu: 'Острова', icon: '🏝️', type: 'water', popular: true },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🤿', type: 'water', popular: true },
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🐠', type: 'water', popular: true },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл', icon: '🚤', type: 'water' },
  { id: 'kayak', labelEn: 'Kayaking', labelRu: 'Каяк', icon: '🛶', type: 'water' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣', type: 'water' },
  { id: 'sailing', labelEn: 'Sailing', labelRu: 'Парус', icon: '⛵', type: 'water' },
  { id: 'sunset-cruise', labelEn: 'Sunset Cruise', labelRu: 'Закат на яхте', icon: '🌅', type: 'water', popular: true },
  { id: 'private-charter', labelEn: 'Private Charter', labelRu: 'Приватный чартер', icon: '🛥️', type: 'water' },
  // Land activities
  { id: 'cultural', labelEn: 'Cultural', labelRu: 'Культура', icon: '🏛️', type: 'land', popular: true },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗', type: 'land' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿', type: 'land' },
  { id: 'food-tour', labelEn: 'Food Tour', labelRu: 'Гастротур', icon: '🍜', type: 'land' },
  // Family & entertainment
  { id: 'waterpark', labelEn: 'Water Park', labelRu: 'Аквапарк', icon: '🏊', type: 'land', popular: true },
  { id: 'karting', labelEn: 'Go-Kart', labelRu: 'Картинг', icon: '🏎️', type: 'land' },
  { id: 'attraction', labelEn: 'Attraction', labelRu: 'Аттракцион', icon: '🎡', type: 'land', popular: true },
  { id: 'playground', labelEn: 'Kids Zone', labelRu: 'Детская зона', icon: '🎪', type: 'land' },
  { id: 'wildlife', labelEn: 'Wildlife', labelRu: 'Животные', icon: '🐘', type: 'land' },
  { id: 'zipline', labelEn: 'Zipline', labelRu: 'Зиплайн', icon: '🪂', type: 'land' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Сёрфинг', icon: '🏄', type: 'water' },
];

// ====== DIFFICULTY LEVELS ======
export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  { id: 'easy', labelEn: 'Easy', labelRu: 'Легко', icon: '🟢', color: 'green' },
  { id: 'moderate', labelEn: 'Moderate', labelRu: 'Средне', icon: '🟡', color: 'yellow' },
  { id: 'challenging', labelEn: 'Challenging', labelRu: 'Сложно', icon: '🔴', color: 'red' },
];

// ====== DURATION PRESETS ======
export const DURATION_OPTIONS = [
  { id: '2h', labelEn: '2 hours', labelRu: '2 часа', hours: 2 },
  { id: '4h', labelEn: 'Half day (4h)', labelRu: 'Полдня (4ч)', hours: 4 },
  { id: '6h', labelEn: '6 hours', labelRu: '6 часов', hours: 6 },
  { id: '8h', labelEn: 'Full day (8h)', labelRu: 'Весь день (8ч)', hours: 8 },
  { id: '12h', labelEn: '12 hours', labelRu: '12 часов', hours: 12 },
  { id: 'multi', labelEn: 'Multi-day', labelRu: 'Несколько дней', hours: 24 },
] as const;

// ====== INCLUDED ITEMS ======
export const EXPERIENCE_INCLUDES = [
  { id: 'pickup', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', icon: '🚐' },
  { id: 'lunch', labelEn: 'Lunch', labelRu: 'Обед', icon: '🍽️' },
  { id: 'snacks', labelEn: 'Snacks & Drinks', labelRu: 'Снеки и напитки', icon: '🥤' },
  { id: 'equipment', labelEn: 'Equipment', labelRu: 'Снаряжение', icon: '🎽' },
  { id: 'guide', labelEn: 'English Guide', labelRu: 'Гид на английском', icon: '🗣️' },
  { id: 'guide_ru', labelEn: 'Russian Guide', labelRu: 'Гид на русском', icon: '🇷🇺' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
  { id: 'photos', labelEn: 'Photos', labelRu: 'Фото', icon: '📸' },
  { id: 'national_park', labelEn: 'Park Fees', labelRu: 'Нац. парк', icon: '🏞️' },
] as const;

// ====== MAPS ======
export const CATEGORY_MAP: Record<string, ExperienceCategoryConfig> = Object.fromEntries(
  EXPERIENCE_CATEGORIES.map(cat => [cat.id, cat])
);

export const DIFFICULTY_MAP: Record<string, DifficultyConfig> = Object.fromEntries(
  DIFFICULTY_LEVELS.map(d => [d.id, d])
);

// ====== HELPER FUNCTIONS ======
export function getCategoryLabel(id: string, language: 'en' | 'ru'): string {
  const cat = CATEGORY_MAP[id];
  if (!cat) return id;
  return language === 'ru' ? cat.labelRu : cat.labelEn;
}

export function getDifficultyLabel(id: string, language: 'en' | 'ru'): string {
  const diff = DIFFICULTY_MAP[id];
  if (!diff) return id;
  return language === 'ru' ? diff.labelRu : diff.labelEn;
}

export function getWaterCategories(): ExperienceCategoryConfig[] {
  return EXPERIENCE_CATEGORIES.filter(c => c.type === 'water' || c.type === 'both');
}

export function getLandCategories(): ExperienceCategoryConfig[] {
  return EXPERIENCE_CATEGORIES.filter(c => c.type === 'land' || c.type === 'both');
}

export function getPopularCategories(): ExperienceCategoryConfig[] {
  return EXPERIENCE_CATEGORIES.filter(c => c.popular);
}

/**
 * Get ribbon categories for MiniAppLayout
 */
export function getRibbonCategories(language: 'en' | 'ru' = 'en') {
  return [
    { id: 'all', label: language === 'ru' ? 'Все' : 'All' },
    ...EXPERIENCE_CATEGORIES.map(cat => ({
      id: cat.id,
      label: language === 'ru' ? cat.labelRu : cat.labelEn,
      icon: cat.icon,
    })),
  ];
}

// Legacy mapping for backward compatibility
export const LEGACY_CATEGORY_MAP: Record<string, ExperienceCategory> = {
  'islands': 'island-hopping',
  'water': 'snorkeling',
  'boat': 'sailing',
  'tour': 'cultural',
  'jetski': 'jet-ski',
  'scuba': 'diving',
};

export function normalizeCategory(id: string): ExperienceCategory {
  const legacy = LEGACY_CATEGORY_MAP[id.toLowerCase()];
  if (legacy) return legacy;
  
  const exists = CATEGORY_MAP[id];
  if (exists) return id as ExperienceCategory;
  
  return 'island-hopping'; // Default fallback
}
