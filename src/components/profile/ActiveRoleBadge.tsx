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
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  user: {
    icon: Home,
    labelEn: 'Client',
    labelRu: 'Клиент',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  tourist: {
    icon: Plane,
    labelEn: 'Tourist',
    labelRu: 'Турист',
    color: 'text-accent-cyan',
    bgColor: 'bg-accent-cyan/10',
  },
  resident: {
    icon: Home,
    labelEn: 'Resident',
    labelRu: 'Резидент',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  partner: {
    icon: Handshake,
    labelEn: 'Partner',
    labelRu: 'Партнёр',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  owner: {
    icon: Building2,
    labelEn: 'Owner',
    labelRu: 'Владелец',
    color: 'text-teal',
    bgColor: 'bg-teal/10',
  },
  property_owner: {
    icon: Building2,
    labelEn: 'Property Owner',
    labelRu: 'Владелец',
    color: 'text-teal',
    bgColor: 'bg-teal/10',
  },
  vendor: {
    icon: Store,
    labelEn: 'Provider',
    labelRu: 'Продавец',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  staff: {
    icon: Briefcase,
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  uno_team: {
    icon: Headphones,
    labelEn: 'Team',
    labelRu: 'Команда',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  admin: {
    icon: Shield,
    labelEn: 'Admin',
    labelRu: 'Админ',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  ombudsman: {
    icon: Scale,
    labelEn: 'Ombudsman',
    labelRu: 'Омбудсмен',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  finance: {
    icon: Wallet,
    labelEn: 'Finance',
    labelRu: 'Финансы',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  support: {
    icon: Headphones,
    labelEn: 'Support',
    labelRu: 'Поддержка',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  sales: {
    icon: TrendingUp,
    labelEn: 'Sales',
    labelRu: 'Продажи',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  investor: {
    icon: LineChart,
    labelEn: 'Investor',
    labelRu: 'Инвестор',
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
  },
};

// Default fallback config
const DEFAULT_BADGE_CONFIG = {
  icon: User,
  labelEn: 'User',
  labelRu: 'Пользователь',
  color: 'text-info',
  bgColor: 'bg-info/10',
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
