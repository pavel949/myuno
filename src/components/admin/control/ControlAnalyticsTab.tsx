import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ControlAnalyticsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const { data: stats } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => {
      const [profilesRes, providersRes, ordersRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
      ]);
      
      return {
        users: profilesRes.count || 0,
        providers: providersRes.count || 0,
        orders: ordersRes.count || 0,
        bookings: bookingsRes.count || 0,
      };
    }
  });

  const kpis = [
    { label: isRussian ? 'Пользователи' : 'Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500' },
    { label: isRussian ? 'Провайдеры' : 'Providers', value: stats?.providers || 0, icon: TrendingUp, color: 'text-green-500' },
    { label: isRussian ? 'Заказы' : 'Orders', value: stats?.orders || 0, icon: Calendar, color: 'text-purple-500' },
    { label: isRussian ? 'Бронирования' : 'Bookings', value: stats?.bookings || 0, icon: BarChart3, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {isRussian ? 'Аналитика' : 'Analytics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {isRussian 
              ? 'Подробные графики доступны в разделе Analytics' 
              : 'Detailed charts available in Analytics section'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
