import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
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

/**
 * AppHeader — Minimal, calm header
 * No gradient branding, no visual noise
 */
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
        "bg-background/90 backdrop-blur-lg border-b border-border/40",
        className
      )}
    >
      <div className="flex items-center justify-between h-12 px-4 max-w-7xl mx-auto">
        {/* Logo — simple text, no gradients */}
        <Link to="/" className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">my</span>
          <span className="text-base font-semibold text-foreground">UNO</span>
        </Link>
        
        {title && (
          <h1 className="text-sm font-medium truncate flex-1 text-center mx-4 text-foreground">{title}</h1>
        )}

        {/* Right — compact utilities */}
        <div className="flex items-center gap-0.5">
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
