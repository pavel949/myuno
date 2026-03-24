/**
 * Index — LifeOS Dashboard
 *
 * Clean, calm, confident layout:
 * 1. Hero (greeting + weather + loyalty)
 * 2. Quick Actions (8 role-adaptive shortcuts)
 * 3. Smart tip (contextual, dismissable)
 * 4. Products (marketplace carousel)
 * 5. Services (photo cards — non-duplicate categories)
 * 6. Support (concierge + compact emergency)
 * 7. Trust
 */
import React, { useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { usePostOrderReview } from '@/hooks/usePostOrderReview';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAuth } from '@/contexts/AuthContext';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/utils';

const HeroBlock = lazy(() => import('@/components/home/HeroBlock').then((m) => ({ default: m.HeroBlock })));
const QuickActionsGrid = lazy(() => import('@/components/home/QuickActionsGrid').then((m) => ({ default: m.QuickActionsGrid })));
const ActiveSituationBanner = lazy(() => import('@/components/life-os/ActiveSituationBanner').then((m) => ({ default: m.ActiveSituationBanner })));
const InstallBanner = lazy(() => import('@/components/pwa/InstallBanner').then((m) => ({ default: m.InstallBanner })));
const HomeProductsSection = lazy(() => import('@/components/home/HomeProductsSection').then((m) => ({ default: m.HomeProductsSection })));
const PostOrderReviewPrompt = lazy(() => import('@/components/reviews/PostOrderReviewPrompt').then((m) => ({ default: m.PostOrderReviewPrompt })));
const LifecycleSmartTip = lazy(() => import('@/components/home/LifecycleSmartTip').then((m) => ({ default: m.LifecycleSmartTip })));
const DocumentExpiryNotifier = lazy(() => import('@/components/notifications/DocumentExpiryNotifier').then((m) => ({ default: m.DocumentExpiryNotifier })));
const PropertyTourBanner = lazy(() => import('@/components/home/PropertyTourBanner').then((m) => ({ default: m.PropertyTourBanner })));
const YourDayFeed = lazy(() => import('@/components/shared/YourDayFeed').then((m) => ({ default: m.YourDayFeed })));
const TodayEventsFeed = lazy(() => import('@/components/home/TodayEventsFeed').then((m) => ({ default: m.TodayEventsFeed })));
const PopularServicesStrip = lazy(() => import('@/components/home/PopularServicesStrip').then((m) => ({ default: m.PopularServicesStrip })));
const OfflineEmergencyCard = lazy(() => import('@/components/home/OfflineEmergencyCard').then((m) => ({ default: m.OfflineEmergencyCard })));
const ProactiveConcierge = lazy(() => import('@/components/home/ProactiveConcierge').then((m) => ({ default: m.ProactiveConcierge })));
const LifeOSStatusBlock = lazy(() => import('@/components/home/LifeOSStatusBlock'));
const ConciergeBanner = lazy(() => import('@/components/home/ConciergeBanner').then((m) => ({ default: m.ConciergeBanner })));
const TrustBanner = lazy(() => import('@/components/home/TrustBanner').then((m) => ({ default: m.TrustBanner })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then((m) => ({ default: m.OnboardingModal })));

function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-3xl border border-border/60 bg-card/60 shadow-sm',
        className,
      )}
    />
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <SectionSkeleton key={index} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

const Index = () => {
  const { activeCode } = useLifeSituationContext();
  const { user } = useAuth();
  const { isOffline } = useOfflineStatus();
  const isDesktop = useIsDesktop();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem('myuno-onboarding-complete') && !sessionStorage.getItem('myuno-onboarding-complete');
    } catch {
      return false;
    }
  });
  const { pendingReview, isOpen: reviewOpen, dismiss: dismissReview } = usePostOrderReview();

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshKey((prev) => prev + 1);
  }, []);

  const hasContext = !!activeCode;
  const isLoggedIn = !!user;

  return (
    <AppLayout showFooter>
      <SEOHead jsonLd={createOrganizationSchema()} />

      <Suspense fallback={null}>
        <DocumentExpiryNotifier />
      </Suspense>

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <ActiveSituationBanner />
      </Suspense>

      <div className="px-4 md:px-6 lg:px-8 xl:px-10 pt-3 w-full max-w-[1536px] mx-auto">
        <Suspense fallback={<SectionSkeleton className="h-14 rounded-2xl" />}>
          <InstallBanner />
        </Suspense>
      </div>

      <PullToRefresh onRefresh={handleRefresh} key={refreshKey}>
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 py-5 pb-20 md:pb-8 w-full max-w-[1536px] mx-auto space-y-6 lg:space-y-10 xl:space-y-14">
          <Suspense fallback={<SectionSkeleton className="h-[320px] sm:h-[380px]" />}>
            <HeroBlock />
          </Suspense>

          <RevealOnScroll>
            <Suspense fallback={<QuickActionsSkeleton />}>
              <QuickActionsGrid />
            </Suspense>
          </RevealOnScroll>

          {isLoggedIn ? (
            isDesktop ? (
              <>
                <Suspense fallback={<SectionSkeleton className="h-40" />}>
                  <YourDayFeed compact />
                </Suspense>

                <div className="grid grid-cols-2 gap-6">
                  <Suspense fallback={<SectionSkeleton className="h-56" />}>
                    <ProactiveConcierge />
                  </Suspense>

                  <div className="space-y-5">
                    <Suspense fallback={<SectionSkeleton className="h-40" />}>
                      <LifecycleSmartTip />
                    </Suspense>

                    {hasContext ? (
                      <Suspense fallback={<SectionSkeleton className="h-32" />}>
                        <LifeOSStatusBlock />
                      </Suspense>
                    ) : (
                      <Suspense fallback={<SectionSkeleton className="h-32" />}>
                        <ConciergeBanner />
                      </Suspense>
                    )}
                  </div>
                </div>

                <Suspense fallback={<SectionSkeleton className="h-44" />}>
                  <PropertyTourBanner />
                </Suspense>
              </>
            ) : (
              <>
                <Suspense fallback={<SectionSkeleton className="h-40" />}>
                  <YourDayFeed compact />
                </Suspense>
                <Suspense fallback={<SectionSkeleton className="h-56" />}>
                  <ProactiveConcierge />
                </Suspense>
                <Suspense fallback={<SectionSkeleton className="h-40" />}>
                  <LifecycleSmartTip />
                </Suspense>
                <Suspense fallback={<SectionSkeleton className="h-44" />}>
                  <PropertyTourBanner />
                </Suspense>
                {hasContext ? (
                  <Suspense fallback={<SectionSkeleton className="h-32" />}>
                    <LifeOSStatusBlock />
                  </Suspense>
                ) : (
                  <Suspense fallback={<SectionSkeleton className="h-32" />}>
                    <ConciergeBanner />
                  </Suspense>
                )}
              </>
            )
          ) : (
            <>
              <Suspense fallback={<SectionSkeleton className="h-40" />}>
                <TodayEventsFeed compact />
              </Suspense>
              <Suspense fallback={<SectionSkeleton className="h-36" />}>
                <PopularServicesStrip />
              </Suspense>
              <Suspense fallback={<SectionSkeleton className="h-44" />}>
                <PropertyTourBanner />
              </Suspense>
            </>
          )}

          <RevealOnScroll>
            <Suspense fallback={<SectionSkeleton className="h-[420px]" />}>
              <HomeProductsSection />
            </Suspense>
          </RevealOnScroll>

          {isOffline && (
            <RevealOnScroll>
              <Suspense fallback={<SectionSkeleton className="h-32" />}>
                <OfflineEmergencyCard compact />
              </Suspense>
            </RevealOnScroll>
          )}

          <RevealOnScroll>
            <Suspense fallback={<SectionSkeleton className="h-40" />}>
              <TrustBanner showEmergency />
            </Suspense>
          </RevealOnScroll>
        </div>
      </PullToRefresh>

      {pendingReview && (
        <Suspense fallback={null}>
          <PostOrderReviewPrompt
            open={reviewOpen}
            onClose={dismissReview}
            orderId={pendingReview.orderId}
            entityType={pendingReview.entityType}
            entityId={pendingReview.entityId}
            entityName={pendingReview.entityName}
          />
        </Suspense>
      )}
    </AppLayout>
  );
};

export default Index;
