import React from 'react';
import { Check, Clock, Package, Truck, MapPin, PartyPopper } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderTrackingTimelineProps {
  orderId: string;
}

// Marketplace order statuses
const MARKETPLACE_STATUSES = [
  { key: 'pending', en: 'Order Placed', ru: 'Заказ оформлен', icon: Clock },
  { key: 'confirmed', en: 'Confirmed', ru: 'Подтверждён', icon: Check },
  { key: 'in_progress', en: 'Processing', ru: 'Обрабатывается', icon: Package },
  { key: 'completed', en: 'Delivered', ru: 'Доставлен', icon: PartyPopper },
];

export function OrderTrackingTimeline({ orderId }: OrderTrackingTimelineProps) {
  const { language } = useLanguage();
  const { order, timeline, isLoading, error, isStatusCompleted, getProgressPercentage } = useOrderTracking(orderId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {language === 'ru' ? 'Заказ не найден' : 'Order not found'}
        </CardContent>
      </Card>
    );
  }

  const currentStatus = order.status || 'pending';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>
            {language === 'ru' ? 'Статус заказа' : 'Order Status'}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            #{order.order_number}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted" />
          <div 
            className="absolute left-5 top-0 w-0.5 bg-primary transition-all duration-500"
            style={{ 
              height: `${getProgressPercentage(currentStatus)}%` 
            }}
          />

          {/* Timeline Items */}
          <div className="space-y-6">
            {MARKETPLACE_STATUSES.map((status) => {
              const isPast = isStatusCompleted(status.key as any, currentStatus as any);
              const isCurrent = status.key === currentStatus;
              const timelineItem = timeline.find(t => t.status === status.key);
              const StatusIcon = status.icon;

              return (
                <div key={status.key} className="relative flex gap-4 pl-2">
                  {/* Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all',
                      isPast 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground',
                      isCurrent && 'ring-4 ring-primary/20'
                    )}
                  >
                    <StatusIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <p className={cn(
                      'font-medium',
                      isPast ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {language === 'ru' ? status.ru : status.en}
                    </p>
                    
                    {timelineItem && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(timelineItem.created_at), 'dd.MM.yyyy HH:mm')}
                      </p>
                    )}
                    
                    {timelineItem?.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {timelineItem.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
