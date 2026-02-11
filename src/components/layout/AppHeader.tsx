import React, { memo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Home, Compass, ShoppingBag, User } from 'lucide-react';
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

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

const desktopNavItems = [
  { path: '/', icon: Home, labelEn: 'Home', labelRu: 'Главная', exact: true },
  { path: '/discover', icon: Compass, labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: '/market', icon: ShoppingBag, labelEn: 'Market', labelRu: 'Маркет' },
  { path: '/account', icon: User, labelEn: 'Me', labelRu: 'Мой' },
];

/**
 * AppHeader — Minimal, calm header
 * Desktop: includes horizontal nav links
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
        "bg-background/90 backdrop-blur-lg border-b border-border/40",
        className
      )}
    >
      <div className="flex items-center justify-between h-12 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
          <span className="text-sm text-muted-foreground">my</span>
          <span className="text-base font-semibold text-foreground">UNO</span>
        </Link>

        {/* Desktop navigation — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {desktopNavItems.map(({ path, icon: Icon, labelEn, labelRu, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{isRu ? labelRu : labelEn}</span>
            </NavLink>
          ))}
        </nav>
        
        {title && (
          <h1 className="text-sm font-medium truncate flex-1 text-center mx-4 text-foreground md:hidden">{title}</h1>
        )}

        {/* Right — compact utilities */}
        <div className="flex items-center gap-0.5 ml-auto">
          <LanguageSwitcher size="sm" />
          <div className="hidden sm:block">
            <ThemeSwitcher size="sm" />
          </div>
          <CurrencySwitcher size="sm" />
          
          <MiniCart className="rounded-lg hover:bg-muted transition-colors" />
          
          {user && availableRoles.length > 1 && (
            <RoleContextSwitcher compact />
          )}
          
          {user ? (
            <>
              <button
                onClick={() => navigate('/notifications')}
                aria-label={t('nav.notifications')}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell className="w-4.5 h-4.5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              
              <Link to="/account" aria-label={t('nav.profile')}>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ml-0.5">
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
