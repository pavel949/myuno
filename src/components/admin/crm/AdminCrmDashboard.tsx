import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCrmStats } from '@/hooks/useAdminCrmStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Building2, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function AdminCrmDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: stats, isLoading } = useAdminCrmStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    { label: isRu ? 'Всего лидов' : 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-primary' },
    { label: isRu ? 'В работе' : 'Active', value: stats.activeLeads, icon: Activity, color: 'text-warning' },
    { label: isRu ? 'Конверсия' : 'Conversion', value: `${stats.overallConversion}%`, icon: TrendingUp, color: 'text-success' },
    { label: isRu ? 'Вендоры (B2B)' : 'Vendors (B2B)', value: stats.vendors.total, icon: Target, sub: isRu ? `Won: ${stats.vendors.won}` : `Won: ${stats.vendors.won}` },
    { label: isRu ? 'Пользователи (B2C)' : 'Users (B2C)', value: stats.users.total, icon: Users, sub: isRu ? `Горячие: ${stats.users.hot}` : `Hot: ${stats.users.hot}` },
    { label: isRu ? 'Собственники' : 'Owners', value: stats.owners.total, icon: Building2, sub: isRu ? `Интерес: ${stats.owners.interested}` : `Interested: ${stats.owners.interested}` },
  ];

  const funnelData = [
    { name: isRu ? 'Вендоры' : 'Vendors', total: stats.vendors.total, converted: stats.vendors.won },
    { name: isRu ? 'Пользователи' : 'Users', total: stats.users.total, converted: stats.users.converted },
    { name: isRu ? 'Собственники' : 'Owners', total: stats.owners.total, converted: stats.owners.converted },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color || 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {isRu ? 'Воронка по каналам' : 'Channel Funnel'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary) / 0.3)" name={isRu ? 'Всего' : 'Total'} radius={[0, 4, 4, 0]} />
                <Bar dataKey="converted" fill="hsl(var(--primary))" name={isRu ? 'Конверсия' : 'Converted'} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
