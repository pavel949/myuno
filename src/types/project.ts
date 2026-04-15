/**
 * Shared types for property_projects — used by both Offplan (buyer) and Newbuilds (developer) modules.
 */

export type ProjectStatus = 'offplan' | 'under_construction' | 'completed';
export type ListingPurpose = 'offplan' | 'investment' | 'completed';

/** Developer info from the joined `developers` table */
export interface ProjectDeveloper {
  id: string;
  name_en: string;
  logo_url: string | null;
  muuno_score: number | null;
  is_verified: boolean;
}

/**
 * Base project fields (camelCase) — used by the Offplan buyer catalog.
 * Offplan module already uses camelCase throughout its components.
 */
export interface BaseProject {
  id: string;
  slug: string | null;
  nameEn: string;
  nameRu: string | null;
  coverImage: string | null;
  district: string | null;
  locationArea: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  projectStatus: ProjectStatus;
  listingPurpose: ListingPurpose;
  completionDate: string | null;
  constructionProgress: number;
  isFeatured: boolean;
  isApproved: boolean;
  developerId: string | null;
  developerName: string | null;
  amenities: string[] | null;
  muunoScore: number | null;
  totalUnits: number | null;
  unitsAvailable: number;
  unitsSold: number;
  createdAt: string;
}

/** Buyer-facing offplan project (camelCase) — includes developer join + investment metrics */
export interface OffplanProject extends BaseProject {
  isActive: boolean;
  developer: ProjectDeveloper | null;
  developerLogo: string | null;
  developerScore: number | null;
  developerVerified: boolean;
  investmentEnabled: boolean;
  fundingGoal: number | null;
  minInvestment: number | null;
  roiProjected: number | null;
  riskLevel: string | null;
}

/**
 * Developer-facing newbuild project (snake_case) — matches DB column names directly.
 * Newbuilds components access fields as snake_case (e.g. project.name_en, project.cover_image).
 */
export interface NewbuildProject {
  id: string;
  slug: string | null;
  name_en: string;
  name_ru: string | null;
  tagline: string | null;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  gallery_urls: string[] | null;
  images: string[] | null;
  video_url: string | null;
  location_area: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_from: number | null;
  price_to: number | null;
  unit_types: string[] | null;
  total_units: number | null;
  units_available: number | null;
  units_sold: number | null;
  completion_date: string | null;
  construction_progress: number;
  project_status: ProjectStatus;
  listing_purpose: ListingPurpose;
  is_featured: boolean;
  is_approved: boolean;
  developer_id: string | null;
  developer_name: string | null;
  amenities: string[] | null;
  muuno_score: number | null;
  investment_enabled: boolean;
  funding_goal: number | null;
  min_investment: number | null;
  roi_projected: number | null;
  risk_level: string | null;
  created_at: string;
}
