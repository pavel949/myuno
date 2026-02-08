import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, LogOut } from 'lucide-react';
import { AccountProfileCard } from '@/components/account/AccountProfileCard';
import { AccountActiveStay } from '@/components/account/AccountActiveStay';
import { AccountActivitySection } from '@/components/account/AccountActivitySection';
import { AccountFlatMenu } from '@/components/account/AccountFlatMenu';
import { DownloadAppButton } from '@/components/pwa/DownloadAppButton';

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
    <div className="min-h-screen bg-background">
      {/* Header — minimal */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">{isRu ? 'Мой аккаунт' : 'My Account'}</h1>
          </div>
        </div>
      </header>

      {/* Content — generous spacing, Airbnb-clarity */}
      <div className="px-4 pt-6 pb-24 space-y-8 max-w-lg mx-auto">
        {/* Profile */}
        <AccountProfileCard />

        {/* Active Stay — contextual, only shows when relevant */}
        <AccountActiveStay />

        {/* Activity: Upcoming + Recent grouped */}
        <AccountActivitySection />

        <Separator />

        {/* Flat menu — Airbnb-style */}
        <AccountFlatMenu />

        <Separator />

        {/* PWA Install */}
        <DownloadAppButton />

        {/* Logout — at the bottom, separated */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-3 text-destructive hover:opacity-70 transition-opacity"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-base font-medium">{isRu ? 'Выйти' : 'Log out'}</span>
        </button>
      </div>
    </div>
  );
}
