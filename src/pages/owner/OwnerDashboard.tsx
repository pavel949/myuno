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
import { motion } from 'framer-motion';
import { useIsDesktop } from '@/hooks/use-desktop';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { ActiveStaysWidget } from '@/components/owner/dashboard/ActiveStaysWidget';
import { OwnerPropertiesList } from '@/components/owner/dashboard/OwnerPropertiesList';
import { OwnerOperationsFlat } from '@/components/owner/dashboard/OwnerOperationsFlat';
import { OwnerDashboardMenu } from '@/components/owner/dashboard/OwnerDashboardMenu';
import { ActiveDealsWidget } from '@/components/owner/dashboard/ActiveDealsWidget';
import { UpcomingPaymentsWidget } from '@/components/owner/dashboard/UpcomingPaymentsWidget';
import { CrmTasksWidget } from '@/components/owner/dashboard/CrmTasksWidget';
import { BusinessKPIWidget } from '@/components/owner/dashboard/BusinessKPIWidget';
import { RevenueInsightsWidget } from '@/components/owner/dashboard/RevenueInsightsWidget';
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
    case 'revenue_insights':
      return (
        <Suspense fallback={<SectionSkeleton />}>
          <RevenueInsightsWidget />
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
  const isDesktop = useIsDesktop();
  const { role, setRole, config } = useBusinessRole();

  // On desktop, filter out 'menu' widget since sidebar already provides navigation
  const visibleWidgets = isDesktop
    ? config.widgets.filter((w) => w !== 'menu')
    : config.widgets;

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
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 space-y-5 overflow-x-hidden max-w-lg md:max-w-[1536px] mx-auto">
      {/* Header: Greeting + Role Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <DashboardGreeting roleConfig={config} />
        <BusinessRoleSwitcher activeRole={role} onRoleChange={setRole} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <RoleQuickActions role={role} />
      </motion.div>

      <Separator />

      {/* Composed Widgets — 2-column grid on desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
        {visibleWidgets.map((widgetKey, idx) => {
          // Full-width widgets on desktop
          const isFullWidth = widgetKey === 'kpi' || widgetKey === 'revenue_insights' || widgetKey === 'properties';
          return (
            <motion.div
              key={widgetKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
              className={isFullWidth ? 'md:col-span-2' : ''}
            >
              {idx > 0 && SEPARATOR_BEFORE.has(widgetKey) && !isDesktop && <Separator className="mb-6" />}
              <DashboardWidget widgetKey={widgetKey} role={role} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
