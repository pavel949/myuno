import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  ShoppingBag,
  Calendar,
  ChevronRight,
  Package,
  Ticket,
  Utensils,
  Car,
  Sparkles,
} from 'lucide-react';

const BOOKING_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  tour: Ticket,
  experience: Sparkles,
  restaurant: Utensils,
  transport: Car,
  beauty: Sparkles,
  default: Package,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  completed: 'bg-info/10 text-info',
  cancelled: 'bg-destructive/10 text-destructive',
};

export function AccountOrdersSummary() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRussian = language === 'ru';

  const { data: recentOrders, isLoading } = useQuery({
    queryKey: ['recent-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_type, status, scheduled_at, total_amount, currency, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const formatDate = (date: string) => {
    return format(new Date(date), 'd MMM', {
      locale: isRussian ? ru : enUS,
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      pending: { en: 'Pending', ru: 'Ожидает' },
      confirmed: { en: 'Confirmed', ru: 'Подтверждён' },
      completed: { en: 'Completed', ru: 'Завершён' },
      cancelled: { en: 'Cancelled', ru: 'Отменён' },
    };
    return labels[status]?.[isRussian ? 'ru' : 'en'] || status;
  };

  const getBookingTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      tour: { en: 'Tour', ru: 'Тур' },
      experience: { en: 'Experience', ru: 'Впечатление' },
      restaurant: { en: 'Restaurant', ru: 'Ресторан' },
      transport: { en: 'Transport', ru: 'Транспорт' },
      beauty: { en: 'Beauty', ru: 'Красота' },
      service: { en: 'Service', ru: 'Услуга' },
    };
    return labels[type]?.[isRussian ? 'ru' : 'en'] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            {isRussian ? 'Последние заказы' : 'Recent Orders'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => navigate('/bookings')}
          >
            {isRussian ? 'Все' : 'View All'}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-none" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((order) => {
              const Icon = BOOKING_TYPE_ICONS[order.booking_type] || BOOKING_TYPE_ICONS.default;
              
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/bookings/${order.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-none hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="p-2 rounded-none bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getBookingTypeLabel(order.booking_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.scheduled_at
                        ? formatDate(order.scheduled_at)
                        : formatDate(order.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${STATUS_COLORS[order.status] || ''}`}
                  >
                    {getStatusLabel(order.status)}
                  </Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Нет заказов' : 'No orders yet'}
            </p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => navigate('/discover')}
            >
              {isRussian ? 'Найти услуги' : 'Browse Services'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
