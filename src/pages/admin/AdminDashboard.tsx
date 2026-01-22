import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Ship,
  Home,
  Utensils,
  Scissors
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';

import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { AdminRevenueChart } from '@/components/admin/AdminRevenueChart';
import { AdminVerticalChart } from '@/components/admin/AdminVerticalChart';
import { AdminAlertPanel } from '@/components/admin/AdminAlertPanel';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();
  const { summary, revenueChartData, isLoading: analyticsLoading } = useAdminAnalytics(14);

  const verticalData = data ? [
    { name: 'Yachts', nameRu: 'Яхты', count: data.yachts, color: 'hsl(199 89% 48%)' },
    { name: 'Properties', nameRu: 'Недвижимость', count: data.properties, color: 'hsl(142 76% 36%)' },
    { name: 'Tours', nameRu: 'Туры', count: data.tours, color: 'hsl(43 74% 49%)' },
    { name: 'Restaurants', nameRu: 'Рестораны', count: data.restaurants, color: 'hsl(0 84% 60%)' },
    { name: 'Salons', nameRu: 'Салоны', count: data.salons, color: 'hsl(280 65% 60%)' },
    { name: 'Clinics', nameRu: 'Клиники', count: data.clinics, color: 'hsl(160 84% 39%)' },
    { name: 'Gyms', nameRu: 'Фитнес', count: data.gyms, color: 'hsl(220 70% 50%)' },
    { name: 'Events', nameRu: 'События', count: data.events, color: 'hsl(340 75% 55%)' },
  ] : [];

  const chartData = revenueChartData?.map(d => ({
    date: d.date,
    revenue: d.revenue || 0,
    gmv: d.gmv || 0,
  })) || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isRussian ? 'Панель управления' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRussian ? 'Обзор платформы UNO SuperApp' : 'UNO SuperApp platform overview'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminKPICard title={isRussian ? 'Провайдеры' : 'Providers'} value={data?.providers || 0} change={summary?.providerGrowth} trend={summary?.providerGrowth && summary.providerGrowth > 0 ? 'up' : 'neutral'} icon={Users} iconColor="text-info" href="/admin/providers" loading={isLoading} />
          <AdminKPICard title={isRussian ? 'Услуги' : 'Services'} value={data?.services || 0} icon={Package} iconColor="text-success" href="/admin/services" loading={isLoading} />
          <AdminKPICard title={isRussian ? 'Бронирования' : 'Bookings'} value={data?.totalBookings || 0} change={summary?.bookingGrowth} trend={summary?.bookingGrowth && summary.bookingGrowth > 0 ? 'up' : 'neutral'} icon={ShoppingCart} iconColor="text-warning" href="/admin/operations" loading={isLoading} />
          <AdminKPICard title={isRussian ? 'Пользователи' : 'Users'} value={data?.totalUsers || 0} change={summary?.userGrowth} trend={summary?.userGrowth && summary.userGrowth > 0 ? 'up' : 'neutral'} icon={DollarSign} iconColor="text-primary" href="/admin/analytics" loading={isLoading} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <AdminRevenueChart data={chartData} loading={analyticsLoading} />
          <AdminVerticalChart data={verticalData} loading={isLoading} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminAlertPanel pendingBookings={data?.pendingBookings || 0} pendingLeads={0} openTickets={0} pendingModeration={data?.pendingContent || 0} loading={isLoading} />
          <AdminQuickActions />
          <div className="grid grid-cols-2 gap-2">
            <AdminKPICard title={isRussian ? 'Яхты' : 'Yachts'} value={data?.yachts || 0} icon={Ship} iconColor="text-info" href="/admin/yachts" loading={isLoading} />
            <AdminKPICard title={isRussian ? 'Недвижимость' : 'Properties'} value={data?.properties || 0} icon={Home} iconColor="text-success" href="/admin/properties" loading={isLoading} />
            <AdminKPICard title={isRussian ? 'Рестораны' : 'Restaurants'} value={data?.restaurants || 0} icon={Utensils} iconColor="text-destructive" href="/admin/restaurants" loading={isLoading} />
            <AdminKPICard title={isRussian ? 'Салоны' : 'Salons'} value={data?.salons || 0} icon={Scissors} iconColor="text-purple-500" href="/admin/salons" loading={isLoading} />
          </div>
        </div>
    </div>
  );
}
