import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PMCompany {
  id: string;
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  logo_url?: string;
  cover_image?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  license_number?: string;
  tax_id?: string;
  established_year?: number;
  service_districts: string[];
  service_types: string[];
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
  properties_managed: number;
  created_at: string;
  updated_at: string;
}

export type PMCompanyInsert = Omit<PMCompany, 'id' | 'created_at' | 'updated_at' | 'verified_at' | 'review_count' | 'properties_managed'>;
export type PMCompanyUpdate = Partial<PMCompanyInsert>;

export function usePMCompanies() {
  const queryClient = useQueryClient();

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['pm-companies'],
    queryFn: async (): Promise<PMCompany[]> => {
      const { data, error } = await supabase
        .from('property_management_companies')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as PMCompany[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (company: PMCompanyInsert) => {
      const { data, error } = await supabase
        .from('property_management_companies')
        .insert(company)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-companies'] });
      toast.success('УК создана');
    },
    onError: (error) => {
      console.error('Error creating PM company:', error);
      toast.error('Ошибка при создании УК');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PMCompanyUpdate }) => {
      const { data: result, error } = await supabase
        .from('property_management_companies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-companies'] });
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
        .from('property_management_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-companies'] });
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
