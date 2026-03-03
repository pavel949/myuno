import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  AdminKPIGrid,
  AdminOperationalAlerts,
  AdminActivityBlock,
} from '@/components/admin/dashboard';
import { LaunchSwitch } from '@/components/maintenance/LaunchSwitch';
import { SectionHeader } from '@/components/ds';
import { LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 lg:space-y-3 overflow-x-hidden max-w-full max-w-[1536px] mx-auto w-full">
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

      {/* Row 1: KPI Metrics — 6 cards */}
      <AdminKPIGrid />

      {/* Row 2: Alerts */}
      <AdminOperationalAlerts />

      {/* Row 3: Activity Feed */}
      <AdminActivityBlock />
    </div>
  );
}
