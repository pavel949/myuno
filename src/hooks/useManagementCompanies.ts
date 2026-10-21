/**
 * Hook for fetching management companies from the database
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ManagementCompany {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  logo: string | null;
  cover_image: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  address: string | null;
  district: string | null;
  languages: string[];
  services: string[];
  founded_year: number | null;
  properties_count: number | null;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  // Extended fields
  legal_name: string | null;
  registration_number: string | null;
  legal_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  swift_code: string | null;
  dbd_card_url: string | null;
  documents: unknown[];
  backup_settings: Record<string, unknown> | null;
}

/**
 * Public-safe columns exposed by the `management_companies_public` view.
 *
 * Anonymous visitors have no grants on the `management_companies` base table
 * (financial/legal columns such as bank_account, tax_id, stripe ids must never
 * leak). The public MC directory and `/property/mc/:slug` profile pages read
 * the view instead, which only contains marketing columns for active companies.
 */
const MANAGEMENT_COMPANY_PUBLIC_COLUMNS = `
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, whatsapp, website,
  address, district, languages, services,
  founded_year, properties_count, properties_managed,
  rating, review_count, is_verified, is_active, is_featured,
  brand_color, has_24_7_support, has_emergency_service,
  service_districts, service_types, created_at
`;

export function useManagementCompanies() {
  return useQuery({
    queryKey: ['management-companies'],
    queryFn: async (): Promise<ManagementCompany[]> => {
      const { data, error } = await supabase
        .from('management_companies_public')
        .select(MANAGEMENT_COMPANY_PUBLIC_COLUMNS)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name_en');

      if (error) throw error;
      return (data || []) as unknown as ManagementCompany[];
    },
  });
}

export function useManagementCompanyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['management-company', slug],
    queryFn: async (): Promise<ManagementCompany | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('management_companies_public')
        .select(MANAGEMENT_COMPANY_PUBLIC_COLUMNS)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      if (!data) return null;
      return data as unknown as ManagementCompany;
    },
    enabled: !!slug,
  });
}
