import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  CheckCircle2,
  Calendar,
  TrendingUp,
  Users,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant: 'properties' | 'bookings' | 'tasks' | 'analytics' | 'success';
  className?: string;
  onAction?: () => void;
}

const EMPTY_STATES: Record<string, {
  icon: LucideIcon;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  actionEn?: string;
  actionRu?: string;
  actionPath?: string;
  color: string;
  bgColor: string;
}> = {
  properties: {
    icon: Home,
    titleEn: 'No properties yet',
    titleRu: 'Пока нет объектов',
    descriptionEn: 'Add your first property to start managing rentals',
    descriptionRu: 'Добавьте первый объект для управления арендой',
    actionEn: 'Add property',
    actionRu: 'Добавить объект',
    actionPath: '/owner/properties/new',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  bookings: {
    icon: Calendar,
    titleEn: 'No bookings',
    titleRu: 'Нет бронирований',
    descriptionEn: 'Bookings will appear here when guests reserve your properties',
    descriptionRu: 'Бронирования появятся, когда гости забронируют ваши объекты',
    actionEn: 'View calendar',
    actionRu: 'Открыть календарь',
    actionPath: '/owner/calendar',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  tasks: {
    icon: CheckCircle2,
    titleEn: 'All clear',
    titleRu: 'Всё в порядке',
    descriptionEn: 'No pending tasks. Your properties are running smoothly.',
    descriptionRu: 'Нет задач. Ваши объекты работают отлично.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  analytics: {
    icon: TrendingUp,
    titleEn: 'Analytics coming soon',
    titleRu: 'Аналитика скоро',
    descriptionEn: 'Complete a few bookings to see revenue metrics',
    descriptionRu: 'Завершите несколько бронирований для метрик',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  success: {
    icon: Users,
    titleEn: 'Welcome to owner panel',
    titleRu: 'Добро пожаловать',
    descriptionEn: 'Manage your properties, bookings, and finances',
    descriptionRu: 'Управляйте объектами, бронированиями и финансами',
    actionEn: 'Get started',
    actionRu: 'Начать',
    actionPath: '/owner/properties/new',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

export function OwnerEmptyState({ variant, className, onAction }: EmptyStateProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const config = EMPTY_STATES[variant];
  if (!config) return null;

  const Icon = config.icon;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (config.actionPath) {
      navigate(config.actionPath);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex flex-col items-center justify-center py-6 px-4 text-center">
        <div className={cn('p-2.5 rounded-full mb-2', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        
        <h3 className="text-sm font-semibold mb-0.5">
          {isRu ? config.titleRu : config.titleEn}
        </h3>
        
        <p className="text-xs text-muted-foreground max-w-[220px] mb-3">
          {isRu ? config.descriptionRu : config.descriptionEn}
        </p>

        {(config.actionEn && config.actionPath) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAction}
            className="h-8 text-xs"
          >
            {isRu ? config.actionRu : config.actionEn}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact celebration state for task blocks
export function OwnerSuccessState({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20', className)}>
      <div className="p-2 rounded-full bg-success/10 shrink-0">
        <CheckCircle2 className="h-5 w-5 text-success" />
      </div>
      <div>
         <p className="text-sm font-medium text-success">
          {isRu ? 'Всё в порядке' : 'All clear'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Нет задач на сегодня' : 'No tasks for today'}
        </p>
      </div>
    </div>
  );
}
