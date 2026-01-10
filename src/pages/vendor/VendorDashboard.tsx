import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorBookings, useVendorAnalytics } from '@/hooks/useVendor';
import AppLayout from '@/components/layout/AppLayout';
import PageContainer from '@/components/uno/PageContainer';
import PageHeader from '@/components/uno/PageHeader';
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
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { bookings, isLoading: bookingsLoading } = useVendorBookings(profile?.id, { limit: 5 });
  const { summary, isLoading: analyticsLoading } = useVendorAnalytics(profile?.id, 30);

  const isRussian = language === 'ru';

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect to onboarding if no vendor profile
  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  if (authLoading || profileLoading) {
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

  if (!profile) return null;

  const stats = [
    {
      label: isRussian ? 'Доход за месяц' : 'Monthly Revenue',
      value: `${summary.totalRevenue.toLocaleString()} ₽`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: isRussian ? 'Бронирования' : 'Bookings',
      value: summary.totalBookings.toString(),
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: isRussian ? 'Завершено' : 'Completed',
      value: summary.completedBookings.toString(),
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: isRussian ? 'К выплате' : 'Pending Payout',
      value: `${profile.pending_payout.toLocaleString()} ₽`,
      icon: CreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const quickActions = [
    {
      label: isRussian ? 'Бронирования' : 'Bookings',
      icon: Calendar,
      path: '/vendor/bookings',
      color: 'bg-blue-500',
    },
    {
      label: isRussian ? 'Услуги' : 'Services',
      icon: Package,
      path: '/vendor/services',
      color: 'bg-purple-500',
    },
    {
      label: isRussian ? 'Аналитика' : 'Analytics',
      icon: BarChart3,
      path: '/vendor/analytics',
      color: 'bg-green-500',
    },
    {
      label: isRussian ? 'Выплаты' : 'Payouts',
      icon: CreditCard,
      path: '/vendor/payouts',
      color: 'bg-orange-500',
    },
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
          subtitle={profile.business_name}
        />

        {/* Verification Badge */}
        {!profile.is_verified && (
          <Card className="mb-6 border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isRussian ? 'Аккаунт на модерации' : 'Account pending verification'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Ваш профиль будет виден клиентам после проверки' : 'Your profile will be visible to customers after review'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
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
        <div className="grid grid-cols-4 gap-3 mb-6">
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

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {isRussian ? 'Последние бронирования' : 'Recent Bookings'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/bookings')}>
              {isRussian ? 'Все' : 'View All'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{isRussian ? 'Пока нет бронирований' : 'No bookings yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{booking.customer_name || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.scheduled_at
                          ? format(new Date(booking.scheduled_at), 'dd MMM, HH:mm', {
                              locale: isRussian ? ru : undefined,
                            })
                          : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{booking.amount.toLocaleString()} ₽</p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Card */}
        {profile.review_count > 0 && (
          <Card className="mt-4">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.rating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.review_count} {isRussian ? 'отзывов' : 'reviews'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </AppLayout>
  );
};

export default VendorDashboard;
