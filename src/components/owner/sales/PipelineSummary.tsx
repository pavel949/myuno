import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { DynamicPipelineResult } from '@/hooks/useDynamicPipelineStages';
import { TrendingUp, Target, DollarSign } from 'lucide-react';

interface Props {
  deals: AgentDeal[];
  pipelineData: DynamicPipelineResult;
}

export function PipelineSummary({ deals, pipelineData }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const stats = useMemo(() => {
    const closedKeys = pipelineData.stages.filter(s => s.isWon || s.isLost).map(s => s.key);
    const wonKeys = pipelineData.stages.filter(s => s.isWon).map(s => s.key);
    const active = deals.filter(d => !closedKeys.includes(d.stage));
    const totalPipeline = active.reduce((s, d) => s + Number(d.deal_value || d.budget_max || 0), 0);
    const weighted = active.reduce((s, d) => {
      const val = Number(d.deal_value || d.budget_max || 0);
      return s + val * pipelineData.getProbability(d.stage);
    }, 0);
    const won = deals.filter(d => wonKeys.includes(d.stage));
    const wonTotal = won.reduce((s, d) => s + Number(d.deal_value || 0), 0);
    return { activeCount: active.length, totalPipeline, weighted, wonTotal, wonCount: won.length };
  }, [deals, pipelineData]);

  if (deals.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex items-center gap-2 p-2.5 rounded-none border bg-card">
        <DollarSign className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{isRu ? 'Воронка' : 'Pipeline'}</p>
          <p className="text-sm font-bold">{formatValue(stats.totalPipeline)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2.5 rounded-none border bg-card">
        <Target className="h-4 w-4 text-accent-amber shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{isRu ? 'Прогноз' : 'Forecast'}</p>
          <p className="text-sm font-bold">{formatValue(stats.weighted)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2.5 rounded-none border bg-card">
        <TrendingUp className="h-4 w-4 text-success shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{isRu ? 'Закрыто' : 'Won'}</p>
          <p className="text-sm font-bold">{formatValue(stats.wonTotal)}</p>
        </div>
      </div>
    </div>
  );
}
