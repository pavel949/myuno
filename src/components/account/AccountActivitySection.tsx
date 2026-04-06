import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ChevronRight, Clock, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { label: { en: string; ru: string }; dot: string }> = {
  pending: { label: { en: 'Pending', ru: 'Ожидает' }, dot: 'bg-warning' },
  confirmed: { label: { en: 'Confirmed', ru: 'Подтверждён' }, dot: 'bg-info' },
  in_progress: { label: { en: 'In Progress', ru: 'Выполняется' }, dot: 'bg-accent-purple' },
  completed: { label: { en: 'Completed', ru: 'Завершён' }, dot: 'bg-success' },
  cancelled: { label: { en: 'Cancelled', ru: 'Отменён' }, dot: 'bg-muted-foreground' },
};

export function AccountActivitySection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { orders, isLoading } = useOrders();

  const { active, recent } = useMemo(() => {
    const now = new Date();
    const activeStatuses = ['pending', 'confirmed', 'in_progress'];
    
    const active = orders
      .filter(o => activeStatuses.includes(o.status))
      .sort((a, b) => new Date(a.start_at || a.created_at).getTime() - new Date(b.start_at || b.created_at).getTime())
      .slice(0, 3);

    const recent = orders
      .filter(o => !activeStatuses.includes(o.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    return { active, recent };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  const isEmpty = active.length === 0 && recent.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-8">
        <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">
          {isRu ? 'Пока нет бронирований' : 'No bookings yet'}
        </p>
        <button
          onClick={() => navigate('/discover')}
          className="text-primary text-sm font-medium mt-2 hover:underline"
        >
          {isRu ? 'Найти услуги →' : 'Browse services →'}
        </button>
      </div>
    );
  }

  const renderItem = (order: typeof orders[0]) => {
    const firstItem = order.order_items?.[0];
    const title = firstItem?.item_name || order.order_number;
    const statusConfig = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

    return (
      <button
        key={order.id}
        onClick={() => navigate(`/bookings/${order.id}`)}
        className="w-full flex items-center gap-4 py-4 text-left hover:opacity-70 transition-opacity"
      >
        {/* Status dot */}
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusConfig.dot)} />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">
              {format(new Date(order.start_at || order.created_at), 'd MMM yyyy', { locale })}
            </span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {statusConfig.label[isRu ? 'ru' : 'en']}
            </span>
          </div>
        </div>

        <span className="text-sm font-medium flex-shrink-0">
          {order.currency} {order.total_amount.toLocaleString()}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Active */}
      {active.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold">{isRu ? 'Активные' : 'Active'}</h2>
            <button
              onClick={() => navigate('/bookings')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Все' : 'View all'}
            </button>
          </div>
          <div className="divide-y">
            {active.map(renderItem)}
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-1">{isRu ? 'Недавние' : 'Recent'}</h2>
          <div className="divide-y">
            {recent.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}
