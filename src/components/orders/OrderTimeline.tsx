import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  PartyPopper,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ChefHat,
  Bike
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/hooks/useOrders';

interface TimelineEvent {
  status: string;
  actor_name?: string;
  reason?: string | null;
  created_at: string;
}

interface OrderTimelineProps {
  orderId: string;
  orderType: string;
  currentStatus: OrderStatus;
  timeline: TimelineEvent[];
  estimatedTime?: string;
  className?: string;
}

// Different status sequences for different order types
const STATUS_SEQUENCES: Record<string, OrderStatus[]> = {
  food: ['pending', 'confirmed', 'in_progress', 'completed'],
  delivery: ['pending', 'confirmed', 'in_progress', 'completed'],
  service: ['pending', 'confirmed', 'in_progress', 'completed'],
  default: ['pending', 'confirmed', 'in_progress', 'completed'],
};

// Status configurations with icons and labels
const STATUS_CONFIG: Record<string, {
  icon: typeof Clock;
  labelEn: string;
  labelRu: string;
  color: string;
}> = {
  pending: { 
    icon: Clock, 
    labelEn: 'Order Placed', 
    labelRu: 'Заказ оформлен',
    color: 'text-yellow-500'
  },
  confirmed: { 
    icon: CheckCircle2, 
    labelEn: 'Confirmed', 
    labelRu: 'Подтверждён',
    color: 'text-blue-500'
  },
  preparing: { 
    icon: ChefHat, 
    labelEn: 'Preparing', 
    labelRu: 'Готовится',
    color: 'text-orange-500'
  },
  in_progress: { 
    icon: Truck, 
    labelEn: 'On the way', 
    labelRu: 'В пути',
    color: 'text-purple-500'
  },
  completed: { 
    icon: PartyPopper, 
    labelEn: 'Delivered', 
    labelRu: 'Доставлен',
    color: 'text-green-500'
  },
  cancelled: { 
    icon: XCircle, 
    labelEn: 'Cancelled', 
    labelRu: 'Отменён',
    color: 'text-red-500'
  },
  refunded: { 
    icon: RefreshCw, 
    labelEn: 'Refunded', 
    labelRu: 'Возврат',
    color: 'text-orange-500'
  },
};

// Food delivery specific labels
const FOOD_STATUS_CONFIG: Record<string, {
  icon: typeof Clock;
  labelEn: string;
  labelRu: string;
}> = {
  pending: { icon: Clock, labelEn: 'Order Received', labelRu: 'Заказ получен' },
  confirmed: { icon: CheckCircle2, labelEn: 'Restaurant Accepted', labelRu: 'Ресторан принял' },
  in_progress: { icon: Bike, labelEn: 'Courier on the way', labelRu: 'Курьер в пути' },
  completed: { icon: PartyPopper, labelEn: 'Delivered!', labelRu: 'Доставлено!' },
};

export function OrderTimeline({
  orderId,
  orderType,
  currentStatus,
  timeline,
  estimatedTime,
  className,
}: OrderTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const statusSequence = STATUS_SEQUENCES[orderType] || STATUS_SEQUENCES.default;
  const isFood = orderType === 'food' || orderType === 'delivery';

  // Calculate progress percentage
  const currentIndex = statusSequence.indexOf(currentStatus);
  const progress = currentIndex >= 0 
    ? ((currentIndex + 1) / statusSequence.length) * 100 
    : 0;

  // Check if status is completed
  const isStatusCompleted = (status: OrderStatus) => {
    const checkIndex = statusSequence.indexOf(status);
    return checkIndex >= 0 && checkIndex <= currentIndex;
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    if (isFood && FOOD_STATUS_CONFIG[status]) {
      return isRu ? FOOD_STATUS_CONFIG[status].labelRu : FOOD_STATUS_CONFIG[status].labelEn;
    }
    const config = STATUS_CONFIG[status];
    return config 
      ? (isRu ? config.labelRu : config.labelEn) 
      : status;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    if (isFood && FOOD_STATUS_CONFIG[status]) {
      return FOOD_STATUS_CONFIG[status].icon;
    }
    return STATUS_CONFIG[status]?.icon || Clock;
  };

  // Is terminal status (cancelled, refunded)
  const isTerminal = ['cancelled', 'refunded', 'disputed'].includes(currentStatus);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isRu ? 'Статус заказа' : 'Order Status'}
          </CardTitle>
          {estimatedTime && !isTerminal && currentStatus !== 'completed' && (
            <div className="text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              {isRu ? 'Ожидаемое время:' : 'ETA:'} {estimatedTime}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Progress Bar (only for active orders) */}
        {!isTerminal && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {statusSequence.map((status, index) => {
                const isCompleted = isStatusCompleted(status);
                const isCurrent = status === currentStatus;
                
                return (
                  <div 
                    key={status}
                    className={cn(
                      'text-xs text-center flex-1',
                      isCompleted ? 'text-primary font-medium' : 'text-muted-foreground',
                      isCurrent && 'font-bold'
                    )}
                  >
                    {getStatusLabel(status)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Events */}
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-border" />

          {timeline.length > 0 ? (
            timeline.map((event, index) => {
              const StatusIcon = getStatusIcon(event.status);
              const isLatest = index === timeline.length - 1;
              const config = STATUS_CONFIG[event.status];

              return (
                <div key={index} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Circle/Icon */}
                  <div className={cn(
                    'relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    isLatest ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <StatusIcon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <p className={cn(
                      'font-medium',
                      isLatest ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {getStatusLabel(event.status)}
                    </p>
                    {event.reason && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {event.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.created_at), 'dd MMM, HH:mm', {
                        locale: isRu ? ru : undefined
                      })}
                      {event.actor_name && event.actor_name !== 'System' && (
                        <span> • {event.actor_name}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            // Show expected steps when no timeline yet
            statusSequence.map((status, index) => {
              const StatusIcon = getStatusIcon(status);
              const isCompleted = isStatusCompleted(status);
              const isCurrent = status === currentStatus;

              return (
                <div key={status} className="relative flex gap-4 pb-4 last:pb-0">
                  <div className={cn(
                    'relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                    isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    isCurrent && 'ring-4 ring-primary/20'
                  )}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={cn(
                      'font-medium',
                      isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {getStatusLabel(status)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline timeline for order cards
interface OrderTimelineInlineProps {
  currentStatus: OrderStatus;
  orderType?: string;
  className?: string;
}

export function OrderTimelineInline({
  currentStatus,
  orderType = 'default',
  className,
}: OrderTimelineInlineProps) {
  const statusSequence = STATUS_SEQUENCES[orderType] || STATUS_SEQUENCES.default;
  const currentIndex = statusSequence.indexOf(currentStatus);
  const isTerminal = ['cancelled', 'refunded', 'disputed'].includes(currentStatus);

  if (isTerminal) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <XCircle className="w-4 h-4 text-destructive" />
        <span className="text-xs text-destructive font-medium">
          {STATUS_CONFIG[currentStatus]?.labelEn}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {statusSequence.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={status}>
            <div className={cn(
              'w-2 h-2 rounded-full transition-all',
              isCompleted ? 'bg-primary' : 'bg-muted',
              isCurrent && 'ring-2 ring-primary/30 ring-offset-1'
            )} />
            {index < statusSequence.length - 1 && (
              <div className={cn(
                'w-4 h-0.5',
                isCompleted && index < currentIndex ? 'bg-primary' : 'bg-muted'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
