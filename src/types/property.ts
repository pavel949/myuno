/**
 * @module PropertyTypes
 * @description Centralized property type definitions for Owner and Vendor modules
 */

import type { Json } from '@/integrations/supabase/types';

/**
 * Base property interface with common fields
 */
export interface BaseProperty {
  id: string;
  title: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Minimal property reference for components that only need id/title
 */
export interface PropertyReference {
  id: string;
  title: string;
  title_ru?: string | null;
  cover_image?: string | null;
}

/**
 * Owner property - full interface for property management
 */
export interface OwnerProperty extends BaseProperty {
  owner_id: string;
  title_ru?: string;
  description?: string;
  description_ru?: string;
  management_type: string;
  is_rented?: boolean;
  rental_platform?: string;
  status: string;
  verified_at?: string;
  internal_name?: string;
  notes?: string;
  marketplace_property_id?: string;
  
  // Project/Unit fields
  project_id?: string;
  floor?: number;
  unit_number?: string;
  view_type?: string;
  furnishing_level?: string;
  equipment?: string[];
  
  // Rental terms - Basic
  price_per_night?: number;
  min_stay_nights?: number;
  max_guests?: number;
  deposit_amount?: number;
  deposit_currency?: string;
  deposit_type?: string;
  check_in_time?: string;
  check_out_time?: string;
  house_rules?: string;
  house_rules_ru?: string;
  cancellation_policy?: string;
  instant_booking?: boolean;
  
  // Extended property details
  rooms?: Json;
  highlights?: string[];
  nearby_places?: Json;
  safety_features?: string[];
  accessibility_features?: string[];
  
  // Seasonality and discounts
  seasonal_pricing?: Json;
  weekly_discount?: number;
  monthly_discount?: number;
  
  // Electricity
  electricity_included?: boolean;
  electricity_unit_price?: number;
  electricity_provider?: string;
  electricity_metering?: string;
  electricity_notes?: string;
  electricity_notes_ru?: string;
  
  // Water
  water_included?: boolean;
  water_unit_price?: number;
  water_notes?: string;
  water_notes_ru?: string;
  
  // Internet
  internet_speed?: string;
  internet_provider?: string;
  
  // Included/extra services
  included_services?: Json;
  extra_services?: Json;
  
  // Cleaning
  cleaning_included?: boolean;
  cleaning_frequency?: string;
  extra_cleaning_price?: number;
  linen_change_price?: number;
  linen_change_frequency?: string;
  
  // Check-in details
  early_checkin_price?: number;
  late_checkout_price?: number;
  key_handover?: string;
  check_in_instructions?: string;
  check_in_instructions_ru?: string;
  
  // Transfer
  transfer_available?: boolean;
  transfer_airport_price?: number;
  transfer_notes?: string;
  transfer_notes_ru?: string;
  
  // Extra guests
  extra_guest_price?: number;
  extra_guest_threshold?: number;
  
  // Parking
  parking_included?: boolean;
  parking_spaces?: number;
  parking_notes?: string;
  
  // Pets
  pets_allowed?: boolean;
  pet_deposit?: number;
  pet_notes?: string;
  pet_notes_ru?: string;
  
  // Quiet hours & parties
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  parties_allowed?: boolean;
  max_party_guests?: number;
  
  // Children
  children_friendly?: boolean;
  has_crib?: boolean;
  has_high_chair?: boolean;
  
  // Penalties
  late_checkout_penalty?: number;
  smoking_penalty?: number;
  
  // Manager contact
  manager_name?: string;
  manager_phone?: string;
  manager_line_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  host_languages?: string[];
  
  // Ownership/delegation fields
  created_on_behalf?: boolean;
  actual_owner_email?: string;
  actual_owner_name?: string;
  actual_owner_phone?: string;
  managed_by_org_id?: string;
  ownership_type?: 'own' | 'management_agreement' | 'verbal';
  ownership_transferred_at?: string;
  
  // Verification fields
  management_document_url?: string;
  management_document_name?: string;
  commercial_terms_redacted?: boolean;
  ownership_verification_status?: 'pending' | 'in_progress' | 'verified' | 'rejected';
  ownership_verification_notes?: string;
  ownership_verified_at?: string;
  ownership_verified_by?: string;
  
  // Ownership form & Sale fields
  ownership_form?: 'freehold' | 'leasehold' | 'company' | 'foreign_company';
  is_for_sale?: boolean;
  sale_price?: number;
  sale_currency?: string;
  
  // Moderation/Approval fields
  approval_status?: 'draft' | 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  instant_booking_enabled_at?: string;
  
  // iCal sync
  ical_token?: string;
  
  // Payment settings
  payment_model?: 'cash' | 'prepay' | 'full_prepay';
  prepay_percent?: number;
  balance_due_days?: number;
  security_deposit_required?: boolean;
}

/**
 * Vendor/Marketplace property interface
 * Note: extends BaseProperty but overrides 'title' since vendor properties use title_en/title_ru
 */
export interface VendorProperty extends Omit<BaseProperty, 'title'> {
  provider_id: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  listing_type: string;
  price?: number;
  price_period?: string;
  currency?: string;
  internal_name?: string;
  max_guests?: number;
  min_stay_nights?: number;
  amenities?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  available_from?: string;
}

/**
 * Property inspection interface
 */
export interface PropertyInspection {
  id: string;
  property_id: string;
  owner_id: string;
  inspector_id?: string;
  inspection_type: string;
  status: string;
  scheduled_at: string;
  completed_at?: string;
  report_summary?: string;
  report_summary_ru?: string;
  photos?: string[];
  video_url?: string;
  checklist_results?: unknown;
  issues_found?: unknown;
  cost?: number;
  currency?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  property?: OwnerProperty;
}

/**
 * Property service request interface
 */
export interface PropertyServiceRequest {
  id: string;
  property_id: string;
  owner_id: string;
  assigned_to?: string;
  service_type: string;
  status: string;
  priority: string;
  scheduled_at?: string;
  completed_at?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_count?: number;
  description?: string;
  description_ru?: string;
  special_instructions?: string;
  completion_photos?: string[];
  completion_notes?: string;
  deposit_amount?: number;
  deposit_collected?: boolean;
  deposit_returned?: boolean;
  service_cost?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
  property?: OwnerProperty;
}

/**
 * Property financial transaction interface
 */
export interface PropertyFinancial {
  id: string;
  property_id: string;
  owner_id: string;
  transaction_type: string;
  category?: string;
  amount: number;
  currency?: string;
  description?: string;
  description_ru?: string;
  reference_type?: string;
  reference_id?: string;
  receipt_url?: string;
  transaction_date: string;
  created_at: string;
  property?: OwnerProperty;
}
