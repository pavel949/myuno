import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

function mapRow(row: any): PMCompany {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name_en,
    name_ru: row.name_ru,
    description: row.description_en,
    description_ru: row.description_ru,
    logo_url: row.logo,
    cover_image: row.cover_image,
    phone: row.phone,
    email: row.email,
    website: row.website,
    address: row.address,
    license_number: row.license_number,
    tax_id: row.tax_id,
    established_year: row.founded_year,
    service_districts: row.service_districts || [],
    service_types: row.services || [],
    languages: row.languages || [],
    has_24_7_support: row.has_24_7_support ?? false,
    has_emergency_service: row.has_emergency_service ?? false,
    default_commission_rate: row.default_commission_rate ?? 10,
    min_contract_months: row.min_contract_months ?? 12,
    is_active: row.is_active ?? true,
    is_verified: row.is_verified ?? false,
    verified_at: row.verified_at,
    rating: row.rating,
    review_count: row.review_count ?? 0,
    properties_managed: row.properties_count ?? 0,
    director_name: row.director_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
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
    queryKey: ['management-companies'],
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
        .insert(dbData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-companies'] });
      toast.success('УК создана');
    },
    onError: (error) => {
      console.error('Error creating PM company:', error);
      toast.error('Ошибка при создании УК');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PMCompanyUpdate }) => {
      const dbData = mapToDb(data);
      const { data: result, error } = await supabase
        .from('management_companies')
        .update(dbData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-companies'] });
      toast.success('УК обновлена');
    },
    onError: (error) => {
      console.error('Error updating PM company:', error);
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
      queryClient.invalidateQueries({ queryKey: ['management-companies'] });
      toast.success('УК удалена');
    },
    onError: (error) => {
      console.error('Error deleting PM company:', error);
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
