import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { runMonteCarlo, type DcfInput, type MonteCarloResult } from '@/lib/finance/dcfMath';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Dice5, Loader2 } from 'lucide-react';

interface Props {
  baseInput: DcfInput;
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

function pctFmt(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function buildHistogram(samples: number[], bins = 20): Array<{ bin: string; count: number; midpoint: number }> {
  if (!samples.length) return [];
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const step = (max - min) / bins || 1;
  const buckets = Array(bins).fill(0).map((_, i) => ({
    midpoint: min + step * (i + 0.5),
    count: 0,
    bin: '',
  }));
  samples.forEach(s => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((s - min) / step)));
    buckets[idx].count += 1;
  });
  return buckets.map(b => ({ ...b, bin: b.midpoint >= 1_000_000 ? `${(b.midpoint / 1_000_000).toFixed(1)}M` : `${(b.midpoint / 1_000).toFixed(0)}K` }));
}

export function MonteCarloPanel({ baseInput }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [iterations, setIterations] = useState(1000);
  const [irrTarget, setIrrTarget] = useState(0.12);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MonteCarloResult | null>(null);

  const run = () => {
    setRunning(true);
    // Yield to UI
    setTimeout(() => {
      const r = runMonteCarlo(baseInput, iterations, irrTarget);
      setResult(r);
      setRunning(false);
    }, 30);
  };

  const npvHisto = useMemo(() => result ? buildHistogram(result.npvSamples, 24) : [], [result]);
  const irrHisto = useMemo(() => result
    ? buildHistogram(result.irrSamples.map(x => x * 100), 24).map(b => ({ ...b, bin: b.midpoint.toFixed(1) + '%' }))
    : [], [result]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dice5 className="h-4 w-4 text-primary" />
            {isRu ? 'Monte Carlo симуляция' : 'Monte Carlo simulation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Варьирует NOI, рост NOI и Exit Cap Rate по треугольному распределению. Использует параметры из вкладки DCF.'
              : 'Varies NOI, NOI growth and Exit Cap Rate by triangular distribution. Uses inputs from DCF tab.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">{isRu ? 'Итераций' : 'Iterations'}</span>
              <Input type="number" min={100} max={10000} step={100} value={iterations} onChange={e => setIterations(Math.max(100, Math.min(10000, +e.target.value || 1000)))} className="h-9 text-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">{isRu ? 'Целевой IRR %' : 'Target IRR %'}</span>
              <Input type="number" step={0.5} value={(irrTarget * 100).toFixed(1)} onChange={e => setIrrTarget((parseFloat(e.target.value) || 0) / 100)} className="h-9 text-sm" />
            </label>
            <div className="flex items-end">
              <Button onClick={run} disabled={running} className="w-full h-9">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dice5 className="h-4 w-4" />}
                <span className="ml-1.5">{isRu ? 'Запустить' : 'Run'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={isRu ? 'NPV ср.' : 'NPV mean'} value={fmt(result.npvStats.mean)} tone={result.npvStats.mean >= 0 ? 'text-success' : 'text-destructive'} />
            <StatCard label={isRu ? 'NPV медиана' : 'NPV median'} value={fmt(result.npvStats.median)} tone="text-foreground" />
            <StatCard label="P10" value={fmt(result.npvStats.p10)} tone={result.npvStats.p10 >= 0 ? 'text-success' : 'text-destructive'} />
            <StatCard label="P90" value={fmt(result.npvStats.p90)} tone="text-success" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label={isRu ? 'Веро-ть NPV > 0' : 'P(NPV > 0)'} value={pctFmt(result.npvStats.probPositive, 0)} tone={result.npvStats.probPositive >= 0.7 ? 'text-success' : result.npvStats.probPositive >= 0.5 ? 'text-warning' : 'text-destructive'} />
            <StatCard label={isRu ? 'Веро-ть IRR ≥ цели' : 'P(IRR ≥ target)'} value={pctFmt(result.irrStats.probAbove, 0)} tone={result.irrStats.probAbove >= 0.7 ? 'text-success' : result.irrStats.probAbove >= 0.5 ? 'text-warning' : 'text-destructive'} />
            <StatCard label={isRu ? 'IRR ср.' : 'IRR mean'} value={pctFmt(result.irrStats.mean)} tone="text-primary" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {isRu ? 'Распределение NPV' : 'NPV distribution'}
                <Badge variant="outline" className="text-[10px]">{result.iterations} {isRu ? 'итераций' : 'iter'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={npvHisto}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={2} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <ReferenceLine x={npvHisto.find(b => b.midpoint >= 0)?.bin} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isRu ? 'Распределение IRR' : 'IRR distribution'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={irrHisto}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={2} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn('text-base font-bold tabular-nums', tone)}>{value}</p>
      </CardContent>
    </Card>
  );
}
