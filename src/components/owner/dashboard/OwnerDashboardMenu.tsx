import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TrendingUp,
  ContactRound,
  Receipt,
  BarChart3,
  Users,
  Building2,
  Package,
  Wrench,
  DollarSign,
  Star,
  Tag,
  ShieldCheck,
  Radio,
  FileText,
  Megaphone,
  BookOpen,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  icon: LucideIcon;
  labelEn: string;
  labelRu: string;
  tint: string;
}

interface MenuSection {
  titleEn: string;
  titleRu: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    titleEn: 'CRM & Sales',
    titleRu: 'CRM и продажи',
    items: [
      { path: '/owner/owners', icon: Crown, labelEn: 'Owners', labelRu: 'Собственники', tint: 'bg-accent-amber/15 text-accent-amber' },
      { path: '/owner/sales', icon: TrendingUp, labelEn: 'Sales', labelRu: 'Продажи', tint: 'bg-success/15 text-success' },
      { path: '/owner/contacts', icon: ContactRound, labelEn: 'Contacts', labelRu: 'Контакты', tint: 'bg-info/15 text-info' },
      { path: '/owner/reviews-management', icon: Star, labelEn: 'Reviews', labelRu: 'Отзывы', tint: 'bg-warning/15 text-warning' },
      { path: '/owner/marketing', icon: Megaphone, labelEn: 'Marketing', labelRu: 'Маркетинг', tint: 'bg-accent-coral/15 text-accent-coral' },
    ],
  },
  {
    titleEn: 'Operations',
    titleRu: 'Операции',
    items: [
      { path: '/owner/operations', icon: Wrench, labelEn: 'Tasks', labelRu: 'Задачи', tint: 'bg-warning/15 text-warning' },
      { path: '/owner/rates', icon: Tag, labelEn: 'Rates', labelRu: 'Тарифы', tint: 'bg-accent-purple/15 text-accent-purple' },
      { path: '/owner/channels', icon: Radio, labelEn: 'Channels', labelRu: 'Каналы', tint: 'bg-accent-cyan/15 text-accent-cyan' },
      { path: '/owner/inventory', icon: Package, labelEn: 'Inventory', labelRu: 'Инвентарь', tint: 'bg-accent-amber/15 text-accent-amber' },
      { path: '/owner/vendors', icon: Building2, labelEn: 'Vendors', labelRu: 'Поставщики', tint: 'bg-info/15 text-info' },
      { path: '/owner/insurance', icon: ShieldCheck, labelEn: 'Insurance', labelRu: 'Страховки', tint: 'bg-success/15 text-success' },
      { path: '/owner/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Документы', tint: 'bg-muted text-muted-foreground' },
    ],
  },
  {
    titleEn: 'Finance',
    titleRu: 'Финансы',
    items: [
      { path: '/owner/finance', icon: DollarSign, labelEn: 'Overview', labelRu: 'Обзор', tint: 'bg-success/15 text-success' },
      { path: '/owner/financials', icon: Receipt, labelEn: 'Transactions', labelRu: 'Транзакции', tint: 'bg-accent-amber/15 text-accent-amber' },
      { path: '/owner/reports', icon: BarChart3, labelEn: 'Reports', labelRu: 'Отчёты', tint: 'bg-primary/15 text-primary' },
      { path: '/owner/budget', icon: Tag, labelEn: 'Budget', labelRu: 'Бюджет', tint: 'bg-accent-purple/15 text-accent-purple' },
      { path: '/owner/invoices', icon: Receipt, labelEn: 'Invoices', labelRu: 'Инвойсы', tint: 'bg-accent-cyan/15 text-accent-cyan' },
    ],
  },
  {
    titleEn: 'Team',
    titleRu: 'Команда',
    items: [
      { path: '/owner/staff', icon: Users, labelEn: 'Staff', labelRu: 'Сотрудники', tint: 'bg-info/15 text-info' },
      { path: '/owner/guide', icon: BookOpen, labelEn: 'Guide', labelRu: 'Руководство', tint: 'bg-muted text-muted-foreground' },
    ],
  },
];

export function OwnerDashboardMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <nav className="space-y-6">
      {MENU_SECTIONS.map((section) => (
        <div key={section.titleEn}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {isRu ? section.titleRu : section.titleEn}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              // Extract bg and text classes from tint
              const [bgClass, textClass] = item.tint.split(' ');
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 hover:bg-muted/50 group"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm',
                    'ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
                    'transition-transform group-hover:scale-105',
                    bgClass,
                  )}>
                    <Icon className={cn('h-6 w-6', textClass)} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight text-foreground/80 line-clamp-2">
                    {isRu ? item.labelRu : item.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
