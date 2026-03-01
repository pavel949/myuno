import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PropertyComplex {
  id: string;
  owner_id: string;
  name: string;
  name_ru?: string;
  description?: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  district?: string;
  // Classification
  complex_type?: string;
  total_units?: number;
  total_buildings?: number;
  year_built?: number;
  total_floors?: number;
  // Location
  lat?: number;
  lng?: number;
  // Media
  cover_image?: string;
  images?: string[];
  // Amenities & Services
  amenities?: string[];
  services?: string[];
  security_features?: string[];
  infrastructure?: string[];
  // Management
  management_company_id?: string;
  cam_fee_per_sqm?: number;
  cam_includes?: string[];
  juristic_person_name?: string;
  juristic_phone?: string;
  juristic_email?: string;
  // Status
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export type ComplexFormData = Omit<PropertyComplex, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

const db = supabase;

export function usePropertyComplexes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-complexes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('property_complexes')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as PropertyComplex[];
    },
  });
}

export function useCreateComplex() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ComplexFormData) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db
        .from('property_complexes')
        .insert({ ...payload, owner_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyComplex;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс создан');
    },
  });
}

export function useUpdateComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyComplex> & { id: string }) => {
      const { data, error } = await db
        .from('property_complexes')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyComplex;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс обновлён');
    },
  });
}

export function useDeleteComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('property_complexes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс удалён');
    },
  });
}

export function useAssignPropertyToComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, complexId }: { propertyId: string; complexId: string | null }) => {
      const { error } = await db
        .from('properties')
        .update({ complex_id: complexId })
        .eq('id', propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
    },
  });
}

/** Hook to get amenities inherited from a property's complex */
export function useComplexAmenities(complexId: string | null | undefined) {
  return useQuery({
    queryKey: ['complex-amenities', complexId],
    enabled: !!complexId,
    queryFn: async () => {
      const { data, error } = await db
        .from('property_complexes')
        .select('amenities, services, security_features, infrastructure, name, name_ru')
        .eq('id', complexId!)
        .single();
      if (error) throw error;
      return data as Pick<PropertyComplex, 'amenities' | 'services' | 'security_features' | 'infrastructure' | 'name' | 'name_ru'>;
    },
    staleTime: 10 * 60 * 1000,
  });
}
