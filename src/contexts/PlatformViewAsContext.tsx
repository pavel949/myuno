/**
 * Admin-only "view as" hint: records audit rows via log_platform_impersonation RPC.
 * Does not change auth.uid(); RLS still applies to the signed-in admin.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const STORAGE_KEY = 'myuno:platform-view-as';

export interface PlatformViewAsState {
  targetUserId: string | null;
  targetEmail: string | null;
}

interface PlatformViewAsContextValue extends PlatformViewAsState {
  isActive: boolean;
  enter: (targetUserId: string, targetEmail?: string | null, note?: string | null) => Promise<void>;
  exit: () => Promise<void>;
}

const PlatformViewAsContext = createContext<PlatformViewAsContextValue>({
  targetUserId: null,
  targetEmail: null,
  isActive: false,
  enter: async () => {},
  exit: async () => {},
});

export function PlatformViewAsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [state, setState] = useState<PlatformViewAsState>({
    targetUserId: null,
    targetEmail: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlatformViewAsState;
        if (parsed?.targetUserId) setState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: PlatformViewAsState) => {
    setState(next);
    try {
      if (next.targetUserId) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const enter = useCallback(
    async (targetUserId: string, targetEmail?: string | null, note?: string | null) => {
      if (!user?.id || !isAdmin) return;
      try {
        const rpc = supabase.rpc as unknown as (
          name: string,
          args: Record<string, unknown>
        ) => ReturnType<typeof supabase.rpc>;
        await rpc('log_platform_impersonation', {
          p_target_user_id: targetUserId,
          p_action: 'enter',
          p_note: note ?? targetEmail ?? null,
        });
      } catch {
        // audit is best-effort
      }
      persist({ targetUserId, targetEmail: targetEmail ?? null });
    },
    [user?.id, isAdmin, persist]
  );

  const exit = useCallback(async () => {
    if (!user?.id || !isAdmin) {
      persist({ targetUserId: null, targetEmail: null });
      return;
    }
    try {
      const rpc = supabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>
      ) => ReturnType<typeof supabase.rpc>;
      await rpc('log_platform_impersonation', {
        p_target_user_id: null,
        p_action: 'exit',
        p_note: null,
      });
    } catch {
      /* ignore */
    }
    persist({ targetUserId: null, targetEmail: null });
  }, [user?.id, isAdmin, persist]);

  const value = useMemo(
    () => ({
      ...state,
      isActive: Boolean(state.targetUserId),
      enter,
      exit,
    }),
    [state, enter, exit]
  );

  return (
    <PlatformViewAsContext.Provider value={value}>{children}</PlatformViewAsContext.Provider>
  );
}

export function usePlatformViewAs() {
  return useContext(PlatformViewAsContext);
}
