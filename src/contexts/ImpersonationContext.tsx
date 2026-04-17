/**
 * ImpersonationContext — admin "Pavel mode" for acting as a developer.
 *
 * Stored in sessionStorage so the impersonation banner survives reloads
 * but doesn't leak across browser sessions. Only platform admins can set it
 * (UI gate via useIsAdmin); the DB still enforces real RLS based on the
 * admin's auth.uid(), so this is a UX/scoping helper, not a privilege grant.
 *
 * Usage:
 *   const { developerId, enter, exit } = useImpersonation();
 *   useEffectiveDeveloperProfile() — drop-in for useDeveloperProfile()
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'myuno:impersonate_dev';

interface ImpersonationState {
  developerId: string | null;
  developerName: string | null;
}

interface ImpersonationContextValue extends ImpersonationState {
  enter: (developerId: string, developerName: string) => Promise<void>;
  exit: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  developerId: null,
  developerName: null,
  enter: async () => {},
  exit: () => {},
});

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ImpersonationState>({ developerId: null, developerName: null });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const enter = useCallback(async (developerId: string, developerName: string) => {
    const next = { developerId, developerName };
    setState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
    // Best-effort audit log; don't block UX if it fails
    if (user?.id) {
      try {
        await supabase.from('developer_impersonation_log').insert({
          admin_id: user.id,
          developer_id: developerId,
          action: 'enter',
          context: { url: typeof window !== 'undefined' ? window.location.pathname : null },
        });
      } catch {
        // ignore audit failure
      }
    }
  }, [user?.id]);

  const exit = useCallback(() => {
    setState({ developerId: null, developerName: null });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ ...state, enter, exit }), [state, enter, exit]);

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
