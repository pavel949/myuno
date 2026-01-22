import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  AdminTodayBlock,
  AdminAlertsBlock,
  AdminRevenueBlock,
  AdminVerticalsBlock,
  AdminActivityBlock,
} from '@/components/admin/dashboard';

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className="p-4 md:p-6 space-y-3">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold">
          {isRussian ? 'Панель управления' : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isRussian ? 'Обзор платформы UNO' : 'UNO platform overview'}
        </p>
      </div>

      {/* Row 1: Today + Alerts (side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminTodayBlock />
        <AdminAlertsBlock />
      </div>

      {/* Row 2: Revenue (full width) */}
      <AdminRevenueBlock />

      {/* Row 3: Verticals (full width) */}
      <AdminVerticalsBlock />

      {/* Row 4: Activity (full width) */}
      <AdminActivityBlock />
    </div>
  );
}
