import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useVendorOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle,
  Clock,
  Building2,
  ShoppingBag,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Professional components
import { VendorKPICard } from '@/components/vendor/VendorKPICard';
import { VendorAlertPanel } from '@/components/vendor/VendorAlertPanel';
import { VendorRevenueChart } from '@/components/vendor/VendorRevenueChart';
import { VendorQuickActions } from '@/components/vendor/VendorQuickActions';
import { VendorCategoryGrid } from '@/components/vendor/VendorCategoryGrid';
import { VendorQuickCreateFAB } from '@/components/vendor/wizard';
import { BulkImportSheet, ImportVertical } from '@/components/vendor/wizard';
import { VendorOnboardingChecklist } from '@/components/vendor/dashboard/VendorOnboardingChecklist';
import { VendorVerificationBadge } from '@/components/vendor/dashboard/VendorVerificationBadge';
import { YourDayFeed } from '@/components/shared/YourDayFeed';
import { VendorModerationQueue } from '@/components/vendor/dashboard/VendorModerationQueue';
import { VendorRevenueWidget } from '@/components/vendor/VendorRevenueWidget';
import { Period, getPeriodDateRange, getComparisonPeriodRange } from '@/components/vendor/dashboard/VendorPeriodSelector';
import { useVendorProfile } from '@/hooks/useVendor';
import { getCurrencySymbol } from '@/lib/config/currencies';

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
  const { profile: vendorProfile } = useVendorProfile();
  const { orders, isLoading: ordersLoading, stats, updateStatus } = useVendorOrders();

  // State for FAB actions
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportVertical, setBulkImportVertical] = useState<ImportVertical>('products');
  
  // Period selector state
  const [chartPeriod, setChartPeriod] = useState<Period>('7d');

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

  // Get period date ranges
  const { start: periodStart, end: periodEnd } = getPeriodDateRange(chartPeriod);
  const { start: prevStart, end: prevEnd } = getComparisonPeriodRange(chartPeriod);

  // Chart data based on selected period
  const chartData = useMemo(() => {
    if (!orders) return [];
    const data = [];
    const days = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = days - 1; i >= 0; i--) {
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
  }, [orders, chartPeriod, periodStart, periodEnd]);

  // Calculate previous period revenue for comparison
  const previousPeriodRevenue = useMemo(() => {
    if (!orders) return 0;
    return orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= prevStart && orderDate <= prevEnd;
      })
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  }, [orders, prevStart, prevEnd]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5);
  }, [orders]);

  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol('THB');
    if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
    return `${symbol}${amount.toLocaleString()}`;
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

  // Determine completed onboarding steps
  const completedOnboardingSteps = useMemo(() => {
    const steps: string[] = [];
    if (user?.user_metadata?.name) steps.push('profile');
    if (stats.completedCount > 0) steps.push('first-listing');
    // Add more checks as needed
    return steps;
  }, [user, stats]);

  // Onboarding state: auto-hide when complete, persist dismissal in localStorage
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!user?.id) return false;
    const dismissed = localStorage.getItem(`vendor-onboarding-dismissed-${user.id}`);
    return !dismissed;
  });
  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    if (user?.id) {
      localStorage.setItem(`vendor-onboarding-dismissed-${user.id}`, 'true');
    }
  };

  // New orders in last 24h (distinct from total pending)
  const newOrdersCount = useMemo(() => {
    if (!orders) return 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return orders.filter(o => o.status === 'pending' && new Date(o.created_at) > oneDayAgo).length;
  }, [orders]);

  // Unread notifications count from database
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['vendor-unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto w-full">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (vendorOrgs.length === 0) return null;
  const currentOrg = activeOrg || vendorOrgs[0]?.org;

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 space-y-4 max-w-[1536px] mx-auto w-full">
      {/* Onboarding Checklist */}
      {showOnboarding && completedOnboardingSteps.length < 3 && (
        <VendorOnboardingChecklist
          completedSteps={completedOnboardingSteps}
          onDismiss={handleDismissOnboarding}
        />
      )}

      {/* Your Day Feed */}
      <YourDayFeed role="vendor" compact />

      {/* Org Header */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold">{currentOrg?.name || (isRu ? 'Мой бизнес' : 'My Business')}</h1>
            <p className="text-sm text-muted-foreground">{isRu ? 'Панель поставщика' : 'Vendor Dashboard'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Verification Level Badge */}
      <VendorVerificationBadge
        isVerified={currentOrg?.is_verified || false}
        rating={vendorProfile?.rating || 0}
        bookingsCount={stats.completedCount || 0}
      />

      {/* Revenue Analytics */}
      <VendorRevenueWidget />

      {/* KPI Cards with Comparison */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <VendorKPICard 
          title={isRu ? 'Выручка' : 'Revenue'} 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          iconColor="text-success" 
          loading={ordersLoading} 
          href="/vendor/analytics"
          change={previousPeriodRevenue > 0 ? ((stats.totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : undefined}
          trend={previousPeriodRevenue > 0 ? (stats.totalRevenue > previousPeriodRevenue ? 'up' : stats.totalRevenue < previousPeriodRevenue ? 'down' : 'neutral') : undefined}
        />
        <VendorKPICard 
          title={isRu ? 'Заказы' : 'Orders'} 
          value={stats.pendingCount + stats.confirmedCount + stats.completedCount} 
          icon={Calendar} 
          iconColor="text-info" 
          loading={ordersLoading} 
          href="/vendor/bookings" 
        />
        <VendorKPICard 
          title={isRu ? 'Завершено' : 'Completed'} 
          value={stats.completedCount} 
          icon={CheckCircle} 
          iconColor="text-success" 
          loading={ordersLoading} 
        />
        <VendorKPICard 
          title={isRu ? 'Ожидает' : 'Pending'} 
          value={stats.pendingCount} 
          icon={Clock} 
          iconColor="text-warning" 
          loading={ordersLoading} 
        />
      </div>

      <VendorAlertPanel newOrders={newOrdersCount} pendingConfirmation={stats.pendingCount} unreadMessages={unreadCount} loading={ordersLoading} />
      
      {/* Revenue Chart with Period Selector */}
      <VendorRevenueChart 
        data={chartData} 
        loading={ordersLoading}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        previousPeriodRevenue={previousPeriodRevenue}
      />
      
      <VendorQuickActions />
      
      {/* Moderation Queue - P2 improvement */}
      {vendorProfile?.id && (
        <VendorModerationQueue 
          providerId={vendorProfile.id}
          vendorId={(activeOrg?.metadata as any)?.marketplace_vendor_id}
          limit={5}
        />
      )}
      
      <VendorCategoryGrid />

      {/* Recent Orders with Inline Actions */}
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
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group">
                <div>
                  <p className="font-medium text-sm">{order.order_number || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'd MMM, HH:mm', { locale })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                  {getStatusBadge(order.status)}
                  
                  {/* Inline Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/vendor/bookings/${order.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {isRu ? 'Просмотр' : 'View'}
                      </DropdownMenuItem>
                      {order.status === 'pending' && (
                        <DropdownMenuItem onClick={() => updateStatus({ orderId: order.id, status: 'confirmed' })}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isRu ? 'Подтвердить' : 'Confirm'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Create FAB */}
      <VendorQuickCreateFAB 
        onBulkImportClick={() => {
          setBulkImportVertical('products');
          setShowBulkImport(true);
        }}
      />

      {/* Bulk Import Sheet */}
      <BulkImportSheet
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        vertical={bulkImportVertical}
        onImport={async () => {
          toast.info(isRu ? 'Массовый импорт скоро будет доступен' : 'Bulk import coming soon');
          return { success: 0, failed: 0 };
        }}
      />
    </div>
  );
};

export default VendorDashboard;
