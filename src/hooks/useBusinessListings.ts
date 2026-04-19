import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BusinessListingType =
  | 'business_for_sale'
  | 'developer_raise'
  | 'developer_inventory'
  | 'startup_pitch'
  | 'operating_partner_wanted';

export type BusinessAssetClass =
  | 'restaurant' | 'hotel' | 'retail' | 'marine'
  | 'import_export' | 'manufacturing' | 'medical'
  | 'education' | 'tech' | 'franchise' | 'wellness'
  | 'real_estate' | 'other';

export interface BusinessListing {
  id: string;
  slug: string;
  listing_type: BusinessListingType;
  asset_class: BusinessAssetClass;
  title_ru: string;
  title_en: string;
  teaser_ru: string | null;
  teaser_en: string | null;
  full_description_ru: string | null;
  full_description_en: string | null;
  ask_amount: number | null;
  currency: string | null;
  equity_offered_pct: number | null;
  min_ticket: number | null;
  monthly_revenue: number | null;
  ebitda: number | null;
  asset_value: number | null;
  location_district: string | null;
  staff_count: number | null;
  lease_remaining_months: number | null;
  license_status: string | null;
  reason_for_sale: string | null;
  use_of_funds: string | null;
  is_anonymized: boolean;
  visibility: 'draft' | 'pending_review' | 'published' | 'archived';
  success_probability: number | null;
  expected_close_date: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  view_count: number | null;
  intro_count: number | null;
  created_at: string;
  published_at: string | null;
}

export const BUSINESS_ASSET_CLASSES: { key: BusinessAssetClass; en: string; ru: string; icon: string }[] = [
  { key: 'restaurant', en: 'Restaurant / Café', ru: 'Ресторан / Кафе', icon: '🍽️' },
  { key: 'hotel', en: 'Hotel / Hospitality', ru: 'Отель / Гостиница', icon: '🏨' },
  { key: 'retail', en: 'Retail / Shop', ru: 'Ритейл / Магазин', icon: '🛍️' },
  { key: 'marine', en: 'Marine / Yacht', ru: 'Marine / Яхты', icon: '⚓' },
  { key: 'import_export', en: 'Import / Export', ru: 'Импорт / Экспорт', icon: '🚢' },
  { key: 'manufacturing', en: 'Manufacturing', ru: 'Производство', icon: '🏭' },
  { key: 'medical', en: 'Medical / Clinic', ru: 'Медицина / Клиника', icon: '🏥' },
  { key: 'education', en: 'Education', ru: 'Образование', icon: '🎓' },
  { key: 'tech', en: 'Tech / Startup', ru: 'IT / Стартап', icon: '💻' },
  { key: 'franchise', en: 'Franchise', ru: 'Франшиза', icon: '🤝' },
  { key: 'wellness', en: 'Wellness / Spa', ru: 'Wellness / Spa', icon: '💆' },
  { key: 'real_estate', en: 'Real Estate', ru: 'Недвижимость', icon: '🏗️' },
  { key: 'other', en: 'Other', ru: 'Другое', icon: '📦' },
];

export const LISTING_TYPE_LABELS: Record<BusinessListingType, { en: string; ru: string }> = {
  business_for_sale: { en: 'Business for sale', ru: 'Готовый бизнес' },
  developer_raise: { en: 'Developer raising capital', ru: 'Девелопер привлекает капитал' },
  developer_inventory: { en: 'Developer inventory sale', ru: 'Остатки от девелопера' },
  startup_pitch: { en: 'Startup pitch', ru: 'Стартап / идея' },
  operating_partner_wanted: { en: 'Operating partner wanted', ru: 'Ищу управляющего партнёра' },
};

interface Filters {
  assetClass?: BusinessAssetClass;
  listingType?: BusinessListingType;
}

export function useBusinessListings(filters?: Filters) {
  return useQuery({
    queryKey: ['business-listings', filters],
    queryFn: async (): Promise<BusinessListing[]> => {
      let q = supabase
        .from('business_listings')
        .select('*')
        .eq('visibility', 'published')
        .order('created_at', { ascending: false });

      if (filters?.assetClass) q = q.eq('asset_class', filters.assetClass);
      if (filters?.listingType) q = q.eq('listing_type', filters.listingType);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BusinessListing[];
    },
  });
}

export function useBusinessListing(slug?: string) {
  return useQuery({
    queryKey: ['business-listing', slug],
    enabled: !!slug,
    queryFn: async (): Promise<BusinessListing | null> => {
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data as BusinessListing | null;
    },
  });
}
