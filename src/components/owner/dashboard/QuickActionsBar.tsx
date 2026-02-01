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
    color: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20',
  },
  { 
    id: 'expense', 
    icon: Receipt, 
    labelEn: 'Add Expense', 
    labelRu: 'Расход',
    path: '/owner/quick-expense',
    color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
  },
  { 
    id: 'cleaning', 
    icon: Sparkles, 
    labelEn: 'Cleaning', 
    labelRu: 'Уборка',
    path: '/owner/service-request?type=cleaning',
    color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
  },
  { 
    id: 'calendar', 
    icon: Calendar, 
    labelEn: 'Calendar', 
    labelRu: 'Календарь',
    path: '/owner/calendar',
    color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
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
