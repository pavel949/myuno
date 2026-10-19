/** Catalogue content only. Never ownership, legal contacts, CAM pricing or scope. */
export const MANAGED_COMPLEX_DRAFT_FIELDS = [
  'name', 'name_ru', 'description_en', 'description_ru', 'address', 'district',
  'complex_type', 'total_units', 'total_buildings', 'year_built', 'total_floors',
  'lat', 'lng', 'cover_image', 'images', 'video_url', 'amenities', 'services',
  'security_features', 'infrastructure',
] as const;
export type ManagedComplexDraftField = typeof MANAGED_COMPLEX_DRAFT_FIELDS[number];
