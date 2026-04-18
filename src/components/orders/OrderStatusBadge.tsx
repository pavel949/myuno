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
  draft: { icon: Clock, color: 'bg-muted text-muted-foreground', labelEn: 'Draft', labelRu: 'Черновик' },
  pending: { icon: Clock, color: 'bg-warning/20 text-warning', labelEn: 'Pending', labelRu: 'Ожидание' },
  pending_advance: { icon: Clock, color: 'bg-warning/20 text-warning', labelEn: 'Awaiting Advance', labelRu: 'Ожидание аванса' },
  awaiting_client_payment: { icon: Clock, color: 'bg-warning/20 text-warning', labelEn: 'Awaiting Payment', labelRu: 'Ожидание оплаты' },
  pending_deposit: { icon: Clock, color: 'bg-warning/20 text-warning', labelEn: 'Awaiting Deposit', labelRu: 'Ожидание депозита' },
  deposit_paid: { icon: CheckCircle2, color: 'bg-info/20 text-info', labelEn: 'Deposit Paid', labelRu: 'Депозит оплачен' },
  confirmed: { icon: CheckCircle2, color: 'bg-info/20 text-info', labelEn: 'Confirmed', labelRu: 'Подтверждён' },
  in_progress: { icon: Truck, color: 'bg-accent-purple/20 text-accent-purple', labelEn: 'In Progress', labelRu: 'В процессе' },
  checked_in: { icon: CheckCircle2, color: 'bg-accent-cyan/20 text-accent-cyan', labelEn: 'Checked In', labelRu: 'Заехал' },
  checked_out: { icon: Package, color: 'bg-muted text-muted-foreground', labelEn: 'Checked Out', labelRu: 'Выехал' },
  completed: { icon: Package, color: 'bg-success/20 text-success', labelEn: 'Completed', labelRu: 'Завершён' },
  cancelled: { icon: XCircle, color: 'bg-destructive/20 text-destructive', labelEn: 'Cancelled', labelRu: 'Отменён' },
  refunded: { icon: RefreshCw, color: 'bg-warning/20 text-warning', labelEn: 'Refunded', labelRu: 'Возврат' },
  disputed: { icon: AlertCircle, color: 'bg-destructive/20 text-destructive', labelEn: 'Disputed', labelRu: 'Спор' },
  no_show: { icon: XCircle, color: 'bg-muted text-muted-foreground', labelEn: 'No Show', labelRu: 'Неявка' },
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
