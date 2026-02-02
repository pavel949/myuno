import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin,
  Phone,
  MessageCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/hooks/useOrders';

const statusConfig: Record<OrderStatus, { 
  icon: typeof Clock; 
  color: string; 
  labelEn: string; 
  labelRu: string 
}> = {
  draft: { icon: Clock, color: 'bg-muted text-muted-foreground', labelEn: 'Draft', labelRu: 'Черновик' },
  pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-600', labelEn: 'Pending', labelRu: 'Ожидание' },
  confirmed: { icon: CheckCircle2, color: 'bg-blue-500/20 text-blue-600', labelEn: 'Confirmed', labelRu: 'Подтверждён' },
  in_progress: { icon: Truck, color: 'bg-purple-500/20 text-purple-600', labelEn: 'In Progress', labelRu: 'В процессе' },
  completed: { icon: Package, color: 'bg-green-500/20 text-green-600', labelEn: 'Completed', labelRu: 'Завершён' },
  cancelled: { icon: AlertCircle, color: 'bg-red-500/20 text-red-600', labelEn: 'Cancelled', labelRu: 'Отменён' },
  refunded: { icon: RefreshCw, color: 'bg-orange-500/20 text-orange-600', labelEn: 'Refunded', labelRu: 'Возврат' },
  disputed: { icon: AlertCircle, color: 'bg-red-500/20 text-red-600', labelEn: 'Disputed', labelRu: 'Спор' },
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { 
    order, 
    timeline, 
    isLoading, 
    getProgressPercentage, 
    isStatusCompleted,
    STATUS_SEQUENCE 
  } = useOrderTracking(id);

  if (isLoading) {
    return (
      <AppLayout title={isRu ? 'Отслеживание заказа' : 'Order Tracking'}>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout title={isRu ? 'Заказ не найден' : 'Order Not Found'}>
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isRu ? 'Заказ не найден' : 'Order not found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isRu ? 'Возможно, заказ был удалён или у вас нет доступа' : 'The order may have been deleted or you don\'t have access'}
            </p>
            <Button onClick={() => navigate('/orders')}>
              {isRu ? 'Мои заказы' : 'My Orders'}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const status = order.status as OrderStatus;
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const progress = getProgressPercentage(status);

  return (
    <AppLayout title={isRu ? 'Отслеживание заказа' : 'Order Tracking'}>
      <PageContainer className="pb-24">
        <PageHeader 
          title={isRu ? 'Отслеживание заказа' : 'Order Tracking'} 
          showBack 
          fallbackPath="/orders" 
        />
        {/* Order Header */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Заказ' : 'Order'} #{order.order_number}
                </p>
                <h2 className="text-xl font-bold capitalize">
                  {order.order_type.replace(/_/g, ' ')}
                </h2>
              </div>
              <Badge className={cn('text-sm', config.color)}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {isRu ? config.labelRu : config.labelEn}
              </Badge>
            </div>

            {/* Progress Bar */}
            {!['cancelled', 'refunded', 'disputed'].includes(status) && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {STATUS_SEQUENCE.map((s) => (
                    <span 
                      key={s} 
                      className={cn(
                        isStatusCompleted(s, status) && 'text-primary font-medium'
                      )}
                    >
                      {isRu 
                        ? statusConfig[s].labelRu 
                        : statusConfig[s].labelEn
                      }
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">
              {isRu ? 'История заказа' : 'Order Timeline'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length > 0 ? (
              <div className="relative space-y-4">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                
                {timeline.map((event, index) => {
                  const eventConfig = statusConfig[event.status as OrderStatus] || statusConfig.pending;
                  const EventIcon = eventConfig.icon;
                  
                  return (
                    <div key={index} className="relative flex gap-4 pl-8">
                      {/* Timeline dot */}
                      <div className={cn(
                        'absolute left-0 w-6 h-6 rounded-full flex items-center justify-center',
                        index === timeline.length - 1 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      )}>
                        <EventIcon className="w-3 h-3" />
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <p className="font-medium">
                          {isRu 
                            ? statusConfig[event.status as OrderStatus]?.labelRu || event.status
                            : statusConfig[event.status as OrderStatus]?.labelEn || event.status
                          }
                        </p>
                        {event.reason && (
                          <p className="text-sm text-muted-foreground">{event.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.created_at), 'dd MMM yyyy, HH:mm', {
                            locale: isRu ? ru : undefined
                          })}
                          {event.actor_name !== 'System' && (
                            <span className="ml-2">• {event.actor_name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{isRu ? 'История пока пуста' : 'No timeline events yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">
              {isRu ? 'Детали заказа' : 'Order Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            {order.order_items && order.order_items.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {isRu ? 'Товары' : 'Items'}
                </p>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.item_name} × {item.qty}</span>
                      <span className="font-medium">
                        {item.amount.toLocaleString()} {order.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses */}
            {order.order_addresses && order.order_addresses.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {isRu ? 'Адрес' : 'Address'}
                </p>
                {order.order_addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium capitalize">{addr.address_type}</p>
                      <p className="text-sm text-muted-foreground">{addr.address_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule */}
            {order.start_at && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {isRu ? 'Дата и время' : 'Date & Time'}
                </p>
                <p className="font-medium">
                  {format(new Date(order.start_at), 'dd MMMM yyyy, HH:mm', {
                    locale: isRu ? ru : undefined
                  })}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>{isRu ? 'Итого' : 'Total'}</span>
                <span>{order.total_amount.toLocaleString()} {order.currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-bottom">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1" asChild>
              <a href="tel:+66922407355">
                <Phone className="w-4 h-4 mr-2" />
                {isRu ? 'Позвонить' : 'Call'}
              </a>
            </Button>
            <Button className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              {isRu ? 'Чат' : 'Chat'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
