/**
 * Hook for developer portal — checks if current user is a developer
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DeveloperProfile {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string | null;
  logo_url: string | null;
  description_en: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  subscription_tier: string | null;
  user_id: string | null;
}

export function useDeveloperProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['developer-profile', user?.id],
    queryFn: async (): Promise<DeveloperProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name_en: data.name_en,
        name_ru: data.name_ru,
        slug: data.slug,
        logo_url: data.logo_url,
        description_en: data.description_en,
        website: data.website,
        phone: data.phone,
        email: data.email,
        is_verified: data.is_verified,
        subscription_tier: data.subscription_tier,
        user_id: data.user_id,
      };
    },
    enabled: !!user,
  });
}

export function useDeveloperProjects(developerId?: string) {
  return useQuery({
    queryKey: ['developer-projects', developerId],
    queryFn: async () => {
      if (!developerId) return [];
      const { data, error } = await supabase
        .from('property_projects')
        .select('*')
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!developerId,
  });
}

export function useApplyAsDeveloper() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name_en: string; name_ru: string; email?: string; phone?: string; website?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const slug = data.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error } = await supabase.from('developers').insert({
        ...data,
        user_id: user.id,
        slug,
        is_active: true,
        is_verified: false,
        is_featured: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['developer-profile'] });
      toast.success('Заявка отправлена');
    },
    onError: () => toast.error('Ошибка при создании'),
  });
}
