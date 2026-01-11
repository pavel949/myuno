import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePropertyCareStats, useOwnerProperties, useServiceRequests, usePropertyInspections } from '@/hooks/usePropertyCare';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Plus, ClipboardCheck, DollarSign, Calendar, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, 
  Key, Camera, Wrench, FileText, Users, Sparkles,
  ShoppingCart, TrendingUp, TrendingDown, CalendarDays,
  LogIn, LogOut, Brush, Package
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: stats, isLoading: statsLoading } = usePropertyCareStats();
  const { data: properties } = useOwnerProperties();
  const { data: requests } = useServiceRequests();
  const { data: inspections } = usePropertyInspections();
  const { bookings, upcomingBookings, activeBookings } = useAllPropertyBookings();

  // Today's activities
  const todayActivities = useMemo(() => {
    const activities: Array<{
      type: 'check_in' | 'check_out' | 'cleaning' | 'service';
      title: string;
      subtitle: string;
      time?: string;
      propertyTitle?: string;
    }> = [];

    // Check-ins today
    bookings?.forEach(booking => {
      if (isToday(new Date(booking.check_in))) {
        activities.push({
          type: 'check_in',
          title: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          subtitle: isRu ? 'Заезд' : 'Check-in',
          propertyTitle: (booking as any).owner_properties?.title,
        });
      }
      if (isToday(new Date(booking.check_out))) {
        activities.push({
          type: 'check_out',
          title: booking.guest_name || (isRu ? 'Гость' : 'Guest'),
          subtitle: isRu ? 'Выезд' : 'Check-out',
          propertyTitle: (booking as any).owner_properties?.title,
        });
      }
    });

    // Today's service requests
    requests?.forEach(request => {
      if (request.scheduled_at && isToday(new Date(request.scheduled_at))) {
        activities.push({
          type: request.service_type === 'cleaning' ? 'cleaning' : 'service',
          title: request.service_type === 'cleaning' 
            ? (isRu ? 'Уборка' : 'Cleaning')
            : request.service_type === 'check_in' 
              ? 'Check-in' 
              : request.service_type === 'check_out'
                ? 'Check-out'
                : (isRu ? 'Сервис' : 'Service'),
          subtitle: request.guest_name || (request as any).property?.title || '',
          time: format(new Date(request.scheduled_at), 'HH:mm'),
        });
      }
    });

    return activities;
  }, [bookings, requests, isRu]);

  // This month's financials
  const monthlyFinancials = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let income = 0;
    let expenses = 0;

    // Calculate from bookings
    bookings?.forEach(booking => {
      const checkIn = new Date(booking.check_in);
      if (checkIn >= monthStart && checkIn <= monthEnd && booking.total_amount) {
        income += booking.total_amount;
      }
    });

    return {
      income,
      expenses: stats?.totalExpenses || 0,
      net: income - (stats?.totalExpenses || 0),
    };
  }, [bookings, stats]);

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Home className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'UNO Property Care' : 'UNO Property Care'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu 
              ? 'Войдите, чтобы управлять своей недвижимостью' 
              : 'Sign in to manage your property'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const pendingRequests = requests?.filter(r => 
    ['pending', 'confirmed', 'in_progress'].includes(r.status)
  ).slice(0, 3);

  const upcomingInspections = inspections?.filter(i => 
    i.status === 'scheduled'
  ).slice(0, 3);

  // Service quick order buttons
  const serviceButtons = [
    { 
      icon: Brush, 
      label: isRu ? 'Клининг' : 'Cleaning', 
      type: 'cleaning',
      color: 'bg-cyan-500'
    },
    { 
      icon: Wrench, 
      label: isRu ? 'Ремонт' : 'Repair', 
      type: 'maintenance',
      color: 'bg-orange-500'
    },
    { 
      icon: ShoppingCart, 
      label: isRu ? 'Закупки' : 'Shopping', 
      type: 'shopping',
      color: 'bg-pink-500'
    },
    { 
      icon: Key, 
      label: 'Check-in', 
      type: 'check_in',
      color: 'bg-green-500'
    },
    { 
      icon: LogOut, 
      label: 'Check-out', 
      type: 'check_out',
      color: 'bg-amber-500'
    },
    { 
      icon: Camera, 
      label: isRu ? 'Инспекция' : 'Inspection', 
      type: 'inspection',
      color: 'bg-purple-500'
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Property Care' : 'Property Care'}
        subtitle={isRu ? 'Управление вашей недвижимостью' : 'Manage your property'}
        showBack
        fallbackPath="/"
      />

      {/* Today's Activity */}
      {todayActivities.length > 0 && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {isRu ? 'Сегодня' : 'Today'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {todayActivities.slice(0, 4).map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                  <div className={`p-1.5 rounded-full ${
                    activity.type === 'check_in' ? 'bg-green-500/20 text-green-500' :
                    activity.type === 'check_out' ? 'bg-amber-500/20 text-amber-500' :
                    activity.type === 'cleaning' ? 'bg-cyan-500/20 text-cyan-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {activity.type === 'check_in' ? <LogIn className="h-3.5 w-3.5" /> :
                     activity.type === 'check_out' ? <LogOut className="h-3.5 w-3.5" /> :
                     activity.type === 'cleaning' ? <Brush className="h-3.5 w-3.5" /> :
                     <Wrench className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.subtitle}
                      {activity.propertyTitle && ` • ${activity.propertyTitle}`}
                    </p>
                  </div>
                  {activity.time && (
                    <span className="text-xs font-medium">{activity.time}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current & Upcoming Bookings */}
      <Card className="mb-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'Бронирования' : 'Bookings'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/owner/calendar')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {isRu ? 'Календарь' : 'Calendar'}
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Active (current guests) */}
          {activeBookings.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isRu ? 'Сейчас проживают' : 'Currently staying'}
              </p>
              <div className="space-y-2">
                {activeBookings.slice(0, 2).map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <div className="p-2 rounded-full bg-green-500/20">
                      <Users className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(booking as any).owner_properties?.title} • 
                        {isRu ? ' до ' : ' until '}
                        {format(new Date(booking.check_out), 'd MMM', { locale: isRu ? ru : undefined })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                      {isRu ? 'Активно' : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingBookings.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isRu ? 'Предстоящие' : 'Upcoming'}
              </p>
              <div className="space-y-2">
                {upcomingBookings.slice(0, 3).map((booking) => {
                  const checkIn = new Date(booking.check_in);
                  const daysUntil = differenceInDays(checkIn, new Date());
                  
                  return (
                    <div 
                      key={booking.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-primary/20">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(booking as any).owner_properties?.title} • 
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
          ) : activeBookings.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isRu ? 'Нет предстоящих бронирований' : 'No upcoming bookings'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Financial Summary */}
      <Card className="mb-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {isRu ? 'Этот месяц' : 'This Month'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/owner/financials')}
          >
            {isRu ? 'Подробнее' : 'Details'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-green-500/10 text-center">
              <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">
                ฿{(monthlyFinancials.income / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Доход' : 'Income'}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-center">
              <TrendingDown className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-600">
                ฿{(monthlyFinancials.expenses / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <Sparkles className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-primary">
                ฿{(monthlyFinancials.net / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Чистая' : 'Net'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Service Order */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isRu ? 'Заказать сервис' : 'Order Service'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            {serviceButtons.map((service, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (service.type === 'inspection') {
                    navigate('/owner/inspection');
                  } else {
                    navigate(`/owner/service-request?type=${service.type}`);
                  }
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`p-2 rounded-full ${service.color} text-white`}>
                  <service.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-center">{service.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card 
          className="bg-gradient-to-br from-primary/10 to-primary/5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/owner/properties')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Объектов' : 'Properties'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/owner/messages')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/20">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Сообщений' : 'Messages'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Properties */}
      <Card className="mb-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isRu ? 'Мои объекты' : 'My Properties'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/owner/properties')}
          >
            {isRu ? 'Все' : 'All'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {!properties?.length ? (
            <div className="text-center py-6">
              <Home className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm mb-3">
                {isRu ? 'У вас пока нет объектов' : 'No properties yet'}
              </p>
              <Button size="sm" onClick={() => navigate('/owner/properties/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {properties.slice(0, 3).map((property) => (
                <div 
                  key={property.id}
                  onClick={() => navigate(`/owner/properties/${property.id}`)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {property.cover_image ? (
                      <img 
                        src={property.cover_image} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {isRu && property.title_ru ? property.title_ru : property.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {property.district || property.address}
                    </p>
                  </div>
                  <Badge variant={property.marketplace_property_id ? 'default' : 'secondary'} className="text-xs">
                    {property.marketplace_property_id 
                      ? (isRu ? 'Онлайн' : 'Live')
                      : (isRu ? 'Черновик' : 'Draft')
                    }
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isRu ? 'Активные заявки' : 'Active Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-muted/50"
                >
                  <div className={`p-1.5 rounded-full ${
                    request.service_type === 'check_in' ? 'bg-green-500/20 text-green-500' :
                    request.service_type === 'check_out' ? 'bg-orange-500/20 text-orange-500' :
                    request.service_type === 'cleaning' ? 'bg-cyan-500/20 text-cyan-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {request.service_type === 'check_in' ? <Key className="h-3.5 w-3.5" /> :
                     request.service_type === 'check_out' ? <Key className="h-3.5 w-3.5" /> :
                     request.service_type === 'cleaning' ? <Brush className="h-3.5 w-3.5" /> :
                     <Wrench className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {request.service_type === 'check_in' ? 'Check-in' :
                       request.service_type === 'check_out' ? 'Check-out' :
                       request.service_type === 'cleaning' ? (isRu ? 'Клининг' : 'Cleaning') :
                       (isRu ? 'Сервис' : 'Service')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.scheduled_at && format(
                        new Date(request.scheduled_at), 
                        'd MMM, HH:mm',
                        { locale: isRu ? ru : undefined }
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {request.status === 'pending' ? (isRu ? 'Ожидает' : 'Pending') :
                     request.status === 'confirmed' ? (isRu ? 'Подтв.' : 'OK') :
                     (isRu ? 'В работе' : 'Working')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
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
