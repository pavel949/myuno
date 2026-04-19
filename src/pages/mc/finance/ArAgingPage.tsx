import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useArAging } from '@/hooks/useArAging';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ArAgingPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: rows, isLoading } = useArAging();

  const totals = useMemo(() => {
    const list = rows || [];
    return {
      b1: list.reduce((s, r) => s + Number(r.bucket_0_30), 0),
      b2: list.reduce((s, r) => s + Number(r.bucket_31_60), 0),
      b3: list.reduce((s, r) => s + Number(r.bucket_61_90), 0),
      b4: list.reduce((s, r) => s + Number(r.bucket_90_plus), 0),
      total: list.reduce((s, r) => s + Number(r.total_outstanding), 0),
    };
  }, [rows]);

  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Receipt className="w-7 h-7 text-primary" />
          {isRu ? 'Дебиторская задолженность' : 'AR Aging'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu ? 'Открытые инвойсы по контрагентам с разбивкой по срокам просрочки' : 'Open invoices by contact, bucketed by overdue days'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '0–30', value: totals.b1, color: 'text-success' },
          { label: '31–60', value: totals.b2, color: 'text-warning' },
          { label: '61–90', value: totals.b3, color: 'text-warning' },
          { label: '90+', value: totals.b4, color: 'text-destructive' },
          { label: isRu ? 'Всего' : 'Total', value: totals.total, color: 'text-primary' },
        ].map((b, i) => (
          <Card key={i} className="p-3">
            <div className="text-xs text-muted-foreground">{b.label} {isRu ? 'дн.' : 'days'}</div>
            <div className={cn("text-lg md:text-xl font-bold tabular-nums mt-1", b.color)}>{fmt(b.value)} ฿</div>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-60" />
      ) : !rows || rows.length === 0 ? (
        <Card className="p-10 text-center">
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Открытой дебиторки нет' : 'No outstanding receivables'}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">{isRu ? 'Контрагент' : 'Contact'}</th>
                <th className="text-right p-3">{isRu ? 'Инв.' : 'Inv.'}</th>
                <th className="text-right p-3">0–30</th>
                <th className="text-right p-3">31–60</th>
                <th className="text-right p-3">61–90</th>
                <th className="text-right p-3">90+</th>
                <th className="text-right p-3">{isRu ? 'Итого' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{r.recipient_name}</div>
                    {r.recipient_email && <div className="text-xs text-muted-foreground">{r.recipient_email}</div>}
                  </td>
                  <td className="p-3 text-right tabular-nums">{r.open_invoices}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(Number(r.bucket_0_30))}</td>
                  <td className="p-3 text-right tabular-nums text-warning">{fmt(Number(r.bucket_31_60))}</td>
                  <td className="p-3 text-right tabular-nums text-warning">{fmt(Number(r.bucket_61_90))}</td>
                  <td className="p-3 text-right tabular-nums text-destructive font-semibold">
                    {Number(r.bucket_90_plus) > 0 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                    {fmt(Number(r.bucket_90_plus))}
                  </td>
                  <td className="p-3 text-right tabular-nums font-bold">{fmt(Number(r.total_outstanding))} {r.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
