import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, Store, Shield, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { SectionCard } from '@/components/uno/SectionCard';
import { cn } from '@/lib/utils';

interface RoleSwitchMenuProps {
  compact?: boolean;
  className?: string;
}

/**
 * Airbnb-style "Switch to..." menu showing available dashboards
 * Based on user's roles (not active role)
 */
export function RoleSwitchMenu({ compact = false, className }: RoleSwitchMenuProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasRole, isLoading } = useUserContext();

  if (isLoading) return null;

  const dashboards = [
    {
      key: 'guest',
      icon: Home,
      labelEn: 'Guest Mode',
      labelRu: 'Режим гостя',
      path: '/',
      available: true, // Always available
      color: 'bg-blue-500',
    },
    {
      key: 'owner',
      icon: Building2,
      labelEn: 'Switch to Hosting',
      labelRu: 'Режим владельца',
      path: '/owner',
      available: hasRole('owner') || hasRole('admin'),
      color: 'bg-teal-500',
    },
    {
      key: 'vendor',
      icon: Store,
      labelEn: 'Switch to Selling',
      labelRu: 'Режим продавца',
      path: '/vendor',
      available: hasRole('vendor') || hasRole('admin'),
      color: 'bg-purple-500',
    },
    {
      key: 'team',
      icon: Users,
      labelEn: 'UNO Team',
      labelRu: 'Команда UNO',
      path: '/team',
      available: hasRole('uno_team') || hasRole('admin'),
      color: 'bg-emerald-500',
    },
    {
      key: 'admin',
      icon: Shield,
      labelEn: 'Admin Panel',
      labelRu: 'Панель админа',
      path: '/admin',
      available: hasRole('admin') || hasRole('staff') || hasRole('uno_team'),
      color: 'bg-red-500',
    },
  ];

  const availableDashboards = dashboards.filter(d => d.available);

  // If only guest mode is available, don't show the menu
  if (availableDashboards.length <= 1) return null;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {availableDashboards.map((dashboard) => {
          const Icon = dashboard.icon;
          return (
            <button
              key={dashboard.key}
              onClick={() => navigate(dashboard.path)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl",
                "bg-secondary/50 hover:bg-secondary transition-colors",
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
          return (
            <button
              key={dashboard.key}
              onClick={() => navigate(dashboard.path)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                "bg-secondary/30 hover:bg-secondary/60 transition-colors",
                "text-left"
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
