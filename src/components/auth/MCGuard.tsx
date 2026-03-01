import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useUserContext } from '@/hooks/useUserContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * MC workspace guard — allows access only to users who are members
 * of at least one management_company (via management_company_members).
 * Admins always pass through.
 * If no companies — redirects to MC onboarding.
 */
export function MCGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: contextLoading } = useUserContext();
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

  // Admins always have access
  if (hasRole('admin')) {
    return <>{children}</>;
  }

  // No companies — redirect to onboarding
  if (companies.length === 0) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  return <>{children}</>;
}
