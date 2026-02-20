import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRole } from '@/lib/businessRoles';
import { Button } from '@/components/ui/button';
import {
  Plus, Receipt, Sparkles, Calendar, Download, Users, FileText,
  Target, Phone, ClipboardList
} from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const ROLE_ACTIONS: Record<BusinessRole, QuickAction[]> = {
  property_manager: [
    { id: 'sync', icon: Download, labelEn: 'Import OTA', labelRu: 'Импорт OTA', path: '/owner/channels' },
    { id: 'expense', icon: Receipt, labelEn: 'Add Expense', labelRu: 'Расход', path: '/owner/quick-expense' },
    { id: 'cleaning', icon: Sparkles, labelEn: 'Cleaning', labelRu: 'Уборка', path: '/owner/service-request?type=cleaning' },
    { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
    { id: 'property', icon: Plus, labelEn: 'Add Property', labelRu: 'Объект', path: '/owner/properties/new' },
  ],
  sales_agent: [
    { id: 'deal', icon: Target, labelEn: 'New Deal', labelRu: 'Новая сделка', path: '/owner/sales/new' },
    { id: 'contact', icon: Users, labelEn: 'Add Contact', labelRu: 'Контакт', path: '/owner/contacts' },
    { id: 'tasks', icon: ClipboardList, labelEn: 'My Tasks', labelRu: 'Мои задачи', path: '/owner/crm-tasks' },
    { id: 'call', icon: Phone, labelEn: 'Call Log', labelRu: 'Звонки', path: '/owner/contacts' },
  ],
  service_provider: [
    { id: 'tasks', icon: ClipboardList, labelEn: 'My Tasks', labelRu: 'Задачи', path: '/owner/crm-tasks' },
    { id: 'invoice', icon: FileText, labelEn: 'New Invoice', labelRu: 'Счёт', path: '/owner/invoices' },
    { id: 'calendar', icon: Calendar, labelEn: 'Schedule', labelRu: 'Расписание', path: '/owner/calendar' },
    { id: 'expense', icon: Receipt, labelEn: 'Add Expense', labelRu: 'Расход', path: '/owner/quick-expense' },
  ],
  general: [
    { id: 'sync', icon: Download, labelEn: 'Import OTA', labelRu: 'Импорт OTA', path: '/owner/channels' },
    { id: 'deal', icon: Target, labelEn: 'New Deal', labelRu: 'Сделка', path: '/owner/sales/new' },
    { id: 'expense', icon: Receipt, labelEn: 'Expense', labelRu: 'Расход', path: '/owner/quick-expense' },
    { id: 'cleaning', icon: Sparkles, labelEn: 'Cleaning', labelRu: 'Уборка', path: '/owner/service-request?type=cleaning' },
    { id: 'property', icon: Plus, labelEn: 'Add Property', labelRu: 'Объект', path: '/owner/properties/new' },
  ],
};

interface RoleQuickActionsProps {
  role: BusinessRole;
}

export function RoleQuickActions({ role }: RoleQuickActionsProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const actions = ROLE_ACTIONS[role];

  return (
    <div data-tour="quick-actions" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-auto py-2.5 px-3.5 rounded-xl gap-2 bg-primary/8 text-primary hover:bg-primary/15 border border-primary/10"
            onClick={() => navigate(action.path)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium whitespace-nowrap">
              {isRu ? action.labelRu : action.labelEn}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
