import React from 'react';
import { Home, Building2, Store, Shield, Users, Briefcase } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { cn } from '@/lib/utils';

interface ActiveRoleBadgeProps {
  className?: string;
  showLabel?: boolean;
}

const ROLE_CONFIG: Record<AppRole, {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  color: string;
  bgColor: string;
}> = {
  user: {
    icon: Home,
    labelEn: 'Guest',
    labelRu: 'Гость',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  owner: {
    icon: Building2,
    labelEn: 'Owner',
    labelRu: 'Владелец',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  vendor: {
    icon: Store,
    labelEn: 'Provider',
    labelRu: 'Продавец',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  uno_team: {
    icon: Users,
    labelEn: 'Team',
    labelRu: 'Команда',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  staff: {
    icon: Briefcase,
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  admin: {
    icon: Shield,
    labelEn: 'Admin',
    labelRu: 'Админ',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

/**
 * Badge showing the user's current active role
 */
export function ActiveRoleBadge({ className, showLabel = true }: ActiveRoleBadgeProps) {
  const { language } = useLanguage();
  const { activeRole, isLoading } = useUserContext();

  if (isLoading) return null;

  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.user;
  const Icon = config.icon;
  const label = language === 'ru' ? config.labelRu : config.labelEn;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
