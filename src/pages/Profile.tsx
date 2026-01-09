import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut, ChevronRight, Shield, Bell, CreditCard, Heart, Clock, Wallet, Palette, Gift } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { PageContainer } from '@/components/uno/PageContainer';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { ReferralCard } from '@/components/uno/ReferralCard';

export default function Profile() {
  const { t, language } = useLanguage();
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState />
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: User, label: language === 'ru' ? 'Редактировать профиль' : 'Edit Profile', onClick: () => {} },
    { icon: Wallet, label: language === 'ru' ? 'Кошелёк' : 'Wallet', onClick: () => navigate('/wallet') },
    { icon: Heart, label: language === 'ru' ? 'Избранное' : 'Favorites', onClick: () => navigate('/favorites') },
    { icon: Clock, label: language === 'ru' ? 'История просмотров' : 'View History', onClick: () => navigate('/view-history') },
    { icon: Bell, label: language === 'ru' ? 'Уведомления' : 'Notifications', onClick: () => navigate('/notifications') },
    { icon: CreditCard, label: language === 'ru' ? 'Способы оплаты' : 'Payment Methods', onClick: () => {} },
    { icon: Shield, label: language === 'ru' ? 'Конфиденциальность' : 'Privacy & Security', onClick: () => {} },
    { icon: Settings, label: language === 'ru' ? 'Настройки' : 'Settings', onClick: () => {} },
    { icon: HelpCircle, label: language === 'ru' ? 'Помощь' : 'Help & Support', onClick: () => {} },
  ];

  return (
    <AppLayout>
      <PageContainer>
        {/* Profile header */}
        <SectionCard className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{user.email}</h2>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Аккаунт туриста' : 'Tourist Account'}
            </p>
          </div>
          <PremiumButton variant="outline" size="sm">
            {t('action.edit')}
          </PremiumButton>
        </SectionCard>

        {/* Theme switcher */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">
              {language === 'ru' ? 'Тема оформления' : 'Theme'}
            </span>
          </div>
          <ThemeSwitcher variant="select" />
        </SectionCard>

        {/* Language switcher */}
        <SectionCard className="flex items-center justify-between">
          <span className="font-medium">
            {language === 'ru' ? 'Язык' : 'Language'}
          </span>
          <LanguageSwitcher variant="toggle" size="sm" />
        </SectionCard>

        {/* Referral program */}
        <ReferralCard variant="compact" />

        {/* Menu items */}
        <SectionCard noPadding className="overflow-hidden divide-y divide-border">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </SectionCard>

        {/* Logout button */}
        <PremiumButton
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t('auth.logout')}
        </PremiumButton>
      </PageContainer>
    </AppLayout>
  );
}
