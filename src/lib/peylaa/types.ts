/**
 * PEYLAA Types — matching the peylaa Supabase schema
 */

export interface PeylaaUnit {
  id: string;
  unit_no: string;
  building: 'A' | 'B' | 'C';
  floor: number;
  type_code: string;
  bedrooms: number;
  room_type: '1BR' | '2BR-Corner' | '2BR-Middle' | '3BR';
  view: string;
  area_sqm: number;
  price_per_sqm: number | null;
  asking_price_thb: number | null;
  asking_price_usd: number | null;
  status: 'available' | 'reserved' | 'sold' | 'holding';
  reservation_fee_thb: number | null;
  floor_plan_url: string | null;
  gallery_urls: string[] | null;
  is_featured: boolean;
  is_best_value: boolean;
  sort_order: number;
}

export interface PeylaaLead {
  full_name?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  nationality?: string;
  language?: 'ru' | 'en' | 'th' | 'zh';
  source_channel: string;
  source_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  interested_unit_ids?: string[];
  preferred_bedrooms?: number[];
  preferred_views?: string[];
  budget_min?: number;
  budget_max?: number;
  purchase_timeline?: string;
  purchase_purpose?: string;
  financing_needed?: boolean;
  is_in_phuket?: boolean;
  notes?: string;
}

export interface PeylaaAmenity {
  id: string;
  category: 'active_lifestyle' | 'community' | 'resident_services' | 'premium';
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  icon: string;
  sort_order: number;
  is_phase2: boolean;
}

export interface PeylaaProjectInfo {
  id: string;
  name: string;
  name_ru: string;
  developer: string;
  brand: string;
  location: string;
  location_ru: string;
  latitude: number;
  longitude: number;
  total_units: number;
  buildings: number;
  floors: number;
  construction_start: string;
  completion_date: string;
  sinking_fund_per_sqm: number;
  cam_fee_year1_per_sqm: number;
  transfer_fee_pct: number;
  financing_available: boolean;
  financing_provider: string;
  financing_max_ltv: number;
  financing_max_years: number;
  financing_rate: string;
}

export interface UnitStats {
  building: string;
  bedrooms: number;
  total: number;
  available: number;
  reserved: number;
  sold: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  min_area: number;
  max_area: number;
}

// Filter types for the unit catalog
export interface UnitFilters {
  bedrooms?: number[];
  buildings?: string[];
  floors?: number[];
  views?: string[];
  priceMin?: number;
  priceMax?: number;
  status?: string[];
}
