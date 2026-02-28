import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { PipelineWithStages } from '@/hooks/useCrmPipelines';
import { useSalesForecast } from '@/hooks/useSalesForecast';
import { TrendingUp, Target, CheckCircle, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  deals: AgentDeal[];
  pipeline: PipelineWithStages | undefined;
  agentMap?: Map<string, string>;
}

export function ForecastDashboard({ deals, pipeline, agentMap }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const forecast = useSalesForecast(deals, pipeline, agentMap);

  const cards = [
    {
      title: isRu ? 'Взвешенный прогноз' : 'Weighted Forecast',
      value: formatValue(forecast.weightedTotal),
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: isRu ? 'Лучший случай' : 'Best Case',
      value: formatValue(forecast.bestCase),
      icon: Target,
      color: 'text-warning',
    },
    {
      title: isRu ? 'Закрыто (успех)' : 'Closed Won',
      value: formatValue(forecast.closedWon),
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      title: isRu ? 'Win Rate' : 'Win Rate',
      value: `${forecast.winRate.toFixed(0)}%`,
      icon: Percent,
      color: forecast.winRate >= 50 ? 'text-success' : forecast.winRate >= 25 ? 'text-warning' : 'text-destructive',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Forecast cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <Card key={i} className="border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={cn('h-4 w-4', card.color)} />
                <span className="text-[11px] text-muted-foreground">{card.title}</span>
              </div>
              <p className="text-lg font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent leaderboard */}
      {forecast.byAgent.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isRu ? 'По агентам' : 'By Agent'}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {forecast.byAgent.slice(0, 5).map((agent, idx) => (
                <div key={agent.agentId} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-5 text-center text-muted-foreground">{idx + 1}</span>
                  <span className="text-sm flex-1 truncate">{agent.agentName}</span>
                  <span className="text-xs text-muted-foreground">{agent.deals} {isRu ? 'сделок' : 'deals'}</span>
                  <span className="text-sm font-semibold">{formatValue(agent.weighted)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
