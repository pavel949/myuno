import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Download,
  Sparkles,
  BarChart3,
  MessageCircle,
  ChevronRight,
  HelpCircle,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  ContactRound,
  Receipt,
  ListTodo,
  Building2,
  Package,
  Megaphone,
  FolderOpen,
  Import,
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

const MENU_SECTIONS: MenuSection[] = [
  {
    titleEn: 'CRM & Sales',
    titleRu: 'CRM и продажи',
    items: [
      { path: '/owner/sales', icon: TrendingUp, labelEn: 'Sales Pipeline', labelRu: 'Воронка продаж' },
      { path: '/owner/contacts', icon: ContactRound, labelEn: 'Contacts', labelRu: 'Контакты' },
      { path: '/owner/contacts/import', icon: Import, labelEn: 'Import Contacts', labelRu: 'Импорт контактов' },
      { path: '/owner/tasks', icon: ListTodo, labelEn: 'CRM Tasks', labelRu: 'Задачи CRM' },
    ],
  },
  {
    titleEn: 'Finance & Operations',
    titleRu: 'Финансы и операции',
    items: [
      { path: '/owner/invoices', icon: Receipt, labelEn: 'Invoices', labelRu: 'Инвойсы' },
      { path: '/owner/reports', icon: BarChart3, labelEn: 'Reports', labelRu: 'Отчёты' },
      { path: '/owner/management-terms', icon: FileText, labelEn: 'Management Terms', labelRu: 'Условия управления' },
      { path: '/owner/staff', icon: Users, labelEn: 'Staff Directory', labelRu: 'Реестр сотрудников' },
      { path: '/owner/vendors', icon: Building2, labelEn: 'Vendor Directory', labelRu: 'Поставщики' },
      { path: '/owner/inventory', icon: Package, labelEn: 'Inventory', labelRu: 'Инвентарь' },
    ],
  },
  {
    titleEn: 'Property Tools',
    titleRu: 'Инструменты',
    items: [
      { path: '/owner/channels', icon: Download, labelEn: 'Channel Manager', labelRu: 'Менеджер каналов' },
      { path: '/owner/service-request?type=cleaning', icon: Sparkles, labelEn: 'Request Cleaning', labelRu: 'Заказать уборку' },
      { path: '/owner/vault', icon: FolderOpen, labelEn: 'File Vault', labelRu: 'Хранилище файлов' },
      { path: '/owner/documents', icon: FileText, labelEn: 'Document Templates', labelRu: 'Шаблоны документов' },
      { path: '/owner/marketing', icon: Megaphone, labelEn: 'Marketing', labelRu: 'Маркетинг' },
    ],
  },
  {
    titleEn: 'Support',
    titleRu: 'Поддержка',
    items: [
      { path: '/owner/messages', icon: MessageCircle, labelEn: 'Messages', labelRu: 'Сообщения' },
      { path: '/owner/guide', icon: BookOpen, labelEn: 'Management Guide', labelRu: 'Руководство' },
      { path: '/support', icon: HelpCircle, labelEn: 'Help', labelRu: 'Помощь' },
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
