import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { OwnerType } from '@/hooks/useProfile';

export type { OwnerType };

interface UseOwnerTypeResult {
  ownerType: OwnerType | null;
  isSelfManaged: boolean;
  isMCPortal: boolean;
  /** Default path to send this owner after login */
  defaultPath: string;
  isLoading: boolean;
  /** Update stored owner_type (e.g. when MC activates portal) */
  setOwnerType: (type: OwnerType) => Promise<void>;
}

export function useOwnerType(): UseOwnerTypeResult {
  const { user } = useAuth();

  const { data: ownerType, isLoading } = useQuery<OwnerType | null>({
    queryKey: ['owner-type', user?.id],
    queryFn: async (): Promise<OwnerType | null> => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from('profiles')
        .select('owner_type')
        .eq('id', user.id)
        .maybeSingle();

      return (data?.owner_type as OwnerType | null) ?? 'self_managed';
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const setOwnerType = async (type: OwnerType) => {
    if (!user?.id) return;
    await supabase
      .from('profiles')
      .update({ owner_type: type })
      .eq('id', user.id);
  };

  const resolved = ownerType ?? null;

  return {
    ownerType: resolved,
    isSelfManaged: resolved !== 'mc_portal',
    isMCPortal: resolved === 'mc_portal',
    defaultPath: resolved === 'mc_portal' ? '/my-property' : '/mc',
    isLoading,
    setOwnerType,
  };
}
