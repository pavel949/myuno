/**
 * MC Owner Analytics page — owner profitability ranking (LTV proxy via 12m net income).
 * Route: /mc/insights/owner-analytics
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProfitability } from '@/hooks/useOwnerAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Crown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OwnerAnalyticsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: rows = [], isLoading } = useOwnerProfitability();

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue_12m || 0), 0);
  const totalNet = rows.reduce((s, r) => s + Number(r.net_income_12m || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Аналитика собственников' : 'Owner Analytics'}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu
            ? 'Прибыльность каждого собственника за последние 12 месяцев.'
            : 'Profitability ranking per owner over the last 12 months.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">{isRu ? 'Собственников' : 'Owners'}</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">{rows.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">{isRu ? 'Доход (12м)' : 'Revenue (12m)'}</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">
            {Math.round(totalRevenue / 1000).toLocaleString()}K
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">{isRu ? 'Чистая (12м)' : 'Net (12m)'}</p>
          <p className={cn('text-xl font-bold tabular-nums mt-0.5', totalNet >= 0 ? 'text-success' : 'text-destructive')}>
            {Math.round(totalNet / 1000).toLocaleString()}K
          </p>
        </CardContent></Card>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
            <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isRu ? 'Нет данных по собственникам.' : 'No owner data yet.'}</p>
          </CardContent></Card>
        ) : rows.map((r, idx) => (
          <Card key={r.owner_id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold tabular-nums text-primary">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono">{r.owner_id.slice(0, 8)}…</p>
                <p className="text-xs text-muted-foreground">
                  {r.property_count} {isRu ? 'объектов' : 'properties'}
                  {' · '}
                  {isRu ? 'доход ' : 'revenue '}
                  {Number(r.revenue_12m).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-bold tabular-nums', Number(r.net_income_12m) >= 0 ? 'text-success' : 'text-destructive')}>
                  {Number(r.net_income_12m).toLocaleString()}
                </p>
                <Badge variant="outline" className={cn('text-xs gap-1 mt-0.5',
                  Number(r.net_margin_pct) >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}>
                  {Number(r.net_margin_pct) >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Number(r.net_margin_pct)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
