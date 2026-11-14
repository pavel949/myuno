import { useOwnerType } from '@/hooks/useOwnerType';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

/** Guards /my-property routes after authentication and owner-type resolution. */
export function MCPortalGuard({ children }: { children: React.ReactNode }) {
  const { isLoading } = useOwnerType();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
