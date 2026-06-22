import React from 'react';
import { Home, Building2, Store, Shield, Users, Briefcase, User, Plane, Handshake, UserCog, Scale, Headphones, Wallet, TrendingUp, LineChart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import type { AppRole } from '@/types/auth';
import { cn } from '@/lib/utils';

interface ActiveRoleBadgeProps {
  className?: string;
  showLabel?: boolean;
}

// MC company role config — takes priority when user is in MC context
const MC_ROLE_BADGE_CONFIG: Record<string, {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  color: string;
  bgColor: string;
}> = {
  director: {
    icon: Shield,
    labelEn: 'Director',
    labelRu: 'Директор',
    labelTh: 'ผู้อำนวยการ',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  admin: {
    icon: Shield,
    labelEn: 'Admin',
    labelRu: 'Администратор',
    labelTh: 'ผู้ดูแลระบบ',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  manager: {
    icon: Briefcase,
    labelEn: 'Manager',
    labelRu: 'Менеджер',
    labelTh: 'ผู้จัดการ',
    color: 'text-teal',
    bgColor: 'bg-teal/10',
  },
  accountant: {
    icon: Wallet,
    labelEn: 'Accountant',
    labelRu: 'Бухгалтер',
    labelTh: 'นักบัญชี',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  staff: {
    icon: Users,
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    labelTh: 'พนักงาน',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
};

// UI-specific role config for badge display
const ROLE_BADGE_CONFIG: Partial<Record<AppRole, {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  color: string;
  bgColor: string;
}>> = {
  guest: {
    icon: User,
    labelEn: 'Guest',
    labelRu: 'Гость',
    labelTh: 'ผู้เยี่ยมชม',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  user: {
    icon: Home,
    labelEn: 'Client',
    labelRu: 'Клиент',
    labelTh: 'ลูกค้า',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  tourist: {
    icon: Plane,
    labelEn: 'Tourist',
    labelRu: 'Турист',
    labelTh: 'นักท่องเที่ยว',
    color: 'text-accent-cyan',
    bgColor: 'bg-accent-cyan/10',
  },
  resident: {
    icon: Home,
    labelEn: 'Resident',
    labelRu: 'Резидент',
    labelTh: 'ผู้พักอาศัย',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  partner: {
    icon: Handshake,
    labelEn: 'Partner',
    labelRu: 'Партнёр',
    labelTh: 'พาร์ทเนอร์',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  owner: {
    icon: Building2,
    labelEn: 'Property Owner',
    labelRu: 'Собственник',
    labelTh: 'เจ้าของอสังหาริมทรัพย์',
    color: 'text-teal',
    bgColor: 'bg-teal/10',
  },
  vendor: {
    icon: Store,
    labelEn: 'Provider',
    labelRu: 'Продавец',
    labelTh: 'ผู้ให้บริการ',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  staff: {
    icon: Briefcase,
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    labelTh: 'พนักงาน',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  uno_team: {
    icon: Headphones,
    labelEn: 'Team',
    labelRu: 'Команда',
    labelTh: 'ทีมงาน',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  admin: {
    icon: Shield,
    labelEn: 'Admin',
    labelRu: 'Админ',
    labelTh: 'ผู้ดูแลระบบ',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  ombudsman: {
    icon: Scale,
    labelEn: 'Ombudsman',
    labelRu: 'Омбудсмен',
    labelTh: 'ผู้ตรวจการ',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  finance: {
    icon: Wallet,
    labelEn: 'Finance',
    labelRu: 'Финансы',
    labelTh: 'การเงิน',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  support: {
    icon: Headphones,
    labelEn: 'Support',
    labelRu: 'Поддержка',
    labelTh: 'ฝ่ายสนับสนุน',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  sales: {
    icon: TrendingUp,
    labelEn: 'Sales',
    labelRu: 'Продажи',
    labelTh: 'ฝ่ายขาย',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  investor: {
    icon: LineChart,
    labelEn: 'Investor',
    labelRu: 'Инвестор',
    labelTh: 'นักลงทุน',
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
  },
};

// Default fallback config
const DEFAULT_BADGE_CONFIG = {
  icon: User,
  labelEn: 'User',
  labelRu: 'Пользователь',
  labelTh: 'ผู้ใช้',
  color: 'text-info',
  bgColor: 'bg-info/10',
};

/**
 * Badge showing the user's current active role.
 * Prioritizes MC company role (director/manager/etc.) over platform role when available.
 */
export function ActiveRoleBadge({ className, showLabel = true }: ActiveRoleBadgeProps) {
  const { language } = useLanguage();
  const { activeRole, isLoading } = useUserContext();
  const { activeCompany, isLoading: isCompanyLoading } = useActiveCompany();

  if (isLoading || isCompanyLoading) return null;

  // Prioritize MC company role when user has an active company
  const mcRole = activeCompany?.role;
  const mcConfig = mcRole ? MC_ROLE_BADGE_CONFIG[mcRole] : null;
  
  const config = mcConfig || ROLE_BADGE_CONFIG[activeRole] || DEFAULT_BADGE_CONFIG;
  const Icon = config.icon;
  const label = language === 'ru' ? config.labelRu : language === 'th' ? config.labelTh : config.labelEn;

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
