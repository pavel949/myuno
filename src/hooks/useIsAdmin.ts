/**
 * useIsAdmin - Centralized admin check hook
 * ★ SINGLE SOURCE OF TRUTH for admin role verification ★
 * 
 * ALL admin checks MUST use this hook. Do NOT create parallel admin-check hooks.
 * useAdminCheck() in useAdmin.ts re-exports this hook for backward compatibility.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UseIsAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
}

// Cache admin status to avoid repeated DB calls.
// Entries carry a timestamp and expire after ADMIN_CACHE_TTL_MS so a role
// granted mid-session (or a has_role RPC that resolved before the role row
// committed on first login) is re-validated instead of being pinned for the
// whole tab lifetime.
const ADMIN_CACHE_TTL_MS = 60_000;
const adminCache = new Map<string, { value: boolean; ts: number }>();

export function useIsAdmin(): UseIsAdminResult {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      // Check cache first (honour TTL — re-validate expired entries)
      const cached = adminCache.get(user.id);
      if (cached && Date.now() - cached.ts < ADMIN_CACHE_TTL_MS) {
        if (isMounted) {
          setIsAdmin(cached.value);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (error) throw error;

        const adminStatus = data === true;
        adminCache.set(user.id, { value: adminStatus, ts: Date.now() });
        
        if (isMounted) setIsAdmin(adminStatus);
      } catch {
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAdmin();
    return () => { isMounted = false; };
  }, [user]);

  return { isAdmin, isLoading };
}

/**
 * Clear admin cache (call on logout)
 */
export function clearAdminCache() {
  adminCache.clear();
}

/**
 * @deprecated Use useIsAdmin() directly. This alias exists for backward compatibility.
 */
export const useAdminCheck = useIsAdmin;
