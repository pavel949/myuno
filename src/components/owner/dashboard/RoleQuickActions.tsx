import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRole } from '@/lib/businessRoles';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import {
  Plus, Receipt, Sparkles, Calendar, Download, Users, FileText,
  Target, Phone, ClipboardList, ListTodo
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
    { id: 'task', icon: ListTodo, labelEn: 'New Task', labelRu: '+ Задача', path: '__quick_task__' },
    { id: 'sync', icon: Download, labelEn: 'Import OTA', labelRu: 'Импорт OTA', path: '/mc/channels' },
    { id: 'expense', icon: Receipt, labelEn: 'Add Expense', labelRu: 'Расход', path: '/mc/quick-expense' },
    { id: 'cleaning', icon: Sparkles, labelEn: 'Cleaning', labelRu: 'Уборка', path: '/mc/service-request?type=cleaning' },
    { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/mc/calendar' },
    { id: 'property', icon: Plus, labelEn: 'Add Property', labelRu: 'Объект', path: APP_ROUTES.MC_PROPERTY_NEW },
    { id: 'complex', icon: Plus, labelEn: 'Complexes', labelRu: 'Комплексы', path: APP_ROUTES.MC_COMPLEXES },
  ],
  sales_agent: [
    { id: 'deal', icon: Target, labelEn: 'New Deal', labelRu: 'Новая сделка', path: APP_ROUTES.MC_SALES_NEW },
    { id: 'contact', icon: Users, labelEn: 'Add Contact', labelRu: 'Контакт', path: '/mc/contacts' },
    { id: 'tasks', icon: ClipboardList, labelEn: 'My Tasks', labelRu: 'Мои задачи', path: '/mc/tasks' },
    { id: 'call', icon: Phone, labelEn: 'Call Log', labelRu: 'Звонки', path: '/mc/contacts' },
  ],
  service_provider: [
    { id: 'tasks', icon: ClipboardList, labelEn: 'My Tasks', labelRu: 'Задачи', path: '/mc/tasks' },
    { id: 'invoice', icon: FileText, labelEn: 'New Invoice', labelRu: 'Счёт', path: '/mc/invoices' },
    { id: 'calendar', icon: Calendar, labelEn: 'Schedule', labelRu: 'Расписание', path: '/mc/calendar' },
    { id: 'expense', icon: Receipt, labelEn: 'Add Expense', labelRu: 'Расход', path: '/mc/quick-expense' },
  ],
  general: [
    { id: 'sync', icon: Download, labelEn: 'Import OTA', labelRu: 'Импорт OTA', path: '/mc/channels' },
    { id: 'deal', icon: Target, labelEn: 'New Deal', labelRu: 'Сделка', path: APP_ROUTES.MC_SALES_NEW },
    { id: 'expense', icon: Receipt, labelEn: 'Expense', labelRu: 'Расход', path: '/mc/quick-expense' },
    { id: 'property', icon: Plus, labelEn: 'Add Property', labelRu: 'Объект', path: APP_ROUTES.MC_PROPERTY_NEW },
    { id: 'complex', icon: Plus, labelEn: 'Complexes', labelRu: 'Комплексы', path: APP_ROUTES.MC_COMPLEXES },
  ],
};

interface RoleQuickActionsProps {
  role: BusinessRole;
  onQuickTask?: () => void;
}

export function RoleQuickActions({ role, onQuickTask }: RoleQuickActionsProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const actions = ROLE_ACTIONS[role];

  return (
    <div data-tour="quick-actions" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {actions.map((action) => {
        const Icon = action.icon;
        const handleClick = action.path === '__quick_task__'
          ? () => onQuickTask?.()
          : () => navigate(action.path);
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-auto py-2 px-3 rounded-none gap-2.5 bg-primary/8 text-primary hover:bg-primary/15 ring-1 ring-primary/10 shadow-sm"
            onClick={handleClick}
          >
            <div className="w-7 h-7 rounded-none bg-primary/12 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">
              {isRu ? action.labelRu : action.labelEn}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
