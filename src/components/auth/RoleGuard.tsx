import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { AccessDenied } from './AccessDenied';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallbackPath?: string;
  /** If true, shows AccessDenied page instead of redirecting */
  showAccessDenied?: boolean;
}

/**
 * Route guard component that checks authentication and role permissions.
 * Uses Airbnb-style "soft" navigation - checks if user HAS the role, not active role.
 * This allows users with multiple roles to freely navigate between dashboards.
 * 
 * When showAccessDenied is true, displays an informative access denied page
 * instead of silently redirecting, helping users understand why they can't access.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/',
  showAccessDenied = true,
}: RoleGuardProps) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: contextLoading } = useUserContext();

  // Show loading while checking auth/context
  if (authLoading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has any of the allowed roles (Airbnb-style: check ownership, not active role)
  const hasAllowedRole = allowedRoles.some(role => hasRole(role));

  if (!hasAllowedRole) {
    // Show informative access denied page instead of redirect
    if (showAccessDenied) {
      return (
        <AccessDenied 
          requiredRoles={allowedRoles} 
          currentPath={location.pathname}
        />
      );
    }
    // Fallback to redirect behavior
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * HOC to wrap a component with role guard
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: AppRole[],
  fallbackPath?: string
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallbackPath={fallbackPath}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Admin route guard - requires admin, staff, or uno_team role
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'staff', 'uno_team']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

/**
 * Vendor route guard - requires vendor or admin role
 */
export function VendorGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['vendor', 'admin']} fallbackPath="/vendor/onboarding">
      {children}
    </RoleGuard>
  );
}

/**
 * Owner route guard - requires owner or admin role
 */
export function OwnerGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['owner', 'property_owner', 'property_manager', 'admin']} fallbackPath="/owner/onboarding">
      {children}
    </RoleGuard>
  );
}

/**
 * UNO Team route guard - requires uno_team or admin role
 */
export function TeamGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['uno_team', 'admin']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

/**
 * Auth guard - just requires authentication, no specific role
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
