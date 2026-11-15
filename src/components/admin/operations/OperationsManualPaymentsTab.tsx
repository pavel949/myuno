import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, MessageCircle, CheckCircle2, XCircle, Clock,
  Phone, Mail, Wallet, AlertTriangle, ExternalLink, Upload, Copy, FileText, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { applyManualPaymentQueue, parseManualPaymentFilter, parseQueuePage, type ManualPaymentFilter } from '@/lib/adminDashboardQueues';
import { pickLang } from '@/lib/i18n/pickLang';

type Status = 'awaiting_admin' | 'contacted' | 'paid' | 'confirmed' | 'rejected' | 'expired';

export interface RequestRow {
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
  orders: { total_amount: number; currency: string; order_number: string | null; metadata: Record<string, any> | null } | null;
}

const STATUS_FILTERS: { id: ManualPaymentFilter; en: string; ru: string }[] = [
  { id: 'all', en: 'All', ru: 'Все' },
  { id: 'review', en: 'Needs review', ru: 'Требуют проверки' },
  { id: 'awaiting_admin', en: 'Awaiting', ru: 'Ожидает' },
  { id: 'contacted', en: 'Contacted', ru: 'На связи' },
  { id: 'paid', en: 'Paid', ru: 'Оплачено' },
  { id: 'confirmed', en: 'Confirmed', ru: 'Подтв.' },
  { id: 'rejected', en: 'Rejected', ru: 'Отклон.' },
  { id: 'expired', en: 'Expired', ru: 'Истёк' },
];

const STATUS_BADGE: Record<Status, { en: string; ru: string; cls: string }> = {
  awaiting_admin: { en: 'Awaiting admin', ru: 'Ожидает админа', cls: 'bg-warning/10 text-warning border-warning/20' },
  contacted:      { en: 'Contacted',      ru: 'На связи',       cls: 'bg-primary/10 text-primary border-primary/20' },
  paid:           { en: 'Paid',           ru: 'Оплачено',       cls: 'bg-primary/10 text-primary border-primary/40' },
  confirmed:      { en: 'Confirmed',      ru: 'Подтверждено',   cls: 'bg-success/10 text-success border-success/20' },
  rejected:       { en: 'Rejected',       ru: 'Отклонено',      cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  expired:        { en: 'Expired',        ru: 'Истекло',        cls: 'bg-muted text-muted-foreground' },
};

export function OperationsManualPaymentsTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const filter = parseManualPaymentFilter(params);
  const page = parseQueuePage(params, 'manual_page');
  const pageSize = 50;
  const setFilter = (value: ManualPaymentFilter) => setParams(previous => { const next = new URLSearchParams(previous); next.delete('manual_page'); if (value === 'all') next.delete('manual_status'); else next.set('manual_status', value); return next; });
  const setPage = (value: number) => setParams(previous => { const next = new URLSearchParams(previous); if (value===0) next.delete('manual_page'); else next.set('manual_page',String(value)); return next; });
  const [confirmTarget, setConfirmTarget] = useState<RequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<RequestRow | null>(null);

  const { data: result, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['manual-payment-requests', user?.id, filter, page],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      let q = supabase
        .from('manual_payment_requests')
        .select(`
          id, order_id, status, amount_listing, currency_listing, amount_rub_estimate, amount_rub_actual, payment_method_actual,
          guest_name, guest_phone, guest_email, hold_expires_at, rejected_reason, proof_file_path,
          created_at, contacted_at, confirmed_at, metadata,
          orders ( order_number, metadata, total_amount, currency )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(page*pageSize,(page+1)*pageSize-1);
      q = applyManualPaymentQueue(q, filter);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data || []) as unknown as RequestRow[], count };
    },
    refetchInterval: 30000,
  });
  const data = result?.rows;

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
            const c = error || isLoading ? undefined : f.id === filter ? result?.count : undefined;
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

      {error && <div role="alert" className="border border-destructive p-4">
        {pickLang(language, { en: 'Could not load payment requests. Results are unavailable.', ru: 'Не удалось загрузить запросы на оплату. Результаты недоступны.', th: 'โหลดคำขอชำระเงินไม่สำเร็จ ผลลัพธ์ไม่พร้อมใช้งาน' })}
        <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>{pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}</Button>
      </div>}
      {!error && !isLoading && <div className="flex flex-wrap items-center gap-3 py-3">
        <p role="status" className="text-sm">{pickLang(language,{en:'Matching requests',ru:'Подходящие запросы',th:'คำขอที่ตรงกัน'})}: {result?.count ?? pickLang(language,{en:'Count unavailable',ru:'Количество недоступно',th:'จำนวนไม่พร้อมใช้งาน'})} · {pickLang(language,{en:'Page',ru:'Страница',th:'หน้า'})} {page+1}</p>
        <Button variant="outline" disabled={page===0||isFetching} onClick={()=>setPage(page-1)}>{pickLang(language,{en:'Previous',ru:'Назад',th:'ก่อนหน้า'})}</Button>
        <Button variant="outline" disabled={isFetching||result?.count==null||(page+1)*pageSize>=result.count} onClick={()=>setPage(page+1)}>{pickLang(language,{en:'Next',ru:'Далее',th:'ถัดไป'})}</Button>
      </div>}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!error && !isLoading && rows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground space-y-2">
            <Wallet className="w-10 h-10 mx-auto opacity-40" />
            <p>{isRu ? 'Заявок нет' : 'No requests'}</p>
          </CardContent>
        </Card>
      )}

      {/* Desktop / tablet — table view */}
      {!error && rows.length > 0 && (
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
      {!error && rows.length > 0 && (
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
                className={cn('cursor-pointer transition-transform', isExpiringSoon && 'border-warning/40')}
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
  const isActionable = row.status === 'awaiting_admin' || row.status === 'contacted' || row.status === 'paid' || (row.status === 'confirmed' && row.metadata?.receipt_outcome === 'partial');

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

          {row.status === 'confirmed' && row.metadata?.receipt_outcome !== 'settled' && (
            <p className="text-sm p-3 border border-warning/40" role="status">
              {row.metadata?.receipt_outcome === 'partial'
                ? (isRu ? `Поступление учтено. Осталось оплатить: ${row.metadata.receipt_remaining_thb} THB.` : `Receipt recorded. Balance due: ${row.metadata.receipt_remaining_thb} THB.`)
                : (isRu ? 'Поступление требует сверки. Полная оплата не подтверждена.' : 'Receipt requires reconciliation. Full payment is unconfirmed.')}
            </p>
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
              {isRu ? 'Учесть поступление' : 'Record receipt'}
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
// requires an agreed FX rate and an immutable proof document.
// ──────────────────────────────────────────────────────────
export function ConfirmPaymentDialog({
  row, isRu, onClose, onDone,
}: { row: Pick<RequestRow, 'id' | 'amount_rub_estimate' | 'amount_listing' | 'orders'>; isRu: boolean; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState<string>('');
  const [fx, setFx] = useState('');
  const [total, setTotal] = useState(String(row.orders?.total_amount ?? row.amount_listing));
  const [reference, setReference] = useState('');
  const uploadedProof = useRef<{ file: File; path: string } | null>(null);
  const inFlight = useRef(false);
  const [method, setMethod] = useState<string>('sbp');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (inFlight.current) return;
    if (![amt, Number(fx), Number(total)].every(n => Number.isFinite(n) && n > 0) || reference.trim().length < 3 || !proofFile || !['image/jpeg', 'image/png', 'application/pdf'].includes(proofFile.type) || proofFile.size > 10 * 1024 * 1024) {
      toast.error(isRu ? 'Укажите сумму, курс, согласованную стоимость, номер документа и PDF/JPG/PNG до 10 МБ' : 'Enter amount, exchange rate, approved total, receipt reference and PDF/JPG/PNG up to 10 MB');
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    try {
      let proofPath = uploadedProof.current?.file === proofFile ? uploadedProof.current.path : null;
      if (!proofPath) {
        const ext = proofFile.type === 'application/pdf' ? 'pdf' : proofFile.type === 'image/png' ? 'png' : 'jpg';
        const path = `${row.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('manual_payment_proofs').upload(path, proofFile, { upsert: false });
        if (upErr) throw upErr;
        uploadedProof.current = { file: proofFile, path };
        proofPath = path;
      }

      const { data, error } = await supabase.functions.invoke('confirm-manual-payment', {
        body: {
          request_id: row.id,
          amount_rub_actual: amt,
          fx_rate_rub_per_thb: Number(fx),
          approved_total_thb: Number(total),
          receipt_reference: reference.trim(),
          payment_method: method,
          proof_file_path: proofPath,
        },
      });
      if (error) throw error;
      if (!data?.ok || !data.order_id || !['settled', 'partial', 'overpayment_requires_reconciliation', 'legacy_receipt_requires_reconciliation', 'recipient_requires_reconciliation', 'inventory_requires_reconciliation'].includes(data.outcome)) throw new Error(isRu ? 'Нет подтверждения. Проверьте заявку перед повтором.' : 'Acknowledgement missing. Check the request before retrying.');
      const message = data.outcome === 'settled' ? (isRu ? 'Оплата и бронирование подтверждены' : 'Payment and booking confirmed') : data.outcome === 'partial' ? (isRu ? `Поступление учтено. Остаток: ${data.remaining_thb} THB` : `Receipt recorded. Balance: ${data.remaining_thb} THB`) : (isRu ? 'Поступление учтено. Требуется отдельная сверка.' : 'Receipt recorded. Separate reconciliation required.');
      toast.success(message);
      onDone();
    } catch (e: any) {
      toast.error(isRu ? 'Не удалось подтвердить' : 'Confirmation failed', { description: e?.message });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Подтвердить поступление' : 'Confirm receipt'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="receipt-amount">{isRu ? 'Сумма получена (₽)' : 'Amount received (₽)'}</Label>
            <Input
              id="receipt-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="185000"
            />
          </div>
          <div>
            <Label htmlFor="receipt-fx">{isRu ? 'Курс: RUB за 1 THB (по согласованию)' : 'Agreed rate: RUB per 1 THB'}</Label>
            <Input id="receipt-fx" type="number" inputMode="decimal" value={fx} onChange={e => setFx(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="receipt-total">{isRu ? 'Согласованная полная стоимость (THB)' : 'Approved full order total (THB)'}</Label>
            <Input id="receipt-total" type="number" inputMode="decimal" value={total} onChange={e => setTotal(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="receipt-reference">{isRu ? 'Уникальный номер банковского документа' : 'Unique bank receipt reference'}</Label>
            <Input id="receipt-reference" value={reference} onChange={e => setReference(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label htmlFor="receipt-method">{isRu ? 'Способ оплаты' : 'Payment method'}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="receipt-method"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sbp">{isRu ? 'СБП' : 'SBP'}</SelectItem>
                <SelectItem value="ru_card">{isRu ? 'Карта РФ' : 'Russian card'}</SelectItem>
                <SelectItem value="cash">{isRu ? 'Наличные' : 'Cash'}</SelectItem>
                <SelectItem value="other">{isRu ? 'Другое' : 'Other'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="receipt-proof" className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              {isRu ? 'Документ (обязательно, до 10 МБ)' : 'Document (required, up to 10 MB)'}
            </Label>
            <Input
              id="receipt-proof"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
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
  isRu, onClose,
}: { row: RequestRow; isRu: boolean; onClose: () => void; onDone: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isRu ? 'Требуется отдельное решение' : 'Separate decision required'}</DialogTitle></DialogHeader>
        <p>{isRu ? 'Отмена бронирования и возврат требуют проверенной атомарной операции. Зафиксируйте решение для сверки; заявка и платёжные документы сохранены.' : 'Cancellation and refunds require a checked atomic operation. Record a reconciliation decision; the request and receipt evidence are preserved.'}</p>
        <DialogFooter><Button onClick={onClose}>{isRu ? 'Закрыть' : 'Close'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
