import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Plus, Receipt, Sparkles, Calendar, FileText, MessageCircle, Download, Zap, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { 
    id: 'sync', 
    icon: Download, 
    labelEn: 'Import OTA', 
    labelRu: 'Импорт OTA',
    path: '/owner/channels',
  },
  { 
    id: 'expense', 
    icon: Receipt, 
    labelEn: 'Add Expense', 
    labelRu: 'Расход',
    path: '/owner/quick-expense',
  },
  { 
    id: 'cleaning', 
    icon: Sparkles, 
    labelEn: 'Cleaning', 
    labelRu: 'Уборка',
    path: '/owner/service-request?type=cleaning',
  },
  { 
    id: 'calendar', 
    icon: Calendar, 
    labelEn: 'Calendar', 
    labelRu: 'Календарь',
    path: '/owner/calendar',
  },
  { 
    id: 'auto-msg', 
    icon: Zap, 
    labelEn: 'Auto Msgs', 
    labelRu: 'Авто-сообщ.',
    path: '/owner/auto-messaging',
  },
  { 
    id: 'revenue', 
    icon: TrendingUp, 
    labelEn: 'Revenue', 
    labelRu: 'Доходы',
    path: '/owner/revenue',
  },
  { 
    id: 'property', 
    icon: Plus, 
    labelEn: 'Add Property', 
    labelRu: 'Объект',
    path: '/owner/properties/new',
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
            className="flex-shrink-0 h-auto py-2 px-3 rounded-xl gap-2 bg-primary/8 text-primary hover:bg-primary/15"
            onClick={() => navigate(action.path)}
            data-tour={action.id === 'property' ? 'add-property' : undefined}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">
              {isRu ? action.labelRu : action.labelEn}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
