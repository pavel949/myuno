import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * Investor workspace guard — gates investor-only surfaces (`/capital`,
 * `/invest/dashboard`, `/invest/ops/*`).
 *
 * Access rule (any one is enough):
 *   - admin / uno_team / capital_team / investor server-resolved role
 *   - runtime persona stack contains `investor`
 *
 * Unauthed users are sent to `/auth` with the current path preserved.
 * Authed users without the role/persona land on the public `/invest`
 * marketing hub instead of an empty workspace.
 */
export function InvestorGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading: contextLoading, isAdminMode } = useResolvedContext();
  const { personas, isLoading: personasLoading } = useUserPersonas();

  if (authLoading || contextLoading || personasLoading) {
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

  const hasInvestorPersona = personas.includes('investor');

  if (isPrivileged || hasInvestorPersona) {
    return <>{children}</>;
  }

  return <Navigate to="/invest" replace />;
}
