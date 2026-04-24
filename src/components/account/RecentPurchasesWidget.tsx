import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ShoppingBag, ChevronRight, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { label: { en: string; ru: string }; className: string }> = {
  pending: { 
    label: { en: 'Pending', ru: 'Ожидает' }, 
    className: 'bg-warning/10 text-warning' 
  },
  confirmed: { 
    label: { en: 'Confirmed', ru: 'Подтверждён' }, 
    className: 'bg-info/10 text-info' 
  },
  in_progress: { 
    label: { en: 'In Progress', ru: 'Выполняется' }, 
    className: 'bg-accent-purple/10 text-accent-purple' 
  },
  completed: { 
    label: { en: 'Completed', ru: 'Завершён' }, 
    className: 'bg-success/10 text-success' 
  },
  cancelled: { 
    label: { en: 'Cancelled', ru: 'Отменён' }, 
    className: 'bg-muted text-muted-foreground' 
  },
};

export function RecentPurchasesWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { orders, isLoading } = useOrders();

  // Get recent orders (any type, sorted by date)
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 3);
  }, [orders]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            {isRu ? 'Последние заказы' : 'Recent Orders'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (recentOrders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            {isRu ? 'Последние заказы' : 'Recent Orders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isRu ? 'Пока нет заказов' : 'No orders yet'}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/market')}
              className="mt-2"
            >
              {isRu ? 'Перейти в маркет' : 'Go to market'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            {isRu ? 'Последние заказы' : 'Recent Orders'}
          </CardTitle>
          {orders.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bookings')}
              className="h-7 text-xs text-muted-foreground"
            >
              {isRu ? 'История' : 'History'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentOrders.map(order => {
          const firstItem = order.order_items?.[0];
          const title = firstItem?.item_name || order.order_number;
          const itemCount = order.order_items?.length || 0;
          const statusConfig = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

          return (
            <button
              key={order.id}
              onClick={() => navigate(`/bookings/${order.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-none hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{title}</p>
                  {itemCount > 1 && (
                    <span className="text-xs text-muted-foreground">
                      +{itemCount - 1}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), 'd MMM', { locale })}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-[10px] px-1.5 py-0", statusConfig.className)}
                  >
                    {statusConfig.label[isRu ? 'ru' : 'en']}
                  </Badge>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-sm">
                  {order.currency} {order.total_amount.toLocaleString()}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
