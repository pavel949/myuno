/**
 * useIsAdmin - Centralized admin check hook
 * ★ SINGLE SOURCE OF TRUTH for admin role verification ★
 * 
 * ALL admin checks MUST use this hook. Do NOT create parallel admin-check hooks.
 * useAdminCheck() in useAdmin.ts re-exports this hook for backward compatibility.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UseIsAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

// Cache admin status to avoid repeated DB calls.
// Entries carry a timestamp and expire after ADMIN_CACHE_TTL_MS so a role
// granted mid-session (or a has_role RPC that resolved before the role row
// committed on first login) is re-validated instead of being pinned for the
// whole tab lifetime.
const ADMIN_CACHE_TTL_MS = 60_000;
const adminCache = new Map<string, { value: boolean; ts: number }>();
let adminCacheGeneration = 0;

export function useIsAdmin(): UseIsAdminResult {
  const { user } = useAuth();
  const actorId = user?.id ?? null;
  const cacheGeneration = adminCacheGeneration;
  const [attempt, setAttempt] = useState(0);
  const token = useMemo(() => ({ actorId, cacheGeneration, attempt }), [actorId, cacheGeneration, attempt]);
  const currentToken = useRef(token);
  currentToken.current = token;
  const [check, setCheck] = useState({ token, isAdmin: false, isLoading: !!actorId, error: null as Error | null });

  const retry = useCallback(() => {
    if (!actorId) return;
    adminCache.delete(actorId);
    setAttempt(value => value + 1);
  }, [actorId]);

  useEffect(() => {
    let active = true;
    const isCurrent = () => active && currentToken.current === token && token.cacheGeneration === adminCacheGeneration;
    const checkAdmin = async () => {
      if (!token.actorId) {
        if (isCurrent()) setCheck({ token, isAdmin: false, isLoading: false, error: null });
        return;
      }
      const cached = adminCache.get(token.actorId);
      if (cached && Date.now() - cached.ts < ADMIN_CACHE_TTL_MS) {
        if (isCurrent()) setCheck({ token, isAdmin: cached.value, isLoading: false, error: null });
        return;
      }
      setCheck({ token, isAdmin: false, isLoading: true, error: null });
      try {
        const { data, error } = await supabase.rpc('has_role', { _user_id: token.actorId, _role: 'admin' });
        if (error) throw error;
        // A former actor, logout or unmount must invalidate both the visible
        // result and its cache write, including after a later same-ID login.
        if (!isCurrent()) return;
        const adminStatus = data === true;
        adminCache.set(token.actorId, { value: adminStatus, ts: Date.now() });
        setCheck({ token, isAdmin: adminStatus, isLoading: false, error: null });
      } catch (error) {
        if (!isCurrent()) return;
        const failure = error instanceof Error ? error : new Error(
          typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message : 'Administrator access could not be verified');
        setCheck({ token, isAdmin: false, isLoading: false, error: failure });
      }
    };
    void checkAdmin();
    return () => { active = false; };
  }, [user, token]);

  // Effects run after rendering. Bind the returned authority to this actor and
  // verification token during render, so no previous actor's true value leaks.
  const current = check.token === token && token.cacheGeneration === adminCacheGeneration;
  return {
    isAdmin: current ? check.isAdmin : false,
    isLoading: current ? check.isLoading : !!actorId,
    error: current ? check.error : null,
    retry,
  };
}

/**
 * Clear admin cache (call on logout)
 */
export function clearAdminCache() {
  adminCacheGeneration += 1;
  adminCache.clear();
}

/**
 * @deprecated Use useIsAdmin() directly. This alias exists for backward compatibility.
 */
export const useAdminCheck = useIsAdmin;
