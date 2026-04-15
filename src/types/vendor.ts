// Centralized vendor type definitions

export type { VendorActivity } from '@/hooks/useVendorActivities';

export interface VendorBabysitter {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  bio_en?: string;
  bio_ru?: string;
  photo?: string;
  images?: string[];
  age_groups?: string[];
  languages?: string[];
  certifications?: string[];
  experience_years?: number;
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  availability?: Record<string, unknown>;
  can_cook?: boolean;
  can_drive?: boolean;
  first_aid_certified?: boolean;
  background_checked?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorCleaningService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  features?: string[];
  areas_served?: string[];
  price_per_hour?: number;
  price_fixed?: number;
  duration_hours?: number;
  currency?: string;
  cover_image?: string;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorClinic {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  clinic_type: string;
  specialty: string[];
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: Record<string, string>;
  languages: string[];
  is_24h: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  consultation_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface VendorFlowerShop {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  phone?: string;
  email?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, unknown>;
  delivery_available?: boolean;
  delivery_fee?: number;
  min_order_amount?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

// VendorProperty is now defined in ./property.ts - re-export for backward compatibility
// export type { VendorProperty } from '@/hooks/useVendorProperties';

export interface VendorRestaurant {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  cuisine?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  price_range?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, unknown>;
  delivery_available?: boolean;
  delivery_fee?: number;
  delivery_time?: string;
  min_order_amount?: number;
  features?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  approval_status?: string;
}

export interface VendorSalon {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  salon_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[];
  amenities: string[];
  price_from: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  working_hours: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// VendorTour — REMOVED: consolidated into AdminExperience from useAdminExperiences

export interface VendorVehicle {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  vehicle_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  luggage_capacity: number;
  doors: number;
  transmission: string;
  fuel_type: string;
  year_built: number | null;
  engine_size: string | null;
  color: string | null;
  location_name: string | null;
  location_ru: string | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_per_week: number | null;
  price_per_month: number | null;
  price_airport_transfer: number | null;
  deposit_amount: number | null;
  min_rental_days: number;
  free_km_per_day: number | null;
  extra_km_price: number | null;
  currency: string;
  features: string[];
  rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  provider_id: string | null;
  created_at: string;
  insurance_note: string | null;
  mileage_policy: string | null;
  helmet_included: boolean;
}

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
