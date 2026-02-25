import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, Store, Shield, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { SectionCard } from '@/components/uno/SectionCard';
import { cn } from '@/lib/utils';

interface RoleSwitchMenuProps {
  compact?: boolean;
  className?: string;
}

/**
 * Airbnb-style "Switch to..." menu showing available dashboards
 * Uses unified useUserContext as single source of truth
 */
export function RoleSwitchMenu({ compact = false, className }: RoleSwitchMenuProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasRole, isLoading, switchContext, activeRole } = useUserContext();

  if (isLoading) return null;

  const dashboards = [
    {
      key: 'guest',
      icon: Home,
      labelEn: 'Guest',
      labelRu: 'Гость',
      path: '/',
      available: true, // Always available
      color: 'bg-info',
    },
    {
      key: 'owner',
      icon: Building2,
      labelEn: 'Hosting',
      labelRu: 'Владелец',
      path: '/owner',
      available: hasRole('owner') || hasRole('admin'),
      color: 'bg-accent-teal',
    },
    {
      key: 'vendor',
      icon: Store,
      labelEn: 'Provider',
      labelRu: 'Продавец',
      path: '/vendor',
      available: hasRole('vendor') || hasRole('admin'),
      color: 'bg-accent-purple',
    },
    {
      key: 'team',
      icon: Users,
      labelEn: 'Team',
      labelRu: 'Команда',
      path: '/team',
      available: hasRole('uno_team') || hasRole('admin'),
      color: 'bg-success',
    },
    {
      key: 'admin',
      icon: Shield,
      labelEn: 'Admin',
      labelRu: 'Админ',
      path: '/admin',
      available: hasRole('admin') || hasRole('staff') || hasRole('uno_team'),
      color: 'bg-destructive',
    },
  ];

  const availableDashboards = dashboards.filter(d => d.available);

  // If only guest mode is available, don't show the menu
  if (availableDashboards.length <= 1) return null;

  const handleSwitch = async (path: string, roleKey: string) => {
    // Map dashboard keys to AppRole values
    const roleMap: Record<string, AppRole> = {
      guest: 'user',
      owner: 'owner',
      vendor: 'vendor',
      team: 'uno_team',
      admin: 'admin',
    };
    const targetRole = roleMap[roleKey] || 'user';
    
    // Update context in DB and navigate
    await switchContext({ role: targetRole });
    navigate(path);
  };

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {availableDashboards.map((dashboard) => {
          const Icon = dashboard.icon;
          const isActive = dashboard.key === 'guest' && activeRole === 'user' 
            || dashboard.key === activeRole;
          return (
            <button
              key={dashboard.key}
              onClick={() => handleSwitch(dashboard.path, dashboard.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl transition-colors",
                isActive 
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary/50 hover:bg-secondary",
                "text-sm font-medium"
              )}
            >
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", dashboard.color)}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span>{language === 'ru' ? dashboard.labelRu : dashboard.labelEn}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <SectionCard className={cn("space-y-2", className)}>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {language === 'ru' ? 'Мои режимы' : 'My Dashboards'}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {availableDashboards.map((dashboard) => {
          const Icon = dashboard.icon;
          const isActive = dashboard.key === 'guest' && activeRole === 'user' 
            || dashboard.key === activeRole;
          return (
            <button
              key={dashboard.key}
              onClick={() => handleSwitch(dashboard.path, dashboard.key)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                isActive 
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary/30 hover:bg-secondary/60"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", dashboard.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {language === 'ru' ? dashboard.labelRu : dashboard.labelEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
