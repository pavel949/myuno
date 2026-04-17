/**
 * Developer Adapter — Single source of mapping between snake_case DB rows
 * and camelCase UI fields. Returned object contains BOTH (DB row spread +
 * camelCase aliases) so legacy consumers keep working without refactor.
 */

/** Raw shape from `public.developers` (only fields used across the app). */
export interface DeveloperRow {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string | null;
  logo_url: string | null;
  cover_image: string | null;
  description_en: string | null;
  description_ru: string | null;
  founded_year?: number | null;
  established_year?: number | null;
  projects_completed: number | null;
  projects_ongoing?: number | null;
  total_units_sold?: number | null;
  total_units_delivered?: number | null;
  average_rating?: number | string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address?: string | null;
  headquarters?: string | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  is_active?: boolean | null;
  muuno_score: number | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** UI shape — DB row + camelCase aliases. Backwards compatible. */
export type DeveloperUI = DeveloperRow & {
  nameEn: string;
  nameRu: string;
  logoUrl: string | null;
  coverImage: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  foundedYear: number | null;
  establishedYear: number | null;
  projectsCompleted: number;
  projectsOngoing: number;
  totalUnitsSold: number;
  totalUnitsDelivered: number;
  averageRating: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  muunoScore: number | null;
  userId: string | null;
  headquarters: string | null;
  address: string | null;
};

export function toDeveloperUI(row: DeveloperRow): DeveloperUI {
  return {
    ...row,
    nameEn: row.name_en,
    nameRu: row.name_ru,
    logoUrl: row.logo_url,
    coverImage: row.cover_image,
    descriptionEn: row.description_en,
    descriptionRu: row.description_ru,
    foundedYear: row.founded_year ?? null,
    establishedYear: row.established_year ?? row.founded_year ?? null,
    projectsCompleted: row.projects_completed ?? 0,
    projectsOngoing: row.projects_ongoing ?? 0,
    totalUnitsSold: row.total_units_sold ?? 0,
    totalUnitsDelivered: row.total_units_delivered ?? row.total_units_sold ?? 0,
    averageRating: Number(row.average_rating ?? 0) || 0,
    isVerified: row.is_verified ?? false,
    isFeatured: row.is_featured ?? false,
    isActive: row.is_active ?? true,
    muunoScore: row.muuno_score ?? null,
    userId: row.user_id ?? null,
    headquarters: row.headquarters ?? null,
    address: row.address ?? null,
  };
}
