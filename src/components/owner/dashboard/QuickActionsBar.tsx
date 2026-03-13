import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Plus, Receipt, Sparkles, Calendar, FileText, MessageCircle, Download, Zap, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

const actions = [
  { 
    id: 'sync', 
    icon: Download, 
    labelEn: 'Import OTA', 
    labelRu: 'Импорт OTA',
    path: APP_ROUTES.MC_CHANNELS,
  },
  { 
    id: 'expense', 
    icon: Receipt, 
    labelEn: 'Add Expense', 
    labelRu: 'Расход',
    path: APP_ROUTES.MC + '/quick-expense',
  },
  { 
    id: 'cleaning', 
    icon: Sparkles, 
    labelEn: 'Cleaning', 
    labelRu: 'Уборка',
    path: APP_ROUTES.MC + '/service-request?type=cleaning',
  },
  { 
    id: 'calendar', 
    icon: Calendar, 
    labelEn: 'Calendar', 
    labelRu: 'Календарь',
    path: APP_ROUTES.MC_CALENDAR,
  },
  { 
    id: 'auto-msg', 
    icon: Zap, 
    labelEn: 'Auto Msgs', 
    labelRu: 'Авто-сообщ.',
    path: APP_ROUTES.MC + '/auto-messaging',
  },
  { 
    id: 'revenue', 
    icon: TrendingUp, 
    labelEn: 'Revenue', 
    labelRu: 'Доходы',
    path: APP_ROUTES.MC_FINANCE,
  },
  { 
    id: 'property', 
    icon: Plus, 
    labelEn: 'Add Property', 
    labelRu: 'Объект',
    path: APP_ROUTES.MC_PROPERTIES + '/new',
  },
];

export function QuickActionsBar() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div data-tour="quick-actions" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-auto py-2 px-3 rounded-xl gap-2.5 bg-primary/8 text-primary hover:bg-primary/15 ring-1 ring-primary/10 shadow-sm"
            onClick={() => navigate(action.path)}
            data-tour={action.id === 'property' ? 'add-property' : undefined}
          >
            <div className="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0">
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
