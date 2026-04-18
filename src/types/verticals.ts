/**
 * Vendor vertical type interfaces.
 * Consolidated from individual useVendorXxx hook files.
 * Use with useVerticalCRUD<T>(verticalId) directly.
 */

export interface VendorActivity {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category: string;
  difficulty?: string;
  duration_minutes?: number;
  price?: number;
  price_per?: string;
  currency?: string;
  min_participants?: number;
  max_participants?: number;
  age_restriction?: number;
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  location_name?: string;
  includes?: string[];
  requirements?: string[];
  equipment_included?: boolean;
  is_certified?: boolean;
  certification_details?: string;
  safety_briefing_required?: boolean;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  available_times?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

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

export type EducationEntityType = 'institution' | 'individual';
export type ExperienceType = 'tour' | 'activity' | 'class';
export type BookingModel = 'group' | 'private';

export interface VendorEducationProvider {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  provider_type?: string;
  entity_type?: EducationEntityType;
  education_type?: string;
  subjects?: string[];
  age_groups?: string[];
  qualifications?: string[];
  curriculum?: string;
  languages?: string[];
  price_per_hour?: number;
  price_per_course?: number;
  price_from?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  is_online?: boolean;
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

export interface VendorEvent {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  event_type?: string;
  event_date?: string;
  event_time?: string;
  duration_hours?: number;
  venue_name?: string;
  venue_address?: string;
  location_name?: string;
  location_ru?: string;
  address?: string;
  lat?: number;
  lng?: number;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  price?: number;
  original_price?: number;
  price_vip?: number;
  currency?: string;
  max_capacity?: number;
  max_spots?: number;
  spots_remaining?: number;
  spots_left?: number;
  cover_image?: string;
  images?: string[];
  includes?: import('@/integrations/supabase/types').Json;
  excludes?: import('@/integrations/supabase/types').Json;
  itinerary?: import('@/integrations/supabase/types').Json;
  is_active?: boolean;
  is_featured?: boolean;
  is_hot?: boolean;
  is_recurring?: boolean;
  recurrence_rule?: string;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorExperience {
  id: string;
  provider_id?: string;
  experience_type?: ExperienceType;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  difficulty?: string;
  duration_hours?: number;
  duration_minutes?: number;
  price?: number;
  price_per?: string;
  currency?: string;
  min_participants?: number;
  max_participants?: number;
  max_guests?: number;
  languages?: string[];
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  location_name?: string;
  includes?: import('@/integrations/supabase/types').Json;
  excludes?: import('@/integrations/supabase/types').Json;
  highlights?: import('@/integrations/supabase/types').Json;
  requirements?: import('@/integrations/supabase/types').Json;
  itinerary?: import('@/integrations/supabase/types').Json;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  start_times?: string[];
  tags?: string[];
  equipment_included?: boolean;
  is_certified?: boolean;
  certification_details?: string;
  safety_briefing_required?: boolean;
  age_restriction?: number;
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  approval_status?: string;
  external_link?: string;
  booking_model?: BookingModel;
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

export interface VendorGym {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  gym_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  amenities: string[];
  classes: string[];
  price_day_pass: number | null;
  price_week_pass: number | null;
  price_month_pass: number | null;
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

export interface VendorLegalService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  specializations?: string[];
  languages?: string[];
  price_consultation?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, unknown>;
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

export interface VendorPetService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  pet_types?: string[];
  services_offered?: string[];
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, unknown>;
  has_pickup?: boolean;
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

export interface VendorProduct {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  price?: number;
  currency?: string;
  sku?: string;
  stock_quantity?: number;
  cover_image?: string;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

/** @deprecated Use VendorProperty from '@/types/property' — this legacy shape uses `title` instead of `title_en/title_ru`. */
export interface VendorPropertyLegacy {
  id: string;
  provider_id?: string;
  title: string;
  title_ru?: string;
  description?: string;
  description_ru?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  price_per_night?: number;
  price_per_month?: number;
  currency?: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  amenities?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

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
