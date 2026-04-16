import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AdminKPIGrid,
  AdminOperationalAlerts,
  AdminActivityBlock,
} from '@/components/admin/dashboard';
import { LaunchSwitch } from '@/components/maintenance/LaunchSwitch';
import { SectionHeader } from '@/components/ds';
import { PageContainer } from '@/components/uno/PageContainer';
import { LayoutDashboard } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { StaffDashboard } from '@/components/admin/StaffDashboard';
import { GoLiveChecklist } from '@/components/admin/GoLiveChecklist';

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
    <PageContainer className="space-y-4 lg:space-y-3">
      {/* Header + Launch Switch inline */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title={isRussian ? 'Панель управления' : 'Dashboard'}
          subtitle={isRussian ? 'Обзор платформы UNO' : 'UNO platform overview'}
          icon={LayoutDashboard}
          size="lg"
        />
        <LaunchSwitch variant="compact" />
      </div>

      {/* Go-Live Checklist — hidden when all green */}
      <GoLiveChecklist />

      {/* Row 1: KPI Metrics — 6 cards */}
      <AdminKPIGrid />

      {/* Row 2: Alerts */}
      <AdminOperationalAlerts />

      {/* Row 3: Activity Feed */}
      <AdminActivityBlock />
    </PageContainer>
  );
}
