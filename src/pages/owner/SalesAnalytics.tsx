import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, useCompanyMembers, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage, STAGE_PROBABILITIES, formatValue } from '@/hooks/useAgentDeals';
import { AgentLeaderboard } from '@/components/owner/sales/AgentLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

// Theme-compatible colors using CSS variable-aware palette
const STAGE_COLORS: Record<DealStage, string> = {
  new: 'hsl(var(--info))',
  contacted: 'hsl(var(--info) / 0.7)',
  showing: 'hsl(var(--warning))',
  negotiation: 'hsl(var(--warning) / 0.7)',
  contract: 'hsl(var(--primary))',
  closed_won: 'hsl(var(--success))',
  closed_lost: 'hsl(var(--destructive))',
};

const SOURCE_COLORS = [
  'hsl(var(--info))',
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  'hsl(var(--accent-foreground))',
];

const PERIOD_OPTIONS = [
  { value: 'all', labelEn: 'All Time', labelRu: 'Всё время' },
  { value: 'year', labelEn: 'This Year', labelRu: 'Этот год' },
  { value: 'quarter', labelEn: 'Quarter', labelRu: 'Квартал' },
  { value: 'month', labelEn: 'Month', labelRu: 'Месяц' },
];

export default function SalesAnalytics() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: ml } = useMyCompanyId();
  const { data: dealsResult, isLoading } = useAgentDeals(membership?.company_id);
  const allDeals = dealsResult?.data || [];
  const { data: members = [] } = useCompanyMembers(membership?.company_id);
  const [period, setPeriod] = useState('all');

  // Filter deals by period
  const deals = useMemo(() => {
    if (period === 'all') return allDeals;
    const now = new Date();
    let cutoff: Date;
    if (period === 'month') cutoff = subMonths(now, 1);
    else if (period === 'quarter') cutoff = subMonths(now, 3);
    else cutoff = new Date(now.getFullYear(), 0, 1);
    return allDeals.filter(d => new Date(d.created_at) >= cutoff);
  }, [allDeals, period]);

  // Funnel data
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of deals) counts[d.stage] = (counts[d.stage] || 0) + 1;
    return DEAL_STAGES.filter(s => s !== 'closed_lost').map(s => ({
      name: isRu ? DEAL_STAGE_LABELS[s].ru : DEAL_STAGE_LABELS[s].en,
      value: counts[s] || 0,
      fill: STAGE_COLORS[s],
    }));
  }, [deals, isRu]);

  // Monthly data (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { month: string; won: number; lost: number; active: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(now, i));
      const end = startOfMonth(i === 0 ? addMonths(now, 1) : subMonths(now, i - 1));
      const label = format(start, 'MMM yy');
      const monthDeals = allDeals.filter(d => {
        const created = new Date(d.created_at);
        return created >= start && created < end;
      });
      months.push({
        month: label,
        won: monthDeals.filter(d => d.stage === 'closed_won').length,
        lost: monthDeals.filter(d => d.stage === 'closed_lost').length,
        active: monthDeals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length,
      });
    }
    return months;
  }, [allDeals]);

  // Sources pie
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of deals) {
      const src = d.client_source || 'other';
      map[src] = (map[src] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [deals]);

  // KPIs
  const kpis = useMemo(() => {
    const total = deals.length;
    const won = deals.filter(d => d.stage === 'closed_won').length;
    const totalValue = deals.filter(d => d.stage === 'closed_won' && d.deal_value).reduce((s, d) => s + Number(d.deal_value), 0);
    const totalCommission = deals.filter(d => d.stage === 'closed_won' && d.commission_amount).reduce((s, d) => s + Number(d.commission_amount), 0);
    const active = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
    const forecast = active.reduce((s, d) => {
      const val = Number(d.deal_value || d.budget_max || 0);
      return s + val * (STAGE_PROBABILITIES[d.stage as DealStage] || 0);
    }, 0);
    return { total, won, conversionRate: total ? ((won / total) * 100).toFixed(1) : '0', totalValue, totalCommission, forecast };
  }, [deals]);

  if (ml || isLoading) {
    return <div className="p-4 max-w-lg mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BackButton fallbackPath={APP_ROUTES.MC_SALES} variant="ghost" size="sm" />
        <h1 className="text-xl font-bold">{isRu ? 'Аналитика продаж' : 'Sales Analytics'}</h1>
      </div>

      {/* Period filter */}
      <div className="flex gap-1.5">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors font-medium',
              period === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
            )}
          >
            {isRu ? opt.labelRu : opt.labelEn}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: isRu ? 'Всего сделок' : 'Total Deals', value: kpis.total },
          { label: isRu ? 'Конверсия' : 'Conversion', value: `${kpis.conversionRate}%` },
          { label: isRu ? 'Объём продаж' : 'Sales Volume', value: formatValue(kpis.totalValue) },
          { label: isRu ? 'Комиссия' : 'Commission', value: formatValue(kpis.totalCommission) },
          { label: isRu ? 'Прогноз' : 'Forecast', value: formatValue(kpis.forecast) },
          { label: isRu ? 'Выиграно' : 'Won Deals', value: kpis.won },
        ].map(k => (
          <div key={k.label} className="p-3 rounded-xl border bg-card text-center">
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium mb-3">{isRu ? 'Воронка продаж' : 'Sales Funnel'}</p>
        {deals.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{isRu ? 'Нет данных за выбранный период' : 'No data for selected period'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {funnelData.map((item) => {
              const maxVal = Math.max(...funnelData.map(f => f.value), 1);
              const width = Math.max((item.value / maxVal) * 100, 8);
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-right text-muted-foreground">{item.name}</span>
                  <div className="flex-1 h-7 rounded-md overflow-hidden bg-muted">
                    <div
                      className="h-full rounded-md flex items-center px-2 text-xs font-medium text-white transition-all"
                      style={{ width: `${width}%`, backgroundColor: item.fill }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly bar chart */}
      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium mb-3">{isRu ? 'Сделки по месяцам' : 'Deals by Month'}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="active" stackId="a" fill="hsl(var(--info))" name={isRu ? 'Активные' : 'Active'} radius={[0,0,0,0]} />
            <Bar dataKey="won" stackId="a" fill="hsl(var(--success))" name={isRu ? 'Успех' : 'Won'} radius={[0,0,0,0]} />
            <Bar dataKey="lost" stackId="a" fill="hsl(var(--destructive))" name={isRu ? 'Проигрыш' : 'Lost'} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sources pie */}
      {sourceData.length > 0 && (
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-sm font-medium mb-3">{isRu ? 'Источники клиентов' : 'Client Sources'}</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
                  {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1">
              {sourceData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                  <span>{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent Leaderboard */}
      <AgentLeaderboard deals={deals} agents={members} />
    </div>
  );
}
