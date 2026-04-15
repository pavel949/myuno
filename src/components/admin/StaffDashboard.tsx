import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Users, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

function useTodayOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['staff-today-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, order_type, total_amount, status, vertical, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });
}

function useRecentLeads() {
  return useQuery({
    queryKey: ['staff-recent-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('id, name, phone, vertical_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60_000,
  });
}

export function StaffDashboard() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const { data: orders, isLoading: ordersLoading } = useTodayOrders();
  const { data: leads, isLoading: leadsLoading } = useRecentLeads();

  const todayRevenue = (orders || [])
    .filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold">{isRu ? 'Панель помощника' : 'Staff Dashboard'}</h1>
        <p className="text-sm text-muted-foreground">{isRu ? 'Заказы, лиды и задачи на сегодня' : "Today's orders, leads and tasks"}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{orders?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Заказов сегодня' : 'Orders today'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatPrice(todayRevenue)}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Выручка' : 'Revenue'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-lg font-bold">{leads?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Новых лидов' : 'Recent leads'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold">
                {(orders || []).filter(o => o.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Ожидают' : 'Pending'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Заказы сегодня' : "Today's Orders"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-12" />)
            ) : !orders?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{isRu ? 'Пока нет заказов' : 'No orders yet'}</p>
            ) : orders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{order.order_number || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{order.vertical || order.order_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatPrice(order.total_amount)}</span>
                  <Badge variant={order.status === 'confirmed' || order.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Недавние лиды' : 'Recent Leads'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadsLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-12" />)
            ) : !leads?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{isRu ? 'Нет лидов' : 'No leads'}</p>
            ) : leads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{lead.name || (isRu ? 'Без имени' : 'No name')}</p>
                  <p className="text-xs text-muted-foreground">{lead.phone} · {lead.vertical_id}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{lead.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
