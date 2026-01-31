import { useEffect, Suspense, lazy } from 'react';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { GuidedTour } from '@/components/demo/GuidedTour';
import { useDemoMode } from '@/hooks/useDemoMode';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load Index to prevent chunk loading errors from crashing demo
const Index = lazy(() => import('@/pages/Index'));

const DemoFallback = () => (
  <div className="px-4 py-8 space-y-4">
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-12 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

export default function DemoHome() {
  const { trackDemoAction } = useDemoMode();

  useEffect(() => {
    trackDemoAction('demo_home_viewed');
  }, [trackDemoAction]);

  return (
    <>
      <DemoBanner />
      <div className="pt-10">
        <ErrorBoundary>
          <Suspense fallback={<DemoFallback />}>
            <Index />
          </Suspense>
        </ErrorBoundary>
      </div>
      <GuidedTour autoStart={false} />
    </>
  );
}
