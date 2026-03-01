/**
 * @module useProfileDetails
 * @description Extended profile data hook — now reads/writes directly to `profiles` table.
 * profile_details table has been merged into profiles.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProfileDetails {
  id: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  /** Canonical field name (was emergency_contact_relation in old profile_details) */
  emergency_contact_relationship: string | null;
  dietary_restrictions: string[] | null;
  medical_conditions: string | null;
  travel_preferences: Record<string, unknown> | null;
}

export interface UpdateProfileDetailsData {
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  /** Canonical field — maps to emergency_contact_relationship in profiles */
  emergency_contact_relation?: string | null;
  dietary_restrictions?: string[] | null;
  medical_conditions?: string | null;
}

export function useProfileDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: details, isLoading, error } = useQuery({
    queryKey: ['profile-details', user?.id],
    queryFn: async (): Promise<ProfileDetails | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          date_of_birth,
          gender,
          nationality,
          address_line1,
          address_line2,
          city,
          state_province,
          postal_code,
          country,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          dietary_restrictions,
          medical_conditions,
          travel_preferences
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        date_of_birth: (data as any).date_of_birth ?? null,
        gender: (data as any).gender ?? null,
        nationality: (data as any).nationality ?? null,
        address_line1: (data as any).address_line1 ?? null,
        address_line2: (data as any).address_line2 ?? null,
        city: (data as any).city ?? null,
        state_province: (data as any).state_province ?? null,
        postal_code: (data as any).postal_code ?? null,
        country: (data as any).country ?? null,
        dietary_restrictions: (data as any).dietary_restrictions ?? null,
        medical_conditions: (data as any).medical_conditions ?? null,
        travel_preferences: (data as any).travel_preferences ?? null,
        emergency_contact_relationship: data.emergency_contact_relationship ?? null,
      } as ProfileDetails;
    },
    enabled: !!user?.id,
  });

  const updateDetails = useMutation({
    mutationFn: async (updates: UpdateProfileDetailsData) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Map emergency_contact_relation → emergency_contact_relationship (canonical name in profiles)
      const { emergency_contact_relation, ...rest } = updates;
      const mapped: Record<string, unknown> = { ...rest };
      if (emergency_contact_relation !== undefined) {
        mapped.emergency_contact_relationship = emergency_contact_relation;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(mapped)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-details', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Данные сохранены');
    },
    onError: () => {
      toast.error('Ошибка сохранения');
    },
  });

  // Expose emergency_contact_relation as alias for backward compat with PersonalDetails.tsx
  const detailsWithAlias = details ? {
    ...details,
    emergency_contact_relation: details.emergency_contact_relationship,
  } : null;

  return {
    details: detailsWithAlias,
    isLoading,
    error,
    updateDetails: updateDetails.mutate,
    updateDetailsAsync: updateDetails.mutateAsync,
    isUpdating: updateDetails.isPending,
  };
}
