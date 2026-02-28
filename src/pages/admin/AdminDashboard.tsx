import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  AdminKPIGrid,
  AdminQuickActionsGrid,
  AdminOperationalAlerts,
  AdminAllVerticalsGrid,
  AdminRevenueBlock,
  AdminActivityBlock,
} from '@/components/admin/dashboard';
import { LaunchSwitch } from '@/components/maintenance/LaunchSwitch';

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-3 lg:space-y-2.5 overflow-x-hidden max-w-full max-w-[1536px] mx-auto w-full">
      {/* Header + Launch Switch inline */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {isRussian ? 'Панель управления' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRussian ? 'Обзор платформы UNO' : 'UNO platform overview'}
          </p>
        </div>
        <LaunchSwitch variant="compact" />
      </div>

      {/* Row 1: KPI Metrics */}
      <AdminKPIGrid />

      {/* Row 2: Quick Actions + Alerts + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <AdminOperationalAlerts />
        <AdminRevenueBlock />
        <AdminQuickActionsGrid />
      </div>

      {/* Row 3: All Verticals */}
      <AdminAllVerticalsGrid />

      {/* Row 4: Activity */}
      <AdminActivityBlock />
    </div>
  );
}
