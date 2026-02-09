import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PackageOpen, 
  Rocket, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant: 'orders' | 'services' | 'analytics' | 'success';
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
  orders: {
    icon: PackageOpen,
    titleEn: 'No orders yet',
    titleRu: 'Пока нет заказов',
    descriptionEn: 'Orders will appear here once customers book your services',
    descriptionRu: 'Заказы появятся здесь, когда клиенты забронируют ваши услуги',
    actionEn: 'Add services',
    actionRu: 'Добавить услуги',
    actionPath: '/vendor/services',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  services: {
    icon: Rocket,
    titleEn: 'No services yet',
    titleRu: 'Пока нет услуг',
    descriptionEn: 'Add your first service or product to start receiving orders',
    descriptionRu: 'Добавьте вашу первую услугу или товар, чтобы начать получать заказы',
    actionEn: 'Create listing',
    actionRu: 'Создать объявление',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  analytics: {
    icon: TrendingUp,
    titleEn: 'Analytics coming soon',
    titleRu: 'Аналитика скоро',
    descriptionEn: 'Complete a few orders to see your performance metrics',
    descriptionRu: 'Завершите несколько заказов, чтобы увидеть метрики',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  success: {
    icon: CheckCircle2,
    titleEn: 'All clear',
    titleRu: 'Всё в порядке',
    descriptionEn: 'No pending tasks or orders requiring your attention',
    descriptionRu: 'Нет задач или заказов, требующих внимания',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
};

export function VendorEmptyState({ variant, className, onAction }: EmptyStateProps) {
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
      <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className={cn('p-3 rounded-full mb-3', config.bgColor)}>
          <Icon className={cn('h-6 w-6', config.color)} />
        </div>
        
        <h3 className="text-base font-semibold mb-1">
          {isRu ? config.titleRu : config.titleEn}
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-[250px] mb-4">
          {isRu ? config.descriptionRu : config.descriptionEn}
        </p>

        {(config.actionEn && config.actionPath) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAction}
            className="gap-1.5"
          >
            {isRu ? config.actionRu : config.actionEn}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact inline empty state for dashboard blocks
export function VendorEmptyStateInline({ 
  variant, 
  className 
}: { 
  variant: 'orders' | 'services' | 'analytics' | 'success';
  className?: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const config = EMPTY_STATES[variant];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-muted/30', className)}>
      <div className={cn('p-2 rounded-full shrink-0', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">
          {isRu ? config.titleRu : config.titleEn}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {isRu ? config.descriptionRu : config.descriptionEn}
        </p>
      </div>
    </div>
  );
}
