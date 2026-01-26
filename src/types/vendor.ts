// Centralized vendor type definitions
// Re-export from individual hooks for backward compatibility

export type { VendorActivity } from '@/hooks/useVendorActivities';
export type { VendorBabysitter } from '@/hooks/useVendorBabysitters';
export type { VendorCleaningService } from '@/hooks/useVendorCleaning';
export type { VendorClinic } from '@/hooks/useVendorClinics';
export type { VendorEducationProvider } from '@/hooks/useVendorEducation';
export type { VendorEvent } from '@/hooks/useVendorEvents';
export type { VendorFlowerShop } from '@/hooks/useVendorFlowers';
export type { VendorGym } from '@/hooks/useVendorGyms';
export type { VendorLegalService } from '@/hooks/useVendorLegal';
export type { VendorPetService } from '@/hooks/useVendorPets';
// VendorProperty is now defined in ./property.ts - re-export for backward compatibility
// export type { VendorProperty } from '@/hooks/useVendorProperties';
export type { VendorRestaurant } from '@/hooks/useVendorRestaurants';
export type { VendorSalon } from '@/hooks/useVendorSalons';
export type { VendorTour } from '@/hooks/useVendorTours';
export type { VendorVehicle } from '@/hooks/useVendorVehicles';

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

// Common location fields
export interface LocationFields {
  address?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// Common contact fields
export interface ContactFields {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

// Common pricing fields
export interface PricingFields {
  currency?: string;
  price_per_hour?: number | null;
  price_per_day?: number | null;
}

// Working hours type
export type WorkingHours = Record<string, string> | null;
