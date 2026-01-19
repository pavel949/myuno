import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useVendorOrders } from '@/hooks/useOrders';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Package,
  CreditCard,
  BarChart3,
  Crown,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { activeOrg, vendorOrgs, isLoading: contextLoading } = useUserContext();
  const { orders, isLoading: ordersLoading, stats } = useVendorOrders();

  const isRussian = language === 'ru';

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect to onboarding if no vendor org
  React.useEffect(() => {
    if (!contextLoading && vendorOrgs.length === 0 && user) {
      navigate('/vendor/onboarding');
    }
  }, [vendorOrgs, contextLoading, user, navigate]);

  if (authLoading || contextLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (vendorOrgs.length === 0) return null;

  const currentOrg = activeOrg || vendorOrgs[0]?.org;

  const statCards = [
    {
      label: isRussian ? 'Доход за месяц' : 'Monthly Revenue',
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: isRussian ? 'Заказы' : 'Orders',
      value: (stats.pendingCount + stats.confirmedCount + stats.completedCount).toString(),
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: isRussian ? 'Завершено' : 'Completed',
      value: stats.completedCount.toString(),
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: isRussian ? 'Ожидает' : 'Pending',
      value: stats.pendingCount.toString(),
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const quickActions = [
    { label: isRussian ? 'Бронирования' : 'Bookings', icon: Calendar, path: '/vendor/bookings', color: 'bg-blue-500' },
    { label: isRussian ? 'Услуги' : 'Services', icon: Package, path: '/vendor/services', color: 'bg-purple-500' },
    { label: isRussian ? 'Аналитика' : 'Analytics', icon: BarChart3, path: '/vendor/analytics', color: 'bg-green-500' },
    { label: isRussian ? 'Выплаты' : 'Payouts', icon: CreditCard, path: '/vendor/payouts', color: 'bg-orange-500' },
  ];

  const categoryActions = [
    { label: isRussian ? 'Яхты' : 'Yachts', path: '/vendor/yachts' },
    { label: isRussian ? 'Туры' : 'Tours', path: '/vendor/tours' },
    { label: isRussian ? 'Активности' : 'Activities', path: '/vendor/activities' },
    { label: isRussian ? 'Недвижимость' : 'Properties', path: '/vendor/properties' },
    { label: isRussian ? 'Рестораны' : 'Restaurants', path: '/vendor/restaurants' },
    { label: isRussian ? 'Красота' : 'Beauty', path: '/vendor/beauty' },
    { label: isRussian ? 'Фитнес' : 'Fitness', path: '/vendor/fitness' },
    { label: isRussian ? 'Клиники' : 'Clinics', path: '/vendor/clinics' },
    { label: isRussian ? 'Транспорт' : 'Transport', path: '/vendor/transport' },
    { label: isRussian ? 'Мероприятия' : 'Events', path: '/vendor/events' },
    { label: isRussian ? 'Образование' : 'Education', path: '/vendor/education' },
    { label: isRussian ? 'Юридические' : 'Legal', path: '/vendor/legal' },
    { label: isRussian ? 'Питомцы' : 'Pets', path: '/vendor/pets' },
    { label: isRussian ? 'Уборка' : 'Cleaning', path: '/vendor/cleaning' },
    { label: isRussian ? 'Няни' : 'Babysitters', path: '/vendor/babysitters' },
    { label: isRussian ? 'Цветы' : 'Flowers', path: '/vendor/flowers' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{isRussian ? 'Ожидает' : 'Pending'}</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{isRussian ? 'Подтверждено' : 'Confirmed'}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">{isRussian ? 'Завершено' : 'Completed'}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">{isRussian ? 'Отменено' : 'Cancelled'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Панель управления' : 'Dashboard'}
        />

        {/* Org Info */}
        {currentOrg && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{currentOrg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentOrg.is_verified 
                    ? (isRussian ? 'Верифицирован' : 'Verified') 
                    : (isRussian ? 'На модерации' : 'Pending verification')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => navigate(action.path)}
            >
              <div className={`p-2 rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Category Navigation */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRussian ? 'Мои категории' : 'My Categories'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {categoryActions.map((cat, index) => (
                <Button key={index} variant="ghost" size="sm" className="h-auto py-2 text-xs" onClick={() => navigate(cat.path)}>
                  {cat.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {isRussian ? 'Последние заказы' : 'Recent Orders'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/bookings')}>
              {isRussian ? 'Все' : 'View All'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{isRussian ? 'Пока нет заказов' : 'No orders yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.start_at
                          ? format(new Date(order.start_at), 'dd MMM, HH:mm', {
                              locale: isRussian ? ru : undefined,
                            })
                          : format(new Date(order.created_at), 'dd MMM', { locale: isRussian ? ru : undefined })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">฿{order.total_amount.toLocaleString()}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
};

export default VendorDashboard;
