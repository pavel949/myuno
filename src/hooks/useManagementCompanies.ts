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
}

export function useManagementCompanies() {
  return useQuery({
    queryKey: ['management-companies'],
    queryFn: async (): Promise<ManagementCompany[]> => {
      const { data, error } = await supabase
        .from('management_companies')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name_en');

      if (error) throw error;
      return (data || []) as ManagementCompany[];
    },
  });
}

export function useManagementCompanyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['management-company', slug],
    queryFn: async (): Promise<ManagementCompany | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('management_companies')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as ManagementCompany;
    },
    enabled: !!slug,
  });
}
