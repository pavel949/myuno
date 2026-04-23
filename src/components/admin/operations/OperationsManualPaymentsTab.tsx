import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, MessageCircle, CheckCircle2, XCircle, Clock,
  Phone, Mail, Wallet, AlertTriangle, ExternalLink, Upload, Copy, FileText, ChevronRight,
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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
  paid:           { en: 'Paid',           ru: 'Оплачено',       cls: 'bg-primary/10 text-primary border-primary/40/20' },
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
  const [detailTarget, setDetailTarget] = useState<RequestRow | null>(null);

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

  const rows = data || [];

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

      {!isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <Wallet className="w-10 h-10 mx-auto opacity-40" />
            <p>{isRu ? 'Заявок нет' : 'No requests'}</p>
          </CardContent>
        </Card>
      )}

      {/* Desktop / tablet — table view */}
      {rows.length > 0 && (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">{isRu ? '№ заявки' : 'Request #'}</TableHead>
                  <TableHead>{isRu ? 'Гость' : 'Guest'}</TableHead>
                  <TableHead>{isRu ? 'Контакты' : 'Contacts'}</TableHead>
                  <TableHead className="text-right">{isRu ? 'Сумма ₽' : 'Amount ₽'}</TableHead>
                  <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                  <TableHead>{isRu ? 'Hold' : 'Hold'}</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const expiresAt = parseISO(row.hold_expires_at);
                  const isExpiringSoon = row.status === 'awaiting_admin' && expiresAt.getTime() - Date.now() < 4 * 3600 * 1000;
                  const orderNumber = row.orders?.order_number || row.order_id.slice(0, 8);
                  const badge = STATUS_BADGE[row.status];
                  const rubDisplay = row.amount_rub_actual ?? row.amount_rub_estimate;

                  return (
                    <TableRow
                      key={row.id}
                      className={cn('cursor-pointer', isExpiringSoon && 'bg-warning/5')}
                      onClick={() => setDetailTarget(row)}
                    >
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          #{orderNumber}
                          {isExpiringSoon && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{row.guest_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <a
                            href={`tel:${row.guest_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary inline-flex items-center gap-1"
                            title={row.guest_phone}
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <a
                            href={`mailto:${row.guest_email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary inline-flex items-center gap-1 truncate max-w-[180px]"
                            title={row.guest_email}
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{row.guest_email}</span>
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {rubDisplay != null ? (
                          <div>
                            <div className="font-semibold">
                              {row.amount_rub_actual ? '' : '≈ '}
                              {rubDisplay.toLocaleString('ru-RU')} ₽
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {row.currency_listing} {row.amount_listing.toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {row.currency_listing} {row.amount_listing.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', badge.cls)}>
                          {isRu ? badge.ru : badge.en}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(expiresAt, { addSuffix: true, locale: isRu ? ruLocale : undefined })}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mobile — compact list */}
      {rows.length > 0 && (
        <div className="md:hidden space-y-2">
          {rows.map((row) => {
            const expiresAt = parseISO(row.hold_expires_at);
            const isExpiringSoon = row.status === 'awaiting_admin' && expiresAt.getTime() - Date.now() < 4 * 3600 * 1000;
            const orderNumber = row.orders?.order_number || row.order_id.slice(0, 8);
            const badge = STATUS_BADGE[row.status];
            const rubDisplay = row.amount_rub_actual ?? row.amount_rub_estimate;

            return (
              <Card
                key={row.id}
                className={cn('cursor-pointer active:scale-[0.99] transition-transform', isExpiringSoon && 'border-warning/40')}
                onClick={() => setDetailTarget(row)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-semibold text-xs">#{orderNumber}</span>
                        <Badge variant="outline" className={cn('text-[10px]', badge.cls)}>
                          {isRu ? badge.ru : badge.en}
                        </Badge>
                        {isExpiringSoon && <AlertTriangle className="w-3 h-3 text-destructive" />}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">{row.guest_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{row.guest_email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {rubDisplay != null && (
                        <div className="font-semibold text-sm">
                          {row.amount_rub_actual ? '' : '≈ '}
                          {rubDisplay.toLocaleString('ru-RU')} ₽
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(expiresAt, { addSuffix: true, locale: isRu ? ruLocale : undefined })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {detailTarget && (
        <DetailSheet
          row={detailTarget}
          isRu={isRu}
          onClose={() => setDetailTarget(null)}
          onConfirm={() => { setConfirmTarget(detailTarget); setDetailTarget(null); }}
          onReject={() => { setRejectTarget(detailTarget); setDetailTarget(null); }}
          onWhatsApp={() => openWhatsApp(detailTarget)}
          onCopyEmail={() => copyEmail(detailTarget)}
          onMarkContacted={() => { markContacted(detailTarget); setDetailTarget(null); }}
        />
      )}
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
// Detail sheet — read-only request card opened from the table.
// Shows full info: order ref, property, amounts (estimate/actual), contacts,
// timing, proof preview, status, and primary actions.
// ──────────────────────────────────────────────────────────
function DetailSheet({
  row, isRu, onClose, onConfirm, onReject, onWhatsApp, onCopyEmail, onMarkContacted,
}: {
  row: RequestRow;
  isRu: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onWhatsApp: () => void;
  onCopyEmail: () => void;
  onMarkContacted: () => void;
}) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!row.proof_file_path) return;
    supabase.storage
      .from('manual_payment_proofs')
      .createSignedUrl(row.proof_file_path, 60 * 10)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setProofUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [row.proof_file_path]);

  const orderNumber = row.orders?.order_number || row.order_id.slice(0, 8);
  const propertyTitle = row.orders?.metadata?.property_title || (isRu ? 'Объект' : 'Property');
  const expiresAt = parseISO(row.hold_expires_at);
  const badge = STATUS_BADGE[row.status];
  const isActionable = row.status === 'awaiting_admin' || row.status === 'contacted' || row.status === 'paid';

  const copyOrderRef = () => {
    navigator.clipboard.writeText(orderNumber).then(
      () => toast.success(isRu ? 'Номер скопирован' : 'Number copied'),
    );
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-0.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="font-mono">#{orderNumber}</SheetTitle>
            <Badge variant="outline" className={cn('text-[10px]', badge.cls)}>
              {isRu ? badge.ru : badge.en}
            </Badge>
            <button
              onClick={copyOrderRef}
              className="text-muted-foreground hover:text-primary"
              title={isRu ? 'Скопировать' : 'Copy'}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <SheetDescription>{propertyTitle}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-5">
          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={isRu ? 'Сумма заказа' : 'Order amount'}>
              <span className="font-semibold">
                {row.currency_listing} {row.amount_listing.toLocaleString()}
              </span>
            </Field>
            <Field label={isRu ? 'Оценка ₽' : 'RUB estimate'}>
              {row.amount_rub_estimate != null ? (
                <span className="font-semibold">≈ {row.amount_rub_estimate.toLocaleString('ru-RU')} ₽</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>
            {row.amount_rub_actual != null && (
              <Field label={isRu ? 'Получено ₽' : 'Received ₽'}>
                <span className="font-semibold text-success">
                  {row.amount_rub_actual.toLocaleString('ru-RU')} ₽
                </span>
              </Field>
            )}
            {row.payment_method_actual && (
              <Field label={isRu ? 'Способ' : 'Method'}>
                <span>{row.payment_method_actual}</span>
              </Field>
            )}
          </div>

          <Separator />

          {/* Contacts */}
          <div className="space-y-3">
            <Field label={isRu ? 'Гость' : 'Guest'}>
              <span className="font-medium">{row.guest_name}</span>
            </Field>
            <div className="grid grid-cols-1 gap-2">
              <a
                href={`tel:${row.guest_phone}`}
                className="flex items-center justify-between p-2.5 rounded-none border hover:bg-muted/50"
              >
                <span className="inline-flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {row.guest_phone}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
              <button
                type="button"
                onClick={onCopyEmail}
                className="flex items-center justify-between p-2.5 rounded-none border hover:bg-muted/50 text-left"
              >
                <span className="inline-flex items-center gap-2 text-sm truncate">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{row.guest_email}</span>
                </span>
                <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
              <button
                type="button"
                onClick={onWhatsApp}
                className="flex items-center justify-between p-2.5 rounded-none border bg-success/5 border-success/20 hover:bg-success/10 text-left"
              >
                <span className="inline-flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-success" />
                  {isRu ? 'Открыть WhatsApp с гостем' : 'Open WhatsApp with guest'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <Separator />

          {/* Timing */}
          <div className="space-y-2">
            <Field label={isRu ? 'Создано' : 'Created'}>
              <span>{format(parseISO(row.created_at), 'd MMM yyyy, HH:mm', { locale: isRu ? ruLocale : undefined })}</span>
            </Field>
            <Field label={isRu ? 'Hold истекает' : 'Hold expires'}>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {format(expiresAt, 'd MMM, HH:mm', { locale: isRu ? ruLocale : undefined })}
                <span className="text-muted-foreground">
                  ({formatDistanceToNow(expiresAt, { addSuffix: true, locale: isRu ? ruLocale : undefined })})
                </span>
              </span>
            </Field>
            {row.contacted_at && (
              <Field label={isRu ? 'На связи с' : 'Contacted at'}>
                <span>{format(parseISO(row.contacted_at), 'd MMM, HH:mm', { locale: isRu ? ruLocale : undefined })}</span>
              </Field>
            )}
            {row.confirmed_at && (
              <Field label={isRu ? 'Подтверждено' : 'Confirmed at'}>
                <span>{format(parseISO(row.confirmed_at), 'd MMM, HH:mm', { locale: isRu ? ruLocale : undefined })}</span>
              </Field>
            )}
          </div>

          {row.rejected_reason && (
            <>
              <Separator />
              <Field label={isRu ? 'Причина отклонения' : 'Rejection reason'}>
                <p className="text-sm p-2.5 rounded-none bg-destructive/5 text-destructive">{row.rejected_reason}</p>
              </Field>
            </>
          )}

          {row.proof_file_path && (
            <>
              <Separator />
              <Field label={isRu ? 'Чек / подтверждение' : 'Proof'}>
                {proofUrl ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    {isRu ? 'Открыть файл' : 'Open file'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {isRu ? 'Загрузка ссылки…' : 'Loading link…'}
                  </span>
                )}
              </Field>
            </>
          )}
        </div>

        {/* Action footer */}
        {isActionable && (
          <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-background border-t flex flex-wrap gap-2">
            {row.status === 'awaiting_admin' && (
              <Button size="sm" variant="outline" onClick={onMarkContacted} className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isRu ? 'Связался' : 'Contacted'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={onConfirm}
              className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isRu ? 'Подтвердить оплату' : 'Confirm payment'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="gap-1.5 text-destructive hover:text-destructive border-destructive/30"
            >
              <XCircle className="w-3.5 h-3.5" />
              {isRu ? 'Отклонить' : 'Reject'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
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
