/**
 * TopBar — universal application header.
 *
 * Replaces AppHeader, MCHeader, AdminHeader, VendorHeader, GuestHeader.
 * Composition by breakpoint:
 *  - Mobile  (<768): logo + search-icon + utilities + avatar
 *  - Tablet  (768–1023): logo + 5 nav pills + search-icon + utilities + avatar
 *  - Desktop (≥1024): logo + 5 nav pills + full search input + utilities + avatar
 *
 * Reads PRIMARY_NAV[role] from the SSOT navigation model.
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ConsumerHeader } from './ConsumerHeader';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { GlobalPreferencesControls } from '@/components/uno/GlobalPreferencesControls';
import { MiniCart } from '@/components/market/MiniCart';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { Breadcrumbs } from '@/components/nav/Breadcrumbs';
import { useScrolled } from '@/hooks/useScrollBehavior';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ECOSYSTEM_HEADER_INNER } from '@/design-system/ecosystemLayout';
import { shouldShowBreadcrumbs } from '@/lib/config/routeMeta';
import {
  PRIMARY_NAV,
  hasSidebar,
  type NavRoleKey,
} from '@/lib/nav/navigationModel';

interface TopBarProps {
  role: NavRoleKey;
  title?: string;
  className?: string;
  /** Show cart icon (consumer surfaces). Defaults to true for guest/investor/mc_portal. */
  showCart?: boolean;
}

export const TopBar = memo(function TopBar({
  role,
  title,
  className,
  showCart,
}: TopBarProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const isRu = language === 'ru';
  const [searchOpen, setSearchOpen] = useState(false);
  const searchOrigin = useRef<HTMLElement | null>(null);
  const scrolled = useScrolled(60);

  const sidebarVisible = hasSidebar(role);
  const isConsumer = !sidebarVisible;
  const headerFrame = role === 'admin'
    ? 'mx-auto w-full max-w-none px-[var(--page-padding-x)]'
    : ECOSYSTEM_HEADER_INNER;
  const cartEnabled = showCart ?? isConsumer;
  const navItems = PRIMARY_NAV[role];
  const showCrumbs = shouldShowBreadcrumbs(location.pathname);

  const openSearch = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (role === 'admin') searchOrigin.current = event?.currentTarget
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSearchOpen(true);
  }, [role]);
  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open);
    // This controlled search has no Radix DialogTrigger to restore focus to.
    if (!open && role === 'admin') {
      const origin = searchOrigin.current;
      requestAnimationFrame(() => { if (origin?.isConnected) origin.focus({ preventScroll: true }); });
    }
  }, [role]);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // AdminLayout's command palette exclusively owns this shortcut.
    if (role === 'admin') return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  }, [openSearch, role]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    const openHandler = () => openSearch();
    window.addEventListener('myuno:open-search', openHandler);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('myuno:open-search', openHandler);
    };
  }, [handleKeyDown, openSearch]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (isConsumer) return (
    <>
      <ConsumerHeader onSearch={() => openSearch()} />
      <GlobalSearchModal open={searchOpen} onOpenChange={handleSearchOpenChange} />
    </>
  );

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b border-border transition-all duration-300',
          scrolled
            ? 'bg-[hsl(var(--bg-surface)/0.95)] shadow-[0_1px_0_hsl(var(--border))]'
            : 'bg-[hsl(var(--bg-surface))]',
          className,
        )}
      >
        <div
          className={cn(
            headerFrame,
            'flex h-14 items-center gap-1.5 lg:h-16 lg:gap-2',
          )}
        >
          {/* Sidebar toggle (workspace roles, ≥md only) */}
          {sidebarVisible && (
            <SidebarTrigger
              className="flex h-11 w-11 shrink-0 md:h-9 md:w-9 md:mr-1"
              title={pickLang(language, { ru: 'Меню', en: 'Menu', th: 'เมนู' })}
            />
          )}

          {/* Logo */}
          <BrandWordmark className={role === 'owner' || role === 'admin' ? 'min-h-11 items-center' : undefined} />

          {/* Nav pills (≥md). Consumer roles get them on tablet+; workspace roles
              have a sidebar — pills are redundant, hidden. */}
          {isConsumer && (
            <nav className="hidden md:flex items-center gap-0.5 ml-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                const label = pickLang(language, { ru: item.labelRu, en: item.labelEn, th: item.labelTh });
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    aria-label={label}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-none text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    <span className="hidden lg:inline">{label}</span>
                  </NavLink>
                );
              })}
            </nav>
          )}

          {/* Desktop search input (lg+) */}
          <button
            onClick={openSearch}
            className={cn(
              'hidden lg:flex items-center gap-3 mx-4 flex-1 max-w-sm',
              'px-4 py-2 rounded-none',
              'bg-[hsl(var(--bg-elevated))] border border-border',
              'transition-all duration-200 cursor-pointer group/search',
              'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            <Search className="size-5 text-muted-foreground group-hover/search:text-foreground transition-colors shrink-0" />
            <span className="text-[13px] text-muted-foreground flex-1 text-left truncate">
              {pickLang(language, { ru: 'Поиск сервисов...', en: 'Search services...', th: 'ค้นหาบริการ...' })}
            </span>
            <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-none text-[10px] font-mono text-muted-foreground bg-[hsl(var(--bg-base)/0.6)] border border-border">
              ⌘K
            </kbd>
          </button>

          {title && (
            <h1 className="text-sm font-medium truncate flex-1 text-center mx-2 text-foreground lg:hidden">
              {title}
            </h1>
          )}

          {!title && <div className="flex-1 lg:hidden" />}

          {/* Right utilities */}
          <div className="flex items-center gap-0.5 lg:gap-1.5 ml-auto shrink-0">
            <button
              onClick={openSearch}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-none hover:bg-muted/40 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={pickLang(language, { ru: 'Поиск', en: 'Search', th: 'ค้นหา' })}
            >
              <Search className="size-5 text-muted-foreground" />
            </button>
            {role === 'owner' || role === 'admin' ? (
              <>
                <div className={role === 'admin' ? 'hidden lg:block' : 'hidden md:block'}>
                  <GlobalPreferencesControls size="sm" themeVariant="dropdown" />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn('h-11 w-11 shrink-0', role === 'admin' ? 'lg:hidden' : 'md:hidden')} aria-label={pickLang(language, {ru: 'Язык, валюта и тема', en: 'Language, currency and theme', th: 'ภาษา สกุลเงิน และธีม'})}>
                      <SlidersHorizontal className="h-5 w-5" aria-hidden />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" aria-label={isRu ? 'Язык, валюта и тема' : 'Language, currency and theme'} className="w-auto max-w-[calc(100vw-2rem)] p-4 [&_button]:min-h-11 [&_button]:min-w-11">
                    <p className="mb-3 text-body-sm font-medium">{isRu ? 'Язык, валюта и тема' : 'Language, currency and theme'}</p>
                    <GlobalPreferencesControls size="default" themeVariant="dropdown" />
                  </PopoverContent>
                </Popover>
              </>
            ) : <GlobalPreferencesControls size="sm" themeVariant="dropdown" />}
            {cartEnabled && (
              <MiniCart className="rounded-none hover:bg-muted/40 transition-colors" />
            )}
            {user ? (
              <UserAvatarMenu compact={role === 'owner' || role === 'admin'} />
            ) : (
              <Button
                asChild
                size="sm"
                className="h-11 text-xs px-3 lg:px-4 ml-0.5 lg:ml-1 rounded-[var(--radius-full)] font-semibold bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <Link to={APP_ROUTES.AUTH}>{t('auth.login')}</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumbs row — depth ≥ 2 only (see routeMeta.shouldShowBreadcrumbs).
            Hidden on /auth, /, and other top-level surfaces. */}
        {showCrumbs && (
          <div className="border-t border-border/40 bg-[hsl(var(--bg-surface)/0.6)]">
            <div className={cn(headerFrame, 'flex h-9 items-center')}>
              <Breadcrumbs />
            </div>
          </div>
        )}
      </header>

      <GlobalSearchModal open={searchOpen} onOpenChange={handleSearchOpenChange} />
    </>
  );
});
