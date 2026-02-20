import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessRole } from '@/hooks/useBusinessRole';
import { type DashboardWidgetKey } from '@/lib/businessRoles';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { ActiveStaysWidget } from '@/components/owner/dashboard/ActiveStaysWidget';
import { OwnerPropertiesList } from '@/components/owner/dashboard/OwnerPropertiesList';
import { OwnerOperationsFlat } from '@/components/owner/dashboard/OwnerOperationsFlat';
import { OwnerDashboardMenu } from '@/components/owner/dashboard/OwnerDashboardMenu';
import { ActiveDealsWidget } from '@/components/owner/dashboard/ActiveDealsWidget';
import { UpcomingPaymentsWidget } from '@/components/owner/dashboard/UpcomingPaymentsWidget';
import { CrmTasksWidget } from '@/components/owner/dashboard/CrmTasksWidget';
import { BusinessKPIWidget } from '@/components/owner/dashboard/BusinessKPIWidget';
import { BusinessRoleSwitcher } from '@/components/owner/dashboard/BusinessRoleSwitcher';
import { DashboardGreeting } from '@/components/owner/dashboard/DashboardGreeting';
import { RoleQuickActions } from '@/components/owner/dashboard/RoleQuickActions';

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

/** Maps widget keys to their React components */
function DashboardWidget({ widgetKey, role }: { widgetKey: DashboardWidgetKey; role?: import('@/lib/businessRoles').BusinessRole }) {
  switch (widgetKey) {
    case 'kpi':
      return (
        <Suspense fallback={<SectionSkeleton />}>
          <BusinessKPIWidget role={role} />
        </Suspense>
      );
    case 'invites':
      return <OwnershipInviteBanner />;
    case 'active_stays':
      return (
        <div data-tour="active-stays">
          <Suspense fallback={<SectionSkeleton />}>
            <ActiveStaysWidget />
          </Suspense>
        </div>
      );
    case 'properties':
      return (
        <div data-tour="properties">
          <Suspense fallback={<SectionSkeleton />}>
            <OwnerPropertiesList />
          </Suspense>
        </div>
      );
    case 'operations':
      return (
        <div data-tour="operations">
          <Suspense fallback={<SectionSkeleton />}>
            <OwnerOperationsFlat />
          </Suspense>
        </div>
      );
    case 'crm_tasks':
      return (
        <Suspense fallback={<SectionSkeleton />}>
          <CrmTasksWidget />
        </Suspense>
      );
    case 'upcoming_payments':
      return (
        <Suspense fallback={<SectionSkeleton />}>
          <UpcomingPaymentsWidget />
        </Suspense>
      );
    case 'active_deals':
      return (
        <div data-tour="deals">
          <Suspense fallback={<SectionSkeleton />}>
            <ActiveDealsWidget />
          </Suspense>
        </div>
      );
    case 'menu':
      return (
        <div data-tour="menu">
          <OwnerDashboardMenu />
        </div>
      );
    default:
      return null;
  }
}

/** Widgets that should have a separator before them */
const SEPARATOR_BEFORE: Set<DashboardWidgetKey> = new Set([
  'operations',
  'active_deals',
  'menu',
]);

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { role, setRole, config } = useBusinessRole();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{isRu ? 'Управление недвижимостью' : 'Property Management'}</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {isRu ? 'Профессиональное управление вашей недвижимостью на Пхукете' : 'Professional property management in Phuket'}
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
    <div className="px-4 pt-6 pb-24 space-y-5 overflow-x-hidden max-w-lg mx-auto">
      {/* Header: Greeting + Role Switcher */}
      <div className="space-y-4">
        <DashboardGreeting roleConfig={config} />
        <BusinessRoleSwitcher activeRole={role} onRoleChange={setRole} />
      </div>

      {/* Quick Actions */}
      <RoleQuickActions role={role} />

      <Separator />

      {/* Composed Widgets */}
      {config.widgets.map((widgetKey, idx) => (
        <div key={widgetKey}>
          {idx > 0 && SEPARATOR_BEFORE.has(widgetKey) && <Separator className="mb-6" />}
          <DashboardWidget widgetKey={widgetKey} role={role} />
        </div>
      ))}
    </div>
  );
}
