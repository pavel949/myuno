import { lazy, Suspense, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import { PageShell, PageHeader, PageTabs, LoadingState, EmptyState, type PageTab } from '@/components/page';
import { APP_ROUTES } from '@/lib/config/routes';

const OverviewTab = lazy(() => import('@/pages/owner/OwnerRevenueDashboard'));
const ReportsTab = lazy(() => import('@/pages/owner/ReportsPage'));
const BudgetTab = lazy(() => import('@/pages/owner/BudgetPage'));

type AnalyticsTab = 'overview' | 'reports' | 'budget';

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const { canAccess, isLoading } = useTeamPermissions();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  // Match the module tile; reports access must never imply finance access.
  const canViewReports = !isLoading && canAccess('reports', 'view');
  const canViewFinance = canViewReports && canAccess('finance', 'view');
  // BudgetPage includes editing controls, so view-only access is insufficient.
  const canEditBudget = canViewFinance && canAccess('finance', 'edit');
  const tabs: PageTab<AnalyticsTab>[] = [];
  if (canViewFinance) tabs.push({ value: 'overview', label: isRu ? 'Обзор' : 'Overview' });
  if (canViewReports) tabs.push({ value: 'reports', label: isRu ? 'Отчёты' : 'Reports' });
  if (canEditBudget) tabs.push({ value: 'budget', label: isRu ? 'Бюджет' : 'Budget' });
  // Resolve a revoked/previous selection before rendering any lazy child.
  const activeTab = tabs.some(item => item.value === tab) ? tab : tabs[0]?.value;

  return (
    <PageShell width="wide">
      <PageHeader
        title={isRu ? 'Аналитика и отчёты' : 'Analytics & Reports'}
        subtitle={canViewFinance
          ? (isRu ? 'Метрики и отчёты' : 'Metrics and reports')
          : (isRu ? 'Отчёты' : 'Reports')}
        showBack
        fallbackPath={APP_ROUTES.MC}
      />

      {isLoading ? <LoadingState variant="skeleton" layout="cards" rows={6} /> : !activeTab ? (
        <EmptyState
          title={isRu ? 'Нет доступа к аналитике' : 'Analytics access unavailable'}
          description={isRu ? 'Для этой страницы нужен доступ к отчётам компании.' : 'This page requires access to company reports.'}
        />
      ) : (
        <>
          <PageTabs<AnalyticsTab> tabs={tabs} value={activeTab} onChange={setTab} />
          <Suspense fallback={<LoadingState variant="skeleton" layout="cards" rows={6} />}>
            {activeTab === 'overview' && canViewFinance && <OverviewTab />}
            {activeTab === 'reports' && canViewReports && <ReportsTab />}
            {activeTab === 'budget' && canEditBudget && <BudgetTab />}
          </Suspense>
        </>
      )}
    </PageShell>
  );
}
