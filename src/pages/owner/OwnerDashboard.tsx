import { Suspense, lazy } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { 
  QuickActionsBar,
  PortfolioSection,
  OperationsSection,
  FinancesSummary,
  CommunicationsSection,
  OwnerPerformanceCard,
  BookingSearchBar,
  ActiveStaysWidget,
} from '@/components/owner/dashboard';

// Skeleton components for each section
function SearchBarSkeleton() {
  return <Skeleton className="h-12 w-full rounded-xl" />;
}

function QuickActionsSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-16 w-20 rounded-xl flex-shrink-0" />
      ))}
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

function OperationsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function FinancesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

function PerformanceSkeleton() {
  return <Skeleton className="h-32 w-full rounded-xl" />;
}

function ActiveStaysSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        <Skeleton className="h-28 w-72 rounded-xl shrink-0" />
        <Skeleton className="h-28 w-72 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

function CommunicationsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isRu ? 'UNO Property Care' : 'UNO Property Care'}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {isRu 
            ? 'Управляйте своей недвижимостью на Пхукете профессионально' 
            : 'Manage your Phuket property professionally'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => navigate('/auth')} size="lg" className="h-12">
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth?mode=signup')} size="lg" className="h-12">
            {isRu ? 'Создать аккаунт' : 'Create Account'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Ownership Invites Banner */}
      <OwnershipInviteBanner />

      {/* Global Booking Search */}
      <Suspense fallback={<SearchBarSkeleton />}>
        <BookingSearchBar />
      </Suspense>

      {/* Quick Actions - horizontal scroll */}
      <Suspense fallback={<QuickActionsSkeleton />}>
        <QuickActionsBar />
      </Suspense>

      {/* Active Stays Widget - Airbnb style "Who's staying now" */}
      <Suspense fallback={<ActiveStaysSkeleton />}>
        <ActiveStaysWidget />
      </Suspense>

      {/* Portfolio Section - Hero with properties */}
      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioSection />
      </Suspense>

      {/* Performance Metrics - Airbnb style */}
      <Suspense fallback={<PerformanceSkeleton />}>
        <OwnerPerformanceCard />
      </Suspense>

      {/* Operations Section - Today's tasks */}
      <Suspense fallback={<OperationsSkeleton />}>
        <OperationsSection />
      </Suspense>

      {/* Finances Summary */}
      <Suspense fallback={<FinancesSkeleton />}>
        <FinancesSummary />
      </Suspense>

      {/* Communications Section */}
      <Suspense fallback={<CommunicationsSkeleton />}>
        <CommunicationsSection />
      </Suspense>
    </div>
  );
}
