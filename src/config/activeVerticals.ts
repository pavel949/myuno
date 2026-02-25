/**
 * @module activeVerticals
 * Feature-flag system for controlling which verticals are visible to end-users.
 * Admin users always see everything. Only affects UI rendering — no data/code is deleted.
 * 
 * VITRINE MODE: All 18+ verticals are now visible to showcase the full platform.
 */

export const ACTIVE_VERTICALS = [
  'property',
  'cleaning',
  'transfer',
  'vehicle',
  'yacht',
  'experience',
  'restaurant',
  'beauty',
  'salon',
  'medical',
  'legal',
  'insurance',
  'education',
  'gym',
  'fitness',
  'flowers',
  'flower',
  'babysitter',
  'pet',
  'pharmacy',
  'events',
  'event',
  'water',
  'water_activities',
  'transport',
  'diving',
] as const;

export type ActiveVertical = typeof ACTIVE_VERTICALS[number];

export const isActiveVertical = (verticalId: string): boolean =>
  ACTIVE_VERTICALS.includes(verticalId as ActiveVertical);

/**
 * Vertical group IDs that should be visible to non-admin users.
 * All groups now visible in vitrine mode.
 */
export const ACTIVE_VERTICAL_GROUPS = [
  'home',
  'transport',
  'experience',
  'lifestyle',
  'professional',
  'help',
] as const;

export const isActiveVerticalGroup = (groupId: string): boolean =>
  ACTIVE_VERTICAL_GROUPS.includes(groupId as any);

/**
 * Coming soon verticals — currently empty since all verticals are active.
 */
export const COMING_SOON_VERTICALS: { id: string; labelEn: string; labelRu: string }[] = [];
