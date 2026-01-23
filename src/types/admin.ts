/**
 * Admin-related type definitions
 * Aligned with actual database schema
 */

export interface Provider {
  id: string;
  user_id?: string;
  name: string; // Single name field in DB (not localized)
  business_category: string;
  email?: string;
  phone?: string;
  address?: string;
  description_en?: string;
  description_ru?: string;
  cover_image?: string;
  logo_url?: string;
  is_active: boolean;
  is_verified: boolean;
  rating: number | null;
  review_count: number | null;
  pending_payout: number;
  total_earnings?: number;
  commission_rate?: number;
  website?: string;
  trust_score?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  category_id?: string;
  price?: number;
  currency: string;
  duration_minutes?: number;
  max_capacity?: number;
  cover_image?: string;
  images?: string[];
  is_active: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  location_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  group_id?: string;
  sort_order?: number;
  is_active: boolean;
  is_hot?: boolean;
  is_new?: boolean;
  mini_app_type?: string;
  created_at: string;
}

export interface TopProvider {
  id: string;
  name: string; // Single name field in DB
  business_category: string;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
}

export interface PlatformMetrics {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_providers: number;
  active_providers: number;
  new_providers: number;
  total_bookings: number;
  new_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  gmv: number;
  platform_revenue: number;
  subscription_revenue: number;
  page_views: number;
  unique_visitors: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalGMV: number;
  totalRevenue: number;
  userGrowth: number;
  providerGrowth: number;
  bookingGrowth: number;
  revenueGrowth: number;
}

export interface RealtimeStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  pendingBookings: number;
  activeSubscriptions: number;
  todayRevenue: number;
}
