/**
 * After login, calls ensure_multi_role_qa_bundle() once per browser tab session.
 * Server-side config (qa_multi_role_auto_config) decides if grants apply; idempotent.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_PREFIX = 'qa_multi_role_bundle_checked:';

export function useEnsureMultiRoleQaBundle() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !session || typeof window === 'undefined') return;

    const storageKey = `${STORAGE_PREFIX}${user.id}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');

    void (async () => {
      try {
        // Guard against undefined supabase.rpc (can happen if client init races).
        if (!supabase || typeof supabase.rpc !== 'function') return;
        // RPC name not yet in generated types — cast to bypass strict union.
        const rpc = supabase.rpc.bind(supabase) as unknown as (name: string) => Promise<{ data: unknown; error: { message: string } | null }>;
        const { data, error } = await rpc('ensure_multi_role_qa_bundle');
        if (error) {
          console.warn('ensure_multi_role_qa_bundle', error.message);
          return;
        }
        const row = data as { applied?: boolean } | null;
        if (row?.applied) {
          await queryClient.invalidateQueries({ queryKey: ['resolved-context', user.id] });
          await queryClient.invalidateQueries({ queryKey: ['user-roles'] });
          await queryClient.invalidateQueries({ queryKey: ['user-active-context'] });
        }
      } catch (err) {
        console.warn('ensure_multi_role_qa_bundle threw', err);
      }
    })();
  }, [session, user?.id, queryClient]);
}
