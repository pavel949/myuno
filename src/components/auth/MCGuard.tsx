import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * MC workspace guard — allows access only to users who are members
 * of at least one management_company (via management_company_members).
 * Uses server-resolved context for authorization.
 * Admins always pass through.
 * If no companies — redirects to MC onboarding.
 */
export function MCGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading: contextLoading, isAdminMode } = useResolvedContext();
  const { companies, isLoading: companiesLoading } = useActiveCompany();

  if (authLoading || contextLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Server-resolved admin access
  if (isAdminMode || context?.role === 'admin' || context?.role === 'uno_team') {
    return <>{children}</>;
  }

  // No companies — redirect to onboarding
  if (companies.length === 0) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  return <>{children}</>;
}
