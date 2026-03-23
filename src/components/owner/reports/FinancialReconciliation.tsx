import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReconciliationRow } from '@/hooks/useOwnerReconciliation';

interface Props {
  rows: ReconciliationRow[];
}

const fmt = (n: number) => `฿${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function FinancialReconciliation({ rows }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!rows?.length) return null;

  const totals = rows.reduce(
    (acc, r) => ({
      income: acc.income + r.income,
      expenses: acc.expenses + r.expenses,
      managementFee: acc.managementFee + r.managementFee,
      netMovement: acc.netMovement + r.netMovement,
    }),
    { income: 0, expenses: 0, managementFee: 0, netMovement: 0 }
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {isRu ? 'Итоговая финансовая сверка (накопительно)' : 'Cumulative Financial Reconciliation'}
      </h3>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{isRu ? 'Период' : 'Period'}</TableHead>
              <TableHead className="text-right">{isRu ? 'Вх. баланс' : 'Opening'}</TableHead>
              <TableHead className="text-right text-success">{isRu ? 'Доходы' : 'Income'}</TableHead>
              <TableHead className="text-right text-destructive">{isRu ? 'Расходы' : 'Expenses'}</TableHead>
              <TableHead className="text-right text-destructive">{isRu ? 'Комиссия УК' : 'Mgmt Fee'}</TableHead>
              <TableHead className="text-right">{isRu ? 'Движение' : 'Movement'}</TableHead>
              <TableHead className="text-right font-medium">{isRu ? 'Исх. баланс' : 'Closing'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.period}>
                <TableCell className="font-medium">{r.periodLabel}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmt(r.openingBalance)}</TableCell>
                <TableCell className="text-right text-success">+{fmt(r.income)}</TableCell>
                <TableCell className="text-right text-destructive">−{fmt(r.expenses)}</TableCell>
                <TableCell className="text-right text-destructive">−{fmt(r.managementFee)}</TableCell>
                <TableCell className={`text-right font-medium ${r.netMovement >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {r.netMovement >= 0 ? '+' : ''}{fmt(r.netMovement)}
                </TableCell>
                <TableCell className="text-right font-semibold">{fmt(r.closingBalance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">{isRu ? 'Итого' : 'Total'}</TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell className="text-right text-success">+{fmt(totals.income)}</TableCell>
              <TableCell className="text-right text-destructive">−{fmt(totals.expenses)}</TableCell>
              <TableCell className="text-right text-destructive">−{fmt(totals.managementFee)}</TableCell>
              <TableCell className={`text-right font-medium ${totals.netMovement >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totals.netMovement >= 0 ? '+' : ''}{fmt(totals.netMovement)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {rows.length ? fmt(rows[rows.length - 1].closingBalance) : '—'}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
