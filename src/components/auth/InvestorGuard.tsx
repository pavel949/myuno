import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * Investor workspace guard — gates investor-only surfaces (`/capital`,
 * `/invest/dashboard`, `/invest/ops/*`).
 *
 * Access rule: a **server-resolved** role is required —
 *   admin / uno_team / capital_team / investor (from `useResolvedContext`).
 *
 * P5 hardening (audit AUDIT.md): the previous fallback that granted access when
 * the runtime persona stack contained `investor` was removed. That persona is
 * self-assignable client-side (`user_personas` is a client-writable table via
 * `useUserPersonas`, and guest personas live in localStorage), so it made this
 * confidential Tier-3 surface reachable by anyone who toggled a persona.
 * This guard is UI-gating only — the authoritative control is RLS on the
 * underlying `capital_*` / `investment_deals` tables and document buckets.
 *
 * Unauthed users are sent to `/auth` with the current path preserved.
 * Authed users without the role land on the public `/invest` marketing hub.
 */
export function InvestorGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading: contextLoading, isAdminMode } = useResolvedContext();

  if (authLoading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const serverRole = context?.role ?? null;
  const isPrivileged =
    isAdminMode ||
    serverRole === 'admin' ||
    serverRole === 'uno_team' ||
    serverRole === 'capital_team' ||
    serverRole === 'investor';

  if (isPrivileged) {
    return <>{children}</>;
  }

  return <Navigate to="/invest" replace />;
}
