import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface LogRow {
  id: string;
  order_id: string;
  notification_type: string;
  channels: string[] | null;
  recipients: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  customer_name: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  transfer_new_booking: 'New booking',
  transfer_new_booking_no_operator: '🚨 No operator',
  transfer_confirmed: 'Confirmed',
  transfer_rejected: 'Rejected',
  transfer_escalation_30min: '⏱️ Escalation 30 min',
};

export default function AdminTransferSLA() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderRow>>({});
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(72);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data: l } = await supabase
        .from('booking_notifications_log')
        .select('*')
        .like('notification_type', 'transfer_%')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      const rows = (l || []) as LogRow[];
      if (cancelled) return;
      setLogs(rows);

      const ids = Array.from(new Set(rows.map((r) => r.order_id))).filter(Boolean);
      if (ids.length > 0) {
        const { data: o } = await supabase
          .from('orders')
          .select('id, order_number, status, total_amount, currency, customer_name, created_at, confirmed_at, cancelled_at')
          .in('id', ids);
        if (!cancelled) {
          const map: Record<string, OrderRow> = {};
          (o || []).forEach((r) => { map[r.id] = r as OrderRow; });
          setOrders(map);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [hours]);

  const stats = useMemo(() => {
    const byOrder = new Map<string, LogRow[]>();
    logs.forEach((r) => {
      const arr = byOrder.get(r.order_id) || [];
      arr.push(r);
      byOrder.set(r.order_id, arr);
    });
    let confirmed = 0;
    let pending = 0;
    let rejected = 0;
    let escalated = 0;
    let noOp = 0;
    let avgConfirmMin = 0;
    let confirmedCount = 0;
    byOrder.forEach((rows) => {
      const types = new Set(rows.map((r) => r.notification_type));
      if (types.has('transfer_rejected')) rejected++;
      else if (types.has('transfer_confirmed')) {
        confirmed++;
        const created = rows.find((r) => r.notification_type.startsWith('transfer_new'));
        const conf = rows.find((r) => r.notification_type === 'transfer_confirmed');
        if (created && conf) {
          const dt = (new Date(conf.created_at).getTime() - new Date(created.created_at).getTime()) / 60000;
          if (dt > 0 && dt < 24 * 60) { avgConfirmMin += dt; confirmedCount++; }
        }
      } else pending++;
      if (types.has('transfer_escalation_30min')) escalated++;
      if (types.has('transfer_new_booking_no_operator')) noOp++;
    });
    return {
      total: byOrder.size,
      confirmed, pending, rejected, escalated, noOp,
      avgConfirmMin: confirmedCount ? Math.round(avgConfirmMin / confirmedCount) : 0,
    };
  }, [logs]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transfer SLA Dashboard</h1>
        <select
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="bg-background border border-border px-3 py-2"
        >
          <option value={24}>Last 24h</option>
          <option value={72}>Last 3 days</option>
          <option value={168}>Last 7 days</option>
          <option value={720}>Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Confirmed" value={stats.confirmed} tone="ok" icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Pending" value={stats.pending} tone="warn" />
        <StatCard label="Rejected" value={stats.rejected} tone="bad" />
        <StatCard label="Escalated" value={stats.escalated} tone="bad" icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Avg confirm (min)" value={stats.avgConfirmMin} />
      </div>

      {stats.noOp > 0 && (
        <Card className="p-4 border-destructive bg-destructive/10 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span>{stats.noOp} bookings created with NO active operator. Assign Klod or backup operator immediately.</span>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No transfer activity in this window.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Order</th>
                <th className="p-3">Event</th>
                <th className="p-3">Channels</th>
                <th className="p-3">Status</th>
                <th className="p-3">Order status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((r) => {
                const o = orders[r.order_id];
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3 font-mono">{o?.order_number || r.order_id.slice(0, 8)}</td>
                    <td className="p-3">{TYPE_LABEL[r.notification_type] || r.notification_type}</td>
                    <td className="p-3">{(r.channels || []).join(', ')}</td>
                    <td className="p-3">
                      <Badge variant={r.status === 'sent' ? 'default' : r.status === 'partial' ? 'secondary' : 'destructive'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3">{o?.status || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone?: 'ok' | 'warn' | 'bad'; icon?: React.ReactNode }) {
  const toneCls = tone === 'ok' ? 'text-green-600' : tone === 'warn' ? 'text-amber-600' : tone === 'bad' ? 'text-destructive' : '';
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</div>
      <div className={`text-2xl font-bold mt-1 ${toneCls}`}>{value}</div>
    </Card>
  );
}
