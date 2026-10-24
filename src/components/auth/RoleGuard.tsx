import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildAuthPath } from '@/lib/auth/redirectToAuth';
import { useAuth } from '@/contexts/AuthContext';
import { type AppRole } from '@/hooks/useUserContext';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { AccessDenied } from './AccessDenied';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { AccessVerificationBoundary } from './AccessVerificationBoundary';

/** Replace an unbounded spinner with recovery if a current check never settles. */
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
 * Uses Airbnb-style "soft" navigation — allows navigation when the **server-resolved**
 * role/permissions (`useResolvedContext`) match `allowedRoles`, not merely the last
 * client-switched `active_role`. Wildcard `*` permission also grants access.
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
  const { context, isLoading: resolvedLoading, isVerifying: contextVerifying, permissions, error: resolvedError, refetch: retryContext } = useResolvedContext();

  const { language } = useLanguage();

  const actorId = user?.id ?? null;
  const contextReady = !resolvedLoading && !contextVerifying;
  const authReady = !authLoading;
  const allReady = authReady && contextReady;
  const [retryAttempt, setRetryAttempt] = useState(0);
  const verification = useMemo(() => ({ actorId, pending: !allReady, retryAttempt }), [actorId, allReady, retryAttempt]);
  const [deadline, setDeadline] = useState({ verification, expired: false });
  const waitDeadlinePassed = deadline.verification === verification && deadline.expired;

  useEffect(() => {
    setDeadline({ verification, expired: false });
    if (!verification.pending) return;
    const id = window.setTimeout(() => setDeadline({ verification, expired: true }), ROLE_GUARD_MAX_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [verification]);

  const verificationUnavailable = () => <div role="alert" className="min-h-[12rem] flex flex-col items-center justify-center gap-4 p-6 text-center">
    <p>{pickLang(language, { en: 'Could not verify access. Please try again.', ru: 'Не удалось проверить доступ. Повторите попытку.', th: 'ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองอีกครั้ง' })}</p>
    <button type="button" style={{ minHeight: 44, minWidth: 44 }} className="underline underline-offset-4" onClick={() => {
      // A role query cannot restart an unresolved authentication bootstrap.
      if (authLoading) { window.location.reload(); return; }
      setRetryAttempt(value => value + 1);
      void retryContext();
    }}>
      {pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
    </button>
  </div>;

  // Only a previously admitted, unchanged identity can retain mounted state.
  // Pending content is hidden/inert, never usable as cached authorization.
  const identity = JSON.stringify([actorId, context?.mode, context?.entity_id, context?.role, permissions, allowedRoles, location.pathname]);
  const protectedPage = (pending: boolean) => <AccessVerificationBoundary
    identity={identity} pending={pending}
    fallback={waitDeadlinePassed ? verificationUnavailable() : <LoadingState />}
  >{children}</AccessVerificationBoundary>;
  if (!allReady) {
    if (user && !authLoading && !resolvedLoading && !resolvedError && context) return protectedPage(true);
    return waitDeadlinePassed ? verificationUnavailable() : <LoadingState />;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={buildAuthPath({ from: `${location.pathname}${location.search}${location.hash}` })} state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }

  if (resolvedError) return verificationUnavailable();

  // Server-resolved admin always passes
  if (context?.role === 'admin') {
    return protectedPage(false);
  }

  // Check if user's server-resolved role matches any allowed role.
  // Also grant access when the user holds the wildcard permission ('*') or
  // a permission matching an allowed role name, so MC members with broad
  // permissions can navigate freely.
  const serverRole = context?.role;
  const hasAllowedRole = allowedRoles.some(role =>
    role === serverRole ||
    (serverRole !== 'uno_team' && permissions.includes('*')) ||
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

  return protectedPage(false);
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
    <RoleGuard allowedRoles={['admin']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

/**
 * Staff route guard - requires staff, admin, or uno_team role (MC employees)
 */
export function StaffGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['staff', 'admin']} fallbackPath="/">
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
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to={buildAuthPath({ from: `${location.pathname}${location.search}${location.hash}` })} state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }

  return <>{children}</>;
}
