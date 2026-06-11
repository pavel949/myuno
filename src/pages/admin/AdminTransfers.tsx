import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Plane, MapPin, Phone, Calendar, Car,
  ChevronDown, ChevronUp, Wallet, Receipt, TrendingUp, CircleDollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type OrderStatus = Database['public']['Enums']['order_status'];

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  provider_ref: string | null;
  created_at: string;
}
interface LedgerEntry {
  id: string;
  amount: number;
  currency: string;
  entry_type: string;
  description: string | null;
  created_at: string;
}
interface StatusHistory {
  id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: string;
}

function fmtMoney(amt: number | null | undefined, ccy = 'THB') {
  if (amt == null) return '—';
  return `${ccy} ${Number(amt).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function OrderDetail({ orderId, currency, isRu }: { orderId: string; currency: string; isRu: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-transfer-detail', orderId],
    queryFn: async () => {
      const [pi, ledger, hist] = await Promise.all([
        supabase.from('payment_intents').select('id, amount, currency, method, status, provider_ref, created_at').eq('order_id', orderId).order('created_at', { ascending: true }),
        supabase.from('ledger_entries').select('id, amount, currency, entry_type, description, created_at').eq('order_id', orderId).order('created_at', { ascending: true }),
        supabase.from('order_status_history').select('id, from_status, to_status, reason, created_at').eq('order_id', orderId).order('created_at', { ascending: true }),
      ]);
      return {
        payments: (pi.data || []) as PaymentIntent[],
        ledger: (ledger.data || []) as LedgerEntry[],
        history: (hist.data || []) as StatusHistory[],
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  }

  const vendorPayoutEntry = data?.ledger.find(e => e.entry_type === 'vendor_payout' || e.entry_type === 'provider_payout');
  const platformFeeEntry = data?.ledger.find(e => e.entry_type === 'platform_fee');

  return (
    <div className="mt-3 pt-3 border-t border-border/40 space-y-4 text-sm">
      {/* Payments */}
      <section>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          <CircleDollarSign className="w-3.5 h-3.5" />
          {isRu ? 'Платежи клиента' : 'Customer payments'}
        </div>
        {data?.payments.length ? (
          <div className="space-y-1.5">
            {data.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40 rounded-none text-xs">
                <div className="flex items-center gap-2">
                  <Badge className={p.status === 'succeeded' || p.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                    {p.status}
                  </Badge>
                  <span className="text-muted-foreground">{p.method || '—'}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{format(new Date(p.created_at), 'dd.MM HH:mm')}</span>
                </div>
                <span className="font-semibold">{fmtMoney(p.amount, p.currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">{isRu ? 'Нет платежей' : 'No payments yet'}</div>
        )}
      </section>

      {/* Vendor payout (Klod) */}
      <section>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          <Wallet className="w-3.5 h-3.5" />
          {isRu ? 'Выплата оператору (Klod)' : 'Operator payout (Klod)'}
        </div>
        {vendorPayoutEntry ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-success/5 border border-success/20 rounded-none text-xs">
            <div>
              <Badge className="bg-success/10 text-success mr-2">{isRu ? 'Начислено' : 'Accrued'}</Badge>
              <span className="font-mono text-[10.5px] text-muted-foreground">{format(new Date(vendorPayoutEntry.created_at), 'dd.MM.yyyy HH:mm')}</span>
            </div>
            <span className="font-semibold">{fmtMoney(vendorPayoutEntry.amount, vendorPayoutEntry.currency)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-warning/5 border border-warning/20 rounded-none text-xs">
            <span className="text-warning">{isRu ? 'Ещё не начислено (ждём оплаты клиента)' : 'Not accrued yet (awaiting customer payment)'}</span>
          </div>
        )}
      </section>

      {/* Ledger entries (full) */}
      {data?.ledger.length ? (
        <section>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Receipt className="w-3.5 h-3.5" />
            {isRu ? 'Бухгалтерия' : 'Ledger'}
          </div>
          <div className="space-y-1">
            {data.ledger.map(e => (
              <div key={e.id} className="flex items-center justify-between px-2.5 py-1 text-xs">
                <span className="text-muted-foreground">{e.entry_type}{e.description ? ` · ${e.description}` : ''}</span>
                <span className="font-mono">{fmtMoney(e.amount, e.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Status timeline */}
      <section>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          {isRu ? 'История статусов' : 'Status timeline'}
        </div>
        {data?.history.length ? (
          <div className="space-y-1">
            {data.history.map(h => (
              <div key={h.id} className="flex items-center justify-between px-2.5 py-1 text-xs">
                <div className="flex items-center gap-2">
                  {h.from_status && <span className="text-muted-foreground">{h.from_status} →</span>}
                  <Badge className={statusColors[h.to_status] || 'bg-muted text-muted-foreground'}>{h.to_status}</Badge>
                  {h.reason && <span className="text-muted-foreground truncate max-w-[260px]">{h.reason}</span>}
                </div>
                <span className="font-mono text-[10.5px] text-muted-foreground">{format(new Date(h.created_at), 'dd.MM HH:mm')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">—</div>
        )}
      </section>
    </div>
  );
}

export default function AdminTransfers() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-transfers', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, vendor_payout_amount, platform_fee_amount,
          currency, start_at, created_at, paid_at, metadata,
          order_participants(name, phone, email, role),
          order_addresses(address_type, address_text)
        `)
        .eq('order_type', 'vehicle')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as OrderStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        to_status: newStatus,
        reason: `Admin status update to ${newStatus}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      toast(isRu ? 'Статус обновлён' : 'Status updated');
    },
    onError: () => toast.error(isRu ? 'Ошибка обновления' : 'Update failed'),
  });

  const transferOrders = orders?.filter(o => {
    const meta = o.metadata as Record<string, unknown> | null;
    return meta?.transfer_type === 'airport' || meta?.direction;
  }) || [];

  // KPIs
  const totals = transferOrders.reduce((acc, o) => {
    const sale = Number(o.total_amount) || 0;
    const cost = Number(o.vendor_payout_amount) || 0;
    const fee = Number(o.platform_fee_amount) || 0;
    acc.sale += sale;
    acc.cost += cost;
    acc.fee += fee;
    if (!o.paid_at && (o.status === 'confirmed' || o.status === 'completed' || o.status === 'in_progress')) {
      acc.unpaidByCustomer += sale;
    }
    if ((o.status === 'completed' || o.status === 'confirmed' || o.status === 'in_progress') && cost > 0) {
      acc.dueToKlod += cost;
    }
    return acc;
  }, { sale: 0, cost: 0, fee: 0, unpaidByCustomer: 0, dueToKlod: 0 });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-[1536px] mx-auto w-full">
      <div>
        <h1 className="text-2xl font-display font-bold">{isRu ? 'Трансферы' : 'Airport Transfers'}</h1>
        <p className="text-sm text-muted-foreground">{transferOrders.length} {isRu ? 'заказов' : 'orders'}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: isRu ? 'Выручка (продажа)' : 'Revenue (sale)', value: totals.sale, tone: 'text-foreground' },
          { label: isRu ? 'Закупка (Klod)' : 'Cost (Klod)', value: totals.cost, tone: 'text-muted-foreground' },
          { label: isRu ? 'Маржа' : 'Margin', value: totals.fee, tone: 'text-success' },
          { label: isRu ? 'К получению с клиентов' : 'Unpaid by customers', value: totals.unpaidByCustomer, tone: 'text-warning' },
          { label: isRu ? 'К выплате Klod' : 'Due to Klod', value: totals.dueToKlod, tone: 'text-primary' },
        ].map((k) => (
          <div key={k.label} className="p-3 border border-border/50 bg-card rounded-none">
            <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{k.label}</div>
            <div className={`text-lg font-bold mt-1 ${k.tone}`}>{fmtMoney(k.value)}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isRu ? 'Все статусы' : 'All statuses'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : transferOrders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {isRu ? 'Нет заказов на трансфер' : 'No transfer orders yet'}
        </div>
      ) : (
        <div className="space-y-3">
          {transferOrders.map(order => {
            const meta = (order.metadata || {}) as Record<string, unknown>;
            const participants = order.order_participants as Array<{ name: string; phone: string | null; email: string | null; role: string }> | null;
            const addresses = order.order_addresses as Array<{ address_type: string; address_text: string }> | null;
            const primary = participants?.find(p => p.role === 'primary') || participants?.[0];
            const pickup = addresses?.find(a => a.address_type === 'pickup');
            const dropoff = addresses?.find(a => a.address_type === 'dropoff');
            const scheduledDate = order.start_at
              ? new Date(order.start_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' ICT'
              : '—';
            const ccy = order.currency || 'THB';
            const sale = Number(order.total_amount) || 0;
            const cost = Number(order.vendor_payout_amount) || 0;
            const fee = Number(order.platform_fee_amount) || (sale - cost);
            const marginPct = sale > 0 ? Math.round((fee / sale) * 100) : 0;
            const isOpen = expanded.has(order.id);

            return (
              <div key={order.id} className="p-4 rounded-none border border-border/50 bg-card space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">#{order.order_number}</span>
                    <Badge className={statusColors[order.status] || 'bg-muted text-muted-foreground'}>{order.status}</Badge>
                    <Badge className={order.paid_at ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                      {order.paid_at ? (isRu ? 'Оплачено' : 'Paid') : (isRu ? 'Не оплачено' : 'Unpaid')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg leading-tight">{fmtMoney(sale, ccy)}</div>
                    <div className="text-[10.5px] text-muted-foreground">{isRu ? 'Продажа клиенту' : 'Customer price'}</div>
                  </div>
                </div>

                {/* Money breakdown row */}
                <div className="grid grid-cols-3 gap-2 text-xs border-y border-border/30 py-2">
                  <div>
                    <div className="text-muted-foreground">{isRu ? 'Закупка (Klod)' : 'Cost (Klod)'}</div>
                    <div className="font-semibold text-sm">{fmtMoney(cost, ccy)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{isRu ? 'Маржа' : 'Margin'}</div>
                    <div className="font-semibold text-sm text-success">{fmtMoney(fee, ccy)} <span className="text-[10px] text-muted-foreground">({marginPct}%)</span></div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{isRu ? 'Оплачено' : 'Paid at'}</div>
                    <div className="font-mono text-[11px]">{order.paid_at ? format(new Date(order.paid_at), 'dd.MM HH:mm') : '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{scheduledDate}</span>
                  </div>
                  {meta.flight_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Plane className="w-4 h-4 shrink-0" />
                      <span>{meta.flight_number as string} · {(meta.terminal as string) === 'international' ? "Int'l" : 'Dom'}</span>
                    </div>
                  )}
                  {meta.vehicle_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="w-4 h-4 shrink-0" />
                      <span>{meta.vehicle_name as string} · 👥{(meta.passengers as number) || 1}</span>
                    </div>
                  )}
                  {primary && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{primary.name} {primary.phone && `· ${primary.phone}`}</span>
                    </div>
                  )}
                  {pickup && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 text-success" />
                      <span className="truncate">{pickup.address_text}</span>
                    </div>
                  )}
                  {dropoff && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 text-destructive" />
                      <span className="truncate">{dropoff.address_text}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                  <span className="text-xs text-muted-foreground mr-auto">{isRu ? 'Статус:' : 'Status:'}</span>
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus.mutate({ orderId: order.id, newStatus: val as OrderStatus })}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toggle(order.id)}>
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isOpen ? (isRu ? 'Скрыть' : 'Hide') : (isRu ? 'Финансы' : 'Finance')}
                  </Button>
                </div>

                {isOpen && <OrderDetail orderId={order.id} currency={ccy} isRu={isRu} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
