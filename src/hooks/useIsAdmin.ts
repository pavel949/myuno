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

// Cache admin status to avoid repeated DB calls
const adminCache = new Map<string, boolean>();

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

      // Check cache first
      if (adminCache.has(user.id)) {
        if (isMounted) {
          setIsAdmin(adminCache.get(user.id)!);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (error) throw error;
        
        const adminStatus = data === true;
        adminCache.set(user.id, adminStatus);
        
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
