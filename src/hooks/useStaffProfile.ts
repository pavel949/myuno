import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useStaffProfile');

import { getStoredLang as getLang } from '@/lib/languageConfig';

import { toast } from 'sonner';
export interface StaffProfile {
  id: string;
  user_id: string;
  display_name: string;
  phone: string | null;
  photo: string | null;
  bio: string | null;
  service_types: string[];
  languages: string[];
  avg_rating: number;
  total_reviews: number;
  completed_tasks: number;
  is_available: boolean;
  working_hours: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useStaffProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['staff-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as StaffProfile | null;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('staff_profiles')
        .update(updates as never)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profile'] });
      const isRu = getLang() === 'ru';
      toast(isRu ? 'Профиль обновлён' : 'Profile updated');
    },
    onError: (error) => {
      errorLog.error(error, 'update_profile', {
        toastTitle: 'Update Failed',
        toastTitleRu: 'Ошибка обновления',
        toastDescription: 'Failed to update profile',
        toastDescriptionRu: 'Не удалось обновить профиль',
      });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_available: !profile.is_available })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profile'] });
    },
    onError: (error) => {
      errorLog.error(error, 'toggle_availability');
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
    toggleAvailability,
  };
}

export function useAllStaffProfiles() {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['all-staff-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });
      
      if (error) throw error;
      return data as StaffProfile[];
    },
  });

  const availableStaff = profiles.filter(p => p.is_available);

  return {
    profiles,
    availableStaff,
    isLoading,
  };
}
