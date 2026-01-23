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

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold">
          {isRussian ? 'Панель управления' : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isRussian ? 'Обзор платформы UNO' : 'UNO platform overview'}
        </p>
      </div>

      {/* Row 1: KPI Metrics */}
      <AdminKPIGrid />

      {/* Row 2: Quick Actions */}
      <AdminQuickActionsGrid />

      {/* Row 3: Alerts + Revenue side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminOperationalAlerts />
        <AdminRevenueBlock />
      </div>

      {/* Row 4: All Verticals */}
      <AdminAllVerticalsGrid />

      {/* Row 5: Activity */}
      <AdminActivityBlock />
    </div>
  );
}
