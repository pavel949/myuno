import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Users, Eye,
  MousePointerClick, Target, ArrowRight, AlertTriangle, AlertCircle,
  Info, Sparkles, Check, X, ChevronRight, Loader2
} from 'lucide-react';
import { useMCCNavigation } from '@/pages/admin/marketing/MarketingDashboard';
import {
  usePulseKPIs,
  useLandingFunnelBoard,
  useMCCAlerts,
  useAIRecommendations,
  useApplyRecommendation,
  useDismissRecommendation,
} from '@/hooks/useMCCControlTower';
import { cn } from '@/lib/utils';

type Period = 'today' | '7d' | 'mtd';

const STATE_LABELS: Record<string, { en: string; ru: string }> = {
  anonymous: { en: 'Anonymous', ru: 'Анонимный' },
  identified: { en: 'Identified', ru: 'Идентифицирован' },
  first_action: { en: 'First Action', ru: 'Первое действие' },
  returning: { en: 'Returning', ru: 'Возвращающийся' },
  multi_vertical: { en: 'Multi-Vertical', ru: 'Мульти-вертикаль' },
  expat_candidate: { en: 'Expat', ru: 'Экспат' },
  investor_candidate: { en: 'Investor', ru: 'Инвестор' },
  dormant: { en: 'Dormant', ru: 'Спящий' },
  churned: { en: 'Churned', ru: 'Отток' },
};

export function MCCControlTowerTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { navigateTo } = useMCCNavigation();
  const [period, setPeriod] = useState<Period>('7d');

  const { data: pulse, isLoading: pulseLoading } = usePulseKPIs(period);
  const { data: funnel, isLoading: funnelLoading } = useLandingFunnelBoard(period);
  const alerts = useMCCAlerts();
  const { data: recommendations } = useAIRecommendations();
  const applyMut = useApplyRecommendation();
  const dismissMut = useDismissRecommendation();

  const isLoading = pulseLoading || funnelLoading;

  const formatCurrency = (v: number) => {
    if (v >= 1000000) return `฿${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `฿${(v / 1000).toFixed(0)}K`;
    return `฿${v.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {isRu ? 'Control Tower' : 'Control Tower'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Все ключевые метрики в одном экране' : 'All key metrics in one screen'}
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{isRu ? 'Сегодня' : 'Today'}</SelectItem>
            <SelectItem value="7d">{isRu ? '7 дней' : '7 days'}</SelectItem>
            <SelectItem value="mtd">{isRu ? 'Месяц' : 'MTD'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ══ PULSE BAR ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PulseCard
          title={isRu ? 'Трафик' : 'Traffic'}
          value={pulse?.traffic ?? 0}
          icon={Eye}
          color="bg-info"
          threshold={pulse?.traffic && pulse.traffic >= 100 ? 'green' : pulse?.traffic && pulse.traffic >= 50 ? 'yellow' : 'red'}
        />
        <PulseCard
          title={isRu ? 'Выручка' : 'Revenue'}
          value={formatCurrency(pulse?.revenue ?? 0)}
          icon={DollarSign}
          color="bg-success"
          threshold={pulse?.revenue && pulse.revenue >= 10000 ? 'green' : pulse?.revenue && pulse.revenue >= 5000 ? 'yellow' : 'red'}
        />
        <PulseCard
          title={isRu ? 'Конверсия' : 'Conversion'}
          value={`${(pulse?.conversionPct ?? 0).toFixed(1)}%`}
          icon={Target}
          color="bg-primary"
          threshold={pulse?.conversionPct && pulse.conversionPct >= 8 ? 'green' : pulse?.conversionPct && pulse.conversionPct >= 5 ? 'yellow' : 'red'}
        />
        <PulseCard
          title={isRu ? 'Актив. пользователи' : 'Active Users'}
          value={pulse?.activeUsers ?? 0}
          icon={Users}
          color="bg-chart-1"
        />
      </div>

      {/* ══ ALERTS STRIP ══ */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-none text-sm',
                alert.severity === 'critical' && 'bg-destructive/10 border border-destructive/30',
                alert.severity === 'warning' && 'bg-warning/10 border border-warning/30',
                alert.severity === 'info' && 'bg-info/10 border border-info/30',
              )}
            >
              {alert.severity === 'critical' ? (
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              ) : alert.severity === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-info shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium">{alert.title}</span>
                <span className="text-muted-foreground ml-2">{alert.description}</span>
              </div>
              {alert.action && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-7 text-xs"
                  onClick={() => {
                    if (alert.landing_id) navigateTo('funnel-diag', { landingId: alert.landing_id });
                    else if (alert.action === 'Campaign') navigateTo('campaign-rules');
                    else navigateTo('states');
                  }}
                >
                  {alert.action}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ FUNNEL BOARD ══ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isRu ? 'Воронка по лендингам' : 'Landing Funnel Board'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">{isRu ? 'Лендинг' : 'Landing'}</th>
                  <th className="text-right p-2 font-medium">{isRu ? 'Просмотры' : 'Views'}</th>
                  <th className="text-right p-2 font-medium">CTA</th>
                  <th className="text-right p-2 font-medium">{isRu ? 'Интенты' : 'Intents'}</th>
                  <th className="text-right p-2 font-medium">{isRu ? 'Заверш.' : 'Done'}</th>
                  <th className="text-right p-2 font-medium">{isRu ? '2-е действ.' : '2nd Act'}</th>
                  <th className="text-right p-2 font-medium">{isRu ? 'Выручка' : 'Revenue'}</th>
                  <th className="text-right p-2 font-medium">Conv%</th>
                </tr>
              </thead>
              <tbody>
                {(funnel || []).map((row) => {
                  const conv = row.views > 0 ? ((row.completed / row.views) * 100).toFixed(1) : '0';
                  return (
                    <tr key={row.landing_id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => navigateTo('landings', { landingId: row.landing_id })}>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', row.is_active ? 'bg-success' : 'bg-muted-foreground')} />
                          <span className="font-medium">{isRu ? row.name_ru : row.name_en}</span>
                        </div>
                      </td>
                      <td className="p-2 text-right tabular-nums">{row.views}</td>
                      <td className="p-2 text-right tabular-nums">{row.clicks}</td>
                      <td className="p-2 text-right tabular-nums">{row.intents}</td>
                      <td className="p-2 text-right tabular-nums">{row.completed}</td>
                      <td className="p-2 text-right tabular-nums">{row.secondAction}</td>
                      <td className="p-2 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
                      <td className="p-2 text-right">
                        <Badge variant={Number(conv) >= 8 ? 'default' : Number(conv) >= 5 ? 'secondary' : 'destructive'} className="text-xs">
                          {conv}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {(!funnel || funnel.length === 0) && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                      {isRu ? 'Нет данных. Начните отправлять события.' : 'No data. Start sending events.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ══ BELOW THE FOLD: STATE MAP + AI + DROP-OFF ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Map */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Карта состояний' : 'State Map'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(pulse?.stateDistribution || {}).sort((a, b) => b[1] - a[1]).map(([state, count]) => {
              const maxCount = Math.max(...Object.values(pulse?.stateDistribution || { x: 1 }));
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const label = STATE_LABELS[state] || { en: state, ru: state };
              return (
                <div key={state} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-muted-foreground truncate">{isRu ? label.ru : label.en}</div>
                  <div className="flex-1 h-6 bg-muted rounded-none overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-none flex items-center justify-end px-2"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(pulse?.stateDistribution || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Нет данных по состояниям' : 'No state data yet'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {isRu ? 'AI Рекомендации' : 'AI Recommendations'}
              {recommendations && recommendations.length > 0 && (
                <Badge variant="secondary" className="text-xs">{recommendations.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec: any) => (
                <div key={rec.id} className="p-3 rounded-none bg-muted/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{rec.what_happened}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.why_it_matters}</p>
                      <p className="text-xs font-medium text-primary mt-1">{rec.what_to_do}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {(rec.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs"
                      onClick={() => applyMut.mutate(rec.id)}
                      disabled={applyMut.isPending}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {isRu ? 'Применить' : 'Apply'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => dismissMut.mutate({ id: rec.id })}
                      disabled={dismissMut.isPending}
                    >
                      <X className="h-3 w-3 mr-1" />
                      {isRu ? 'Отклонить' : 'Dismiss'}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Нет активных рекомендаций' : 'No active recommendations'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Drop-off Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Drop-off Radar' : 'Drop-off Radar'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(funnel || []).filter(l => l.views > 0).map((l) => {
              const dropOff = l.intents > 0 ? ((1 - l.completed / l.intents) * 100).toFixed(0) : '0';
              const isHigh = Number(dropOff) > 50;
              return (
                <div key={l.landing_id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm">{isRu ? l.name_ru : l.name_en}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{l.intents} → {l.completed}</span>
                    <Badge variant={isHigh ? 'destructive' : 'secondary'} className="text-xs">
                      {dropOff}% {isRu ? 'потерь' : 'drop'}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {(!funnel || funnel.filter(l => l.views > 0).length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Нет данных' : 'No data'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mini Funnel Numbers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Общая воронка' : 'Overall Funnel'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {[
                { label: isRu ? 'Просмотры' : 'Views', value: pulse?.traffic ?? 0 },
                { label: 'CTA', value: pulse?.ctaClicks ?? 0 },
                { label: isRu ? 'Интенты' : 'Intents', value: pulse?.intents ?? 0 },
                { label: isRu ? 'Заверш.' : 'Done', value: pulse?.completed ?? 0 },
                { label: '2nd', value: pulse?.secondAction ?? 0 },
              ].map((step, idx, arr) => (
                <React.Fragment key={step.label}>
                  <div className="text-center px-3 py-2 rounded-none bg-muted/50 min-w-[70px]">
                    <p className="text-xs text-muted-foreground">{step.label}</p>
                    <p className="text-lg font-bold">{step.value}</p>
                  </div>
                  {idx < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── PulseCard sub-component ──
function PulseCard({
  title, value, icon: Icon, color, threshold
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  threshold?: 'green' | 'yellow' | 'red';
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn('p-2 rounded-none', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {threshold && (
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-1',
            threshold === 'green' && 'bg-success',
            threshold === 'yellow' && 'bg-warning',
            threshold === 'red' && 'bg-destructive',
          )} />
        )}
      </CardContent>
    </Card>
  );
}
