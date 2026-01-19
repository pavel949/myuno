import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallbackPath?: string;
}

/**
 * Route guard component that checks authentication and role permissions.
 * Redirects to auth page if not authenticated, or fallback path if role not allowed.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/' 
}: RoleGuardProps) {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { activeRole, hasRole, isLoading: contextLoading } = useUserContext();

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

  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => hasRole(role));
  
  // Also check if active role is in allowed roles
  const isActiveRoleAllowed = allowedRoles.includes(activeRole);

  if (!hasAllowedRole && !isActiveRoleAllowed) {
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
 * Admin route guard - requires admin role
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

/**
 * Vendor route guard - requires vendor role
 */
export function VendorGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['vendor', 'admin']} fallbackPath="/vendor/onboarding">
      {children}
    </RoleGuard>
  );
}

/**
 * Owner route guard - requires owner role
 */
export function OwnerGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['owner', 'admin']} fallbackPath="/">
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
