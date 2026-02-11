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
import { DownloadAppButton } from '@/components/pwa/DownloadAppButton';
import { AppLayout } from '@/components/layout/AppLayout';
import { AchievementShowcase } from '@/components/gamification/AchievementShowcase';
import { ActivityPulse } from '@/components/home/ActivityPulse';

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
      <div className="px-4 pt-6 pb-24 space-y-8 max-w-lg mx-auto">
        {/* Profile */}
        <AccountProfileCard />

        {/* Activity Stats */}
        <ActivityPulse />

        {/* Achievements & Loyalty */}
        <AchievementShowcase />

        {/* Active Stay */}
        <AccountActiveStay />

        {/* Activity */}
        <AccountActivitySection />

        <Separator className="bg-border/50" />

        {/* Menu */}
        <AccountFlatMenu />

        <Separator className="bg-border/50" />

        {/* PWA Install */}
        <DownloadAppButton />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-3 text-destructive hover:opacity-70 transition-opacity"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-base font-medium">{isRu ? 'Выйти' : 'Log out'}</span>
        </button>
      </div>
    </AppLayout>
  );
}