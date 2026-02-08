import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { ActiveStaysWidget } from '@/components/owner/dashboard/ActiveStaysWidget';
import { OwnerPropertiesList } from '@/components/owner/dashboard/OwnerPropertiesList';
import { OwnerOperationsFlat } from '@/components/owner/dashboard/OwnerOperationsFlat';
import { OwnerDashboardMenu } from '@/components/owner/dashboard/OwnerDashboardMenu';

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
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
        <h2 className="text-2xl font-bold mb-2">UNO Property Care</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {isRu ? 'Управляйте своей недвижимостью на Пхукете профессионально' : 'Manage your Phuket property professionally'}
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
    <div className="px-4 pt-6 pb-24 space-y-8 overflow-x-hidden max-w-lg mx-auto">
      {/* Invites */}
      <OwnershipInviteBanner />

      {/* Active Stays — contextual, like Airbnb "Currently hosting" */}
      <Suspense fallback={<SectionSkeleton />}>
        <ActiveStaysWidget />
      </Suspense>

      {/* Properties — Airbnb "Your listings" style, grouped by status */}
      <Suspense fallback={<SectionSkeleton />}>
        <OwnerPropertiesList />
      </Suspense>

      <Separator />

      {/* Today's Operations — flat list, status-dot style */}
      <Suspense fallback={<SectionSkeleton />}>
        <OwnerOperationsFlat />
      </Suspense>

      <Separator />

      {/* Menu — flat Airbnb style */}
      <OwnerDashboardMenu />
    </div>
  );
}
