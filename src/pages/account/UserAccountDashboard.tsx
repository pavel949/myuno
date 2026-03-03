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
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-lg md:max-w-5xl mx-auto">
        <div className="md:grid md:grid-cols-[320px_1fr] md:gap-8">
          {/* Left column — Profile & identity */}
          <div className="space-y-6 mb-8 md:mb-0">
            <AccountProfileCard />
            <DownloadAppButton />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-3 text-destructive hover:opacity-70 transition-opacity"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base font-medium">{isRu ? 'Выйти' : 'Log out'}</span>
            </button>
          </div>

          {/* Right column — Content */}
          <div className="space-y-8">
            <AccountActiveStay />
            <QuickActionsPanel />
            <Separator className="bg-border/50" />
            <AccountActivitySection />
            <Separator className="bg-border/50" />
            <PersonalRecommendations />
            <Separator className="bg-border/50" />
            <AccountFlatMenu />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
