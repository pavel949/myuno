import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildAuthPath } from '@/lib/auth/redirectToAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * MC workspace guard — allows access only to users who are members
 * of at least one management_company (via management_company_members).
 * Verifies user has a valid activeCompany, not just any membership.
 * Admins always pass through.
 */
export function MCGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading: contextLoading } = useResolvedContext();
  const { companies, activeCompany, isLoading: companiesLoading } = useActiveCompany();

  if (authLoading || contextLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={buildAuthPath({ from: `${location.pathname}${location.search}${location.hash}` })} state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }

  // Server-resolved admin access
  if (context?.role === 'admin') {
    return <>{children}</>;
  }

  // No companies — redirect to onboarding
  if (companies.length === 0) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  // Has companies but activeCompany couldn't be resolved (e.g. stored ID from another company)
  if (!activeCompany) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  return <>{children}</>;
}
