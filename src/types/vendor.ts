// Centralized vendor type definitions
// Re-export from consolidated verticals types
export type {
  VendorActivity,
  VendorBabysitter,
  VendorCleaningService,
  VendorClinic,
  VendorFlowerShop,
  VendorGym,
  VendorLegalService,
  VendorPetService,
  VendorRestaurant,
  VendorSalon,
  VendorVehicle,
  VendorProduct,
  VendorProperty,
} from '@/types/verticals';

// Re-export hooks that have extra types
export type { VendorEducationProvider } from '@/hooks/useVendorEducation';
export type { VendorEvent } from '@/hooks/useVendorEvents';
export type { VendorExperience } from '@/hooks/useVendorExperiences';

// Common vendor entity base interface
export interface VendorEntityBase {
  id: string;
  provider_id?: string | null;
  name_en: string;
  name_ru: string;
  description_en?: string | null;
  description_ru?: string | null;
  cover_image?: string | null;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface LocationFields {
  address?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface ContactFields {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface PricingFields {
  currency?: string;
  price_per_hour?: number | null;
  price_per_day?: number | null;
}

export type WorkingHours = Record<string, string> | null;
