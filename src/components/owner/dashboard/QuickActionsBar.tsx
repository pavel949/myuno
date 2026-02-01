import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Plus, Receipt, Sparkles, Calendar, FileText, MessageCircle, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  { 
    id: 'sync', 
    icon: Download, 
    labelEn: 'Import OTA', 
    labelRu: 'Импорт OTA',
    path: '/owner/channels',
    color: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
  { 
    id: 'expense', 
    icon: Receipt, 
    labelEn: 'Add Expense', 
    labelRu: 'Расход',
    path: '/owner/quick-expense',
    color: 'bg-warning/10 text-warning hover:bg-warning/20',
  },
  { 
    id: 'cleaning', 
    icon: Sparkles, 
    labelEn: 'Cleaning', 
    labelRu: 'Уборка',
    path: '/owner/service-request?type=cleaning',
    color: 'bg-accent/50 text-accent-foreground hover:bg-accent',
  },
  { 
    id: 'calendar', 
    icon: Calendar, 
    labelEn: 'Calendar', 
    labelRu: 'Календарь',
    path: '/owner/calendar',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
  { 
    id: 'property', 
    icon: Plus, 
    labelEn: 'Add Property', 
    labelRu: 'Объект',
    path: '/owner/properties/new',
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
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
            className={cn(
              "flex-shrink-0 h-auto py-2 px-3 rounded-xl gap-2",
              action.color
            )}
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
