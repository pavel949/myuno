import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { DynamicPipelineResult } from '@/hooks/useDynamicPipelineStages';
import { DollarSign, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Resolve the side of a deal — null pipelines fall through to 'buy' so legacy single-pipeline data still bucketizes. */
function dealSide(d: AgentDeal): 'buy' | 'sell' {
  return d.pipeline_side === 'sell' ? 'sell' : 'buy';
}

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

    const gross = (d: AgentDeal) => {
      if (d.commission_amount) return Number(d.commission_amount);
      const val = Number(d.deal_value ?? d.budget_max ?? 0);
      const pct = Number(d.commission_percent ?? 3) / 100;
      return val * pct;
    };

    // Won commission (actual), split by side
    let wonBuy = 0, wonSell = 0;
    for (const d of wonDeals) {
      const v = gross(d);
      if (dealSide(d) === 'sell') wonSell += v; else wonBuy += v;
    }

    // Weighted pipeline commission forecast, split by side
    let weightedBuy = 0, weightedSell = 0;
    for (const d of activeDeals) {
      const probability = pipelineData.getProbability(d.stage);
      const v = gross(d) * probability;
      if (dealSide(d) === 'sell') weightedSell += v; else weightedBuy += v;
    }

    // Expected commission next 30 days, split by side
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let exp30Buy = 0, exp30Sell = 0;
    for (const d of activeDeals) {
      if (!d.expected_close_date) continue;
      if (new Date(d.expected_close_date) > in30) continue;
      const v = gross(d);
      if (dealSide(d) === 'sell') exp30Sell += v; else exp30Buy += v;
    }

    // At-risk deals (high value, stale > 14 days)
    const staleThreshold = 14;
    const atRisk = activeDeals.filter(d => {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate > staleThreshold && Number(d.deal_value || 0) > 0;
    }).length;

    return {
      wonCommission: wonBuy + wonSell,
      wonBuy, wonSell,
      forecastCommission: weightedBuy + weightedSell,
      weightedBuy, weightedSell,
      expected30d: exp30Buy + exp30Sell,
      exp30Buy, exp30Sell,
      atRisk,
    };
  }, [deals, wonLostKeys, pipelineData]);

  const cards: Array<{
    label: string;
    value: string;
    icon: typeof Trophy;
    color: string;
    bg: string;
    buy?: number;
    sell?: number;
  }> = [
    {
      label: isRu ? 'Заработано' : 'Earned',
      value: formatValue(metrics.wonCommission),
      icon: Trophy,
      color: 'text-success',
      bg: 'bg-success/10',
      buy: metrics.wonBuy,
      sell: metrics.wonSell,
    },
    {
      label: isRu ? 'Прогноз (взвеш.)' : 'Forecast (wtd)',
      value: formatValue(metrics.forecastCommission),
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      buy: metrics.weightedBuy,
      sell: metrics.weightedSell,
    },
    {
      label: isRu ? 'Ожидание 30д' : 'Expected 30d',
      value: formatValue(metrics.expected30d),
      icon: DollarSign,
      color: 'text-warning',
      bg: 'bg-warning/10',
      buy: metrics.exp30Buy,
      sell: metrics.exp30Sell,
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
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
            <p className="text-sm font-bold leading-tight tabular-nums">{c.value}</p>
            {(c.buy != null || c.sell != null) && (c.buy! + c.sell! > 0) && (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums truncate">
                <span className="text-primary">B</span> {formatValue(c.buy ?? 0)}
                <span className="mx-1 text-border">·</span>
                <span className="text-accent">S</span> {formatValue(c.sell ?? 0)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
