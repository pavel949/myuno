import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { createErrorHandler } from '@/lib/errorHandler';

/** @deprecated Use AppRole from user_roles table instead. Kept for backward compat only. */
export type UserType = 'tourist' | 'resident' | 'owner' | 'vendor' | 'admin' | 'uno_team';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  email: string | null;
  /** @deprecated Stored in user_roles table. This field is kept for UI fallback only. */
  user_type: UserType | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
}

export interface UpdateProfileData {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  preferred_language?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setLanguage } = useLanguage();
  const errorLog = createErrorHandler('useProfile');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', 'core', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, preferred_language, email, user_type, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        errorLog.silent(error, 'fetch_profile');
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        errorLog.silent(error, 'update_profile');
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'core', user?.id] });
      
      // Sync language with context if it was updated
      if (data?.preferred_language) {
        setLanguage(data.preferred_language as 'ru' | 'en' | 'th');
      }
    },
    onError: (error) => {
      errorLog.silent(error, 'update_profile_mutation');
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
}
