import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessRole } from '@/hooks/useBusinessRole';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useMcOnboarding, computeProgress } from '@/hooks/useMcOnboarding';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { type DashboardWidgetKey } from '@/lib/businessRoles';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsDesktop } from '@/hooks/use-desktop';
import { DashboardFilterProvider } from '@/contexts/DashboardFilterContext';

// Eager — render in the initial sections (Greeting, header chrome).
import { BusinessRoleSwitcher } from '@/components/owner/dashboard/BusinessRoleSwitcher';
import { DashboardGreeting } from '@/components/owner/dashboard/DashboardGreeting';
import { RoleQuickActions } from '@/components/owner/dashboard/RoleQuickActions';
import { DashboardPropertyFilter } from '@/components/owner/dashboard/DashboardPropertyFilter';
import { CollapsibleWidget } from '@/components/owner/dashboard/CollapsibleWidget';
import { QuickTaskDialog } from '@/components/owner/dashboard/QuickTaskDialog';
import { OverviewSection } from '@/components/owner/dashboard/OverviewSection';
import { WidgetErrorBoundary } from '@/components/owner/dashboard/WidgetErrorBoundary';

// Lazy — every widget below the fold gets its own chunk so the
// MC dashboard FCP no longer pays for 30+ Supabase calls upfront.
const ActiveStaysWidget = lazy(() => import('@/components/owner/dashboard/ActiveStaysWidget').then(m => ({ default: m.ActiveStaysWidget })));
const OwnerPropertiesList = lazy(() => import('@/components/owner/dashboard/OwnerPropertiesList').then(m => ({ default: m.OwnerPropertiesList })));
const OwnerOperationsFlat = lazy(() => import('@/components/owner/dashboard/OwnerOperationsFlat').then(m => ({ default: m.OwnerOperationsFlat })));
const ActiveDealsWidget = lazy(() => import('@/components/owner/dashboard/ActiveDealsWidget').then(m => ({ default: m.ActiveDealsWidget })));
const UpcomingPaymentsWidget = lazy(() => import('@/components/owner/dashboard/UpcomingPaymentsWidget').then(m => ({ default: m.UpcomingPaymentsWidget })));
const CrmTasksWidget = lazy(() => import('@/components/owner/dashboard/CrmTasksWidget').then(m => ({ default: m.CrmTasksWidget })));
const YourDayFeed = lazy(() => import('@/components/owner/dashboard/YourDayFeed').then(m => ({ default: m.YourDayFeed })));
const BusinessKPIWidget = lazy(() => import('@/components/owner/dashboard/BusinessKPIWidget').then(m => ({ default: m.BusinessKPIWidget })));
const RevenueInsightsWidget = lazy(() => import('@/components/owner/dashboard/RevenueInsightsWidget').then(m => ({ default: m.RevenueInsightsWidget })));
const TodayBriefingWidget = lazy(() => import('@/components/owner/dashboard/TodayBriefingWidget').then(m => ({ default: m.TodayBriefingWidget })));
const ChannelSyncWidget = lazy(() => import('@/components/owner/dashboard/ChannelSyncWidget').then(m => ({ default: m.ChannelSyncWidget })));
const UnifiedInboxWidget = lazy(() => import('@/components/owner/dashboard/UnifiedInboxWidget').then(m => ({ default: m.UnifiedInboxWidget })));
const PropertyInquiriesWidget = lazy(() => import('@/components/owner/dashboard/PropertyInquiriesWidget').then(m => ({ default: m.PropertyInquiriesWidget })));
const AIAgentStatusWidget = lazy(() => import('@/components/owner/dashboard/AIAgentStatusWidget').then(m => ({ default: m.AIAgentStatusWidget })));
const FounderQuickActions = lazy(() => import('@/components/owner/dashboard/FounderQuickActions').then(m => ({ default: m.FounderQuickActions })));
const FounderInboxWidget = lazy(() => import('@/components/owner/dashboard/FounderInboxWidget').then(m => ({ default: m.FounderInboxWidget })));
const MaintenanceHealthWidget = lazy(() => import('@/components/owner/dashboard/MaintenanceHealthWidget').then(m => ({ default: m.MaintenanceHealthWidget })));
const TodayActionsWidget = lazy(() => import('@/components/owner/dashboard/TodayActionsWidget').then(m => ({ default: m.TodayActionsWidget })));
const PortfolioHealthWidget = lazy(() => import('@/components/owner/dashboard/PortfolioHealthWidget').then(m => ({ default: m.PortfolioHealthWidget })));
const CleaningDashboard = lazy(() => import('@/components/owner/dashboard/CleaningDashboard').then(m => ({ default: m.CleaningDashboard })));
const MorningBriefing = lazy(() => import('@/components/owner/dashboard/MorningBriefing').then(m => ({ default: m.MorningBriefing })));
const PropertyPriorityWidget = lazy(() => import('@/components/owner/dashboard/PropertyPriorityWidget').then(m => ({ default: m.PropertyPriorityWidget })));
const BusinessHealthCard = lazy(() => import('@/components/owner/dashboard/BusinessHealthCard').then(m => ({ default: m.BusinessHealthCard })));
const TopActionsWidget = lazy(() => import('@/components/owner/dashboard/TopActionsWidget').then(m => ({ default: m.TopActionsWidget })));
const SellSignalWidget = lazy(() => import('@/components/owner/dashboard/SellSignalWidget').then(m => ({ default: m.SellSignalWidget })));
import { AlertTriangle, Briefcase, CircleDollarSign, HeartPulse, Sun } from 'lucide-react';

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-16 w-full rounded-none" />
      <Skeleton className="h-16 w-full rounded-none" />
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[88px] rounded-none" />
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
          <Skeleton className="w-[72px] h-[72px] rounded-none flex-shrink-0" />
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
          <div className="mt-4">
            <PropertyInquiriesWidget />
          </div>
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
    case 'portfolio_health':
      return (
        <Suspense fallback={skeleton}>
          <PortfolioHealthWidget />
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
    case 'ai_agents_status':
      return (
        <Suspense fallback={skeleton}>
          <AIAgentStatusWidget />
        </Suspense>
      );
    case 'founder_inbox':
      return (
        <Suspense fallback={skeleton}>
          <FounderInboxWidget />
        </Suspense>
      );
    case 'founder_quick_actions':
      return (
        <Suspense fallback={skeleton}>
          <FounderQuickActions />
        </Suspense>
      );
    case 'business_health':
      return (
        <Suspense fallback={skeleton}>
          <BusinessHealthCard />
        </Suspense>
      );
    case 'top_actions':
      return (
        <Suspense fallback={skeleton}>
          <TopActionsWidget />
        </Suspense>
      );
    case 'sell_signal':
      return (
        <Suspense fallback={skeleton}>
          <SellSignalWidget />
        </Suspense>
      );
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
  'ai_agents_status', 'founder_quick_actions',
  'business_health', 'top_actions',
  'sell_signal',
]);

const OVERVIEW_SUPPRESSED_WIDGETS: Set<DashboardWidgetKey> = new Set([
  'today_actions',
  'your_day',
  'today_briefing',
  'active_stays',
  'crm_tasks',
  'upcoming_payments',
  'business_health',
  'top_actions',
]);

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const isDesktop = useIsDesktop();
  const { role, setRole, config, mcRole, mcRoleLabel } = useBusinessRole();
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  const { activeCompany, isLoading: companyLoading } = useActiveCompany();
  const { data: onboardingProgress } = useMcOnboarding();

  const visibleWidgets = isDesktop
    ? config.widgets.filter((w) => w !== 'menu' && !OVERVIEW_SUPPRESSED_WIDGETS.has(w))
    : config.widgets.filter((w) => !OVERVIEW_SUPPRESSED_WIDGETS.has(w));

  const sectionMeta = {
    today: {
      titleEn: 'Today',
      titleRu: 'Сегодня',
      icon: Sun,
      widgets: ['business_health', 'top_actions', 'today_actions', 'founder_quick_actions', 'ai_agents_status', 'property_priority', 'your_day'] as DashboardWidgetKey[],
    },
    health: {
      titleEn: 'Portfolio Health',
      titleRu: 'Здоровье портфеля',
      icon: HeartPulse,
      widgets: ['portfolio_health', 'active_stays', 'channel_sync', 'maintenance_health'] as DashboardWidgetKey[],
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
      widgets: ['active_deals', 'sell_signal', 'crm_tasks', 'founder_inbox', 'operations'] as DashboardWidgetKey[],
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
        <div className="w-20 h-20 rounded-none bg-primary/10 flex items-center justify-center mb-6">
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
