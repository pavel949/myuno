import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProfileDetails {
  id: string;
  user_id: string;
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
  emergency_contact_relation: string | null;
  dietary_restrictions: string[] | null;
  medical_conditions: string | null;
  travel_preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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
        .from('profile_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ProfileDetails | null;
    },
    enabled: !!user?.id,
  });

  const updateDetails = useMutation({
    mutationFn: async (updates: UpdateProfileDetailsData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('profile_details')
          .update(updates as any)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('profile_details')
          .insert({ user_id: user.id, ...updates } as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-details', user?.id] });
      toast.success('Данные сохранены');
    },
    onError: (error) => {
      console.error('Profile details update error:', error);
      toast.error('Ошибка сохранения');
    },
  });

  return {
    details,
    isLoading,
    error,
    updateDetails: updateDetails.mutate,
    updateDetailsAsync: updateDetails.mutateAsync,
    isUpdating: updateDetails.isPending,
  };
}
