import React from 'react';
import { Home, Building2, Store, Shield, Users, Briefcase, User, Plane, Handshake, UserCog, Scale, Headphones, Wallet, TrendingUp, LineChart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import type { AppRole } from '@/types/auth';
import { cn } from '@/lib/utils';

interface ActiveRoleBadgeProps {
  className?: string;
  showLabel?: boolean;
}

// UI-specific role config for badge display
// Only includes roles that are commonly displayed in badge form
const ROLE_BADGE_CONFIG: Partial<Record<AppRole, {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  color: string;
  bgColor: string;
}>> = {
  guest: {
    icon: User,
    labelEn: 'Guest',
    labelRu: 'Гость',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
  user: {
    icon: Home,
    labelEn: 'Client',
    labelRu: 'Клиент',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  tourist: {
    icon: Plane,
    labelEn: 'Tourist',
    labelRu: 'Турист',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  resident: {
    icon: Home,
    labelEn: 'Resident',
    labelRu: 'Резидент',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  partner: {
    icon: Handshake,
    labelEn: 'Partner',
    labelRu: 'Партнёр',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  owner: {
    icon: Building2,
    labelEn: 'Owner',
    labelRu: 'Владелец',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  property_owner: {
    icon: Building2,
    labelEn: 'Property Owner',
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
  staff: {
    icon: Briefcase,
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  uno_team: {
    icon: Headphones,
    labelEn: 'Team',
    labelRu: 'Команда',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  admin: {
    icon: Shield,
    labelEn: 'Admin',
    labelRu: 'Админ',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  ombudsman: {
    icon: Scale,
    labelEn: 'Ombudsman',
    labelRu: 'Омбудсмен',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
  },
  finance: {
    icon: Wallet,
    labelEn: 'Finance',
    labelRu: 'Финансы',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  support: {
    icon: Headphones,
    labelEn: 'Support',
    labelRu: 'Поддержка',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  sales: {
    icon: TrendingUp,
    labelEn: 'Sales',
    labelRu: 'Продажи',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  investor: {
    icon: LineChart,
    labelEn: 'Investor',
    labelRu: 'Инвестор',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

// Default fallback config
const DEFAULT_BADGE_CONFIG = {
  icon: User,
  labelEn: 'User',
  labelRu: 'Пользователь',
  color: 'text-blue-600 dark:text-blue-400',
  bgColor: 'bg-blue-100 dark:bg-blue-900/30',
};

/**
 * Badge showing the user's current active role
 */
export function ActiveRoleBadge({ className, showLabel = true }: ActiveRoleBadgeProps) {
  const { language } = useLanguage();
  const { activeRole, isLoading } = useUserContext();

  if (isLoading) return null;

  const config = ROLE_BADGE_CONFIG[activeRole] || DEFAULT_BADGE_CONFIG;
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
