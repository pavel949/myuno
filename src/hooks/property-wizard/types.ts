// Property wizard types — extracted from usePropertyWizard.ts (Wave 3 refactor)

export type OwnershipType = 'own' | 'verbal' | 'management_agreement';

export interface OwnershipData {
  ownership_type: OwnershipType;
  actual_owner_email: string;
  actual_owner_name: string;
  actual_owner_phone: string;
  send_invite_immediately: boolean;
  management_document_url: string;
  management_document_name: string;
  commercial_terms_redacted: boolean;
  ownership_document_url: string;
  ownership_document_name: string;
}

export type AssetClass = 'residential' | 'commercial' | 'land';

export interface PropertyFormData {
  asset_class: AssetClass;
  title: string;
  title_ru: string;
  internal_name: string;
  address: string;
  district: string;
  lat?: number;
  lng?: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: string;
  description: string;
  description_ru: string;
  cover_image: string;
  images: string[];
  management_type: string;
  is_rented: boolean;
  rental_platforms: string[];
  custom_platform: string;
  project_id?: string;
  complex_id?: string;
  video_url?: string;
  floor?: number;
  unit_number: string;
  total_floors?: number;
  plot_size_sqm?: number;
  has_elevator: boolean;
  parking_type: string;
  pool_type: string;
  garden_type: string;
  view_type: string[];
  furnishing_level: string;
  equipment: string[];
  price_per_night: string;
  min_stay_nights: number;
  max_guests: number;
  deposit_amount: string;
  check_in_time: string;
  check_out_time: string;
  instant_booking: boolean;
  ownership_form?: 'freehold' | 'leasehold' | 'company' | 'foreign_company';
  is_for_sale: boolean;
  sale_price: string;
  // House Rules
  pets_allowed?: boolean;
  pet_deposit?: number;
  smoking_allowed?: boolean;
  smoking_penalty?: number;
  parties_allowed?: boolean;
  max_party_guests?: number;
  children_friendly?: boolean;
  has_crib?: boolean;
  has_high_chair?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  house_rules?: string;
  house_rules_ru?: string;
  // Cancellation & Discounts
  cancellation_policy?: string;
  weekly_discount?: number;
  monthly_discount?: number;
  seasonal_pricing?: Array<{
    id: string;
    name: string;
    nameRu?: string;
    type: 'high' | 'low' | 'holiday' | 'custom';
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    priceModifier: number;
    pricePerNight?: number;
    minNights?: number;
  }>;
  highlights: string[];
  // Platform listing
  platform_listed?: boolean;
  // Advanced pricing rules
  early_booking_discount?: number;
  early_booking_days?: number;
  last_minute_discount?: number;
  last_minute_days?: number;
  payment_policy?: string;
  prepay_percent?: number;
  balance_due_days?: number;
  deposit_currency?: string;
  negotiation_enabled?: boolean;
  custom_length_discounts?: Array<{ min_nights: number; discount_percent: number }>;
  /** Host-configurable extra fees the guest pays separately (electricity, water, internet, cleaning, etc).
   *  See src/lib/property/guestExtraFees.ts for the GuestExtraFee shape. */
  guest_extra_fees?: unknown[];
  lock_code?: string;
  // Commercial / Land specifics
  floor_area_sqm?: number;
  cap_rate_pct?: number;
  noi_annual_thb?: number;
  zoning?: string;
  title_deed_type?: string;
  permitted_uses?: string[];
  electricity_load_kw?: number;
  land_size_sqm?: number;
  land_size_rai?: number;
  frontage_m?: number;
  // Hotel-specific (only when property_type ∈ HOTEL_PROPERTY_TYPES)
  hotel_keys?: number;
  hotel_star_rating?: number;
  hotel_brand?: string;
  hotel_license_type?: string;
  hotel_adr_thb?: number;
  hotel_revpar_thb?: number;
  hotel_occupancy_pct?: number;
  hotel_gop_margin_pct?: number;
  hotel_management_status?: string;
  hotel_operator_name?: string;
  hotel_year_renovated?: number;
  // ─── 6-tracks model (rent short / medium / long, sale, assignment, quick-sale) ───
  /** Which tenancy modes this property supports (multi-select). */
  tenancy_modes?: Array<'short' | 'medium' | 'long'>;
  price_per_month?: string; // medium-term THB/mo
  price_per_year?: string;  // long-term THB/yr
  deposit_months_long?: number;  // standard 2
  advance_months_long?: number;  // standard 1
  min_lease_months?: number;     // 1, 6, 12
  utilities_included_long?: string[]; // electricity, water, internet, cleaning, cam
  tm30_registration_supported?: boolean;
  // Sale intent
  sale_intent?: 'standard' | 'assignment' | 'quick_sale';
  is_assignment?: boolean;
  assignment_premium?: string;          // THB premium over original contract
  original_contract_price?: string;     // THB SPA price
  remaining_to_developer?: string;      // THB still owed
  spa_stage?: string;
  transfer_fee_split?: 'buyer' | 'seller' | '50_50';
  // Quick sale
  is_quick_sale?: boolean;
  quick_sale_reason?: string;
  quick_sale_discount_pct?: number;
  urgency_deadline?: string; // YYYY-MM-DD
  // Payment options for sale/assignment
  accepts_installments?: boolean;
  installment_plan?: Array<{
    id: string;
    labelEn: string;
    labelRu: string;
    percent: number;
    dueAt?: string;
    dueAtRu?: string;
  }>;
  escrow_offered?: boolean;
  escrow_provider?: 'platform' | 'lawyer' | 'bank' | 'other';
  // Legal readiness (без SoF на покупателе)
  title_deed_url?: string;
  encumbrances_disclosed?: boolean;
  encumbrances_description?: string;
  foreign_quota_available?: boolean;
  // Video tour
  video_file_url?: string;     // uploaded mp4 in Supabase Storage
  virtual_tour_url?: string;   // Matterport / Kuula / 360
}
