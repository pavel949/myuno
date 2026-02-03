import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Construction } from 'lucide-react';
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
import { useMaintenance } from '@/contexts/MaintenanceContext';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export const AppHeader = memo(function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { availableRoles } = useUserContext();
  const { isMaintenanceMode, setMaintenanceMode } = useMaintenance();

  // Check if current user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['user-is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'uno_team'])
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

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
          {/* Coming Soon Toggle - visible to admins */}
          {isAdmin && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full mr-2 transition-colors",
              isMaintenanceMode 
                ? "bg-warning/20 border border-warning/50" 
                : "bg-muted/50 border border-border"
            )}>
              <Construction className={cn(
                "w-4 h-4",
                isMaintenanceMode ? "text-warning" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                isMaintenanceMode ? "text-warning" : "text-muted-foreground"
              )}>
                {language === 'ru' ? 'Скоро' : 'Soon'}
              </span>
              <Switch
                checked={isMaintenanceMode}
                onCheckedChange={setMaintenanceMode}
                className="scale-75"
              />
            </div>
          )}

          {/* Switchers */}
          <div className="flex items-center gap-0.5 sm:gap-1 mr-0.5 sm:mr-1">
            <LanguageSwitcher size="sm" />
            <CurrencySwitcher size="sm" />
            <ThemeSwitcher size="sm" />
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
