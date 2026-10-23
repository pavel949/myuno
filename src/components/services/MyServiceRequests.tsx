import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestServiceOrders } from '@/hooks/useServiceOrders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatServicePrice } from '@/lib/services/formatServicePrice';

/** Account projection of canonical service_orders, shared with the provider desk. */
export function MyServiceRequests() {
  const { user } = useAuth();
  return user ? <AccountServiceRequests key={user.id} /> : null;
}

function AccountServiceRequests() {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const { orders, isLoading, error, refetch, cancelOrder } = useGuestServiceOrders();
  const [expanded, setExpanded] = useState(false);
  const labels: Record<string, string> = {
    pending: ru ? 'Ожидает подтверждения' : 'Awaiting confirmation',
    confirmed: ru ? 'Подтверждено' : 'Confirmed',
    assigned: ru ? 'Назначен исполнитель' : 'Provider assigned',
    in_progress: ru ? 'Выполняется' : 'In progress',
    completed: ru ? 'Выполнено' : 'Completed',
    cancelled: ru ? 'Отменено' : 'Cancelled',
    rejected: ru ? 'Отклонено' : 'Declined',
  };
  return <section aria-labelledby="my-service-requests" className="space-y-3 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="my-service-requests" className="font-display text-h3">{ru ? 'Мои заявки и записи' : 'My requests and bookings'}</h2>
      <Button variant="outline" size="sm" onClick={() => void refetch()}>{ru ? 'Обновить' : 'Refresh'}</Button>
    </div>
    {isLoading ? <Skeleton className="h-24" /> : error ? <p role="alert" className="text-destructive">{ru ? 'Не удалось загрузить заявки. Повторите загрузку.' : 'Could not load requests. Please retry.'}</p>
      : orders.length === 0 ? <p role="status" className="text-sm text-muted-foreground">{ru ? 'Вы ещё не отправляли заявки на услуги. Выберите услугу ниже.' : 'No service requests yet. Choose a service below.'}</p>
      : (expanded ? orders : orders.slice(0, 10)).map(order => <article key={order.id} className="min-w-0 space-y-2 border border-border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-medium">{(ru ? order.service_name_ru : order.service_name) || order.service_name}</h3>
          <Badge variant="outline">{labels[order.status] ?? `${ru ? 'Неизвестный статус' : 'Unknown status'}: ${order.status}`}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{formatServicePrice(order.amount, order.currency, language)}</p>
        {order.scheduled_at && <p className="text-sm">{new Date(order.scheduled_at).toLocaleString(ru ? 'ru-RU' : 'en-GB', { timeZone: 'Asia/Bangkok' })} · {ru ? 'Пхукет' : 'Phuket'}</p>}
        {order.notes && <p className="break-words text-sm">{order.notes}</p>}
        {order.status === 'pending' && <Button size="sm" variant="outline" disabled={cancelOrder.isPending} onClick={() => cancelOrder.mutate(order.id)}>{ru ? 'Отменить заявку' : 'Cancel request'}</Button>}
      </article>)}
    {cancelOrder.isError && <p role="alert" className="text-sm text-destructive">{ru ? 'Отмена не подтверждена. Обновите статус заявки.' : 'Cancellation was not confirmed. Refresh the request status.'}</p>}
    {!error && orders.length > 10 && <Button variant="outline" onClick={() => setExpanded(v => !v)}>{expanded ? (ru ? 'Свернуть' : 'Show less') : (ru ? 'Показать все заявки' : 'Show all requests')}</Button>}
  </section>;
}
