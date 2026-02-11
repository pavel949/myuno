import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { MiniCart } from '@/components/market/MiniCart';
import { RoleContextSwitcher } from '@/components/uno/RoleContextSwitcher';
import { useUserContext } from '@/hooks/useUserContext';
import { Button } from '@/components/ui/button';
import { DesktopNavTabs } from '@/components/layout/DesktopNavTabs';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

/**
 * AppHeader — Architectural Navigation
 * Desktop: animated pill tabs + elegant search + grouped utilities
 * Mobile: logo + utilities only (bottom nav handles navigation)
 */
export const AppHeader = memo(function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { availableRoles } = useUserContext();
  const isRu = language === 'ru';

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-background/90 backdrop-blur-lg border-b border-border/60",
        className
      )}
    >
      <div className="flex items-center justify-between h-12 lg:h-16 px-4 lg:px-8 max-w-7xl mx-auto">
        {/* Logo with hover letter-spacing */}
        <Link
          to="/"
          className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap group"
        >
          <span className="text-sm lg:text-base text-muted-foreground font-light transition-all duration-300 group-hover:tracking-wider">
            my
          </span>
          <span className="text-base lg:text-xl font-semibold text-foreground font-display">
            UNO
          </span>
        </Link>

        {/* Desktop animated pill navigation */}
        <DesktopNavTabs />

        {/* Desktop Search — clean pill with Ctrl+K */}
        <button
          onClick={() => navigate('/search')}
          className={cn(
            "hidden lg:flex items-center gap-3 mx-6 flex-1 max-w-md",
            "px-4 py-2 rounded-full border border-border/80",
            "bg-muted/30 hover:bg-muted/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
          )}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-[14px] text-muted-foreground flex-1 text-left">
            {isRu ? 'Поиск услуг и товаров...' : 'Search services & products...'}
          </span>
          <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground border border-border/60">
            ⌘K
          </kbd>
        </button>

        {title && (
          <h1 className="text-sm font-medium truncate flex-1 text-center mx-4 text-foreground lg:hidden">{title}</h1>
        )}

        {/* Right — grouped utilities with separator */}
        <div className="flex items-center gap-0.5 lg:gap-1 ml-auto">
          {/* Utility group */}
          <div className="hidden lg:flex items-center gap-0.5">
            <LanguageSwitcher size="sm" />
            <ThemeSwitcher size="sm" />
            <CurrencySwitcher size="sm" />
          </div>

          {/* Mobile: only language + currency */}
          <div className="flex lg:hidden items-center gap-0.5">
            <LanguageSwitcher size="sm" />
            <CurrencySwitcher size="sm" />
          </div>

          {/* Vertical separator — desktop only */}
          <div className="hidden lg:block w-px h-5 bg-border/60 mx-2" />

          <MiniCart className="rounded-lg hover:bg-muted transition-colors" />

          {user && availableRoles.length > 1 && (
            <RoleContextSwitcher compact />
          )}

          {user ? (
            <>
              {/* Notification bell with dot indicator */}
              <button
                onClick={() => navigate('/notifications')}
                aria-label={t('nav.notifications')}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>

              {/* Avatar with hover ring */}
              <Link to="/account" aria-label={t('nav.profile')}>
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-muted flex items-center justify-center ml-0.5 transition-all duration-200 hover:ring-2 hover:ring-primary/30">
                  <span className="text-xs font-medium text-muted-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline" className="h-8 text-xs px-3 ml-1">
                {t('auth.login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
});
