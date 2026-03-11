import { Suspense, useState } from 'react';
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
import { DashboardFilterProvider } from '@/contexts/DashboardFilterContext';
import { ActiveStaysWidget } from '@/components/owner/dashboard/ActiveStaysWidget';
import { OwnerPropertiesList } from '@/components/owner/dashboard/OwnerPropertiesList';
import { OwnerOperationsFlat } from '@/components/owner/dashboard/OwnerOperationsFlat';
import { ActiveDealsWidget } from '@/components/owner/dashboard/ActiveDealsWidget';
import { UpcomingPaymentsWidget } from '@/components/owner/dashboard/UpcomingPaymentsWidget';
import { CrmTasksWidget } from '@/components/owner/dashboard/CrmTasksWidget';
import { YourDayFeed } from '@/components/owner/dashboard/YourDayFeed';
import { BusinessKPIWidget } from '@/components/owner/dashboard/BusinessKPIWidget';
import { RevenueInsightsWidget } from '@/components/owner/dashboard/RevenueInsightsWidget';
import { TodayBriefingWidget } from '@/components/owner/dashboard/TodayBriefingWidget';
import { BusinessRoleSwitcher } from '@/components/owner/dashboard/BusinessRoleSwitcher';
import { DashboardGreeting } from '@/components/owner/dashboard/DashboardGreeting';
import { RoleQuickActions } from '@/components/owner/dashboard/RoleQuickActions';
import { ChannelSyncWidget } from '@/components/owner/dashboard/ChannelSyncWidget';
import { UnifiedInboxWidget } from '@/components/owner/dashboard/UnifiedInboxWidget';
import { MaintenanceHealthWidget } from '@/components/owner/dashboard/MaintenanceHealthWidget';
import { TodayActionsWidget } from '@/components/owner/dashboard/TodayActionsWidget';
import { DashboardPropertyFilter } from '@/components/owner/dashboard/DashboardPropertyFilter';
import { PropertyStatusSnapshot } from '@/components/owner/dashboard/PropertyStatusSnapshot';
import { CleaningDashboard } from '@/components/owner/dashboard/CleaningDashboard';
import { MorningBriefing } from '@/components/owner/dashboard/MorningBriefing';
import { PropertyPriorityWidget } from '@/components/owner/dashboard/PropertyPriorityWidget';
import { CollapsibleWidget } from '@/components/owner/dashboard/CollapsibleWidget';
import { QuickTaskDialog } from '@/components/owner/dashboard/QuickTaskDialog';
import { OverviewSection } from '@/components/owner/dashboard/OverviewSection';
import { WidgetErrorBoundary } from '@/components/owner/dashboard/WidgetErrorBoundary';
import { AlertTriangle, Briefcase, CircleDollarSign, HeartPulse, Sun } from 'lucide-react';

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[88px] rounded-xl" />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-6 w-36 mb-2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="w-[72px] h-[72px] rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton map per widget type */
const WIDGET_SKELETON: Partial<Record<DashboardWidgetKey, React.ReactNode>> = {
  kpi: <KPISkeleton />,
  properties: <ListSkeleton />,
  active_stays: <ListSkeleton />,
  your_day: <FeedSkeleton />,
  morning_briefing: <FeedSkeleton />,
  operations: <ListSkeleton />,
  crm_tasks: <ListSkeleton />,
  active_deals: <ListSkeleton />,
};

/** Maps widget keys to their React components */
function DashboardWidget({ widgetKey, role }: { widgetKey: DashboardWidgetKey; role?: import('@/lib/businessRoles').BusinessRole }) {
  const skeleton = WIDGET_SKELETON[widgetKey] || <SectionSkeleton />;

  switch (widgetKey) {
    case 'your_day':
      return (
        <Suspense fallback={skeleton}>
          <YourDayFeed />
        </Suspense>
      );
    case 'kpi':
      return (
        <Suspense fallback={skeleton}>
          <BusinessKPIWidget role={role} />
        </Suspense>
      );
    case 'today_briefing':
      return (
        <Suspense fallback={skeleton}>
          <TodayBriefingWidget />
        </Suspense>
      );
    case 'revenue_insights':
      return (
        <Suspense fallback={skeleton}>
          <RevenueInsightsWidget />
        </Suspense>
      );
    case 'channel_sync':
      return (
        <Suspense fallback={skeleton}>
          <ChannelSyncWidget />
        </Suspense>
      );
    case 'unified_inbox':
      return (
        <Suspense fallback={skeleton}>
          <UnifiedInboxWidget />
        </Suspense>
      );
    case 'invites':
      return null;
    case 'today_actions':
      return (
        <Suspense fallback={skeleton}>
          <TodayActionsWidget />
        </Suspense>
      );
    case 'active_stays':
      return (
        <div data-tour="active-stays">
          <Suspense fallback={skeleton}>
            <ActiveStaysWidget />
          </Suspense>
        </div>
      );
    case 'properties':
      return (
        <div data-tour="properties">
          <Suspense fallback={skeleton}>
            <OwnerPropertiesList />
          </Suspense>
        </div>
      );
    case 'property_status':
      return (
        <Suspense fallback={skeleton}>
          <PropertyStatusSnapshot />
        </Suspense>
      );
    case 'property_priority':
      return (
        <Suspense fallback={skeleton}>
          <PropertyPriorityWidget />
        </Suspense>
      );
    case 'morning_briefing':
      return (
        <Suspense fallback={skeleton}>
          <MorningBriefing />
        </Suspense>
      );
    case 'cleaning_dashboard':
      return (
        <Suspense fallback={skeleton}>
          <CleaningDashboard />
        </Suspense>
      );
    case 'operations':
      return (
        <div data-tour="operations">
          <Suspense fallback={skeleton}>
            <OwnerOperationsFlat />
          </Suspense>
        </div>
      );
    case 'maintenance_health':
      return (
        <Suspense fallback={skeleton}>
          <MaintenanceHealthWidget />
        </Suspense>
      );
    case 'crm_tasks':
      return (
        <Suspense fallback={skeleton}>
          <CrmTasksWidget />
        </Suspense>
      );
    case 'upcoming_payments':
      return (
        <Suspense fallback={skeleton}>
          <UpcomingPaymentsWidget />
        </Suspense>
      );
    case 'active_deals':
      return (
        <div data-tour="deals">
          <Suspense fallback={skeleton}>
            <ActiveDealsWidget />
          </Suspense>
        </div>
      );
    case 'myuno_services':
      return null;
    case 'menu':
      return null;
    default:
      return null;
  }
}

/** Widgets that can be collapsed on mobile to reduce scroll */
const COLLAPSIBLE_WIDGETS: Partial<Record<DashboardWidgetKey, { en: string; ru: string; defaultOpen: boolean }>> = {
  operations: { en: 'Operations', ru: 'Операции', defaultOpen: true },
  cleaning_dashboard: { en: 'Cleaning', ru: 'Уборки', defaultOpen: false },
  crm_tasks: { en: 'Tasks', ru: 'Задачи', defaultOpen: true },
  active_deals: { en: 'Deals', ru: 'Сделки', defaultOpen: false },
  upcoming_payments: { en: 'Payments', ru: 'Платежи', defaultOpen: false },
  maintenance_health: { en: 'Maintenance', ru: 'Обслуживание', defaultOpen: false },
  properties: { en: 'Properties', ru: 'Объекты', defaultOpen: true },
  myuno_services: { en: 'Services', ru: 'Услуги', defaultOpen: false },
};

/**
 * Widgets that should render side-by-side in 2-column grid on desktop.
 */
const HALF_WIDTH_WIDGETS: Set<DashboardWidgetKey> = new Set([
  'revenue_insights', 'upcoming_payments',
  'active_deals', 'crm_tasks',
]);

const OVERVIEW_SUPPRESSED_WIDGETS: Set<DashboardWidgetKey> = new Set([
  'today_actions',
  'your_day',
  'today_briefing',
  'active_stays',
  'crm_tasks',
  'upcoming_payments',
]);

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const isDesktop = useIsDesktop();
  const { role, setRole, config, mcRole, mcRoleLabel } = useBusinessRole();
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);

  const visibleWidgets = isDesktop
    ? config.widgets.filter((w) => w !== 'menu' && !OVERVIEW_SUPPRESSED_WIDGETS.has(w))
    : config.widgets.filter((w) => !OVERVIEW_SUPPRESSED_WIDGETS.has(w));

  const sectionMeta = {
    today: {
      titleEn: 'Today',
      titleRu: 'Сегодня',
      icon: Sun,
      widgets: ['today_actions', 'property_priority', 'your_day'] as DashboardWidgetKey[],
    },
    health: {
      titleEn: 'Portfolio Health',
      titleRu: 'Здоровье портфеля',
      icon: HeartPulse,
      widgets: ['property_status', 'active_stays', 'channel_sync', 'maintenance_health'] as DashboardWidgetKey[],
    },
    revenue: {
      titleEn: 'Revenue & Cash',
      titleRu: 'Выручка и деньги',
      icon: CircleDollarSign,
      widgets: ['kpi', 'upcoming_payments', 'revenue_insights'] as DashboardWidgetKey[],
    },
    crm: {
      titleEn: 'Sales & CRM',
      titleRu: 'Продажи и CRM',
      icon: Briefcase,
      widgets: ['active_deals', 'crm_tasks', 'operations'] as DashboardWidgetKey[],
    },
    exceptions: {
      titleEn: 'Exceptions',
      titleRu: 'Исключения',
      icon: AlertTriangle,
      widgets: ['today_briefing', 'morning_briefing'] as DashboardWidgetKey[],
    },
  } as const;

  const sections = Object.values(sectionMeta)
    .map((section) => ({
      ...section,
      widgets: section.widgets.filter((widget) => visibleWidgets.includes(widget)),
    }))
    .filter((section) => section.widgets.length > 0);

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
    <DashboardFilterProvider>
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 space-y-5 overflow-x-hidden max-w-lg md:max-w-[1536px] mx-auto">
        {/* Header: Greeting + Role Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <DashboardGreeting roleConfig={config} mcRole={mcRole} mcRoleLabel={mcRoleLabel} />
          <BusinessRoleSwitcher activeRole={role} onRoleChange={setRole} />
        </motion.div>

        {/* Quick Actions — desktop only (mobile uses + button in bottom nav) */}
        {isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <RoleQuickActions role={role} onQuickTask={() => setQuickTaskOpen(true)} />
          </motion.div>
        )}

        <QuickTaskDialog open={quickTaskOpen} onOpenChange={setQuickTaskOpen} />

        <Separator />

        {/* Global Property Filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <DashboardPropertyFilter />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
        >
          <OverviewSection />
        </motion.div>

        {sections.map((section, sectionIdx) => (
          <section key={section.titleEn} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <section.icon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {isRu ? section.titleRu : section.titleEn}
              </h2>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
              {section.widgets.map((widgetKey, widgetIdx) => {
                const isFullWidth = !HALF_WIDTH_WIDGETS.has(widgetKey);
                return (
                  <motion.div
                    key={widgetKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(0.15 + (sectionIdx * 0.06) + (widgetIdx * 0.04), 0.45),
                    }}
                    className={isFullWidth ? 'md:col-span-2' : ''}
                  >
                    <WidgetErrorBoundary widgetName={widgetKey}>
                      {(() => {
                        const collapsible = COLLAPSIBLE_WIDGETS[widgetKey];
                        const widget = <DashboardWidget widgetKey={widgetKey} role={role} />;
                        if (collapsible) {
                          return (
                            <CollapsibleWidget
                              title={isRu ? collapsible.ru : collapsible.en}
                              defaultOpen={collapsible.defaultOpen}
                            >
                              {widget}
                            </CollapsibleWidget>
                          );
                        }
                        return widget;
                      })()}
                    </WidgetErrorBoundary>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </DashboardFilterProvider>
  );
}
