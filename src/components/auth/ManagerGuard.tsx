/**
 * @module ManagerGuard
 * @description Route guard for Property Manager role
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { AccessDenied } from '@/components/auth/AccessDenied';

interface ManagerGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Route guard component that checks for property_manager role.
 * Shows AccessDenied page with clear explanation instead of silent redirect.
 */
export function ManagerGuard({ 
  children, 
  fallbackPath = '/',
}: ManagerGuardProps) {
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

  // Check if user has property_manager role
  // Also allow admin roles to access manager features
  const hasManagerAccess = hasRole('property_manager') || hasRole('admin') || hasRole('uno_team');

  if (!hasManagerAccess) {
    return (
      <AccessDenied 
        requiredRoles={['property_manager']} 
        currentPath={location.pathname}
      />
    );
  }

  return <>{children}</>;
}
