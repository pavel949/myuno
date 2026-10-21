import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ControlAnalyticsTab() {
  const { t } = useLanguage();

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
    { label: t('admin.finance.analytics.users'), value: stats?.users || 0, icon: Users, color: 'text-info' },
    { label: t('admin.finance.analytics.providers'), value: stats?.providers || 0, icon: TrendingUp, color: 'text-success' },
    { label: t('admin.finance.analytics.orders'), value: stats?.orders || 0, icon: Calendar, color: 'text-accent-purple' },
    { label: t('admin.finance.analytics.bookings'), value: stats?.bookings || 0, icon: BarChart3, color: 'text-warning' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-none bg-muted flex items-center justify-center`}>
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
            {t('admin.finance.analytics.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('admin.finance.analytics.detailed')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
