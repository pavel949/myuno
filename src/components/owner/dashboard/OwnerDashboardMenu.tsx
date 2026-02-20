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

const MENU_ITEMS: MenuItem[] = [
  { path: '/owner/invoices', icon: Receipt, labelEn: 'Invoices', labelRu: 'Инвойсы' },
  { path: '/owner/tasks', icon: ListTodo, labelEn: 'CRM Tasks', labelRu: 'Задачи CRM' },
  { path: '/owner/sales', icon: TrendingUp, labelEn: 'Sales Pipeline', labelRu: 'Воронка продаж' },
  { path: '/owner/contacts', icon: ContactRound, labelEn: 'Contacts', labelRu: 'Контакты' },
  { path: '/owner/contacts/import', icon: Import, labelEn: 'Import Contacts', labelRu: 'Импорт контактов' },
  { path: '/owner/vault', icon: FolderOpen, labelEn: 'File Vault', labelRu: 'Хранилище файлов' },
  { path: '/owner/vendors', icon: Building2, labelEn: 'Vendor Directory', labelRu: 'Поставщики' },
  { path: '/owner/inventory', icon: Package, labelEn: 'Inventory', labelRu: 'Инвентарь' },
  { path: '/owner/documents', icon: FileText, labelEn: 'Document Templates', labelRu: 'Шаблоны документов' },
  { path: '/owner/marketing', icon: Megaphone, labelEn: 'Marketing', labelRu: 'Маркетинг' },
  { path: '/owner/channels', icon: Download, labelEn: 'Channel Manager', labelRu: 'Менеджер каналов' },
  { path: '/owner/service-request?type=cleaning', icon: Sparkles, labelEn: 'Request Cleaning', labelRu: 'Заказать уборку' },
  { path: '/owner/reports', icon: BarChart3, labelEn: 'Reports', labelRu: 'Отчёты' },
  { path: '/owner/management-terms', icon: FileText, labelEn: 'Management Terms', labelRu: 'Условия управления недвижимостью' },
  { path: '/owner/staff', icon: Users, labelEn: 'Staff Directory', labelRu: 'Реестр сотрудников' },
  { path: '/owner/messages', icon: MessageCircle, labelEn: 'Messages', labelRu: 'Сообщения' },
  { path: '/owner/guide', icon: BookOpen, labelEn: 'Property Management Guide', labelRu: 'Руководство по управлению' },
  { path: '/support', icon: HelpCircle, labelEn: 'Help', labelRu: 'Помощь' },
];

export function OwnerDashboardMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <nav>
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 py-4 text-left hover:opacity-70 transition-opacity active:scale-[0.99]"
          >
            <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
            <span className="flex-1 text-[15px] font-medium">{isRu ? item.labelRu : item.labelEn}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>
        );
      })}
    </nav>
  );
}
