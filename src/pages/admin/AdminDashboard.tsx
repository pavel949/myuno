import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AdminKPIGrid,
  AdminOperationalAlerts,
  AdminActivityBlock,
  AdminRevenueBlock,
  AdminQuickActionsGrid,
  AdminAllVerticalsGrid,
} from '@/components/admin/dashboard';
import { LaunchSwitch } from '@/components/maintenance/LaunchSwitch';
import { useUserRoles } from '@/hooks/useUserRoles';
import { AdminStaffOverview } from '@/components/admin/AdminStaffOverview';
import { GoLiveChecklist } from '@/components/admin/GoLiveChecklist';
import { PageShell, PageHeader, PageSection } from '@/components/page';

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { roles } = useUserRoles();
  const safeRoles = roles || [];
  const isAdmin = safeRoles.some(r => r.role === 'admin');

  // Staff users see simplified dashboard
  if (!isAdmin && safeRoles.some(r => r.role === 'staff' || r.role === 'uno_team')) {
    return <AdminStaffOverview />;
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title={isRussian ? 'Панель управления' : 'Dashboard'}
        subtitle={isRussian ? 'Обзор платформы UNO' : 'UNO platform overview'}
        actions={<LaunchSwitch variant="compact" />}
      />

      <GoLiveChecklist />

      {/*
        Inbox first: the one section that answers «что мне делать
        прямо сейчас». KPIs/revenue/verticals are useful context but
        secondary — they don't change what the admin does today.
      */}
      <PageSection>
        <AdminOperationalAlerts />
      </PageSection>

      <PageSection>
        <AdminKPIGrid />
      </PageSection>

      <PageSection title={isRussian ? 'Выручка платформы' : 'Platform revenue'}>
        <AdminRevenueBlock />
      </PageSection>

      <PageSection title={isRussian ? 'Быстрые действия' : 'Quick actions'}>
        <AdminQuickActionsGrid />
      </PageSection>

      <PageSection title={isRussian ? 'Все вертикали' : 'All verticals'}>
        <AdminAllVerticalsGrid />
      </PageSection>

      <PageSection title={isRussian ? 'Лента активности' : 'Activity feed'}>
        <AdminActivityBlock />
      </PageSection>
    </PageShell>
  );
}
