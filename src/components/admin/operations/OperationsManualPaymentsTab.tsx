import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, MessageCircle, CheckCircle2, XCircle, Clock,
  Phone, Mail, Wallet, AlertTriangle, ExternalLink, Upload, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Status = 'awaiting_admin' | 'contacted' | 'paid' | 'confirmed' | 'rejected' | 'expired';

interface RequestRow {
  id: string;
  order_id: string;
  status: Status;
  amount_listing: number;
  currency_listing: string;
  amount_rub_estimate: number | null;
  amount_rub_actual: number | null;
  payment_method_actual: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  hold_expires_at: string;
  rejected_reason: string | null;
  proof_file_path: string | null;
  created_at: string;
  contacted_at: string | null;
  confirmed_at: string | null;
  metadata: Record<string, any> | null;
  orders: { order_number: string | null; metadata: Record<string, any> | null } | null;
}

const STATUS_FILTERS: { id: 'all' | Status; en: string; ru: string }[] = [
  { id: 'all', en: 'All', ru: 'Все' },
  { id: 'awaiting_admin', en: 'Awaiting', ru: 'Ожидает' },
  { id: 'contacted', en: 'Contacted', ru: 'На связи' },
  { id: 'confirmed', en: 'Confirmed', ru: 'Подтв.' },
  { id: 'rejected', en: 'Rejected', ru: 'Отклон.' },
  { id: 'expired', en: 'Expired', ru: 'Истёк' },
];

const STATUS_BADGE: Record<Status, { en: string; ru: string; cls: string }> = {
  awaiting_admin: { en: 'Awaiting admin', ru: 'Ожидает админа', cls: 'bg-warning/10 text-warning border-warning/20' },
  contacted:      { en: 'Contacted',      ru: 'На связи',       cls: 'bg-primary/10 text-primary border-primary/20' },
  paid:           { en: 'Paid',           ru: 'Оплачено',       cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  confirmed:      { en: 'Confirmed',      ru: 'Подтверждено',   cls: 'bg-success/10 text-success border-success/20' },
  rejected:       { en: 'Rejected',       ru: 'Отклонено',      cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  expired:        { en: 'Expired',        ru: 'Истекло',        cls: 'bg-muted text-muted-foreground' },
};

const REJECT_REASONS: { id: string; en: string; ru: string }[] = [
  { id: 'no_response', en: 'Guest unreachable', ru: 'Гость не отвечает' },
  { id: 'no_payment', en: 'Payment not received', ru: 'Оплата не поступила' },
  { id: 'fraud', en: 'Suspected fraud', ru: 'Подозрение на мошенничество' },
  { id: 'guest_cancelled', en: 'Guest cancelled', ru: 'Гость отменил' },
  { id: 'other', en: 'Other', ru: 'Другое' },
];

export function OperationsManualPaymentsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [confirmTarget, setConfirmTarget] = useState<RequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manual-payment-requests', filter],
    queryFn: async () => {
      let q = supabase
        .from('manual_payment_requests')
        .select(`
          id, order_id, status, amount_listing, currency_listing, amount_rub_estimate, amount_rub_actual, payment_method_actual,
          guest_name, guest_phone, guest_email, hold_expires_at, rejected_reason, proof_file_path,
          created_at, contacted_at, confirmed_at, metadata,
          orders ( order_number, metadata )
        `)
        .order('created_at', { ascending: false })
        .limit(200);
      if (filter !== 'all') q = q.eq('status', filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as RequestRow[];
    },
    refetchInterval: 30000,
  });

  const counts = useMemo(() => {
    const out: Partial<Record<Status, number>> = {};
    (data || []).forEach((r) => { out[r.status] = (out[r.status] || 0) + 1; });
    return out;
  }, [data]);

  const markContacted = async (row: RequestRow) => {
    const { error } = await supabase
      .from('manual_payment_requests')
      .update({
        status: 'contacted',
        contacted_at: new Date().toISOString(),
        contacted_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', row.id);
    if (error) {
      toast.error(isRu ? 'Не удалось обновить' : 'Update failed', { description: error.message });
    } else {
      toast.success(isRu ? 'Отмечено: связались' : 'Marked as contacted');
      qc.invalidateQueries({ queryKey: ['manual-payment-requests'] });
    }
  };

  const openWhatsApp = (row: RequestRow) => {
    const phone = row.guest_phone.replace(/[^0-9]/g, '');
    const ref = row.orders?.order_number || row.order_id.slice(0, 8);
    const msg = `myUNO · Заявка #${ref}. Здравствуйте, ${row.guest_name}! Высылаю реквизиты для оплаты в рублях.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyEmail = (row: RequestRow) => {
    navigator.clipboard.writeText(row.guest_email).then(
      () => toast.success(isRu ? 'Email скопирован' : 'Email copied'),
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {STATUS_FILTERS.map((f) => {
            const c = f.id === 'all' ? data?.length : counts[f.id as Status];
            return (
              <TabsTrigger key={f.id} value={f.id} className="gap-2">
                {isRu ? f.ru : f.en}
                {c != null && c > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{c}</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <Wallet className="w-10 h-10 mx-auto opacity-40" />
            <p>{isRu ? 'Заявок нет' : 'No requests'}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(data || []).map((row) => {
          const expiresAt = parseISO(row.hold_expires_at);
          const isExpiringSoon = row.status === 'awaiting_admin' && expiresAt.getTime() - Date.now() < 4 * 3600 * 1000;
          const propertyTitle = row.orders?.metadata?.property_title || (isRu ? 'Объект' : 'Property');
          const orderNumber = row.orders?.order_number || row.order_id.slice(0, 8);
          const badge = STATUS_BADGE[row.status];
          const isActionable = row.status === 'awaiting_admin' || row.status === 'contacted' || row.status === 'paid';

          return (
            <Card key={row.id} className={cn(isExpiringSoon && 'border-warning/40')}>
              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-sm">#{orderNumber}</span>
                      <Badge variant="outline" className={cn('text-[10px]', badge.cls)}>
                        {isRu ? badge.ru : badge.en}
                      </Badge>
                      {isExpiringSoon && (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {isRu ? 'Срочно' : 'Urgent'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{propertyTitle}</p>
                  </div>
                  <div className="text-right">
                    {row.amount_rub_estimate != null && (
                      <div className="font-semibold">
                        ≈ {row.amount_rub_estimate.toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {row.currency_listing} {row.amount_listing.toLocaleString()}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Guest contact */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  <span className="font-medium">{row.guest_name}</span>
                  <a href={`tel:${row.guest_phone}`} className="text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />{row.guest_phone}
                  </a>
                  <button onClick={() => copyEmail(row)} className="text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />{row.guest_email}
                    <Copy className="w-3 h-3 opacity-50" />
                  </button>
                </div>

                {/* Hold timer */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isRu ? 'Hold' : 'Hold'} {formatDistanceToNow(expiresAt, { addSuffix: true, locale: isRu ? ruLocale : undefined })}
                  </span>
                  <span>·</span>
                  <span>
                    {isRu ? 'Создано' : 'Created'} {format(parseISO(row.created_at), 'd MMM HH:mm', { locale: isRu ? ruLocale : undefined })}
                  </span>
                </div>

                {row.rejected_reason && (
                  <p className="text-xs p-2 rounded bg-destructive/5 text-destructive">{row.rejected_reason}</p>
                )}

                {/* Action buttons */}
                {isActionable && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openWhatsApp(row)} className="gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {isRu ? 'WhatsApp' : 'WhatsApp'}
                    </Button>
                    {row.status === 'awaiting_admin' && (
                      <Button size="sm" variant="outline" onClick={() => markContacted(row)} className="gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isRu ? 'Связался' : 'Contacted'}
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setConfirmTarget(row)} className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isRu ? 'Подтвердить' : 'Confirm'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectTarget(row)} className="gap-1.5 text-destructive hover:text-destructive border-destructive/30">
                      <XCircle className="w-3.5 h-3.5" />
                      {isRu ? 'Отклонить' : 'Reject'}
                    </Button>
                  </div>
                )}

                {row.status === 'confirmed' && row.amount_rub_actual && (
                  <div className="text-xs text-muted-foreground bg-success/5 p-2 rounded">
                    {isRu ? 'Получено' : 'Received'}: {row.amount_rub_actual.toLocaleString('ru-RU')} ₽
                    {row.payment_method_actual && ` · ${row.payment_method_actual}`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {confirmTarget && (
        <ConfirmPaymentDialog
          row={confirmTarget}
          isRu={isRu}
          onClose={() => setConfirmTarget(null)}
          onDone={() => { setConfirmTarget(null); refetch(); }}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          row={rejectTarget}
          isRu={isRu}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Confirm dialog — admin enters actual RUB amount + payment method,
// optionally uploads proof file.
// ──────────────────────────────────────────────────────────
function ConfirmPaymentDialog({
  row, isRu, onClose, onDone,
}: { row: RequestRow; isRu: boolean; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState<string>(row.amount_rub_estimate ? String(row.amount_rub_estimate) : '');
  const [method, setMethod] = useState<string>('sbp');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(isRu ? 'Введите сумму' : 'Enter amount');
      return;
    }
    setSubmitting(true);
    try {
      let proofPath: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split('.').pop() || 'bin';
        const path = `${row.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('manual_payment_proofs')
          .upload(path, proofFile, { upsert: false });
        if (upErr) throw upErr;
        proofPath = path;
      }

      const { error } = await supabase.functions.invoke('confirm-manual-payment', {
        body: {
          request_id: row.id,
          amount_rub_actual: amt,
          payment_method: method,
          proof_file_path: proofPath,
        },
      });
      if (error) throw error;
      toast.success(isRu ? 'Оплата подтверждена' : 'Payment confirmed');
      onDone();
    } catch (e: any) {
      toast.error(isRu ? 'Не удалось подтвердить' : 'Confirmation failed', { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRu ? 'Подтвердить оплату' : 'Confirm payment'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{isRu ? 'Сумма получена (₽)' : 'Amount received (₽)'}</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="185000"
            />
          </div>
          <div>
            <Label>{isRu ? 'Способ оплаты' : 'Payment method'}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sbp">{isRu ? 'СБП' : 'SBP'}</SelectItem>
                <SelectItem value="ru_card">{isRu ? 'Карта РФ' : 'Russian card'}</SelectItem>
                <SelectItem value="crypto">{isRu ? 'Крипта' : 'Crypto'}</SelectItem>
                <SelectItem value="cash">{isRu ? 'Наличные' : 'Cash'}</SelectItem>
                <SelectItem value="other">{isRu ? 'Другое' : 'Other'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              {isRu ? 'Чек / скриншот (необязательно)' : 'Proof (optional)'}
            </Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRu ? 'Отмена' : 'Cancel'}</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isRu ? 'Подтвердить' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────
// Reject dialog
// ──────────────────────────────────────────────────────────
function RejectDialog({
  row, isRu, onClose, onDone,
}: { row: RequestRow; isRu: boolean; onClose: () => void; onDone: () => void }) {
  const [reasonId, setReasonId] = useState<string>('no_payment');
  const [extra, setExtra] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const reasonLabel = REJECT_REASONS.find((r) => r.id === reasonId);
      const reasonText = [reasonLabel ? (isRu ? reasonLabel.ru : reasonLabel.en) : reasonId, extra].filter(Boolean).join(' · ');
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('manual_payment_requests')
        .update({
          status: 'rejected',
          rejected_reason: reasonText,
          rejected_at: new Date().toISOString(),
          rejected_by: u.user?.id,
        })
        .eq('id', row.id);
      if (error) throw error;

      // Cancel the underlying order so dates free up
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', row.order_id);

      toast.success(isRu ? 'Заявка отклонена' : 'Request rejected');
      onDone();
    } catch (e: any) {
      toast.error(isRu ? 'Не удалось отклонить' : 'Reject failed', { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRu ? 'Отклонить заявку' : 'Reject request'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{isRu ? 'Причина' : 'Reason'}</Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REJECT_REASONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{isRu ? r.ru : r.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isRu ? 'Комментарий (опционально)' : 'Comment (optional)'}</Label>
            <Textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRu ? 'Отмена' : 'Cancel'}</Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isRu ? 'Отклонить' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
