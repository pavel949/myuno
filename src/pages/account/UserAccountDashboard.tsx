import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';
import { AccountProfileCard } from '@/components/account/AccountProfileCard';
import { AccountActiveStay } from '@/components/account/AccountActiveStay';
import { AccountActivitySection } from '@/components/account/AccountActivitySection';
import { AccountFlatMenu } from '@/components/account/AccountFlatMenu';
import { QuickActionsPanel } from '@/components/account/QuickActionsPanel';
import { PersonalRecommendations } from '@/components/account/PersonalRecommendations';
import { DashboardStatsBar } from '@/components/account/DashboardStatsBar';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { PersonaDetectionPreview } from '@/components/account/PersonaDetectionPreview';

import { DownloadAppButton } from '@/components/pwa/DownloadAppButton';
import { AppLayout } from '@/components/layout/AppLayout';

export default function UserAccountDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const isRu = language === 'ru';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppLayout title={isRu ? 'Мой аккаунт' : 'My Account'}>
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 w-full">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <AccountSidebar />

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Mobile-only: Profile card */}
            <div className="lg:hidden">
              <AccountProfileCard />
            </div>

            {/* Active Stay banner */}
            <AccountActiveStay />

            {/* Stats bar */}
            <DashboardStatsBar />

            {/* Quick Actions — grid on desktop */}
            <QuickActionsPanel />

            <Separator className="bg-border/50" />

            {/* Activity / Orders */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <AccountActivitySection />
              <PersonalRecommendations />
            </div>

            {/* Mobile-only: flat menu, download, logout */}
            <div className="lg:hidden space-y-6">
              <Separator className="bg-border/50" />
              <AccountFlatMenu />
              <DownloadAppButton />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 py-3 text-destructive hover:opacity-70 transition-opacity"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-base font-medium">{isRu ? 'Выйти' : 'Log out'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
