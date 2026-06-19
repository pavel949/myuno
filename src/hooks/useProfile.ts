import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';

/** @deprecated Use AppRole from user_roles table instead. Kept for backward compat only. */
export type UserType = 'tourist' | 'resident' | 'owner' | 'vendor' | 'admin' | 'uno_team';

export type OwnerType = 'self_managed' | 'mc_portal';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  email: string | null;
  /** @deprecated Stored in user_roles table. This field is kept for UI fallback only. */
  user_type: UserType | null;
  /** Discriminates self-managing owners from MC-portal owners. Null = not an owner. */
  owner_type: OwnerType | null;
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
  // Language sync moved to LanguageProfileHydrate (single source of truth).
  const errorLog = createErrorHandler('useProfile');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', 'core', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, preferred_language, email, user_type, owner_type, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        errorLog.silent(error, 'fetch_profile');
        throw error;
      }

      return data as UserProfile | null;
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
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'core', user?.id] });
      // Language sync intentionally NOT done here — LanguageProfileHydrate is
      // the single source of truth for UI ↔ profile language sync. Doing it
      // here too caused the UI language to flip back unexpectedly after
      // unrelated profile saves.
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
