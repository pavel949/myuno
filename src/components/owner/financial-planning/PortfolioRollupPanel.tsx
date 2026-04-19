import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { computePnL, emptyDrivers, type Drivers, type CapExItem, type LoanItem, type Assumptions, type ExpenseRow } from '@/lib/finance/financialModelMath';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Building2, TrendingUp, Activity } from 'lucide-react';

interface Props { year: number; scenario: 'base' | 'optimistic' | 'pessimistic' }

function fmt(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

export function PortfolioRollupPanel({ year, scenario }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: properties } = useOwnerProperties();

  const propIds = (properties || []).map(p => p.id);

  // Fetch all financial models for these properties for this year+scenario
  const modelQueries = useQueries({
    queries: propIds.map(pid => ({
      queryKey: ['financial-model', user?.id, pid, year, scenario],
      queryFn: async () => {
        const { data } = await supabase
          .from('property_financial_models' as never)
          .select('*')
          .eq('property_id', pid)
          .eq('model_year', year)
          .eq('scenario', scenario)
          .maybeSingle();
        return data as Record<string, unknown> | null;
      },
      enabled: !!user && propIds.length > 0,
    })),
  });

  const budgetQueries = useQueries({
    queries: propIds.map(pid => ({
      queryKey: ['property-budgets', pid, year],
      queryFn: async () => {
        const { data } = await supabase
          .from('property_budgets')
          .select('*')
          .eq('property_id', pid)
          .gte('budget_month', `${year}-01-01`)
          .lte('budget_month', `${year}-12-31`);
        return data || [];
      },
      enabled: !!user && propIds.length > 0,
    })),
  });

  const perProperty = useMemo(() => {
    return propIds.map((pid, i) => {
      const prop = (properties || [])[i];
      const m = modelQueries[i].data as Record<string, unknown> | null | undefined;
      const drivers: Drivers = (m?.drivers as Drivers) || emptyDrivers(year);
      const capex: CapExItem[] = (m?.capex as CapExItem[]) || [];
      const loans: LoanItem[] = (m?.loans as LoanItem[]) || [];
      const assumptions: Assumptions = (m?.assumptions as Assumptions) || {};

      const budgets = (budgetQueries[i].data || []) as Array<{ category: string; budget_month: string; planned_amount: number; transaction_type: string }>;
      const map = new Map<string, number[]>();
      budgets.filter(b => b.transaction_type === 'expense').forEach(b => {
        const monthIdx = new Date(b.budget_month).getMonth();
        const cur = map.get(b.category) || Array(12).fill(0);
        cur[monthIdx] += Number(b.planned_amount || 0);
        map.set(b.category, cur);
      });
      const expenseRows: ExpenseRow[] = Array.from(map.entries()).map(([category, monthly]) => ({ category, monthly }));

      const computed = computePnL({ drivers, budgetExpenses: expenseRows, capex, loans, assumptions });
      const propName = isRu
        ? ((prop as { title_ru?: string; title_en?: string })?.title_ru || (prop as { title_en?: string })?.title_en || 'Объект')
        : ((prop as { title_en?: string; title_ru?: string })?.title_en || (prop as { title_ru?: string })?.title_ru || 'Property');
      return {
        id: pid,
        name: String(propName).slice(0, 24),
        revenue: computed.totals.grossRevenue,
        opex: computed.totals.totalOpEx,
        noi: computed.totals.noi,
        netIncome: computed.totals.netIncome,
        occupancy: computed.totals.avgOccupancy,
        capRate: computed.kpis.capRate,
        dscr: computed.kpis.dscr,
        propertyValue: assumptions.propertyValue || 0,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propIds.join(','), modelQueries.map(q => q.dataUpdatedAt).join(','), budgetQueries.map(q => q.dataUpdatedAt).join(','), year, isRu]);

  const totals = useMemo(() => {
    const sum = (arr: number[]) => arr.reduce((s, x) => s + (x || 0), 0);
    const totalRev = sum(perProperty.map(p => p.revenue));
    const totalOpex = sum(perProperty.map(p => p.opex));
    const totalNoi = sum(perProperty.map(p => p.noi));
    const totalNet = sum(perProperty.map(p => p.netIncome));
    const totalValue = sum(perProperty.map(p => p.propertyValue));
    // Weighted occupancy by revenue
    const weightedOcc = totalRev > 0
      ? perProperty.reduce((s, p) => s + p.occupancy * p.revenue, 0) / totalRev
      : 0;
    const portfolioCapRate = totalValue > 0 ? totalNoi / totalValue : null;
    return { totalRev, totalOpex, totalNoi, totalNet, totalValue, weightedOcc, portfolioCapRate, count: perProperty.length };
  }, [perProperty]);

  const chartData = perProperty.map(p => ({ name: p.name, revenue: Math.round(p.revenue), noi: Math.round(p.noi) }));
  const isLoading = modelQueries.some(q => q.isLoading) || budgetQueries.some(q => q.isLoading);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={Building2} label={isRu ? 'Объектов' : 'Properties'} value={String(totals.count)} tone="text-primary" />
        <Tile icon={TrendingUp} label={isRu ? 'Доход портфеля' : 'Portfolio revenue'} value={fmt(totals.totalRev)} tone="text-success" />
        <Tile icon={TrendingUp} label="NOI" value={fmt(totals.totalNoi)} tone={totals.totalNoi >= 0 ? 'text-success' : 'text-destructive'} />
        <Tile icon={Activity} label={isRu ? 'Загрузка (взв.)' : 'Occupancy (wtd)'} value={`${(totals.weightedOcc * 100).toFixed(0)}%`} tone="text-info" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Tile icon={TrendingUp} label={isRu ? 'OpEx портфеля' : 'Portfolio OpEx'} value={fmt(totals.totalOpex)} tone="text-destructive" />
        <Tile icon={TrendingUp} label={isRu ? 'Чистая прибыль' : 'Net Income'} value={fmt(totals.totalNet)} tone={totals.totalNet >= 0 ? 'text-success' : 'text-destructive'} />
        <Tile icon={TrendingUp} label="Cap Rate" value={totals.portfolioCapRate != null ? `${(totals.portfolioCapRate * 100).toFixed(1)}%` : '—'} tone="text-primary" />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isRu ? 'Доход и NOI по объектам' : 'Revenue and NOI by property'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} width={55} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" name={isRu ? 'Доход' : 'Revenue'} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="noi" fill="hsl(var(--primary))" name="NOI" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            {isRu ? 'Объекты в портфеле' : 'Portfolio properties'}
            <Badge variant="outline" className="text-[10px]">{scenario} · {year}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">{isRu ? 'Загрузка…' : 'Loading…'}</div>
          ) : perProperty.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">{isRu ? 'Нет объектов' : 'No properties'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">{isRu ? 'Объект' : 'Property'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Доход' : 'Revenue'}</th>
                    <th className="px-2 py-2 text-right">OpEx</th>
                    <th className="px-2 py-2 text-right">NOI</th>
                    <th className="px-2 py-2 text-right">Net</th>
                    <th className="px-2 py-2 text-right">Occ</th>
                    <th className="px-2 py-2 text-right">Cap</th>
                    <th className="px-2 py-2 text-right">DSCR</th>
                  </tr>
                </thead>
                <tbody>
                  {perProperty.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-1.5 font-medium">{p.name}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-success">{fmt(p.revenue)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-destructive">{fmt(p.opex)}</td>
                      <td className={cn('px-2 py-1.5 text-right tabular-nums font-medium', p.noi >= 0 ? 'text-foreground' : 'text-destructive')}>{fmt(p.noi)}</td>
                      <td className={cn('px-2 py-1.5 text-right tabular-nums', p.netIncome >= 0 ? 'text-foreground' : 'text-destructive')}>{fmt(p.netIncome)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{(p.occupancy * 100).toFixed(0)}%</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{p.capRate != null ? (p.capRate * 100).toFixed(1) + '%' : '—'}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{p.dscr != null ? p.dscr.toFixed(2) + 'x' : '—'}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-primary/5 font-semibold">
                    <td className="px-3 py-2">{isRu ? 'Итого' : 'Total'}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmt(totals.totalRev)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmt(totals.totalOpex)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmt(totals.totalNoi)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{fmt(totals.totalNet)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{(totals.weightedOcc * 100).toFixed(0)}%</td>
                    <td className="px-2 py-2 text-right tabular-nums">{totals.portfolioCapRate != null ? (totals.portfolioCapRate * 100).toFixed(1) + '%' : '—'}</td>
                    <td className="px-2 py-2 text-right tabular-nums">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn('h-3.5 w-3.5', tone)} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className={cn('text-lg font-bold leading-tight tabular-nums', tone)}>{value}</p>
      </CardContent>
    </Card>
  );
}
