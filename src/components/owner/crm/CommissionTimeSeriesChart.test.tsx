import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { CommissionTimeSeriesChart } from './CommissionTimeSeriesChart';
import { CHART_THEME } from '@/lib/chartTheme';
const fixture = vi.hoisted(() => ({ y: {} as Record<string, unknown>, tooltip: {} as Record<string, unknown>, chart: {} as Record<string, unknown> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/hooks/useCommissionForecastSeries', () => ({ useCommissionForecastSeries: () => ({ isLoading: false, data: [{ month: '2026-10', buy_earned: 2000000, buy_weighted: 0, sell_earned: 1000000, sell_weighted: 0, is_future: false }] }) }));
vi.mock('recharts', () => {
  const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: Container, Bar: Container, BarChart: (props: Record<string, unknown> & { children?: ReactNode }) => { fixture.chart = props; return <Container>{props.children}</Container>; },
    YAxis: (props: Record<string, unknown>) => { fixture.y = props; return null; }, Tooltip: (props: Record<string, unknown>) => { fixture.tooltip = props; return null; }, XAxis: () => null, Legend: () => null, Cell: () => null, CartesianGrid: () => null, ReferenceLine: () => null };
});
it('uses canonical theme fonts while preserving plotted commissions and formatted totals', () => {
 render(<CommissionTimeSeriesChart companyId="synthetic-company" />);
 expect(fixture.y.tick).toMatchObject({ ...CHART_THEME.axisTick, fontSize: 10, fontFamily: 'var(--font-mono)' });
 expect(fixture.tooltip.contentStyle).toEqual({ ...CHART_THEME.tooltip, fontFamily: 'var(--font-mono)' });
 expect(fixture.chart.data).toEqual([{ month: 'Oct', buy: 2000000, sell: 1000000, is_future: false }]);
 expect(screen.getByText('crm.side.buy.label: 2.0M')).toBeVisible();
 expect(screen.getByText('crm.side.sell.label: 1.0M')).toBeVisible();
});
