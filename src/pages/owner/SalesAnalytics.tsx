import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';

const STAGE_COLORS: Record<DealStage, string> = {
  new: '#3b82f6',
  contacted: '#06b6d4',
  showing: '#f59e0b',
  negotiation: '#f97316',
  contract: '#a855f7',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

const SOURCE_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#a855f7', '#22c55e', '#f97316'];

export default function SalesAnalytics() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: ml } = useMyCompanyId();
  const { data: deals = [], isLoading } = useAgentDeals(membership?.company_id);

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

  // Deals by month (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { month: string; won: number; lost: number; active: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const label = format(start, 'MMM yy');
      const monthDeals = deals.filter(d => {
        const created = new Date(d.created_at);
        return created >= start && created < startOfMonth(subMonths(new Date(), i - 1));
      });
      months.push({
        month: label,
        won: monthDeals.filter(d => d.stage === 'closed_won').length,
        lost: monthDeals.filter(d => d.stage === 'closed_lost').length,
        active: monthDeals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length,
      });
    }
    return months;
  }, [deals]);

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
    return { total, won, conversionRate: total ? ((won / total) * 100).toFixed(1) : '0', totalValue, totalCommission };
  }, [deals]);

  if (ml || isLoading) {
    return <div className="p-4 max-w-lg mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner/sales')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{isRu ? 'Аналитика продаж' : 'Sales Analytics'}</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isRu ? 'Всего сделок' : 'Total Deals', value: kpis.total },
          { label: isRu ? 'Конверсия' : 'Conversion', value: `${kpis.conversionRate}%` },
          { label: isRu ? 'Объём продаж' : 'Sales Volume', value: `${(kpis.totalValue / 1e6).toFixed(1)}M` },
          { label: isRu ? 'Комиссия' : 'Commission', value: `${(kpis.totalCommission / 1e6).toFixed(2)}M` },
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
        <div className="space-y-2">
          {funnelData.map((item, idx) => {
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
      </div>

      {/* Monthly bar chart */}
      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium mb-3">{isRu ? 'Сделки по месяцам' : 'Deals by Month'}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="active" stackId="a" fill="#3b82f6" name={isRu ? 'Активные' : 'Active'} radius={[0,0,0,0]} />
            <Bar dataKey="won" stackId="a" fill="#22c55e" name={isRu ? 'Успех' : 'Won'} radius={[0,0,0,0]} />
            <Bar dataKey="lost" stackId="a" fill="#ef4444" name={isRu ? 'Проигрыш' : 'Lost'} radius={[4,4,0,0]} />
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
    </div>
  );
}
