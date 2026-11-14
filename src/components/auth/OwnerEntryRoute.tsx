import { Navigate, useLocation } from 'react-router-dom';
import { useOwnerType } from '@/hooks/useOwnerType';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/**
 * Canonical entry for legacy owner links.
 * MC-portal owners keep the existing MC setup flow; self-managed owners use
 * the owner property workspace instead of being sent to the MC-only shell.
 */
export function OwnerEntryRoute() {
  const location = useLocation();
  const { isMCPortal, isLoading } = useOwnerType();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const target = isMCPortal ? '/mc/setup' : '/my-property';
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}
