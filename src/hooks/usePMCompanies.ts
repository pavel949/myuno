import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ManagementCompanyRow = Database['public']['Tables']['management_companies']['Row'];

export interface PMCompany {
  id: string;
  slug: string;
  name: string;        // mapped from name_en
  name_ru?: string;
  description?: string; // mapped from description_en
  description_ru?: string;
  logo_url?: string;    // mapped from logo
  cover_image?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  license_number?: string;
  tax_id?: string;
  established_year?: number; // mapped from founded_year
  service_districts: string[];
  service_types: string[];  // mapped from services
  languages: string[];
  has_24_7_support: boolean;
  has_emergency_service: boolean;
  default_commission_rate: number;
  min_contract_months: number;
  is_active: boolean;
  is_verified: boolean;
  verified_at?: string;
  rating?: number;
  review_count: number;
  properties_managed: number; // mapped from properties_count
  director_name?: string;
  created_at: string;
  updated_at: string;
}

export type PMCompanyInsert = Omit<PMCompany, 'id' | 'slug' | 'created_at' | 'updated_at' | 'verified_at' | 'review_count' | 'properties_managed'>;
export type PMCompanyUpdate = Partial<PMCompanyInsert>;

function mapRow(row: ManagementCompanyRow): PMCompany {
  const r = row as unknown as Record<string, unknown>;
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name_en as string,
    name_ru: r.name_ru as string | undefined,
    description: r.description_en as string | undefined,
    description_ru: r.description_ru as string | undefined,
    logo_url: r.logo as string | undefined,
    cover_image: r.cover_image as string | undefined,
    phone: r.phone as string | undefined,
    email: r.email as string | undefined,
    website: r.website as string | undefined,
    address: r.address as string | undefined,
    license_number: r.license_number as string | undefined,
    tax_id: r.tax_id as string | undefined,
    established_year: r.founded_year as number | undefined,
    service_districts: (r.service_districts as string[] | null) || [],
    service_types: (r.services as string[] | null) || [],
    languages: (r.languages as string[] | null) || [],
    has_24_7_support: (r.has_24_7_support as boolean | null) ?? false,
    has_emergency_service: (r.has_emergency_service as boolean | null) ?? false,
    default_commission_rate: (r.default_commission_rate as number | null) ?? 10,
    min_contract_months: (r.min_contract_months as number | null) ?? 12,
    is_active: (r.is_active as boolean | null) ?? true,
    is_verified: (r.is_verified as boolean | null) ?? false,
    verified_at: r.verified_at as string | undefined,
    rating: r.rating as number | undefined,
    review_count: (r.review_count as number | null) ?? 0,
    properties_managed: (r.properties_count as number | null) ?? 0,
    director_name: r.director_name as string | undefined,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

function mapToDb(company: Partial<PMCompanyInsert>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (company.name !== undefined) result.name_en = company.name;
  if (company.name_ru !== undefined) result.name_ru = company.name_ru;
  if (company.description !== undefined) result.description_en = company.description;
  if (company.description_ru !== undefined) result.description_ru = company.description_ru;
  if (company.logo_url !== undefined) result.logo = company.logo_url;
  if (company.cover_image !== undefined) result.cover_image = company.cover_image;
  if (company.phone !== undefined) result.phone = company.phone;
  if (company.email !== undefined) result.email = company.email;
  if (company.website !== undefined) result.website = company.website;
  if (company.address !== undefined) result.address = company.address;
  if (company.license_number !== undefined) result.license_number = company.license_number;
  if (company.tax_id !== undefined) result.tax_id = company.tax_id;
  if (company.established_year !== undefined) result.founded_year = company.established_year;
  if (company.service_districts !== undefined) result.service_districts = company.service_districts;
  if (company.service_types !== undefined) result.services = company.service_types;
  if (company.languages !== undefined) result.languages = company.languages;
  if (company.has_24_7_support !== undefined) result.has_24_7_support = company.has_24_7_support;
  if (company.has_emergency_service !== undefined) result.has_emergency_service = company.has_emergency_service;
  if (company.default_commission_rate !== undefined) result.default_commission_rate = company.default_commission_rate;
  if (company.min_contract_months !== undefined) result.min_contract_months = company.min_contract_months;
  if (company.is_active !== undefined) result.is_active = company.is_active;
  if (company.is_verified !== undefined) result.is_verified = company.is_verified;
  if (company.director_name !== undefined) result.director_name = company.director_name;
  return result;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function usePMCompanies() {
  const queryClient = useQueryClient();

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['admin-management-companies'],
    queryFn: async (): Promise<PMCompany[]> => {
      const { data, error } = await supabase
        .from('management_companies')
        .select('*')
        .order('name_en');

      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (company: PMCompanyInsert) => {
      const dbData = mapToDb(company);
      dbData.slug = generateSlug(company.name);
      dbData.name_ru = company.name_ru || company.name;
      const { data, error } = await supabase
        .from('management_companies')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(dbData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-management-companies'] });
      queryClient.invalidateQueries({ queryKey: ['management-companies'] });
      toast.success('УК создана');
    },
    onError: () => {
      toast.error('Ошибка при создании УК');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PMCompanyUpdate }) => {
      const dbData = mapToDb(data);
      const { data: result, error } = await supabase
        .from('management_companies')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(dbData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-management-companies'] });
      queryClient.invalidateQueries({ queryKey: ['management-companies'] });
      toast.success('УК обновлена');
    },
    onError: () => {
      toast.error('Ошибка при обновлении УК');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('management_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-management-companies'] });
      queryClient.invalidateQueries({ queryKey: ['management-companies'] });
      toast.success('УК удалена');
    },
    onError: () => {
      toast.error('Ошибка при удалении УК');
    },
  });

  return {
    companies: companies || [],
    isLoading,
    refetch,
    createCompany: createMutation.mutateAsync,
    updateCompany: updateMutation.mutateAsync,
    deleteCompany: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
