/**
 * useEffectiveDeveloperProfile — drop-in for useDeveloperProfile() that respects
 * admin impersonation. When an admin is impersonating a developer, returns that
 * developer's profile instead of the admin's own.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import type { DeveloperProfile } from '@/hooks/useDeveloperPortal';

export function useEffectiveDeveloperProfile() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { developerId } = useImpersonation();

  const impersonating = isAdmin && !!developerId;

  return useQuery({
    queryKey: ['developer-profile-effective', user?.id, impersonating ? developerId : 'self'],
    queryFn: async (): Promise<DeveloperProfile | null> => {
      if (!user) return null;

      let query = supabase.from('developers').select('*');
      if (impersonating) {
        query = query.eq('id', developerId!);
      } else {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name_en: data.name_en,
        name_ru: data.name_ru,
        slug: data.slug,
        logo_url: data.logo_url,
        cover_image: data.cover_image ?? null,
        description_en: data.description_en,
        description_ru: (data as Record<string, unknown>).description_ru as string | null ?? null,
        website: data.website,
        phone: data.phone,
        email: data.email,
        founded_year: (data as Record<string, unknown>).founded_year as number | null ?? null,
        is_verified: data.is_verified ?? false,
        subscription_tier: (data as Record<string, unknown>).subscription_tier as string || 'free',
        user_id: (data as Record<string, unknown>).user_id as string | null,
        devmod_status: (data as Record<string, unknown>).devmod_status as string | null ?? null,
      };
    },
    enabled: !!user,
  });
}
