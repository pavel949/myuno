import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { type AppRole } from '@/hooks/useUserContext';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { AccessDenied } from './AccessDenied';

/** Stop blocking the shell if Supabase/React Query never settles (offline, hung RPC). */
const ROLE_GUARD_MAX_WAIT_MS = 12_000;

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
  const { context, isLoading: resolvedLoading, permissions } = useResolvedContext();

  const [waitDeadlinePassed, setWaitDeadlinePassed] = useState(false);

  useEffect(() => {
    setWaitDeadlinePassed(false);
    const id = window.setTimeout(() => setWaitDeadlinePassed(true), ROLE_GUARD_MAX_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [user?.id]);

  const contextReady = !resolvedLoading;
  const authReady = !authLoading;
  const allReady = authReady && contextReady;

  // Show loading while checking auth/context, unless we hit the deadline (then fall through with best-effort roles)
  if (!allReady && !waitDeadlinePassed) {
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

  // Server-resolved admin always passes
  if (context?.role === 'admin' || context?.role === 'uno_team') {
    return <>{children}</>;
  }

  // Check if user's server-resolved role matches any allowed role.
  // Also grant access when the user holds the wildcard permission ('*') or
  // a permission matching an allowed role name, so MC members with broad
  // permissions can navigate freely.
  const serverRole = context?.role;
  const hasAllowedRole = allowedRoles.some(role =>
    role === serverRole ||
    permissions.includes('*') ||
    permissions.includes(role)
  );

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
 * Admin route guard - requires admin or uno_team role (platform-level access)
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'uno_team']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

/**
 * Staff route guard - requires staff, admin, or uno_team role (MC employees)
 */
export function StaffGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['staff', 'admin', 'uno_team']} fallbackPath="/">
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
    <RoleGuard allowedRoles={['owner', 'property_manager', 'admin']} fallbackPath="/owner/onboarding">
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
