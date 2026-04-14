import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { User, Settings, HelpCircle, LogOut, ChevronRight, Shield, Bell, CreditCard, Heart, Clock, Wallet, Gift, Info, FileText, Handshake, MessageCircle, ShieldCheck, Building2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PageContainer } from '@/components/uno/PageContainer';
import { SectionCard } from '@/components/uno/SectionCard';
import { ProfileSkeleton } from '@/components/ui/page-skeletons';
import { ReferralCard } from '@/components/uno/ReferralCard';
import { EmailVerificationBadge } from '@/components/profile/EmailVerificationBadge';

import { ActiveRoleBadge } from '@/components/profile/ActiveRoleBadge';
import { BecomePartnerCTA } from '@/components/profile/BecomePartnerCTA';
import { UserRolesPermissions } from '@/components/profile/UserRolesPermissions';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useUserContext } from '@/hooks/useUserContext';
import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { profile } = useProfile();
  const { activeCompany } = useActiveCompany();
  const { hasRole, isLoading: rolesLoading } = useUserContext();
  const navigate = useNavigate();

  const isLoading = authLoading || rolesLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  if (!user) {
    // Redirect handled by route guards
    return null;
  }

  const isAdmin = hasRole('admin');

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate(APP_ROUTES.HOME);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { icon: User, label: language === 'ru' ? 'Редактировать профиль' : 'Edit Profile', onClick: () => navigate(APP_ROUTES.PROFILE_EDIT) },
    { icon: Settings, label: language === 'ru' ? 'Настройки и данные' : 'Settings & Data', onClick: () => navigate(APP_ROUTES.PROFILE_SETTINGS) },
    { icon: FileText, label: language === 'ru' ? 'Мои документы' : 'My Documents', onClick: () => navigate(APP_ROUTES.PROFILE_SETTINGS) },
    { icon: MessageCircle, label: language === 'ru' ? 'Чат поддержки' : 'Support Chat', onClick: () => navigate(APP_ROUTES.SUPPORT) },
    { icon: Wallet, label: language === 'ru' ? 'Кошелёк' : 'Wallet', onClick: () => navigate(APP_ROUTES.WALLET) },
    { icon: Heart, label: language === 'ru' ? 'Избранное' : 'Favorites', onClick: () => navigate(APP_ROUTES.FAVORITES) },
    { icon: Clock, label: language === 'ru' ? 'История просмотров' : 'View History', onClick: () => navigate(APP_ROUTES.VIEW_HISTORY) },
    { icon: Bell, label: language === 'ru' ? 'Уведомления' : 'Notifications', onClick: () => navigate(APP_ROUTES.NOTIFICATIONS) },
    { icon: CreditCard, label: language === 'ru' ? 'Способы оплаты' : 'Payment Methods', onClick: () => navigate(APP_ROUTES.WALLET_CARDS) },
  ];

  const adminItems = [
    { icon: Shield, label: language === 'ru' ? 'Панель управления' : 'Admin Dashboard', onClick: () => navigate(APP_ROUTES.ADMIN) },
    { icon: ShieldCheck, label: language === 'ru' ? 'Заявки партнёров' : 'Partner Applications', onClick: () => navigate(`${APP_ROUTES.ADMIN}/partner-applications`) },
    { icon: Settings, label: language === 'ru' ? 'Пользователи' : 'User Analytics', onClick: () => navigate(`${APP_ROUTES.ADMIN}/user-analytics`) },
    { icon: CreditCard, label: language === 'ru' ? 'Финансы' : 'Finance', onClick: () => navigate(`${APP_ROUTES.ADMIN}/finance`) },
    { icon: FileText, label: language === 'ru' ? 'Модерация контента' : 'Content Moderation', onClick: () => navigate(`${APP_ROUTES.ADMIN}/moderation`) },
  ];

  const infoItems = [
    { icon: Info, label: language === 'ru' ? 'О нас' : 'About Us', onClick: () => navigate(APP_ROUTES.ABOUT) },
    { icon: HelpCircle, label: language === 'ru' ? 'Как это работает' : 'How It Works', onClick: () => navigate(APP_ROUTES.HOW_IT_WORKS) },
    { icon: HelpCircle, label: language === 'ru' ? 'Частые вопросы' : 'FAQ', onClick: () => navigate(APP_ROUTES.FAQ) },
    { icon: Handshake, label: language === 'ru' ? 'Для партнёров' : 'For Partners', onClick: () => navigate(APP_ROUTES.PARTNERS) },
    { icon: Shield, label: language === 'ru' ? 'Конфиденциальность' : 'Privacy Policy', onClick: () => navigate(APP_ROUTES.PRIVACY) },
    { icon: FileText, label: language === 'ru' ? 'Условия использования' : 'Terms of Use', onClick: () => navigate(APP_ROUTES.TERMS) },
  ];

  return (
    <AppLayout>
      <PageContainer>
        {/* Profile header */}
        <SectionCard className="space-y-3">
          {/* Profile header row */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-primary-foreground">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  {profile?.full_name || user.email}
                </h2>
                <ActiveRoleBadge />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {profile?.full_name ? user.email : (language === 'ru' ? 'Аккаунт туриста' : 'Tourist Account')}
              </p>
              {activeCompany && (
                <p className="text-xs text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3" />
                  {language === 'ru' ? activeCompany.name_ru : activeCompany.name_en}
                </p>
              )}
            </div>
            <PremiumButton variant="outline" size="sm" onClick={() => navigate(APP_ROUTES.PROFILE_EDIT)} className="shrink-0">
              {t('action.edit')}
            </PremiumButton>
          </div>
          {/* Verification badge - separate row */}
          <EmailVerificationBadge variant="inline" />
        </SectionCard>

        {/* CTA to become owner/vendor for regular users */}
        <BecomePartnerCTA />

        {/* User roles and permissions (read-only) */}
        <UserRolesPermissions />

        {/* Referral program */}
        <ReferralCard variant="compact" />

        {/* Account Menu items */}
        <SectionCard noPadding className="overflow-hidden divide-y divide-border" role="navigation" aria-label={language === 'ru' ? 'Аккаунт' : 'Account'}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              aria-label={item.label}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </SectionCard>

        {/* Admin Menu - only visible for admins */}
        {isAdmin && (
          <>
            <div className="text-xs font-medium text-muted-foreground mb-2 mt-4 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {language === 'ru' ? 'Администрирование' : 'Administration'}
            </div>
            <SectionCard noPadding className="overflow-hidden divide-y divide-border border-primary/30">
              {adminItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 p-4 hover:bg-primary/10 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-primary" />
                </button>
              ))}
            </SectionCard>
          </>
        )}

        {/* Info & Support */}
        <div className="text-xs font-medium text-muted-foreground mb-2 mt-4">
          {language === 'ru' ? 'Информация' : 'Information'}
        </div>
        <SectionCard noPadding className="overflow-hidden divide-y divide-border">
          {infoItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </SectionCard>

        {/* Logout button */}
        <PremiumButton
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label={language === 'ru' ? 'Выйти из аккаунта' : 'Log out'}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {isLoggingOut ? (language === 'ru' ? 'Выход...' : 'Logging out...') : t('auth.logout')}
        </PremiumButton>
      </PageContainer>
    </AppLayout>
  );
}
