import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import {
  AccountProfileCard,
  AccountActiveStay,
  DashboardStatsBar,
  UpcomingBookingsWidget,
  RecentPurchasesWidget,
  DashboardQuickServices,
  AccountMenu,
  MyApplicationsWidget,
} from '@/components/account';
import { DownloadAppButton } from '@/components/pwa/DownloadAppButton';

export default function UserAccountDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const isRussian = language === 'ru';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">
              {isRussian ? 'Мой аккаунт' : 'My Account'}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isRussian ? 'Выйти' : 'Logout'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <PageContainer className="space-y-4">
        {/* Profile Card */}
        <AccountProfileCard />

        {/* Active Stay (shown only if there's an active booking) */}
        <AccountActiveStay />

        {/* Stats Bar: Bookings | Wallet | Favorites */}
        <DashboardStatsBar />

        {/* Upcoming Bookings */}
        <UpcomingBookingsWidget />

        {/* Recent Orders/Purchases */}
        <RecentPurchasesWidget />

        {/* Quick Services Grid */}
        <DashboardQuickServices />

        {/* My Listing Applications */}
        <MyApplicationsWidget />

        {/* Account Menu (Settings, Documents, etc.) */}
        <AccountMenu />

        {/* PWA Install Button - persistent option */}
        <DownloadAppButton />
      </PageContainer>
    </div>
  );
}
