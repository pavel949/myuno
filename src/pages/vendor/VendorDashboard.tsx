import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useVendorOrders } from '@/hooks/useOrders';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle,
  Clock,
  Building2,
  ShoppingBag
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

// Professional components
import { VendorKPICard } from '@/components/vendor/VendorKPICard';
import { VendorAlertPanel } from '@/components/vendor/VendorAlertPanel';
import { VendorRevenueChart } from '@/components/vendor/VendorRevenueChart';
import { VendorQuickActions } from '@/components/vendor/VendorQuickActions';
import { VendorCategoryGrid } from '@/components/vendor/VendorCategoryGrid';

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  confirmed: 'bg-info/20 text-info',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { activeOrg, vendorOrgs, isLoading: contextLoading } = useUserContext();
  const { orders, isLoading: ordersLoading, stats } = useVendorOrders();

  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!contextLoading && vendorOrgs.length === 0 && user) {
      navigate('/vendor/onboarding');
    }
  }, [vendorOrgs, contextLoading, user, navigate]);

  const isLoading = authLoading || contextLoading;

  // Chart data
  const chartData = useMemo(() => {
    if (!orders) return [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter(o => 
        format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr
      );
      data.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        orders: dayOrders.length,
      });
    }
    return data;
  }, [orders]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5);
  }, [orders]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(0)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      pending: { en: 'Pending', ru: 'Ожидает' },
      confirmed: { en: 'Confirmed', ru: 'Подтверждён' },
      completed: { en: 'Completed', ru: 'Завершён' },
      cancelled: { en: 'Cancelled', ru: 'Отменён' },
    };
    return (
      <Badge className={statusColors[status] || 'bg-muted'}>
        {labels[status]?.[isRu ? 'ru' : 'en'] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (vendorOrgs.length === 0) return null;
  const currentOrg = activeOrg || vendorOrgs[0]?.org;

  return (
    <AppLayout>
      <PageContainer className="pb-24">
        {/* Org Header */}
        <Card className="mb-4">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-semibold">{currentOrg?.name || (isRu ? 'Мой бизнес' : 'My Business')}</h1>
              <p className="text-sm text-muted-foreground">{isRu ? 'Панель поставщика' : 'Vendor Dashboard'}</p>
            </div>
            <Badge variant="outline" className={currentOrg?.is_verified ? 'text-success border-success/30' : ''}>
              {currentOrg?.is_verified ? (isRu ? 'Верифицирован' : 'Verified') : (isRu ? 'На модерации' : 'Pending')}
            </Badge>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <VendorKPICard title={isRu ? 'Выручка' : 'Revenue'} value={formatCurrency(stats.totalRevenue)} icon={DollarSign} iconColor="text-success" loading={ordersLoading} href="/vendor/analytics" />
          <VendorKPICard title={isRu ? 'Заказы' : 'Orders'} value={stats.pendingCount + stats.confirmedCount + stats.completedCount} icon={Calendar} iconColor="text-info" loading={ordersLoading} href="/vendor/bookings" />
          <VendorKPICard title={isRu ? 'Завершено' : 'Completed'} value={stats.completedCount} icon={CheckCircle} iconColor="text-success" loading={ordersLoading} />
          <VendorKPICard title={isRu ? 'Ожидает' : 'Pending'} value={stats.pendingCount} icon={Clock} iconColor="text-warning" loading={ordersLoading} />
        </div>

        <div className="mb-4"><VendorAlertPanel newOrders={stats.pendingCount} pendingConfirmation={stats.pendingCount} unreadMessages={0} loading={ordersLoading} /></div>
        <div className="mb-4"><VendorRevenueChart data={chartData} loading={ordersLoading} /></div>
        <div className="mb-4"><VendorQuickActions /></div>
        <div className="mb-4"><VendorCategoryGrid /></div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-info" />
              {isRu ? 'Последние заказы' : 'Recent Orders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {ordersLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)
            ) : recentOrders.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">{isRu ? 'Нет заказов' : 'No orders'}</p>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{order.order_number || order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'd MMM, HH:mm', { locale })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
};

export default VendorDashboard;
