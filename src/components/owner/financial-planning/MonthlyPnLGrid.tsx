import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { ComputedPnL } from '@/lib/finance/financialModelMath';
import { useFinancialCategories } from '@/hooks/useFinancialCategories';

interface Props {
  computed: ComputedPnL;
}

const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(v: number): string {
  if (!v) return '—';
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return Math.round(v).toLocaleString();
}

export function MonthlyPnLGrid({ computed }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const months = isRu ? MONTHS_RU : MONTHS_EN;
  const { categories: expenseCats } = useFinancialCategories('expense');

  const catLabel = (code: string): string => {
    const c = expenseCats.find(x => x.code === code);
    if (!c) return code;
    return isRu ? c.name_ru : c.name_en;
  };

  const NumberCell = ({ value, bold = false, tone }: { value: number; bold?: boolean; tone?: 'pos' | 'neg' | null }) => (
    <td className={cn(
      'px-1.5 py-1 text-right tabular-nums whitespace-nowrap',
      bold && 'font-semibold',
      tone === 'pos' && 'text-success',
      tone === 'neg' && 'text-destructive',
    )}>
      {fmt(value)}
    </td>
  );

  const total = (arr: number[]) => arr.reduce((s, v) => s + (v || 0), 0);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="bg-muted/40 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 sticky left-0 bg-muted/40 z-10 min-w-[180px]">
                  {isRu ? 'Статья' : 'Line'}
                </th>
                {months.map(m => <th key={m} className="px-1.5 py-2 text-right font-medium min-w-[60px]">{m}</th>)}
                <th className="px-2 py-2 text-right font-bold bg-muted/60">{isRu ? 'Год' : 'Total'}</th>
                <th className="px-2 py-2 text-right text-muted-foreground">{isRu ? 'Сред' : 'Avg'}</th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue rows */}
              <tr className="bg-success/5">
                <td className="px-3 py-1 font-medium sticky left-0 bg-success/5 z-10">{isRu ? 'Доход от номера' : 'Room revenue'}</td>
                {computed.revenuePerMonth.map((v, i) => <NumberCell key={i} value={v} tone="pos" />)}
                <NumberCell value={total(computed.revenuePerMonth)} bold tone="pos" />
                <NumberCell value={total(computed.revenuePerMonth) / 12} tone="pos" />
              </tr>
              <tr>
                <td className="px-3 py-1 sticky left-0 bg-background z-10">{isRu ? 'Уборка' : 'Cleaning revenue'}</td>
                {computed.cleaningRevenuePerMonth.map((v, i) => <NumberCell key={i} value={v} />)}
                <NumberCell value={total(computed.cleaningRevenuePerMonth)} bold />
                <NumberCell value={total(computed.cleaningRevenuePerMonth) / 12} />
              </tr>
              <tr>
                <td className="px-3 py-1 sticky left-0 bg-background z-10">{isRu ? 'Прочий доход' : 'Other revenue'}</td>
                {computed.otherRevenuePerMonth.map((v, i) => <NumberCell key={i} value={v} />)}
                <NumberCell value={total(computed.otherRevenuePerMonth)} bold />
                <NumberCell value={total(computed.otherRevenuePerMonth) / 12} />
              </tr>
              <tr className="bg-success/10 border-y-2 border-success/30">
                <td className="px-3 py-1.5 font-bold sticky left-0 bg-success/10 z-10">{isRu ? 'Валовый доход' : 'Gross Revenue'}</td>
                {computed.grossRevenuePerMonth.map((v, i) => <NumberCell key={i} value={v} bold tone="pos" />)}
                <NumberCell value={total(computed.grossRevenuePerMonth)} bold tone="pos" />
                <NumberCell value={total(computed.grossRevenuePerMonth) / 12} bold tone="pos" />
              </tr>

              {/* Expense rows */}
              {computed.expensesByCategory.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-3 py-3 text-center text-muted-foreground italic">
                    {isRu ? 'Бюджет расходов пуст. Заполните в разделе «Бюджет».' : 'No expense budget. Add in Budget section.'}
                  </td>
                </tr>
              ) : (
                computed.expensesByCategory.map(row => (
                  <tr key={row.category}>
                    <td className="px-3 py-1 sticky left-0 bg-background z-10">{catLabel(row.category)}</td>
                    {row.monthly.map((v, i) => <NumberCell key={i} value={v} tone="neg" />)}
                    <NumberCell value={total(row.monthly)} bold tone="neg" />
                    <NumberCell value={total(row.monthly) / 12} tone="neg" />
                  </tr>
                ))
              )}

              <tr className="bg-destructive/10 border-y-2 border-destructive/30">
                <td className="px-3 py-1.5 font-bold sticky left-0 bg-destructive/10 z-10">{isRu ? 'Всего расходы' : 'Total OpEx'}</td>
                {computed.totalOpExPerMonth.map((v, i) => <NumberCell key={i} value={v} bold tone="neg" />)}
                <NumberCell value={total(computed.totalOpExPerMonth)} bold tone="neg" />
                <NumberCell value={total(computed.totalOpExPerMonth) / 12} bold tone="neg" />
              </tr>

              <tr className="bg-primary/5 border-y-2 border-primary/30">
                <td className="px-3 py-1.5 font-bold sticky left-0 bg-primary/5 z-10">NOI</td>
                {computed.noiPerMonth.map((v, i) => <NumberCell key={i} value={v} bold tone={v >= 0 ? 'pos' : 'neg'} />)}
                <NumberCell value={total(computed.noiPerMonth)} bold tone={total(computed.noiPerMonth) >= 0 ? 'pos' : 'neg'} />
                <NumberCell value={total(computed.noiPerMonth) / 12} bold />
              </tr>
              <tr className="bg-muted/30">
                <td className="px-3 py-1.5 font-bold sticky left-0 bg-muted/30 z-10">{isRu ? 'Чистая прибыль' : 'Net Income'}</td>
                {computed.netIncomePerMonth.map((v, i) => <NumberCell key={i} value={v} bold tone={v >= 0 ? 'pos' : 'neg'} />)}
                <NumberCell value={total(computed.netIncomePerMonth)} bold tone={total(computed.netIncomePerMonth) >= 0 ? 'pos' : 'neg'} />
                <NumberCell value={total(computed.netIncomePerMonth) / 12} bold />
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
