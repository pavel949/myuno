/**
 * Developer Apply — smart redirect.
 * Sole entry point for developer registration is /developer-portal/onboarding.
 * Кept as a dedicated URL (legacy & marketing links) but immediately routes the
 * user to the appropriate place based on their state.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { APP_ROUTES } from '@/lib/config/routes';

export default function DeveloperApply() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: developer, isLoading: devLoading } = useDeveloperProfile();

  if (authLoading || devLoading) {
    return <NewbuildsLayout hideNav><LoadingState /></NewbuildsLayout>;
  }

  // Not logged in → auth, then back to onboarding
  if (!user) {
    return (
      <Navigate
        to={`${APP_ROUTES.AUTH}?redirect=${encodeURIComponent(APP_ROUTES.DEVELOPER_PORTAL_ONBOARDING)}`}
        replace
      />
    );
  }

  // Already approved → dashboard
  if (developer && developer.devmod_status === 'active') {
    return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL} replace />;
  }

  // Pending review → wait page
  if (developer && developer.devmod_status === 'pending') {
    return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL_PENDING} replace />;
  }

  // Otherwise (no profile yet OR draft) → wizard handles creation in step 1
  return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL_ONBOARDING} replace />;
}
