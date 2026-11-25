/**
 * PayoutRunPanel — Design Bible Round 4A · H2.
 * KPIs → payout run (owners · providers · exceptions) → reconciliation and
 * two-person run approval above DUAL_APPROVAL_THRESHOLD_THB.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SystemState } from '@/components/page/SystemState';
import { WorkflowStatus, type WorkflowTone } from '@/components/admin/hq/WorkflowStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useHqPayoutRun, approvableTotal, type PayeeKind, type PayoutLine } from '@/hooks/useHqPayoutRun';
import { useLedgerReconciliation } from '@/hooks/useLedgerReconciliation';
import { useDualApproval } from '@/hooks/useDualApproval';
import { canApprove, DUAL_APPROVAL_THRESHOLD_THB } from '@/lib/access/hqAccessPolicy';
import type { AppRole } from '@/types/auth';
import { cn } from '@/lib/utils';

type Tab = PayeeKind | 'exceptions';

const thb = (v: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(v);

const LINE_TONE: Record<PayoutLine['status'], WorkflowTone> = { ready: 'done', processing: 'active', exception: 'blocked' };

export function PayoutRunPanel() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tr = (en: string, ru: string) => (isRu ? ru : en);
  const locale = isRu ? 'ru-RU' : 'en-GB';
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const run = useHqPayoutRun();
  const recon = useLedgerReconciliation(30);
  const dual = useDualApproval('payout_run', run.data?.periodKey);
  const [tab, setTab] = useState<Tab>('owner');

  if (run.isLoading) return <SystemState variant="loading" rows={6} />;
  if (run.isError || !run.data) return <SystemState variant="error" onAction={() => void run.refetch()} />;

  const s = run.data;
  const owners = s.lines.filter((l) => l.kind === 'owner' && l.status !== 'exception');
  const providers = s.lines.filter((l) => l.kind === 'provider' && l.status !== 'exception');
  const exceptions = s.lines.filter((l) => l.status === 'exception');
  const shown = tab === 'owner' ? owners : tab === 'provider' ? providers : exceptions;
  const total = approvableTotal(s.lines);
  const needed = total.amount >= DUAL_APPROVAL_THRESHOLD_THB ? 2 : 1;
  const approverRoles = (roles ?? []).map((r) => r.role as AppRole);
  const mayApprove = canApprove(approverRoles, 'payout_run');
  const hasApproved = dual.hasApproved(user?.id);
  const approved = dual.approvalCount >= needed;
  const monthLabel = new Date(s.periodStart).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const kpis = [
    { k: tr('Collected', 'Получено'), v: thb(s.collected, locale), d: tr('paid orders this month', 'оплаченные заказы за месяц') },
    { k: tr('Platform fees', 'Комиссия платформы'), v: thb(s.platformFees, locale), d: s.collected ? `${((s.platformFees / s.collected) * 100).toFixed(1)}%` : '—' },
    { k: tr('Payouts due', 'К выплате'), v: thb(s.payoutsDue, locale), d: `${s.lines.length} ${tr('payees', 'получателей')}` },
    { k: tr('Refunds', 'Возвраты'), v: thb(s.refunds, locale), d: `${s.refundCount} ${tr('items', 'шт.')}` },
    { k: tr('Exceptions', 'Исключения'), v: String(exceptions.length + s.openAlerts.length), d: tr('held automatically', 'удержаны автоматически') },
  ];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'owner', label: tr('Owners', 'Собственники'), count: owners.length },
    { id: 'provider', label: tr('Providers', 'Партнёры'), count: providers.length },
    { id: 'exceptions', label: tr('Exceptions', 'Исключения'), count: exceptions.length },
  ];

  const reasonLabel = (r?: string) =>
    r === 'no_bank' ? tr('No bank details', 'Нет реквизитов') : r === 'failed' ? tr('Last transfer failed', 'Перевод не прошёл') : '';

  const handleApprove = async () => {
    try {
      const count = await dual.approve.mutateAsync(`${total.count} payouts · ${total.amount}`);
      toast.success(count >= needed ? tr('Run approved', 'Выплаты одобрены') : tr('Signed. Second approver needed.', 'Подписано. Нужен второй подтверждающий.'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('Could not approve', 'Не удалось одобрить'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.k} className="bg-card p-4">
            <div className="text-sm text-muted-foreground">{k.k}</div>
            <div className="font-display text-2xl tabular-nums text-foreground">{k.v}</div>
            <div className="text-caption font-semibold text-muted-foreground">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 border border-border bg-card" aria-labelledby="payout-run-title">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 id="payout-run-title" className="text-sm font-semibold text-foreground">{tr('Payouts', 'Выплаты')} · {monthLabel}</h2>
            <div role="tablist" className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                  className={cn('min-h-11 px-3 text-sm font-semibold sm:min-h-9', tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
                >
                  {t.label} · {t.count}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <SystemState variant="empty" compact title={tr('Nothing in this list', 'В этом списке пусто')} description={tab === 'exceptions' ? tr('No payouts are held.', 'Удержанных выплат нет.') : tr('No payouts are due for this group.', 'Для этой группы выплат нет.')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted text-left text-caption uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">{tr('Payee', 'Получатель')}</th>
                    <th className="px-4 py-2">{tr('Detail', 'Детали')}</th>
                    <th className="px-4 py-2 text-right">{tr('Gross', 'Начислено')}</th>
                    <th className="px-4 py-2 text-right">{tr('Fees', 'Удержания')}</th>
                    <th className="px-4 py-2 text-right">{tr('Payout', 'К выплате')}</th>
                    <th className="px-4 py-2">{tr('Status', 'Статус')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{l.payee}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{l.detail || (l.kind === 'owner' ? tr('Owner', 'Собственник') : tr('Provider', 'Партнёр'))}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{thb(l.gross, locale)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{thb(l.fees, locale)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">{thb(l.payout, locale)}</td>
                      <td className="px-4 py-2.5">
                        <WorkflowStatus tone={LINE_TONE[l.status]}>
                          {l.status === 'exception' ? reasonLabel(l.reason) : l.status === 'processing' ? tr('Processing', 'В обработке') : tr('Ready', 'Готово')}
                        </WorkflowStatus>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 border border-border bg-card p-4 text-sm">
            <span className="font-semibold text-foreground">{tr('Reconciliation · last 30 days', 'Сверка · 30 дней')}</span>
            {recon.isLoading ? <SystemState variant="loading" rows={3} /> : recon.isError || !recon.data ? (
              <span className="text-warning">{tr('Could not load reconciliation.', 'Не удалось загрузить сверку.')}</span>
            ) : (
              <>
                {[
                  [tr('Collected from guests', 'Получено от клиентов'), recon.data.totalOrderAmount, false],
                  [tr('Recorded in ledger', 'Отражено в реестре'), recon.data.totalLedgerAmount, false],
                  [tr('Difference', 'Разница'), recon.data.totalOrderAmount - recon.data.totalLedgerAmount, recon.data.totalOrderAmount !== recon.data.totalLedgerAmount],
                ].map(([k, v, bad]) => (
                  <div key={String(k)} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={cn('font-mono font-semibold tabular-nums', bad ? 'text-danger' : 'text-foreground')}>{thb(Number(v), locale)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">{tr('Orders without ledger', 'Заказы без проводок')}</span><span className="font-mono font-semibold">{recon.data.missingLedger}</span></div>
              </>
            )}
          </div>

          {(exceptions.length > 0 || s.openAlerts.length > 0) && (
            <div className="flex flex-col gap-1.5 border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="status">
              <span className="font-semibold">{exceptions.length + s.openAlerts.length} {tr('exceptions', 'исключений')}</span>
              {s.openAlerts.slice(0, 5).map((a) => (
                <span key={a.id}>{a.description}{a.amount != null ? ` · ${thb(Math.abs(a.amount), locale)}` : ''}</span>
              ))}
              {exceptions.length > 0 && <span>{exceptions.length} {tr('payouts held (bank details or failed transfer)', 'выплат удержано (реквизиты или неудачный перевод)')}</span>}
            </div>
          )}

          <Button className="min-h-11" disabled={!mayApprove || hasApproved || approved || total.count === 0 || dual.approve.isPending} onClick={() => void handleApprove()}>
            {approved
              ? tr('Run approved', 'Выплаты одобрены')
              : `${tr('Approve', 'Одобрить')} ${total.count} ${tr('payouts', 'выплат')} · ${thb(total.amount, locale)}`}
          </Button>
          <p className="text-caption text-muted-foreground">
            {needed === 2
              ? tr(`Two-person approval above ${thb(DUAL_APPROVAL_THRESHOLD_THB, locale)}: ${dual.approvalCount}/2 signed.`, `Двойное подтверждение выше ${thb(DUAL_APPROVAL_THRESHOLD_THB, locale)}: подписано ${dual.approvalCount}/2.`)
              : tr(`One approval needed: ${dual.approvalCount}/1 signed.`, `Нужно одно подтверждение: ${dual.approvalCount}/1.`)}{' '}
            {tr('Exceptions are held. Approval does not send money: providers are paid in “Provider payouts”, owners by their management company.', 'Исключения удержаны. Одобрение не отправляет деньги: партнёрам платят во вкладке «Выплаты партнёрам», собственникам — их управляющая компания.')}
          </p>
          {dual.approvals.length > 0 && (
            <div className="border border-border bg-card p-3 font-mono text-caption text-muted-foreground" aria-label={tr('Audit marker', 'Аудит-метка')}>
              <div>run · {s.periodKey}</div>
              {dual.approvals.map((a) => (
                <div key={a.id}>approval · {a.id.slice(0, 8)} · {new Date(a.created_at).toISOString()}</div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
