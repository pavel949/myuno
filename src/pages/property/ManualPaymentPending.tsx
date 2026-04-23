import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, MessageCircle, Loader2, Home, AlertCircle, FileCheck2, XCircle } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';

interface ManualPaymentRequestRow {
  id: string;
  order_id: string;
  status: string;
  amount_listing: number;
  currency_listing: string;
  amount_rub_estimate: number | null;
  hold_expires_at: string;
  guest_name: string;
  rejected_reason: string | null;
}

interface OrderRow {
  order_number: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Success/pending screen shown after the guest submits a manual-RUB payment request.
 * Replaces the Stripe redirect for that channel.
 *
 * - Shows order summary and what to expect from the manager
 * - WhatsApp deep-link with prefilled message
 * - Realtime subscription to `manual_payment_requests` so the screen flips
 *   to "Confirmed" / "Rejected" the moment the admin acts in the dashboard.
 */
export default function ManualPaymentPending() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [request, setRequest] = useState<ManualPaymentRequestRow | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const [{ data: req }, { data: ord }] = await Promise.all([
        supabase
          .from('manual_payment_requests')
          .select('id, order_id, status, amount_listing, currency_listing, amount_rub_estimate, hold_expires_at, guest_name, rejected_reason')
          .eq('order_id', orderId)
          .maybeSingle(),
        supabase
          .from('orders')
          .select('order_number, metadata')
          .eq('id', orderId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setRequest((req as ManualPaymentRequestRow | null) ?? null);
      setOrder((ord as OrderRow | null) ?? null);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  // Realtime — flip the UI as soon as admin confirms or rejects.
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`manual_payment_requests:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'manual_payment_requests',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as ManualPaymentRequestRow;
          setRequest(next);
          if (next.status === 'confirmed') {
            toast.success(isRu ? 'Оплата подтверждена!' : 'Payment confirmed!');
          } else if (next.status === 'rejected') {
            toast.error(isRu ? 'Заявка отклонена' : 'Request rejected');
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, isRu]);

  const orderMeta = (order?.metadata || {}) as Record<string, any>;
  const propertyTitle: string = orderMeta.property_title || (isRu ? 'Объект' : 'Property');
  const guests: number = Number(orderMeta.guests || 0);
  const nights: number = Number(orderMeta.nights || 0);

  const whatsappMessage = useMemo(() => {
    const num = order?.order_number || orderId?.slice(0, 8) || '';
    return isRu
      ? `Здравствуйте! Я отправил(а) заявку на оплату в рублях, заявка #${num}. Жду реквизиты для оплаты.`
      : `Hi! I just submitted a Russian-Ruble payment request, ref #${num}. Could you send me the payment details?`;
  }, [order?.order_number, orderId, isRu]);

  const whatsappUrl = `${COMPANY_CONTACTS.whatsapp.link}?text=${encodeURIComponent(whatsappMessage)}`;

  const copyOrderNumber = () => {
    const num = order?.order_number || orderId || '';
    navigator.clipboard.writeText(num).then(
      () => toast.success(isRu ? 'Скопировано' : 'Copied'),
      () => toast.error(isRu ? 'Не удалось скопировать' : 'Could not copy'),
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request || !order) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-display font-bold">
          {isRu ? 'Заявка не найдена' : 'Request not found'}
        </h1>
        <Button onClick={() => navigate('/')} variant="outline">
          <Home className="w-4 h-4 mr-2" />
          {isRu ? 'На главную' : 'Go home'}
        </Button>
      </div>
    );
  }

  // === Status-driven hero ===
  const isConfirmed = request.status === 'confirmed';
  const isRejected = request.status === 'rejected';
  const isExpired = request.status === 'expired';
  const isAwaiting = !isConfirmed && !isRejected && !isExpired;

  const holdExpiresAt = parseISO(request.hold_expires_at);
  const expiresInLabel = formatDistanceToNow(holdExpiresAt, {
    addSuffix: true,
    locale: isRu ? ruLocale : undefined,
  });

  return (
    <div className="pb-12">
        <div className="sticky top-0 z-20 bg-background/95 border-b">
          <div className="flex items-center gap-4 p-4">
            <BackButton fallbackPath="/" variant="ghost" />
            <h1 className="text-lg font-display font-bold">
              {isRu ? 'Оплата в рублях' : 'Russian-Ruble payment'}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-5 max-w-xl mx-auto">
          {/* === Status hero === */}
          {isConfirmed && (
            <Card className="border-success/40 bg-success/5">
              <CardContent className="p-5 flex items-start gap-3">
                <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg">
                    {isRu ? 'Оплата подтверждена!' : 'Payment confirmed!'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Бронирование подтверждено. Ваучер отправлен на email.'
                      : 'Your booking is confirmed. Voucher sent to email.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isRejected && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-5 flex items-start gap-3">
                <XCircle className="w-8 h-8 text-destructive shrink-0" />
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg">
                    {isRu ? 'Заявка отклонена' : 'Request rejected'}
                  </h2>
                  {request.rejected_reason && (
                    <p className="text-sm text-muted-foreground">{request.rejected_reason}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isExpired && (
            <Card className="border-muted bg-muted/30">
              <CardContent className="p-5 flex items-start gap-3">
                <Clock className="w-8 h-8 text-muted-foreground shrink-0" />
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg">
                    {isRu ? 'Срок ожидания истёк' : 'Hold expired'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Даты освобождены. Если хотите забронировать снова — напишите нам.'
                      : 'Dates released. Reach out if you still want to book.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isAwaiting && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5 flex items-start gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg">
                    {isRu ? 'Заявка отправлена!' : 'Request submitted!'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRu
                      ? 'Менеджер myUNO свяжется с вами в течение 30 минут (9:00–22:00 ICT).'
                      : 'A myUNO manager will reach out within 30 minutes (9am–10pm ICT).'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* === Booking summary === */}
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Номер заявки' : 'Request #'}</span>
                <button
                  onClick={copyOrderNumber}
                  className="font-mono font-semibold flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  {order.order_number || orderId?.slice(0, 8)}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Объект' : 'Property'}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{propertyTitle}</span>
              </div>
              {nights > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Ночей' : 'Nights'}</span>
                  <span>{nights}</span>
                </div>
              )}
              {guests > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRu ? 'Гостей' : 'Guests'}</span>
                  <span>{guests}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">{isRu ? 'Полная сумма' : 'Total'}</span>
                <div className="text-right">
                  {request.amount_rub_estimate != null && (
                    <div className="font-semibold text-base">
                      ≈ {request.amount_rub_estimate.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {request.currency_listing} {request.amount_listing.toLocaleString()}
                  </div>
                </div>
              </div>
              {request.amount_rub_estimate != null && (
                <p className="text-[11px] text-muted-foreground italic">
                  {isRu
                    ? 'Финальная сумма уточняется по курсу на момент оплаты'
                    : 'Exact amount confirmed at the time of payment'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* === What's next (only while awaiting) === */}
          {isAwaiting && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">{isRu ? 'Что дальше' : 'What happens next'}</h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">1</span>
                    <span>{isRu ? 'Менеджер свяжется в WhatsApp / по email' : 'Manager contacts you on WhatsApp / email'}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">2</span>
                    <span>{isRu ? 'Получаете реквизиты СБП или карты РФ' : 'You receive SBP / Russian-card transfer details'}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">3</span>
                    <span>{isRu ? 'После оплаты подтверждаем бронь и присылаем ваучер' : 'After payment we confirm the booking and email the voucher'}</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* === Hold timer === */}
          {isAwaiting && (
            <div className="flex items-start gap-2 p-3 rounded-none bg-warning/5 border border-warning/20 text-xs text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0 text-warning mt-0.5" />
              <p>
                {isRu
                  ? `Даты заблокированы ${expiresInLabel}. Если оплата не поступит — бронирование автоматически отменится и даты освободятся.`
                  : `Dates are held ${expiresInLabel}. If payment doesn't arrive in time the booking is cancelled automatically and dates released.`}
              </p>
            </div>
          )}

          {/* === Actions === */}
          <div className="space-y-2">
            {isAwaiting && (
              <Button
                asChild
                size="lg"
                className="w-full h-12 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5" />
                  {isRu ? 'Открыть WhatsApp с менеджером' : 'Open WhatsApp with manager'}
                </a>
              </Button>
            )}
            {isConfirmed && user && (
              <Button
                size="lg"
                className="w-full h-12 gap-2"
                onClick={() => navigate(`/bookings/${orderId}`)}
              >
                <FileCheck2 className="w-5 h-5" />
                {isRu ? 'Открыть бронирование' : 'Open booking'}
              </Button>
            )}
            <Button variant="outline" size="lg" className="w-full h-12 gap-2" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
              {isRu ? 'На главную' : 'Back to home'}
            </Button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            {isRu
              ? 'Никогда не отправляйте оплату до получения официальных реквизитов от менеджера myUNO.'
              : 'Never send payment until you receive official details from a myUNO manager.'}
          </p>
        </div>
      </div>
  );
}
