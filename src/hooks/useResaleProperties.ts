/**
 * Hook for resale/secondary market properties
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ResaleProperty {
  id: string;
  title: string;
  title_ru: string | null;
  property_type: string;
  development_id: string | null;
  unit_reference: string | null;
  seller_type: string;
  agent_name: string | null;
  agent_company: string | null;
  zone: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  year_built: number | null;
  condition: string;
  furnished: string;
  asking_price: number;
  currency: string;
  price_per_sqm: number | null;
  original_purchase_price: number | null;
  price_negotiable: boolean;
  is_assignment: boolean;
  assignment_premium: number | null;
  remaining_payments: unknown;
  transfer_fee_paid_by: string | null;
  current_rental_income: number | null;
  estimated_roi: number | null;
  title_type: string;
  lease_years_remaining: number | null;
  description: string | null;
  description_ru: string | null;
  media: unknown[];
  cover_image: string | null;
  featured: boolean;
  status: string;
  views_count: number;
  inquiries_count: number;
  days_on_market: number;
  created_at: string;
}

export interface ResaleFilters {
  property_type?: string;
  zone?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  is_assignment?: boolean;
  title_type?: string;
  tab?: 'all' | 'assignment' | 'ready';
}

export function useResaleProperties(filters?: ResaleFilters) {
  return useQuery({
    queryKey: ['resale-properties', filters],
    queryFn: async (): Promise<ResaleProperty[]> => {
      let query = supabase
        .from('resale_properties' as any)
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters?.zone) {
        query = query.eq('zone', filters.zone);
      }
      if (filters?.min_price) {
        query = query.gte('asking_price', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('asking_price', filters.max_price);
      }
      if (filters?.min_area) {
        query = query.gte('area_sqm', filters.min_area);
      }
      if (filters?.max_area) {
        query = query.lte('area_sqm', filters.max_area);
      }
      if (filters?.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters?.is_assignment !== undefined) {
        query = query.eq('is_assignment', filters.is_assignment);
      }
      if (filters?.title_type) {
        query = query.eq('title_type', filters.title_type);
      }
      if (filters?.tab === 'assignment') {
        query = query.eq('is_assignment', true);
      }
      if (filters?.tab === 'ready') {
        query = query.eq('is_assignment', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ResaleProperty[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useResaleProperty(id?: string) {
  return useQuery({
    queryKey: ['resale-property', id],
    queryFn: async (): Promise<ResaleProperty | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('resale_properties' as any)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as ResaleProperty;
    },
    enabled: !!id,
  });
}

export function useCreateResaleProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<ResaleProperty>) => {
      const { data: result, error } = await supabase
        .from('resale_properties' as any)
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resale-properties'] });
      toast.success('Resale property created');
    },
    onError: () => toast.error('Failed to create resale property'),
  });
}

export function useUpdateResaleProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ResaleProperty> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('resale_properties' as any)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resale-properties'] });
      toast.success('Resale property updated');
    },
    onError: () => toast.error('Failed to update'),
  });
}
