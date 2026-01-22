import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brush, 
  Wrench, 
  ShoppingCart, 
  Key, 
  LogOut, 
  Camera,
  Zap,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  type: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { 
    id: 'expense',
    icon: Receipt, 
    title: 'Expense', 
    titleRu: 'Расход',
    type: 'expense',
    color: 'text-orange-500'
  },
  { 
    id: 'cleaning',
    icon: Brush, 
    title: 'Cleaning', 
    titleRu: 'Клининг',
    type: 'cleaning',
    color: 'text-info'
  },
  { 
    id: 'repair',
    icon: Wrench, 
    title: 'Repair', 
    titleRu: 'Ремонт',
    type: 'maintenance',
    color: 'text-warning'
  },
  { 
    id: 'shopping',
    icon: ShoppingCart, 
    title: 'Shopping', 
    titleRu: 'Закупки',
    type: 'shopping',
    color: 'text-pink-500'
  },
  { 
    id: 'check-in',
    icon: Key, 
    title: 'Check-in', 
    titleRu: 'Check-in',
    type: 'check_in',
    color: 'text-success'
  },
  { 
    id: 'inspection',
    icon: Camera, 
    title: 'Inspect', 
    titleRu: 'Осмотр',
    type: 'inspection',
    color: 'text-purple-500'
  },
];

export function OwnerQuickActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleAction = (action: QuickAction) => {
    if (action.type === 'expense') {
      navigate('/owner/expenses/quick');
    } else if (action.type === 'inspection') {
      navigate('/owner/inspection');
    } else {
      navigate(`/owner/service-request?type=${action.type}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          {isRu ? 'Быстрые действия' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className="h-auto flex-col gap-1.5 py-3 hover:bg-muted"
              onClick={() => handleAction(action)}
            >
              <div className={cn(
                "p-2 rounded-full bg-muted",
                action.color
              )}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">
                {isRu ? action.titleRu : action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
