import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { MiniCart } from '@/components/market/MiniCart';
import { RoleContextSwitcher } from '@/components/uno/RoleContextSwitcher';
import { useUserContext } from '@/hooks/useUserContext';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export const AppHeader = memo(function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { availableRoles } = useUserContext();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-background/80 backdrop-blur-xl border-b border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Left side - Logo */}
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">my</span>
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">U</span>
          </div>
          {!title && (
            <span className="text-lg font-display font-bold text-gradient-gold hidden sm:block">
              UNO
            </span>
          )}
        </Link>
        
        {title && (
          <h1 className="text-base font-semibold truncate flex-1 text-center mx-4 max-w-[40%]">{title}</h1>
        )}

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">

          {/* Switchers - hide currency/theme on mobile */}
          <div className="flex items-center gap-0.5 sm:gap-1 mr-0.5 sm:mr-1">
            <LanguageSwitcher size="sm" />
            <div className="hidden sm:flex items-center gap-0.5">
              <CurrencySwitcher size="sm" />
              <ThemeSwitcher size="sm" />
            </div>
          </div>
          
          {/* Mini Cart with dropdown */}
          <MiniCart className="rounded-xl hover:bg-secondary transition-colors" />
          
          {/* Role Switcher - show only for users with multiple roles */}
          {user && availableRoles.length > 1 && (
            <RoleContextSwitcher compact />
          )}
          
          {user ? (
            <>
              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                aria-label={t('nav.notifications')}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              
              {/* Profile Avatar - now links to /account */}
              <Link to="/account" aria-label={t('nav.profile')}>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/30 ml-0.5 hover:border-primary/60 transition-colors">
                  <span className="text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <Link to="/auth" className="ml-1">
              <PremiumButton size="sm" className="h-9 text-sm px-3">
                {t('auth.login')}
              </PremiumButton>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
});
