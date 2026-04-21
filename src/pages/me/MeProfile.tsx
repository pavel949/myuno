/**
 * /me/profile — MeProfile
 * Settings-only profile surface inside /me shell. Activity/recommendations
 * have moved to MeFeed; this page keeps profile card, roles, language and
 * logout via the existing AccountFlatMenu primitives.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { AccountProfileCard } from '@/components/account/AccountProfileCard';
import { AccountFlatMenu } from '@/components/account/AccountFlatMenu';
import { DownloadAppButton } from '@/components/pwa/DownloadAppButton';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MeProfile() {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <MeShellLayout title={isRu ? 'Профиль' : 'Profile'}>
      <div className="space-y-6">
        <AccountProfileCard />
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
    </MeShellLayout>
  );
}
