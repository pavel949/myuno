import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePropertyCareStats, useOwnerProperties, useServiceRequests } from '@/hooks/usePropertyCare';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { usePropertyFinancialsFull } from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Plus, Calendar, ArrowRight, 
  CalendarDays, LogIn, LogOut, Users, Star,
  Link2, MessageSquare
} from 'lucide-react';
import { FullManagementCard } from '@/components/owner/FullManagementCard';
import { HostListingsPanel } from '@/components/owner/HostListingsPanel';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { OwnerKPICard } from '@/components/owner/OwnerKPICard';
import { OwnerAlertPanel } from '@/components/owner/OwnerAlertPanel';
import { OwnerRevenueChart } from '@/components/owner/OwnerRevenueChart';
import { OwnerQuickActions } from '@/components/owner/OwnerQuickActions';
import { SuperhostStatusCompact } from '@/components/owner/SuperhostStatusCard';
import { TodayOperationsPanel } from '@/components/owner/TodayOperationsPanel';
import { format, isToday, isTomorrow, differenceInDays, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: stats, isLoading: statsLoading } = usePropertyCareStats();
  const { data: properties } = useOwnerProperties();
  const { data: requests } = useServiceRequests();
  const { totalUnread: totalUnreadMessages } = useOwnerChats();
  const { 
    activeOrders, 
    upcomingOrders, 
    todayCheckIns, 
    todayCheckOuts,
    stats: orderStats 
  } = useOwnerOrders();

  // Fetch real financial data
  const { data: financials } = usePropertyFinancialsFull();

  // Generate chart data for last 14 days from REAL financial data
  const chartData = useMemo(() => {
    const days: Array<{ date: string; income: number; expenses: number }> = [];
    
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filter financials for this specific day
      const dayFinancials = financials?.filter(f => 
        f.transaction_date === dateStr
      ) || [];
      
      const income = dayFinancials
        .filter(f => f.transaction_type === 'income')
        .reduce((sum, f) => sum + Number(f.amount), 0);
        
      const expenses = dayFinancials
        .filter(f => f.transaction_type === 'expense')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      
      days.push({ date: dateStr, income, expenses });
    }
    
    return days;
  }, [financials]);

  const pendingRequestsCount = requests?.filter(r => 
    ['pending', 'confirmed', 'in_progress'].includes(r.status)
  ).length || 0;

  if (!user) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Управление недвижимостью' : 'Property Care'}
          showBack
          fallbackPath="/"
        />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Home className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isRu ? 'Добро пожаловать в UNO Property Care' : 'Welcome to UNO Property Care'}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {isRu 
              ? 'Войдите или зарегистрируйтесь, чтобы управлять своей недвижимостью на Пхукете' 
              : 'Sign in or register to manage your property in Phuket'}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => navigate('/auth')} size="lg">
              {isRu ? 'Войти' : 'Sign In'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth?mode=signup')} size="lg">
              {isRu ? 'Зарегистрироваться как собственник' : 'Register as Owner'}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Управление недвижимостью' : 'Property Care'}
        subtitle={isRu ? 'Ваши объекты на Пхукете' : 'Manage your property'}
        showBack
        fallbackPath="/"
      />

      {/* Superhost Status */}
      <div className="mb-4">
        <SuperhostStatusCompact />
      </div>

      {/* Ownership Invites Banner */}
      <OwnershipInviteBanner />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <OwnerKPICard
          title={isRu ? 'Объектов' : 'Properties'}
          value={stats?.totalProperties || 0}
          icon={Home}
          iconColor="text-primary"
          href="/owner/properties"
          loading={statsLoading}
        />
        <OwnerKPICard
          title={isRu ? 'Бронирований' : 'Bookings'}
          value={orderStats.totalOrders}
          icon={Calendar}
          iconColor="text-info"
          href="/owner/calendar"
          loading={statsLoading}
        />
        <OwnerKPICard
          title={isRu ? 'Сообщений' : 'Messages'}
          value={totalUnreadMessages}
          icon={MessageSquare}
          iconColor="text-warning"
          href="/owner/messages"
          loading={statsLoading}
          badge={totalUnreadMessages > 0 ? (
            <Badge variant="destructive" className="h-5 text-[10px]">NEW</Badge>
          ) : undefined}
        />
        <OwnerKPICard
          title={isRu ? 'Отзывы' : 'Reviews'}
          value="4.8"
          icon={Star}
          iconColor="text-amber-500"
          href="/owner/reviews"
          loading={statsLoading}
        />
      </div>

      {/* Alert Panel */}
      <div className="mb-4">
        <OwnerAlertPanel
          todayCheckIns={todayCheckIns.length}
          todayCheckOuts={todayCheckOuts.length}
          unreadMessages={totalUnreadMessages}
          pendingRequests={pendingRequestsCount}
          loading={statsLoading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-4">
        <OwnerRevenueChart 
          data={chartData} 
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <OwnerQuickActions />
      </div>

      {/* Today's Operations */}
      <div className="mb-4">
        <TodayOperationsPanel />
      </div>

      {/* Current & Upcoming Bookings */}
      <Card className="mb-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'Бронирования' : 'Bookings'}
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/owner/channels')}
            >
              <Link2 className="h-4 w-4 mr-1" />
              {isRu ? 'Каналы' : 'Channels'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/owner/calendar')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              {isRu ? 'Календарь' : 'Calendar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Active (current guests) */}
          {activeOrders.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isRu ? 'Сейчас проживают' : 'Currently staying'}
              </p>
              <div className="space-y-2">
                {activeOrders.slice(0, 2).map((order) => {
                  const guestName = (order.metadata as any)?.guest_name || (isRu ? 'Гость' : 'Guest');
                  return (
                    <div 
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20"
                    >
                      <div className="p-2 rounded-full bg-success/20">
                        <Users className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.[0]?.product_name || order.order_number} • 
                          {isRu ? ' до ' : ' until '}
                          {order.end_at && format(new Date(order.end_at), 'd MMM', { locale: isRu ? ru : undefined })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-success/20 text-success">
                        {isRu ? 'Активно' : 'Active'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingOrders.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isRu ? 'Предстоящие' : 'Upcoming'}
              </p>
              <div className="space-y-2">
                {upcomingOrders.slice(0, 3).map((order) => {
                  const checkIn = order.start_at ? new Date(order.start_at) : new Date();
                  const daysUntil = differenceInDays(checkIn, new Date());
                  const guestName = (order.metadata as any)?.guest_name || (isRu ? 'Гость' : 'Guest');
                  
                  return (
                    <div 
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-primary/20">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.[0]?.product_name || order.order_number} • 
                          {format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {isToday(checkIn) ? (isRu ? 'Сегодня' : 'Today') :
                         isTomorrow(checkIn) ? (isRu ? 'Завтра' : 'Tomorrow') :
                         `${daysUntil} ${isRu ? 'дн' : 'd'}`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeOrders.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isRu ? 'Нет предстоящих бронирований' : 'No upcoming bookings'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Listings - Airbnb Style */}
      <div className="mb-4">
        <HostListingsPanel />
      </div>

      {/* Full Management CTA */}
      <FullManagementCard />

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mt-4">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              {isRu ? 'Нужна помощь?' : 'Need Help?'}
            </h3>
            <p className="text-sm opacity-90">
              {isRu 
                ? 'Свяжитесь с менеджером' 
                : 'Contact your manager'}
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate('/owner/support-chat')}
          >
            {isRu ? 'Чат' : 'Chat'}
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
