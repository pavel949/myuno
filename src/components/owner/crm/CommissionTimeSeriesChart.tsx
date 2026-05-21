/**
 * CommissionTimeSeriesChart — monthly stacked bars over [-monthsBack, +monthsForward]
 * months, split by Buy-Side vs Sell-Side. Past months show earned (solid),
 * future months show weighted forecast (semi-transparent). Y-axis is in
 * millions to keep the dashboard glanceable.
 */
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCommissionForecastSeries } from '@/hooks/useCommissionForecastSeries';
import { cn } from '@/lib/utils';

interface CommissionTimeSeriesChartProps {
  companyId: string;
  monthsBack?: number;
  monthsForward?: number;
  className?: string;
  height?: number;
}

interface ChartRow {
  month: string;
  buy: number;
  sell: number;
  is_future: boolean;
}

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABELS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function formatM(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}

export function CommissionTimeSeriesChart({
  companyId,
  monthsBack = 6,
  monthsForward = 6,
  className,
  height = 240,
}: CommissionTimeSeriesChartProps) {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';
  const monthLabels = isRu ? MONTH_LABELS_RU : MONTH_LABELS_EN;

  const { data: series, isLoading } = useCommissionForecastSeries(companyId, monthsBack, monthsForward);

  const rows: ChartRow[] = useMemo(() => {
    if (!series) return [];
    return series.map((b) => {
      const [, mm] = b.month.split('-').map(Number);
      const label = monthLabels[mm - 1] ?? b.month;
      return {
        month: label,
        buy: b.is_future ? b.buy_weighted : b.buy_earned,
        sell: b.is_future ? b.sell_weighted : b.sell_earned,
        is_future: b.is_future,
      };
    });
  }, [series, monthLabels]);

  const totals = useMemo(() => {
    if (!series) return { buyTotal: 0, sellTotal: 0 };
    let buyTotal = 0;
    let sellTotal = 0;
    for (const b of series) {
      buyTotal += b.buy_earned + b.buy_weighted;
      sellTotal += b.sell_earned + b.sell_weighted;
    }
    return { buyTotal, sellTotal };
  }, [series]);

  const firstFutureIdx = rows.findIndex((r) => r.is_future);

  return (
    <section className={cn('border border-border bg-card', className)}>
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">{t('crm.timeSeries.title')}</h3>
          <p className="text-[11px] text-muted-foreground">{t('crm.timeSeries.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
          <span className="text-primary">
            {t('crm.side.buy.label')}: {formatM(totals.buyTotal)}
          </span>
          <span className="text-accent">
            {t('crm.side.sell.label')}: {formatM(totals.sellTotal)}
          </span>
        </div>
      </header>

      <div className="p-4" style={{ height }}>
        {isLoading || !rows.length ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {isLoading ? '…' : t('crm.timeSeries.empty')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tickFormatter={formatM}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'IBM Plex Mono, ui-monospace' }}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 0,
                  fontSize: 12,
                  fontFamily: 'IBM Plex Mono, ui-monospace',
                }}
                formatter={(value: number, name: string) => [formatM(value), name]}
              />
              <Legend
                iconType="square"
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              />
              {firstFutureIdx > 0 && (
                <ReferenceLine
                  x={rows[firstFutureIdx]?.month}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="2 2"
                  label={{
                    value: t('crm.timeSeries.forecastBand'),
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                    position: 'insideTopLeft',
                  }}
                />
              )}
              <Bar dataKey="buy" name={t('crm.side.buy.label')} stackId="commission">
                {rows.map((row, i) => (
                  <Cell key={`buy-${i}`} fill="hsl(var(--primary))" fillOpacity={row.is_future ? 0.45 : 1} />
                ))}
              </Bar>
              <Bar dataKey="sell" name={t('crm.side.sell.label')} stackId="commission">
                {rows.map((row, i) => (
                  <Cell key={`sell-${i}`} fill="hsl(var(--accent))" fillOpacity={row.is_future ? 0.45 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
