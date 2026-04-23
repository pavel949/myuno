import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapitalInvestmentDeals, useUpdateCapitalInvestmentDeal } from '@/hooks/capital/useCapitalInvestmentDeals';
import { PIPELINE_STAGES, DEAL_INTENTS, type DealPipelineStatus } from '@/lib/investment/dealTaxonomy';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, TrendingUp, DollarSign, Users, Eye, EyeOff } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { toast } from 'sonner';

const fmtUsd = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;

export default function CapitalInvestmentDeals() {
  const { data: deals = [], isLoading } = useCapitalInvestmentDeals();
  const update = useUpdateCapitalInvestmentDeal();
  const navigate = useNavigate();
  const [filterIntent, setFilterIntent] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterIntent ? deals.filter(d => d.deal_intent === filterIntent) : deals,
    [deals, filterIntent]
  );

  const stats = useMemo(() => {
    const totalVolume = deals.reduce((s, d) => s + (d.deal_size_midpoint_usd || 0), 0);
    const weighted = deals.reduce((s, d) => s + (d.expected_value_usd || 0), 0);
    const fees = deals.reduce((s, d) => s + Number(d.platform_fee_estimate_usd || 0), 0);
    const published = deals.filter(d => d.is_published).length;
    return { totalVolume, weighted, fees, published, total: deals.length };
  }, [deals]);

  const byStage = useMemo(() => {
    const grouped: Record<string, typeof filtered> = {};
    PIPELINE_STAGES.forEach(s => { grouped[s.key] = []; });
    filtered.forEach(d => {
      const key = d.status || 'submitted';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    });
    return grouped;
  }, [filtered]);

  const moveDeal = async (id: string, status: DealPipelineStatus) => {
    try {
      await update.mutateAsync({ id, patch: { status } });
      toast.success('Сделка обновлена');
    } catch (err) {
      toast.error(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await update.mutateAsync({ id, patch: { is_published: !current, ...(current ? {} : { status: 'published' }) } });
      toast.success(current ? 'Снято с публикации' : 'Опубликовано');
    } catch (err) {
      toast.error(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Briefcase className="w-5 h-5 text-success" />
        <div>
          <h1 className="text-xl font-semibold">Investment Deals</h1>
          <p className="text-xs text-muted-foreground">Заявки из Investment Hub попадают сюда автоматически</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Всего', value: stats.total, icon: Briefcase },
          { label: 'Опубликовано', value: stats.published, icon: Eye },
          { label: 'Pipeline', value: fmtUsd(stats.totalVolume), icon: DollarSign },
          { label: 'Weighted', value: fmtUsd(stats.weighted), icon: TrendingUp },
          { label: 'Комиссия (est)', value: fmtUsd(stats.fees), icon: Users },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <k.icon className="w-3 h-3" />{k.label}
              </div>
              <p className="text-lg font-semibold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Intent filter */}
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={!filterIntent ? 'default' : 'outline'} onClick={() => setFilterIntent(null)}>Все</Button>
        {DEAL_INTENTS.map(i => (
          <Button key={i.key} size="sm" variant={filterIntent === i.key ? 'default' : 'outline'} onClick={() => setFilterIntent(i.key)}>
            {i.icon} {i.labelRu}
          </Button>
        ))}
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : deals.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          Пока нет заявок. Они появятся автоматически, когда кто-то подаст проект через <code>/invest/submit</code>.
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map(stage => (
              <div key={stage.key} className="w-72 flex-shrink-0">
                <div className={`text-xs font-medium px-2 py-1.5 rounded-none ${stage.color} mb-2 flex items-center justify-between`}>
                  <span>{stage.labelRu}</span>
                  <span className="opacity-60">{byStage[stage.key]?.length ?? 0}</span>
                </div>
                <div className="space-y-2">
                  {byStage[stage.key]?.map(d => (
                    <Card key={d.id} className="hover:border-success/40/50 transition cursor-pointer" onClick={() => navigate(APP_ROUTES.CAPITAL_INVESTMENT_DEAL_DETAIL(d.id))}>
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2">{d.title_private || 'Без названия'}</p>
                          <Button size="icon" variant="ghost" className="h-6 w-6 -mr-1 -mt-1" onClick={(e) => { e.stopPropagation(); togglePublish(d.id, d.is_published); }}>
                            {d.is_published ? <Eye className="w-3.5 h-3.5 text-success" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{d.submitter_name} · {d.submitter_company || '—'}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{DEAL_INTENTS.find(i => i.key === d.deal_intent)?.icon} {d.deal_intent}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{d.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-success font-medium">{fmtUsd(d.deal_size_midpoint_usd || 0)}</span>
                          <span className="text-muted-foreground">{d.probability_score}% · комиссия ≈ {fmtUsd(Number(d.platform_fee_estimate_usd || 0))}</span>
                        </div>
                        {/* Stage move buttons */}
                        <div className="flex gap-1 pt-1">
                          {PIPELINE_STAGES.filter(s => s.key !== stage.key).slice(0, 3).map(s => (
                            <Button key={s.key} size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={(e) => { e.stopPropagation(); moveDeal(d.id, s.key); }}>
                              → {s.labelRu}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
