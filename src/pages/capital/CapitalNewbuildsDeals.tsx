/**
 * CapitalNewbuildsDeals — Broker Console for Developer Module
 *
 * Cross-developer pipeline view showing:
 *  - Pipeline summary (RLNs, holds, reservations, commissions)
 *  - Lead attribution table (unmasked — broker view)
 *  - Active holds with TTL countdowns
 *  - Reservations & booking fee status
 *  - Commission forecast
 *  - Manual RLN send
 *  - Audit log (rln_events)
 *
 * Route: /capital/deals/newbuilds
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Clock, DollarSign, FileText, Send, Users, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RlnEvent {
  id: string;
  rln_number: string;
  sent_at: string;
  project_id: string;
  developer_id: string | null;
  lead_attribution_id: string;
  sent_to_email: string;
  property_projects?: { name_en: string };
}

interface Attribution {
  id: string;
  attribution_cookie_id: string;
  project_id: string | null;
  first_touch_at: string;
  last_touch_at: string;
  expires_at: string;
  claimed_by_broker: boolean;
  email_hash: string | null;
  phone_hash: string | null;
  utm_source: string | null;
  touchpoints: unknown[];
  property_projects?: { name_en: string; id: string };
  nb_leads?: Array<{ email: string | null; phone: string | null; name: string | null }>;
}

interface UnitHold {
  id: string;
  unit_id: string;
  hold_type: string;
  fee_status: string;
  expires_at: string | null;
  released_at: string | null;
  fee_amount_thb: number;
  created_at: string;
  project_units?: { unit_code: string | null; unit_type: string; project_id: string; property_projects?: { name_en: string } };
}

// ── Supabase helper for untyped tables ────────────────────────────────────────
// Returns `any` to bypass TS deep-instantiation explosion on tables not present
// in the auto-generated Database type.
function from(table: string): any {
  return (supabase.from as unknown as (t: string) => any)(table);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useNewbuildsPipelineStats() {
  return useQuery({
    queryKey: ['capital-newbuilds-stats'],
    queryFn: async () => {
      const [rlnRes, holdsRes, reservationsRes] = await Promise.all([
        from('rln_events').select('id', { count: 'exact', head: true }),
        from('unit_holds')
          .select('id', { count: 'exact', head: true })
          .eq('hold_type', 'soft_hold')
          .is('released_at', null),
        from('unit_holds')
          .select('id, fee_amount_thb')
          .eq('hold_type', 'booking_fee')
          .eq('fee_status', 'paid'),
      ]);

      const totalRlns = rlnRes.count ?? 0;
      const activeSoftHolds = holdsRes.count ?? 0;
      const bookingFeesPaid = (reservationsRes.data ?? []) as Array<{ id: string; fee_amount_thb: number }>;
      const totalBookingFees = bookingFeesPaid.reduce((sum, r) => sum + (r.fee_amount_thb || 0), 0);

      return { totalRlns, activeSoftHolds, bookingFeesPaid: bookingFeesPaid.length, totalBookingFees };
    },
  });
}

function useRlnEvents() {
  return useQuery({
    queryKey: ['capital-rln-events'],
    queryFn: async (): Promise<RlnEvent[]> => {
      const { data, error } = await from('rln_events')
        .select('*, property_projects(name_en)')
        .order('sent_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as RlnEvent[];
    },
  });
}

function useAttributionLeads() {
  return useQuery({
    queryKey: ['capital-attributions'],
    queryFn: async (): Promise<Attribution[]> => {
      const { data, error } = await from('lead_attributions')
        .select('*, property_projects(name_en, id)')
        .eq('claimed_by_broker', true)
        .order('last_touch_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Enrich with nb_leads for contact info
      const rows = (data ?? []) as Attribution[];
      const attrIds = rows.map(r => r.id);
      if (attrIds.length === 0) return rows;

      const { data: leads } = await supabase
        .from('nb_leads')
        .select('attribution_id, email, phone, name')
        .in('attribution_id' as never, attrIds);

      const leadMap: Record<string, Array<{ email: string | null; phone: string | null; name: string | null }>> = {};
      (leads ?? []).forEach((l: Record<string, string | null>) => {
        const aid = l.attribution_id as string;
        if (!leadMap[aid]) leadMap[aid] = [];
        leadMap[aid].push({ email: l.email, phone: l.phone, name: l.name });
      });

      return rows.map(r => ({ ...r, nb_leads: leadMap[r.id] ?? [] }));
    },
  });
}

function useActiveHolds() {
  return useQuery({
    queryKey: ['capital-active-holds'],
    queryFn: async (): Promise<UnitHold[]> => {
      const { data, error } = await from('unit_holds')
        .select('*, project_units(unit_code, unit_type, project_id, property_projects(name_en))')
        .is('released_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as UnitHold[];
    },
  });
}

function useSendManualRln() {
  return useMutation({
    mutationFn: async (opts: {
      attributionId: string;
      projectId: string;
      email?: string;
      phone?: string;
    }) => {
      const { data: project } = await supabase
        .from('property_projects')
        .select('name_en, developer_id, developer_name')
        .eq('id', opts.projectId)
        .maybeSingle();

      if (!project) throw new Error('Project not found');

      const year = new Date().getFullYear();
      const { count } = await from('rln_events').select('id', { count: 'exact', head: true });
      const seq = String((count ?? 0) + 1).padStart(5, '0');
      const rlnNumber = `RLN-${year}-${seq}`;

      // Create RLN event
      await from('rln_events').insert({
        lead_attribution_id: opts.attributionId,
        project_id: opts.projectId,
        developer_id: (project as Record<string, string | null>).developer_id ?? null,
        rln_number: rlnNumber,
        sent_to_email: 'sales@myuno.app',
        sent_at: new Date().toISOString(),
      });

      // Fire notify function
      await supabase.functions.invoke('notify-rln', {
        body: {
          rln_number: rlnNumber,
          project_name: (project as Record<string, string>).name_en,
          developer_name: (project as Record<string, string | null>).developer_name ?? null,
          developer_email: null,
          lead_email: opts.email ?? null,
          lead_phone: opts.phone ?? null,
          attribution_id: opts.attributionId,
        },
      });

      return rlnNumber;
    },
    onSuccess: (rlnNumber) => {
      toast.success(`RLN ${rlnNumber} отправлен`);
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка отправки RLN'),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TimeLeft({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-gray-400">—</span>;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return <span className="text-red-500 text-xs">Истёк</span>;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <span className="font-mono text-xs text-amber-600">
      {m}:{s.toString().padStart(2, '0')}
    </span>
  );
}

function Kpi({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-emerald-50">
          <Icon className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CapitalNewbuildsDeals() {
  const [activeTab, setActiveTab] = useState<'leads' | 'holds' | 'rln' | 'commissions'>('leads');

  const { data: stats } = useNewbuildsPipelineStats();
  const { data: rlnEvents = [], isLoading: rlnLoading, refetch: refetchRln } = useRlnEvents();
  const { data: attributions = [], isLoading: leadsLoading } = useAttributionLeads();
  const { data: holds = [], isLoading: holdsLoading } = useActiveHolds();
  const sendRln = useSendManualRln();

  const TABS: Array<{ key: typeof activeTab; label: string; count?: number }> = [
    { key: 'leads', label: 'Лиды / Attribution', count: attributions.length },
    { key: 'holds', label: 'Удержания', count: holds.filter(h => !h.released_at).length },
    { key: 'rln', label: 'RLN журнал', count: rlnEvents.length },
    { key: 'commissions', label: 'Комиссии' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Newbuilds — Broker Console
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Кросс-девелоперский пайплайн · Ignatev Capital</p>
        </div>
        <button
          onClick={() => refetchRln()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={FileText} label="Всего RLN" value={stats.totalRlns} />
          <Kpi icon={Clock} label="Активных удержаний" value={stats.activeSoftHolds} />
          <Kpi icon={CheckCircle} label="Booking Fee оплачено" value={stats.bookingFeesPaid} />
          <Kpi
            icon={DollarSign}
            label="Booking Fees (THB)"
            value={`฿${stats.totalBookingFees.toLocaleString()}`}
            sub="получено"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2',
              activeTab === t.key
                ? 'bg-white shadow-sm text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500',
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Leads / Attribution ── */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Attribution Records — {attributions.length} лидов
            </h2>
          </div>
          {leadsLoading ? (
            <div className="p-8 text-center text-gray-400">Загрузка...</div>
          ) : attributions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Нет лидов</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Контакт</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Проект</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">First Touch</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Last Touch</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">UTM</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attributions.map(a => {
                    const lead = a.nb_leads?.[0];
                    const isExpired = new Date(a.expires_at) < new Date();
                    return (
                      <tr key={a.id} className={cn('hover:bg-gray-50 transition-colors', isExpired && 'opacity-50')}>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{lead?.name || '—'}</div>
                          <div className="text-xs text-gray-500">{lead?.email || '—'}</div>
                          <div className="text-xs text-gray-400">{lead?.phone || '—'}</div>
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          {a.property_projects?.name_en ?? '—'}
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {new Date(a.first_touch_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {new Date(a.last_touch_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-3 text-xs text-gray-400">{a.utm_source ?? '—'}</td>
                        <td className="p-3">
                          {a.project_id && (
                            <button
                              onClick={() => sendRln.mutate({
                                attributionId: a.id,
                                projectId: a.project_id!,
                                email: lead?.email ?? undefined,
                                phone: lead?.phone ?? undefined,
                              })}
                              disabled={sendRln.isPending}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              RLN
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Holds ── */}
      {activeTab === 'holds' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Удержания — {holds.length} записей
            </h2>
          </div>
          {holdsLoading ? (
            <div className="p-8 text-center text-gray-400">Загрузка...</div>
          ) : holds.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Нет активных удержаний</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Юнит</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Проект</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Тип</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Статус оплаты</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">TTL</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {holds.map(h => {
                    const unit = h.project_units;
                    const isActive = !h.released_at;
                    const isSoftHold = h.hold_type === 'soft_hold';
                    return (
                      <tr key={h.id} className={cn('hover:bg-gray-50', !isActive && 'opacity-40')}>
                        <td className="p-3 font-medium text-gray-900">
                          {unit?.unit_code ?? unit?.unit_type ?? '—'}
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          {(unit?.property_projects as { name_en: string } | undefined)?.name_en ?? '—'}
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            isSoftHold ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700',
                          )}>
                            {h.hold_type === 'soft_hold' ? 'Soft Hold' : 'Booking Fee'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            h.fee_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
                          )}>
                            {h.fee_status}
                          </span>
                        </td>
                        <td className="p-3">
                          {isActive && isSoftHold ? (
                            <TimeLeft expiresAt={h.expires_at} />
                          ) : (
                            <span className="text-xs text-gray-400">
                              {h.released_at ? 'Освобождён' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-600">
                          {h.fee_amount_thb > 0 ? `฿${h.fee_amount_thb.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: RLN Journal ── */}
      {activeTab === 'rln' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              RLN Журнал — {rlnEvents.length} записей
            </h2>
          </div>
          {rlnLoading ? (
            <div className="p-8 text-center text-gray-400">Загрузка...</div>
          ) : rlnEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Нет RLN</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">RLN №</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Проект</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Отправлен</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Получатель</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rlnEvents.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs font-semibold text-emerald-700">{r.rln_number}</td>
                      <td className="p-3 text-xs text-gray-600">{r.property_projects?.name_en ?? '—'}</td>
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(r.sent_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-3 text-xs text-gray-400">{r.sent_to_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Commissions ── */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Commission Forecast</h2>
          </div>
          <CommissionForecast />
        </div>
      )}
    </div>
  );
}

// ── Commission Forecast sub-component ─────────────────────────────────────────

function CommissionForecast() {
  const { data, isLoading } = useQuery({
    queryKey: ['capital-commission-forecast'],
    queryFn: async () => {
      const [agreementsRes, holdsRes] = await Promise.all([
        from('commission_agreements')
          .select('id, developer_id, project_id, myuno_retained_rate, status, developers(name_en), property_projects(name_en)')
          .eq('status', 'active'),
        from('unit_holds')
          .select('id, fee_amount_thb, hold_type, fee_status, unit_id, project_units(price, project_id)')
          .eq('hold_type', 'booking_fee')
          .eq('fee_status', 'paid'),
      ]);

      const agreements = (agreementsRes.data ?? []) as Array<{
        id: string;
        myuno_retained_rate: number;
        developers?: { name_en: string };
        property_projects?: { name_en: string };
      }>;

      const paidHolds = (holdsRes.data ?? []) as Array<{
        id: string;
        fee_amount_thb: number;
        project_units?: { price: number | null; project_id: string };
      }>;

      // Estimate potential commission from paid booking fees
      // Real commission is triggered on SPA sign, but we show forecast
      const earnedFees = paidHolds.reduce((s, h) => s + (h.fee_amount_thb || 0), 0);

      return { agreements, earnedFees, paidCount: paidHolds.length };
    },
  });

  if (isLoading) return <div className="text-gray-400 text-sm">Загрузка...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-600 mb-1">Booking Fees получено</p>
          <p className="text-2xl font-bold text-emerald-700">฿{data.earnedFees.toLocaleString()}</p>
          <p className="text-xs text-emerald-500 mt-1">{data.paidCount} транзакций</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-600 mb-1">Активных соглашений</p>
          <p className="text-2xl font-bold text-blue-700">{data.agreements.length}</p>
          <p className="text-xs text-blue-500 mt-1">с застройщиками</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Комиссионные соглашения</h3>
        {data.agreements.length === 0 ? (
          <div className="text-sm text-gray-400">Нет активных соглашений</div>
        ) : (
          <div className="space-y-2">
            {data.agreements.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.developers?.name_en ?? 'Застройщик'}</p>
                  <p className="text-xs text-gray-400">{a.property_projects?.name_en ?? 'Все проекты'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{a.myuno_retained_rate}%</p>
                  <p className="text-xs text-gray-400">myUNO retains</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Комиссия признаётся при подписании SPA (event_type='invoiced'). Booking fee — это
          только депозит. Полный расчёт появится после создания commission_events в системе.
        </p>
      </div>
    </div>
  );
}
