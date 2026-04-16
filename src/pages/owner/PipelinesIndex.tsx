import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyCompanyId, useAgentDeals, formatValue } from '@/hooks/useAgentDeals';
import { useCrmPipelines, PipelineWithStages } from '@/hooks/useCrmPipelines';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Layers, DollarSign, ArrowRight, Briefcase, Home, Building2 } from 'lucide-react';

const divisionConfig: Record<string, { icon: React.ElementType; color: string; label: { en: string; ru: string } }> = {
  capital: { icon: Briefcase, color: 'bg-warning/15 text-warning border-warning/30', label: { en: 'Capital', ru: 'Капитал' } },
  estate: { icon: Home, color: 'bg-primary/15 text-primary border-primary/30', label: { en: 'Estate', ru: 'Недвижимость' } },
  myuno: { icon: Building2, color: 'bg-info/15 text-info border-info/30', label: { en: 'myUNO', ru: 'myUNO' } },
};

function PipelineCard({ pipeline, dealCount, totalValue, isRu, onClick }: {
  pipeline: PipelineWithStages;
  dealCount: number;
  totalValue: number;
  isRu: boolean;
  onClick: () => void;
}) {
  const division = (pipeline as any).division || 'estate';
  const config = divisionConfig[division] || divisionConfig.estate;
  const DivIcon = config.icon;
  const activeStages = pipeline.stages.filter(s => !s.is_won && !s.is_lost);

  return (
    <button
      onClick={onClick}
      className="text-left border rounded-xl p-5 bg-card hover:border-primary/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
            {isRu ? pipeline.name_ru : pipeline.name_en}
          </h3>
          <Badge variant="outline" className={`text-[10px] mt-1 ${config.color}`}>
            <DivIcon className="h-3 w-3 mr-1" />
            {isRu ? config.label.ru : config.label.en}
          </Badge>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold">{dealCount}</p>
            <p className="text-[10px] text-muted-foreground">{isRu ? 'Сделок' : 'Deals'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-lg font-bold">{formatValue(totalValue)}</p>
            <p className="text-[10px] text-muted-foreground">{isRu ? 'Сумма' : 'Value'}</p>
          </div>
        </div>
      </div>

      {/* Stage dots */}
      <div className="flex gap-1 mt-4">
        {activeStages.slice(0, 8).map(s => (
          <div
            key={s.id}
            className="h-1.5 flex-1 rounded-full bg-muted"
            title={isRu ? s.name_ru : s.name_en}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {activeStages.length} {isRu ? 'этапов' : 'stages'}
      </p>
    </button>
  );
}

export default function PipelinesIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const { data: pipelines = [], isLoading: pipelinesLoading } = useCrmPipelines(membership?.company_id);
  const { data: dealsResult } = useAgentDeals(membership?.company_id);
  const deals = dealsResult?.data || [];

  const pipelineStats = useMemo(() => {
    const stats = new Map<string, { count: number; value: number }>();
    for (const d of deals) {
      const pid = d.pipeline_id || '';
      const existing = stats.get(pid) || { count: 0, value: 0 };
      existing.count++;
      existing.value += Number(d.deal_value || d.budget_max || 0);
      stats.set(pid, existing);
    }
    return stats;
  }, [deals]);

  const isLoading = membershipLoading || pipelinesLoading;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalDeals = deals.length;
  const totalValue = deals.reduce((s, d) => s + Number(d.deal_value || d.budget_max || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Воронки' : 'Pipelines'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalDeals} {isRu ? 'сделок' : 'deals'} · {formatValue(totalValue)} {isRu ? 'итого' : 'total'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelines.map(p => {
          const stats = pipelineStats.get(p.id) || { count: 0, value: 0 };
          return (
            <PipelineCard
              key={p.id}
              pipeline={p}
              dealCount={stats.count}
              totalValue={stats.value}
              isRu={isRu}
              onClick={() => navigate(`/mc/sales?pipeline=${p.id}`)}
            />
          );
        })}
      </div>

      {pipelines.length === 0 && (
        <div className="text-center py-16">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Воронки не найдены' : 'No pipelines found'}</p>
        </div>
      )}
    </div>
  );
}
