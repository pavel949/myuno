import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AdminKPIGrid,
  AdminOperationalAlerts,
  AdminActivityBlock,
} from '@/components/admin/dashboard';
import { LaunchSwitch } from '@/components/maintenance/LaunchSwitch';
import { useUserRoles } from '@/hooks/useUserRoles';
import { StaffDashboard } from '@/components/admin/StaffDashboard';
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
    return <StaffDashboard />;
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title={isRussian ? 'Панель управления' : 'Dashboard'}
        subtitle={isRussian ? 'Обзор платформы UNO' : 'UNO platform overview'}
        actions={<LaunchSwitch variant="compact" />}
      />

      <GoLiveChecklist />

      <PageSection>
        <AdminKPIGrid />
      </PageSection>

      <PageSection title={isRussian ? 'Операционные алерты' : 'Operational alerts'}>
        <AdminOperationalAlerts />
      </PageSection>

      <PageSection title={isRussian ? 'Лента активности' : 'Activity feed'}>
        <AdminActivityBlock />
      </PageSection>
    </PageShell>
  );
}
