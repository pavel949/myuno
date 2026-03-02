import React, { memo, useState, useEffect, useCallback } from 'react';
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
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

/**
 * AppHeader — Architectural Navigation
 * Desktop: segmented pill tabs + elegant search + grouped utilities
 * Mobile: logo + utilities only (bottom nav handles navigation)
 */
export const AppHeader = memo(function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { availableRoles } = useUserContext();
  const isRu = language === 'ru';
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full",
          "bg-background/90 backdrop-blur-2xl border-b border-border/30",
          "shadow-[0_1px_3px_0_hsl(220_20%_20%/0.04)]",
          className
        )}
      >
        <div className="flex items-center justify-between h-12 lg:h-16 xl:h-[72px] px-3 sm:px-4 lg:px-8 xl:px-10 max-w-[1536px] mx-auto gap-1">
          {/* Logo with hover animation */}
          <Link
            to="/"
            className="flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap group"
          >
            <span className="text-sm lg:text-[15px] text-muted-foreground/80 font-light transition-all duration-300 group-hover:tracking-wider group-hover:text-muted-foreground">
              my
            </span>
            <span className="text-base lg:text-xl font-bold text-foreground font-display tracking-tight">
              UNO
            </span>
          </Link>

          {/* Desktop segmented pill navigation */}
          <DesktopNavTabs />

          {/* Desktop Search — opens modal */}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "hidden lg:flex items-center gap-3 mx-4 flex-1 max-w-sm",
              "px-4 py-2 rounded-xl border border-border/60",
              "bg-muted/30 hover:bg-muted/50 hover:border-border",
              "transition-all duration-200 cursor-pointer group/search"
            )}
          >
            <Search className="w-4 h-4 text-muted-foreground group-hover/search:text-foreground transition-colors shrink-0" />
            <span className="text-[13px] text-muted-foreground flex-1 text-left truncate">
              {isRu ? 'Поиск услуг и товаров...' : 'Search services & products...'}
            </span>
            <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-md bg-background text-[10px] font-mono text-muted-foreground border border-border/60 shadow-sm">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
            aria-label={isRu ? 'Поиск' : 'Search'}
          >
            <Search className="w-[18px] h-[18px] text-muted-foreground" />
          </button>

          {title && (
            <h1 className="text-sm font-medium truncate flex-1 text-center mx-4 text-foreground lg:hidden">{title}</h1>
          )}

          {/* Right — grouped utilities */}
          <div className="flex items-center gap-0.5 lg:gap-1 ml-auto shrink-0">
            {/* Utility group */}
            <div className="hidden lg:flex items-center gap-0.5 bg-muted/30 rounded-xl p-0.5 border border-border/30">
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
            <div className="hidden lg:block w-px h-5 bg-border/50 mx-1.5" />

            <MiniCart className="rounded-lg hover:bg-muted transition-colors" />

            {user && availableRoles.length > 1 && (
              <RoleContextSwitcher compact />
            )}

            {user ? (
              <>
                {/* Notification bell with dot */}
                <button
                  onClick={() => navigate('/notifications')}
                  aria-label={t('nav.notifications')}
                  className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
                >
                  <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                  )}
                </button>

                {/* Avatar with hover ring */}
                <Link to="/account" aria-label={t('nav.profile')}>
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-primary/10 flex items-center justify-center ml-0.5 transition-all duration-200 hover:ring-2 hover:ring-primary/20 hover:bg-primary/15">
                    <span className="text-xs font-semibold text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="h-8 text-xs px-4 ml-1 rounded-lg font-medium">
                  {t('auth.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
});
