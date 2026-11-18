import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EMPTY_SOCIAL_LINKS, normalizeSocialUrl, PLATFORM_SOCIAL_QUERY_KEY, PLATFORM_SOCIAL_SETTING, readSocialLinks, SOCIAL_NETWORKS } from '@/lib/social/platformSocialLinks';

/** Exact public metadata key; never a wildcard settings read or an authorization source. */
export function usePlatformSocialLinks() {
  return useQuery({
    queryKey: PLATFORM_SOCIAL_QUERY_KEY,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('key, value').eq('key', PLATFORM_SOCIAL_SETTING).maybeSingle();
      if (error) throw error;
      if (!data) return { ...EMPTY_SOCIAL_LINKS };
      if (data.key !== PLATFORM_SOCIAL_SETTING) throw new Error('Unexpected public setting');
      const values = readSocialLinks(data.value);
      return Object.fromEntries(SOCIAL_NETWORKS.map(network => [network, normalizeSocialUrl(network, values[network]) || '']));
    },
  });
}
