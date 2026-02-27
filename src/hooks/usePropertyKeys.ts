import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PropertyKeyAssignment {
  id: string;
  property_id: string;
  key_set_label: string;
  assigned_to_name: string;
  assigned_to_phone: string | null;
  assigned_to_type: string;
  assigned_at: string;
  expected_return: string | null;
  returned_at: string | null;
  notes: string | null;
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateKeyAssignment {
  property_id: string;
  key_set_label: string;
  assigned_to_name: string;
  assigned_to_phone?: string;
  assigned_to_type: string;
  expected_return?: string;
  notes?: string;
}

export function usePropertyKeys(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ['property-keys', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_key_assignments')
        .select('*')
        .eq('property_id', propertyId!)
        .is('returned_at', null)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return data as PropertyKeyAssignment[];
    },
    enabled: !!propertyId && !!user,
  });

  const assignKey = useMutation({
    mutationFn: async (input: CreateKeyAssignment) => {
      const { data, error } = await supabase
        .from('property_key_assignments')
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-keys', propertyId] });
    },
  });

  const returnKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('property_key_assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-keys', propertyId] });
    },
  });

  return { keys: keys || [], isLoading, assignKey, returnKey };
}

/** Fetch active key counts for multiple properties at once (for dashboard snapshot) */
export function usePropertyKeysOverview(propertyIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-keys-overview', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await supabase
        .from('property_key_assignments')
        .select('id, property_id, key_set_label, assigned_to_name, assigned_to_type')
        .in('property_id', propertyIds)
        .is('returned_at', null);
      if (error) throw error;
      return data as Pick<PropertyKeyAssignment, 'id' | 'property_id' | 'key_set_label' | 'assigned_to_name' | 'assigned_to_type'>[];
    },
    enabled: propertyIds.length > 0 && !!user,
  });
}
