import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { DynamicPipelineResult } from '@/hooks/useDynamicPipelineStages';
import { DollarSign, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommissionForecastProps {
  deals: AgentDeal[];
  pipelineData: DynamicPipelineResult;
  wonLostKeys: { won: string[]; lost: string[]; closed: string[] };
}

export function CommissionForecast({ deals, pipelineData, wonLostKeys }: CommissionForecastProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const metrics = useMemo(() => {
    const activeDeals = deals.filter(d => !wonLostKeys.closed.includes(d.stage));
    const wonDeals = deals.filter(d => wonLostKeys.won.includes(d.stage));

    // Won commission (actual)
    const wonCommission = wonDeals.reduce((s, d) => {
      if (d.commission_amount) return s + Number(d.commission_amount);
      if (d.deal_value && d.commission_percent) return s + (Number(d.deal_value) * Number(d.commission_percent) / 100);
      return s;
    }, 0);

    // Weighted pipeline commission forecast
    const forecastCommission = activeDeals.reduce((s, d) => {
      const val = Number(d.deal_value || d.budget_max || 0);
      const pct = Number(d.commission_percent || 3) / 100; // default 3%
      const probability = pipelineData.getProbability(d.stage);
      return s + (val * pct * probability);
    }, 0);

    // Expected commission next 30 days (deals with expected_close_date)
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expected30d = activeDeals
      .filter(d => d.expected_close_date && new Date(d.expected_close_date) <= in30)
      .reduce((s, d) => {
        const val = Number(d.deal_value || d.budget_max || 0);
        const pct = Number(d.commission_percent || 3) / 100;
        return s + (val * pct);
      }, 0);

    // At-risk deals (high value, stale > 14 days)
    const staleThreshold = 14;
    const atRisk = activeDeals.filter(d => {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate > staleThreshold && Number(d.deal_value || 0) > 0;
    }).length;

    return { wonCommission, forecastCommission, expected30d, atRisk };
  }, [deals, wonLostKeys, pipelineData]);

  const cards = [
    {
      label: isRu ? 'Заработано' : 'Earned',
      value: formatValue(metrics.wonCommission),
      icon: Trophy,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: isRu ? 'Прогноз (взвеш.)' : 'Forecast (wtd)',
      value: formatValue(metrics.forecastCommission),
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: isRu ? 'Ожидание 30д' : 'Expected 30d',
      value: formatValue(metrics.expected30d),
      icon: DollarSign,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    ...(metrics.atRisk > 0 ? [{
      label: isRu ? 'Под угрозой' : 'At Risk',
      value: String(metrics.atRisk),
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    }] : []),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map(c => (
        <div key={c.label} className="flex items-center gap-2.5 p-3 rounded-none border bg-card">
          <div className={cn('w-8 h-8 rounded-none flex items-center justify-center shrink-0', c.bg)}>
            <c.icon className={cn('h-4 w-4', c.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
            <p className="text-sm font-bold leading-tight">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
