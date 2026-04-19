import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  computeDCF, computeSensitivity, type DcfInput, type DcfResult, type SensitivityRow,
} from '@/lib/finance/dcfMath';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Target, Calculator, Clock, Award } from 'lucide-react';

interface Props {
  year0NOI: number;
  year0NetIncome: number;
  defaultPropertyValue?: number;
  defaultCashInvested?: number;
  loanBalanceAtExit?: number;
  onResultChange?: (r: DcfResult) => void;
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

export function DCFPanel({ year0NOI, year0NetIncome, defaultPropertyValue, defaultCashInvested, loanBalanceAtExit, onResultChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [input, setInput] = useState<DcfInput>({
    year0NOI: year0NOI || 0,
    year0NetIncome: year0NetIncome || 0,
    initialInvestment: defaultCashInvested ?? defaultPropertyValue ?? 0,
    holdYears: 10,
    noiGrowthPct: 0.04,
    exitCapRatePct: 0.07,
    discountRatePct: 0.10,
    sellingCostPct: 0.03,
    loanBalanceAtExit: loanBalanceAtExit ?? 0,
  });

  // Sync inputs when computed model changes
  useMemo(() => {
    setInput(prev => ({ ...prev, year0NOI: year0NOI || 0, year0NetIncome: year0NetIncome || 0 }));
  }, [year0NOI, year0NetIncome]);

  const result = useMemo(() => computeDCF(input), [input]);
  useMemo(() => { onResultChange?.(result); }, [result, onResultChange]);

  const sensitivity: SensitivityRow[] = useMemo(() => computeSensitivity(input, 0.2), [input]);

  const cashflowChartData = result.rows.map(r => ({
    year: `Y${r.year}`,
    netCashFlow: Math.round(r.netCashFlow),
    pv: Math.round(r.pv),
    cumulative: 0,
  }));
  let cum = -input.initialInvestment;
  cashflowChartData.forEach(d => { cum += d.netCashFlow; d.cumulative = Math.round(cum); });

  const sensitivityChartData = sensitivity.map(s => ({
    name: s.variable,
    delta: Math.round((s.highNPV - s.lowNPV) / 1000),
  }));

  const irrPct = result.totals.irr != null ? (result.totals.irr * 100).toFixed(1) + '%' : '—';
  const irrTone = result.totals.irr == null ? 'text-muted-foreground'
    : result.totals.irr >= 0.15 ? 'text-success'
    : result.totals.irr >= 0.08 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isRu ? 'Параметры DCF (10-летний прогноз по умолчанию)' : 'DCF inputs (10-year default)'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label={isRu ? 'NOI год 1 (฿)' : 'Year-1 NOI (฿)'} value={input.year0NOI} onChange={v => setInput({ ...input, year0NOI: v })} step={10000} />
            <Field label={isRu ? 'Net Income год 1' : 'Year-1 Net Income'} value={input.year0NetIncome} onChange={v => setInput({ ...input, year0NetIncome: v })} step={10000} />
            <Field label={isRu ? 'Вложено собственных' : 'Cash invested'} value={input.initialInvestment} onChange={v => setInput({ ...input, initialInvestment: v })} step={100000} />
            <Field label={isRu ? 'Срок владения (лет)' : 'Hold period (years)'} value={input.holdYears} onChange={v => setInput({ ...input, holdYears: Math.max(1, Math.min(30, v)) })} step={1} />
            <PctField label={isRu ? 'Рост NOI %' : 'NOI growth %'} value={input.noiGrowthPct} onChange={v => setInput({ ...input, noiGrowthPct: v })} step={0.5} />
            <PctField label={isRu ? 'Exit Cap Rate %' : 'Exit Cap Rate %'} value={input.exitCapRatePct} onChange={v => setInput({ ...input, exitCapRatePct: v })} step={0.25} />
            <PctField label={isRu ? 'Ставка дисконт. %' : 'Discount rate %'} value={input.discountRatePct} onChange={v => setInput({ ...input, discountRatePct: v })} step={0.5} />
            <PctField label={isRu ? 'Расходы на продажу %' : 'Selling costs %'} value={input.sellingCostPct ?? 0.03} onChange={v => setInput({ ...input, sellingCostPct: v })} step={0.5} />
            <Field label={isRu ? 'Остаток кредита на выходе' : 'Loan balance at exit'} value={input.loanBalanceAtExit ?? 0} onChange={v => setInput({ ...input, loanBalanceAtExit: v })} step={100000} />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={TrendingUp} label="IRR (levered)" value={irrPct} tone={irrTone} />
        <Kpi icon={Target} label="NPV" value={fmt(result.totals.npv)} tone={result.totals.npv >= 0 ? 'text-success' : 'text-destructive'} />
        <Kpi icon={Award} label="MOIC" value={result.totals.moic ? `${result.totals.moic.toFixed(2)}x` : '—'} tone="text-primary" />
        <Kpi icon={Clock} label={isRu ? 'Окупаемость' : 'Payback'} value={result.totals.payback ? `${result.totals.payback.toFixed(1)} ${isRu ? 'лет' : 'yrs'}` : '—'} tone="text-info" />
      </div>

      {/* Cash flow chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            {isRu ? 'Денежные потоки и накопленный возврат' : 'Cash flows & cumulative return'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmt} width={60} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="netCashFlow" name={isRu ? 'Net CF' : 'Net CF'} radius={[4, 4, 0, 0]}>
                  {cashflowChartData.map((d, i) => (
                    <Cell key={i} fill={d.netCashFlow >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
                <Bar dataKey="cumulative" name={isRu ? 'Накопл.' : 'Cumul.'} fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DCF Year-by-year */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">{isRu ? 'Год' : 'Year'}</th>
                  <th className="px-2 py-2 text-right">NOI</th>
                  <th className="px-2 py-2 text-right">Net Income</th>
                  <th className="px-2 py-2 text-right">{isRu ? 'Терминал' : 'Terminal'}</th>
                  <th className="px-2 py-2 text-right">Net CF</th>
                  <th className="px-2 py-2 text-right">DF</th>
                  <th className="px-2 py-2 text-right">PV</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t bg-muted/20">
                  <td className="px-3 py-1.5 font-medium">Y0</td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">—</td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">—</td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">—</td>
                  <td className="px-2 py-1.5 text-right text-destructive font-medium tabular-nums">({fmt(input.initialInvestment)})</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">1.000</td>
                  <td className="px-2 py-1.5 text-right text-destructive font-medium tabular-nums">({fmt(input.initialInvestment)})</td>
                </tr>
                {result.rows.map(r => (
                  <tr key={r.year} className="border-t">
                    <td className="px-3 py-1.5 font-medium">Y{r.year}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.noi)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.netIncome)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.terminalValue > 0 ? fmt(r.terminalValue) : '—'}</td>
                    <td className={cn('px-2 py-1.5 text-right font-medium tabular-nums', r.netCashFlow >= 0 ? 'text-success' : 'text-destructive')}>{fmt(r.netCashFlow)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{r.discountFactor.toFixed(3)}</td>
                    <td className={cn('px-2 py-1.5 text-right tabular-nums', r.pv >= 0 ? 'text-foreground' : 'text-destructive')}>{fmt(r.pv)}</td>
                  </tr>
                ))}
                <tr className="border-t bg-primary/5 font-semibold">
                  <td className="px-3 py-2" colSpan={6}>NPV</td>
                  <td className={cn('px-2 py-2 text-right tabular-nums', result.totals.npv >= 0 ? 'text-success' : 'text-destructive')}>{fmt(result.totals.npv)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity tornado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isRu ? 'Чувствительность (Tornado, ±20%)' : 'Sensitivity (Tornado, ±20%)'}
            <Badge variant="outline" className="text-[10px]">NPV ฿K</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sensitivityChartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
                <Tooltip formatter={(v: number) => `฿${v.toLocaleString()}K`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="delta" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {isRu
              ? 'Чем длиннее полоса — тем сильнее эта переменная влияет на NPV. Концентрируйтесь на верхних.'
              : 'Longer bars = stronger NPV impact. Focus on the top variables.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn('h-3.5 w-3.5', tone)} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className={cn('text-lg font-bold leading-tight', tone)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, step = 1 }: { label: string; value?: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Input type="number" step={step} value={value ?? 0} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
    </label>
  );
}

function PctField({ label, value, onChange, step = 0.5 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Input type="number" step={step} value={Number((value * 100).toFixed(2))} onChange={e => onChange((parseFloat(e.target.value) || 0) / 100)} className="h-9 text-sm" />
    </label>
  );
}
