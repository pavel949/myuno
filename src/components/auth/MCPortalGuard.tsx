import { Navigate } from 'react-router-dom';
import { useOwnerType } from '@/hooks/useOwnerType';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * Guards /my-property routes — only mc_portal owners may enter.
 * Self-managing owners (owner_type = 'self_managed') are redirected to /mc.
 */
export function MCPortalGuard({ children }: { children: React.ReactNode }) {
  const { isMCPortal, isSelfManaged, isLoading } = useOwnerType();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isSelfManaged) {
    return <Navigate to="/mc" replace />;
  }

  return <>{children}</>;
}
