import { 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  AlertCircle,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/hooks/useOrders';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<OrderStatus, { 
  icon: typeof Clock; 
  color: string; 
  labelEn: string; 
  labelRu: string 
}> = {
  draft: { 
    icon: Clock, 
    color: 'bg-muted text-muted-foreground', 
    labelEn: 'Draft', 
    labelRu: 'Черновик' 
  },
  pending: { 
    icon: Clock, 
    color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', 
    labelEn: 'Pending', 
    labelRu: 'Ожидание' 
  },
  confirmed: { 
    icon: CheckCircle2, 
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', 
    labelEn: 'Confirmed', 
    labelRu: 'Подтверждён' 
  },
  in_progress: { 
    icon: Truck, 
    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400', 
    labelEn: 'In Progress', 
    labelRu: 'В процессе' 
  },
  completed: { 
    icon: Package, 
    color: 'bg-green-500/20 text-green-600 dark:text-green-400', 
    labelEn: 'Completed', 
    labelRu: 'Завершён' 
  },
  cancelled: { 
    icon: XCircle, 
    color: 'bg-red-500/20 text-red-600 dark:text-red-400', 
    labelEn: 'Cancelled', 
    labelRu: 'Отменён' 
  },
  refunded: { 
    icon: RefreshCw, 
    color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400', 
    labelEn: 'Refunded', 
    labelRu: 'Возврат' 
  },
  disputed: { 
    icon: AlertCircle, 
    color: 'bg-red-500/20 text-red-600 dark:text-red-400', 
    labelEn: 'Disputed', 
    labelRu: 'Спор' 
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function OrderStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true 
}: OrderStatusBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge 
      variant="secondary"
      className={cn(
        'font-medium border-0',
        config.color,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {isRu ? config.labelRu : config.labelEn}
    </Badge>
  );
}

export { statusConfig };
