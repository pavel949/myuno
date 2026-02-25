/**
 * @module activeVerticals
 * Feature-flag system for controlling which verticals are visible to end-users.
 * Admin users always see everything. Only affects UI rendering — no data/code is deleted.
 */

export const ACTIVE_VERTICALS = [
  'property',    // Core product — property management
  'cleaning',    // Supports property management
  'transfer',    // Airport transfers — supports property guests
  'vehicle',     // Car/bike rental — supports property guests
] as const;

export type ActiveVertical = typeof ACTIVE_VERTICALS[number];

export const isActiveVertical = (verticalId: string): boolean =>
  ACTIVE_VERTICALS.includes(verticalId as ActiveVertical);

/**
 * Vertical group IDs that should be visible to non-admin users.
 * Maps to VERTICAL_GROUPS[].id in verticalGroups.ts
 */
export const ACTIVE_VERTICAL_GROUPS = [
  'home',       // Property + Cleaning (core)
  'transport',  // Transfers + Vehicles (guest support)
  'help',       // Concierge + SOS (always visible)
] as const;

export const isActiveVerticalGroup = (groupId: string): boolean =>
  ACTIVE_VERTICAL_GROUPS.includes(groupId as any);

/**
 * Coming soon verticals — shown grayed out with "coming soon" badge
 */
export const COMING_SOON_VERTICALS = [
  { id: 'yacht', labelEn: 'Yacht Charter', labelRu: 'Яхт-чартер' },
  { id: 'experience', labelEn: 'Tours & Activities', labelRu: 'Экскурсии' },
  { id: 'restaurant', labelEn: 'Restaurants', labelRu: 'Рестораны' },
  { id: 'beauty', labelEn: 'Spa & Beauty', labelRu: 'Спа и красота' },
  { id: 'medical', labelEn: 'Medical', labelRu: 'Медицина' },
  { id: 'legal', labelEn: 'Legal & Visa', labelRu: 'Юридические услуги' },
  { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страхование' },
] as const;
