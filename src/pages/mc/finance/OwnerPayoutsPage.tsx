import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerPayouts, useUpdatePayoutStatus, OwnerPayoutStatus } from '@/hooks/useOwnerPayouts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, CheckCircle2, Clock, XCircle, FileText, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<OwnerPayoutStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  processing: 'bg-info/10 text-info',
  paid: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

const STATUS_LABEL_RU: Record<OwnerPayoutStatus, string> = {
  draft: 'Черновик', pending: 'Ожидает', approved: 'Одобрена',
  processing: 'В обработке', paid: 'Выплачена', failed: 'Ошибка', cancelled: 'Отменена',
};

export default function OwnerPayoutsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [filter, setFilter] = useState<OwnerPayoutStatus | 'all'>('all');
  const { data: payouts, isLoading } = useOwnerPayouts(filter);
  const updateStatus = useUpdatePayoutStatus();

  const totals = useMemo(() => {
    const list = payouts || [];
    return {
      pending: list.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.net_payout), 0),
      paid: list.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.net_payout), 0),
      count: list.length,
    };
  }, [payouts]);

  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Banknote className="w-7 h-7 text-primary" />
            {isRu ? 'Выплаты собственникам' : 'Owner Payouts'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Регистр выплат, банковские референсы и пакетные прогоны' : 'Payout ledger, bank references and batch runs'}
          </p>
        </div>
        <Button variant="default">
          <Banknote className="w-4 h-4 mr-2" />
          {isRu ? 'Новый прогон выплат' : 'New payout run'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{isRu ? 'К выплате' : 'Pending'}</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{fmt(totals.pending)} ฿</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-success" />{isRu ? 'Выплачено' : 'Paid'}</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{fmt(totals.paid)} ฿</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="w-4 h-4" />{isRu ? 'Всего записей' : 'Records'}</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">{totals.count}</div>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as OwnerPayoutStatus | 'all')}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
          <TabsTrigger value="pending">{isRu ? 'Ожидают' : 'Pending'}</TabsTrigger>
          <TabsTrigger value="approved">{isRu ? 'Одобренные' : 'Approved'}</TabsTrigger>
          <TabsTrigger value="paid">{isRu ? 'Выплаченные' : 'Paid'}</TabsTrigger>
          <TabsTrigger value="failed">{isRu ? 'Ошибки' : 'Failed'}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : !payouts || payouts.length === 0 ? (
        <Card className="p-10 text-center">
          <Banknote className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Выплат пока нет. Создайте первый прогон, чтобы сгенерировать выплаты собственникам по периоду.' : 'No payouts yet.'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {payouts.map(p => (
            <Card key={p.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold">{p.payout_number}</span>
                    <Badge className={STATUS_COLORS[p.status]}>{isRu ? STATUS_LABEL_RU[p.status] : p.status}</Badge>
                    {p.bank_reference && <span className="text-xs text-muted-foreground">ref: {p.bank_reference}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {format(new Date(p.period_start), 'dd MMM')} — {format(new Date(p.period_end), 'dd MMM yyyy')}
                    {p.paid_at && <> · {isRu ? 'выплачено' : 'paid'} {format(new Date(p.paid_at), 'dd.MM.yyyy')}</>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    Gross {fmt(Number(p.gross_revenue))} − Comm {fmt(Number(p.mgmt_commission))} − Exp {fmt(Number(p.expenses))} − WHT {fmt(Number(p.wht_amount))} = <span className="font-bold text-foreground">{fmt(Number(p.net_payout))} {p.currency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: p.id, status: 'approved' })}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />{isRu ? 'Одобрить' : 'Approve'}
                    </Button>
                  )}
                  {p.status === 'approved' && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: 'paid' })}>
                      <ArrowUpRight className="w-4 h-4 mr-1" />{isRu ? 'Отметить выплаченной' : 'Mark paid'}
                    </Button>
                  )}
                  {p.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: p.id, status: 'cancelled' })}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
