import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PostOrderReviewPrompt } from '@/components/reviews/PostOrderReviewPrompt';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { useState } from 'react';
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
import type { OrderStatus, OrderType } from '@/hooks/useOrders';
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';

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
  checked_in: { icon: CheckCircle2, color: 'bg-info/20 text-info', labelEn: 'Checked In', labelRu: 'Заехал' },
  checked_out: { icon: Package, color: 'bg-muted text-muted-foreground', labelEn: 'Checked Out', labelRu: 'Выехал' },
  completed: { icon: Package, color: 'bg-success/20 text-success', labelEn: 'Completed', labelRu: 'Завершён' },
  cancelled: { icon: AlertCircle, color: 'bg-destructive/20 text-destructive', labelEn: 'Cancelled', labelRu: 'Отменён' },
  refunded: { icon: RefreshCw, color: 'bg-warning/20 text-warning', labelEn: 'Refunded', labelRu: 'Возврат' },
  disputed: { icon: AlertCircle, color: 'bg-destructive/20 text-destructive', labelEn: 'Disputed', labelRu: 'Спор' },
  no_show: { icon: AlertCircle, color: 'bg-muted text-muted-foreground', labelEn: 'No Show', labelRu: 'Неявка' },
};

// Preserve existing known non-property UI only; unknown/mixed kinds have no single review target.
// This containment is not evidence that other vertical review contracts are verified.
const legacyReviewTypes: readonly OrderType[] = [
  'service', 'tour', 'yacht', 'vehicle', 'event', 'activity', 'beauty', 'cleaning',
  'babysitter', 'education', 'medical', 'legal', 'pet_service', 'flowers', 'food',
];

const unknownStatusConfig = {
  icon: AlertCircle, color: 'bg-muted text-muted-foreground',
  labelEn: 'Status unknown', labelRu: 'Статус неизвестен',
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
    error, refetch, timelineError, timelineLoading, retryTimeline,
    getProgressPercentage, 
    isStatusCompleted,
    STATUS_SEQUENCE 
  } = useOrderTracking(id);

  if (isLoading) {
    return (
      <AppLayout title={isRu ? 'Отслеживание заказа' : 'Order Tracking'}>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-none" />
            <Skeleton className="h-48 w-full rounded-none" />
            <Skeleton className="h-64 w-full rounded-none" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (error) return <AppLayout title={isRu ? 'Отслеживание заказа' : 'Order Tracking'}><PageContainer><div role="alert" className="space-y-4 py-8"><p>{isRu ? 'Не удалось загрузить заказ. Повторите попытку.' : 'Could not load the order. Please retry.'}</p><Button onClick={() => void refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div></PageContainer></AppLayout>;

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
            <Button onClick={() => navigate('/me/bookings')}>
              {isRu ? 'Мои заказы' : 'My Orders'}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const status = order.status as OrderStatus;
  const config = statusConfig[status] || unknownStatusConfig;
  const StatusIcon = config.icon;
  const progress = getProgressPercentage(status);
  const isPropertyOrder = order.order_type === 'property' || order.order_items?.some(item => item.item_type === 'property') === true;

  return (
    <AppLayout title={isRu ? 'Отслеживание заказа' : 'Order Tracking'}>
      <PageContainer className="pb-24">
        <PageHeader 
          title={isRu ? 'Отслеживание заказа' : 'Order Tracking'} 
          showBack 
          fallbackPath="/me/bookings"
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
                  {isPropertyOrder ? (isRu ? 'Бронирование жилья' : 'Property booking') : order.order_type?.replace(/_/g, ' ') || (isRu ? 'Заказ' : 'Order')}
                </h2>
              </div>
              <Badge className={cn('text-sm', config.color)}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {isRu ? config.labelRu : config.labelEn}
              </Badge>
            </div>

            {/* Generic service stages do not describe property inventory/payment lifecycles. */}
            {!isPropertyOrder && progress !== null && STATUS_SEQUENCE.includes(status) && (
              <div className="space-y-2">
                <Progress value={progress} aria-label={isRu ? 'Статус заказа' : 'Order status'} className="h-2" />
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
            {timelineError ? <div role="alert" className="space-y-2"><p>{isRu ? 'Историю заказа не удалось загрузить.' : 'Could not load the order timeline.'}</p><Button variant="outline" onClick={() => void retryTimeline()}>{isRu ? 'Повторить' : 'Retry'}</Button></div> : timelineLoading ? <p role="status">{isRu ? 'Загрузка истории…' : 'Loading timeline…'}</p> : timeline.length > 0 ? (
              <div className="relative space-y-4">
                {/* Timeline line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                
                {timeline.map((event, index) => {
                  const eventConfig = statusConfig[event.status as OrderStatus] || unknownStatusConfig;
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
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <span className="min-w-0 flex-1 break-words">{item.item_name} × {item.qty}</span>
                      <span className="shrink-0 whitespace-nowrap font-medium tabular-nums">
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

        {/* Property reviews require a separately verified resource identity and dismissal contract. */}
        {!isPropertyOrder && legacyReviewTypes.includes(order.order_type) && status === 'completed' && (() => {
          const reviewed = localStorage.getItem(`reviewed-order-${order.id}`);
          if (reviewed) return null;
          return (
            <PostOrderReviewPrompt
              open={true}
              onClose={() => localStorage.setItem(`reviewed-order-${order.id}`, 'skipped')}
              orderId={order.id}
              entityType={order.order_type}
              entityId={order.provider_org_id || order.id}
            />
          );
        })()}

        {/* Cross-sell Recommendations — for confirmed/completed orders */}
        {['confirmed', 'completed'].includes(status) && (
          <CrossSellRecommendations
            orderType={order.order_type}
            orderId={order.id}
            className="mb-4"
          />
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-bottom">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1" asChild>
              <a href={getTelLink()}>
                <Phone className="w-4 h-4 mr-2" />
                {isRu ? 'Позвонить' : 'Call'}
              </a>
            </Button>
            {isPropertyOrder ? <Button className="flex-1" asChild><Link to="/me/requests"><MessageCircle className="w-4 h-4 mr-2" />{isRu ? 'Мои обращения' : 'My requests'}</Link></Button> : <Button className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              {isRu ? 'Чат' : 'Chat'}
            </Button>}
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
