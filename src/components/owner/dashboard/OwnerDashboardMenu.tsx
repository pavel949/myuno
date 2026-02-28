import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ChevronRight,
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

interface MenuItem {
  path: string;
  icon: LucideIcon;
  labelEn: string;
  labelRu: string;
}

interface MenuSection {
  titleEn: string;
  titleRu: string;
  items: MenuItem[];
}

/**
 * Mobile-only dashboard menu — mirrors sidebar groups (minus "Main" which is already visible).
 */
const MENU_SECTIONS: MenuSection[] = [
  {
    titleEn: 'CRM & Sales',
    titleRu: 'CRM и продажи',
    items: [
      { path: '/owner/owners', icon: Crown, labelEn: 'Property Owners', labelRu: 'Собственники' },
      { path: '/owner/sales', icon: TrendingUp, labelEn: 'Sales Pipeline', labelRu: 'Воронка продаж' },
      { path: '/owner/contacts', icon: ContactRound, labelEn: 'Contacts', labelRu: 'Контакты' },
      { path: '/owner/reviews-management', icon: Star, labelEn: 'Reviews', labelRu: 'Отзывы' },
      { path: '/owner/marketing', icon: Megaphone, labelEn: 'Marketing', labelRu: 'Маркетинг' },
    ],
  },
  {
    titleEn: 'Operations',
    titleRu: 'Операции',
    items: [
      { path: '/owner/operations', icon: Wrench, labelEn: 'Tasks', labelRu: 'Задачи' },
      { path: '/owner/rates', icon: Tag, labelEn: 'Rate Seasons', labelRu: 'Тарифы' },
      { path: '/owner/channels', icon: Radio, labelEn: 'Channel Manager', labelRu: 'Каналы' },
      { path: '/owner/inventory', icon: Package, labelEn: 'Inventory', labelRu: 'Инвентарь' },
      { path: '/owner/vendors', icon: Building2, labelEn: 'Vendors', labelRu: 'Поставщики' },
      { path: '/owner/insurance', icon: ShieldCheck, labelEn: 'Insurance & Docs', labelRu: 'Страховки и документы' },
      { path: '/owner/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Шаблоны документов' },
    ],
  },
  {
    titleEn: 'Finance',
    titleRu: 'Финансы',
    items: [
      { path: '/owner/finance', icon: DollarSign, labelEn: 'Finance Overview', labelRu: 'Обзор финансов' },
      { path: '/owner/financials', icon: Receipt, labelEn: 'Transactions', labelRu: 'Транзакции' },
      { path: '/owner/reports', icon: BarChart3, labelEn: 'Reports', labelRu: 'Отчёты' },
      { path: '/owner/budget', icon: Tag, labelEn: 'Budget', labelRu: 'Бюджет' },
      { path: '/owner/invoices', icon: Receipt, labelEn: 'Invoices', labelRu: 'Инвойсы' },
    ],
  },
  {
    titleEn: 'Team',
    titleRu: 'Команда',
    items: [
      { path: '/owner/staff', icon: Users, labelEn: 'Staff & Access', labelRu: 'Сотрудники и доступ' },
      { path: '/owner/guide', icon: BookOpen, labelEn: 'Owner Guide', labelRu: 'Руководство' },
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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 px-1">
            {isRu ? section.titleRu : section.titleEn}
          </p>
          <div className="divide-y divide-border/50">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3.5 py-3.5 text-left hover:opacity-70 transition-all active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-[15px] font-medium">{isRu ? item.labelRu : item.labelEn}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
