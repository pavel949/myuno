import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut, ChevronRight, Shield, Bell, CreditCard, Heart, Clock, Wallet, Palette, Gift, Info, FileText, Handshake, MessageCircle, ShieldCheck, MapPin, Mail, Globe, Coins } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { PageContainer } from '@/components/uno/PageContainer';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { ReferralCard } from '@/components/uno/ReferralCard';
import { UserPreferences } from '@/components/profile/UserPreferences';
import { EmailVerificationBadge } from '@/components/profile/EmailVerificationBadge';
import { RoleSwitcher } from '@/components/uno/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const { t, language } = useLanguage();
  const { user, isLoading, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Check admin role
  useEffect(() => {
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (!user) {
        if (isMounted) setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (isMounted) setIsAdmin(data === true);
    };

    checkAdminRole();
    
    return () => { isMounted = false; };
  }, [user]);

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
    { icon: User, label: language === 'ru' ? 'Редактировать профиль' : 'Edit Profile', onClick: () => navigate('/profile/edit') },
    { icon: MessageCircle, label: language === 'ru' ? 'Чат поддержки' : 'Support Chat', onClick: () => navigate('/support') },
    { icon: Wallet, label: language === 'ru' ? 'Кошелёк' : 'Wallet', onClick: () => navigate('/wallet') },
    { icon: Heart, label: language === 'ru' ? 'Избранное' : 'Favorites', onClick: () => navigate('/favorites') },
    { icon: Clock, label: language === 'ru' ? 'История просмотров' : 'View History', onClick: () => navigate('/view-history') },
    { icon: Bell, label: language === 'ru' ? 'Уведомления' : 'Notifications', onClick: () => navigate('/notifications') },
    { icon: CreditCard, label: language === 'ru' ? 'Способы оплаты' : 'Payment Methods', onClick: () => {} },
  ];

  const adminItems = [
    { icon: Shield, label: language === 'ru' ? 'Панель управления' : 'Admin Dashboard', onClick: () => navigate('/admin') },
    { icon: ShieldCheck, label: language === 'ru' ? 'Заявки партнёров' : 'Partner Applications', onClick: () => navigate('/admin/partner-applications') },
    { icon: Settings, label: language === 'ru' ? 'Пользователи' : 'User Analytics', onClick: () => navigate('/admin/users') },
    { icon: CreditCard, label: language === 'ru' ? 'Финансы' : 'Finance', onClick: () => navigate('/admin/finance') },
    { icon: FileText, label: language === 'ru' ? 'Модерация контента' : 'Content Moderation', onClick: () => navigate('/admin/moderation') },
  ];

  const infoItems = [
    { icon: Info, label: language === 'ru' ? 'О нас' : 'About Us', onClick: () => navigate('/about') },
    { icon: HelpCircle, label: language === 'ru' ? 'Как это работает' : 'How It Works', onClick: () => navigate('/how-it-works') },
    { icon: HelpCircle, label: language === 'ru' ? 'Частые вопросы' : 'FAQ', onClick: () => navigate('/faq') },
    { icon: Handshake, label: language === 'ru' ? 'Для партнёров' : 'For Partners', onClick: () => navigate('/partners') },
    { icon: Shield, label: language === 'ru' ? 'Конфиденциальность' : 'Privacy Policy', onClick: () => navigate('/privacy') },
    { icon: FileText, label: language === 'ru' ? 'Условия использования' : 'Terms of Use', onClick: () => navigate('/terms') },
  ];

  return (
    <AppLayout>
      <PageContainer>
        {/* Profile header */}
        <SectionCard className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary-foreground">
                {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {profile?.full_name || user.email}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile?.full_name ? user.email : (language === 'ru' ? 'Аккаунт туриста' : 'Tourist Account')}
            </p>
            <EmailVerificationBadge variant="inline" />
          </div>
          <PremiumButton variant="outline" size="sm" onClick={() => navigate('/profile/edit')}>
            {t('action.edit')}
          </PremiumButton>
        </SectionCard>

        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Appearance & Settings */}
        <div className="text-xs font-medium text-muted-foreground mb-2 mt-4 flex items-center gap-1">
          <Settings className="w-3 h-3" />
          {language === 'ru' ? 'Оформление' : 'Appearance'}
        </div>
        
        {/* Theme switcher */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">
              {language === 'ru' ? 'Тема оформления' : 'Theme'}
            </span>
          </div>
          <ThemeSwitcher variant="cards" />
        </SectionCard>

        {/* Language switcher */}
        <SectionCard className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">
              {language === 'ru' ? 'Язык' : 'Language'}
            </span>
          </div>
          <LanguageSwitcher variant="toggle" size="sm" />
        </SectionCard>

        {/* Currency switcher */}
        <SectionCard className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">
              {language === 'ru' ? 'Валюта' : 'Currency'}
            </span>
          </div>
          <CurrencySwitcher size="sm" />
        </SectionCard>

        {/* User Preferences */}
        <div className="text-xs font-medium text-muted-foreground mb-2 mt-4 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {language === 'ru' ? 'Настройки' : 'Preferences'}
        </div>
        <UserPreferences />

        {/* Referral program */}
        <ReferralCard variant="compact" />

        {/* Account Menu items */}
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
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t('auth.logout')}
        </PremiumButton>
      </PageContainer>
    </AppLayout>
  );
}
