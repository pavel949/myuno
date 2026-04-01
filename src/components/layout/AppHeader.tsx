import React, { memo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Search, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { MiniCart } from '@/components/market/MiniCart';
import { Button } from '@/components/ui/button';
import { DesktopNavTabs } from '@/components/layout/DesktopNavTabs';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
import { useScrolled } from '@/hooks/useScrollBehavior';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export const AppHeader = memo(function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [searchOpen, setSearchOpen] = useState(false);
  const scrolled = useScrolled(60);

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
          "sticky top-0 z-50 w-full border-b transition-all duration-300",
          className
        )}
        style={{
          background: scrolled ? 'rgba(15,28,46,0.95)' : 'hsl(var(--bg-surface))',
          borderColor: 'hsl(0 0% 100% / 0.07)',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.07)' : 'none',
        }}
      >
        <div className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-8 xl:px-10 max-w-[1536px] mx-auto gap-2">
          {/* Logo */}
          <Link
            to={APP_ROUTES.HOME}
            className="flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap group"
          >
            <span className="text-sm lg:text-base text-primary font-bold transition-all duration-200 group-hover:tracking-wider">
              my
            </span>
            <span className="text-base lg:text-xl font-bold text-foreground font-display tracking-tight">
              UNO
            </span>
          </Link>

          {/* Desktop navigation */}
          <DesktopNavTabs />

          {/* Desktop Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "hidden lg:flex items-center gap-3 mx-4 flex-1 max-w-sm",
              "px-4 py-2 rounded-[var(--radius-md)]",
              "transition-all duration-200 cursor-pointer group/search"
            )}
            style={{
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(0 0% 100% / 0.07)',
            }}
          >
            <Search className="w-4 h-4 text-muted-foreground group-hover/search:text-foreground transition-colors shrink-0" />
            <span className="text-[13px] text-muted-foreground flex-1 text-left truncate">
              {isRu ? 'Поиск сервисов...' : 'Search services...'}
            </span>
            <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono text-muted-foreground"
              style={{ background: 'hsl(0 0% 100% / 0.04)', border: '1px solid hsl(0 0% 100% / 0.07)' }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] hover:bg-muted/40 transition-colors"
            aria-label={isRu ? 'Поиск' : 'Search'}
          >
            <Search className="w-[18px] h-[18px] text-muted-foreground" />
          </button>

          {title && (
            <h1 className="text-sm font-medium truncate flex-1 text-center mx-4 text-foreground lg:hidden">{title}</h1>
          )}

          {/* Right — utilities */}
          <div className="flex items-center gap-1 lg:gap-1.5 ml-auto shrink-0">
            <LanguageSwitcher size="sm" />
            <CurrencySwitcher size="sm" />
            <MiniCart className="rounded-[var(--radius-sm)] hover:bg-muted/40 transition-colors" />
            {user ? (
              <UserAvatarMenu />
            ) : (
              <Link to={APP_ROUTES.AUTH}>
                <Button size="sm" className="h-8 text-xs px-4 ml-1 rounded-[var(--radius-full)] font-semibold bg-primary text-primary-foreground hover:bg-primary-hover">
                  {t('auth.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
});
