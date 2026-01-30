import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProspectStats, statusConfig, priorityConfig, sourceConfig } from '@/hooks/useVendorAcquisition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Target, CheckCircle, BarChart3, Star } from 'lucide-react';

export function VendorProspectsStats() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: stats, isLoading } = useProspectStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: isRussian ? 'Всего лидов' : 'Total Leads',
      value: stats?.total || 0,
      icon: Users,
      color: 'text-primary'
    },
    {
      title: isRussian ? 'Конверсия' : 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      icon: Target,
      color: 'text-success'
    },
    {
      title: isRussian ? 'Выиграно' : 'Won',
      value: stats?.byStatus?.won || 0,
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      title: isRussian ? 'В работе' : 'In Progress',
      value: (stats?.byStatus?.contacted || 0) + (stats?.byStatus?.negotiating || 0) + (stats?.byStatus?.meeting || 0),
      icon: TrendingUp,
      color: 'text-blue-500'
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isRussian ? 'По статусу' : 'By Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = stats?.byStatus?.[status] || 0;
                const total = stats?.total || 1;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${config.color}`}>●</span>
                      <span className="text-sm">{isRussian ? config.labelRu : config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 rounded-full bg-muted"
                        style={{ width: '100px' }}
                      >
                        <div 
                          className={`h-2 rounded-full ${config.bgColor}`}
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {isRussian ? 'По приоритету' : 'By Priority'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(priorityConfig).map(([priority, config]) => {
                const count = stats?.byPriority?.[priority] || 0;
                const total = stats?.total || 1;
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 rounded-full bg-muted"
                        style={{ width: '100px' }}
                      >
                        <div 
                          className={`h-2 rounded-full ${config.bgColor}`}
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {isRussian ? 'По источнику' : 'By Source'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(sourceConfig).map(([source, config]) => {
              const count = stats?.bySource?.[source] || 0;
              return (
                <div key={source} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl mb-1">{config.icon}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {config.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
