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
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
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
      { path: '/owner/rates', icon: Tag, labelEn: 'Rate Seasons', labelRu: 'Тарифы' },
      { path: '/owner/financials', icon: DollarSign, labelEn: 'Income & Expenses', labelRu: 'Доходы и расходы' },
      { path: '/owner/invoices', icon: Receipt, labelEn: 'Invoices', labelRu: 'Счета' },
      { path: '/owner/analytics', icon: BarChart3, labelEn: 'Analytics & Reports', labelRu: 'Аналитика и отчёты' },
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
          <div className="divide-y">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-4 py-3.5 text-left hover:opacity-70 transition-opacity active:scale-[0.99]"
                >
                  <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
                  <span className="flex-1 text-[15px] font-medium">{isRu ? item.labelRu : item.labelEn}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
