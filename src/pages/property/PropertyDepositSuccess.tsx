import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Calendar, Check, Clock, Lock } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PageState } from '@/components/page/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { TripServicesGrid } from '@/components/property/TripServicesGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

const orderIdPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const outcomeTitle = {
  received: { ru: 'Предоплата получена', en: 'Deposit received', th: 'ได้รับเงินมัดจำแล้ว' },
  refunded: { ru: 'По заказу зарегистрирован возврат', en: 'Refund recorded for this order', th: 'มีบันทึกการคืนเงินสำหรับคำสั่งซื้อนี้' },
  cancelled: { ru: 'Заказ отменён', en: 'Order cancelled', th: 'ยกเลิกคำสั่งซื้อแล้ว' },
  failed: { ru: 'Оплата не прошла', en: 'Payment failed', th: 'ชำระเงินไม่สำเร็จ' },
  pending: { ru: 'Подтверждение оплаты ожидается', en: 'Payment confirmation pending', th: 'กำลังรอการยืนยันการชำระเงิน' },
};

async function readDepositReceipt(actorId: string, orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, status, currency, metadata')
    .eq('id', orderId)
    .eq('customer_user_id', actorId)
    .eq('order_type', 'property')
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) return null;

  const metadata = order.metadata;
  const deposit = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata.deposit_amount : null;
  if (typeof deposit !== 'number' || !Number.isFinite(deposit) || deposit <= 0 || !order.currency || !/^[A-Z]{3}$/.test(order.currency)) {
    return null;
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payment_intents')
    .select('amount, status')
    .eq('order_id', order.id)
    .eq('method', 'stripe')
    .eq('currency', order.currency)
    .eq('amount', deposit)
    .maybeSingle();
  if (paymentError) throw paymentError;

  return { id: order.id, number: order.order_number, status: order.status, currency: order.currency, payment };
}

export default function PropertyDepositSuccess() {
  const [params] = useSearchParams();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const rawOrderId = params.get('order_id') ?? '';
  const orderId = orderIdPattern.test(rawOrderId) ? rawOrderId : '';
  const actorId = user?.id ?? '';
  const receipt = useQuery({
    queryKey: ['property-deposit-receipt', actorId, orderId],
    queryFn: () => readDepositReceipt(actorId, orderId),
    enabled: Boolean(actorId && orderId),
    retry: false,
  });

  const trips = (
    <Button asChild variant="outline">
      <Link to={APP_ROUTES.BOOKINGS}>
        <Calendar className="size-4" aria-hidden="true" />
        {t('Мои поездки', 'My trips', 'ทริปของฉัน')}
      </Link>
    </Button>
  );

  if (authLoading || receipt.isLoading) {
    return (
      <div className="ds-frame ds-frame-form ds-page" role="status">
        <span className="sr-only">{t('Проверяем оплату', 'Checking payment', 'กำลังตรวจสอบการชำระเงิน')}</span>
        <div aria-hidden="true"><ContentSkeleton variant="card" count={2} /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <PageState
        heading="h1"
        icon={Lock}
        title={t('Войдите, чтобы проверить оплату', 'Sign in to check your payment', 'เข้าสู่ระบบเพื่อตรวจสอบการชำระเงิน')}
        description={t('Используйте аккаунт, с которого оформляли бронирование.', 'Use the account that made the booking.', 'ใช้บัญชีที่ทำการจอง')}
      >
        <Button className="self-start" asChild>
          <Link to={APP_ROUTES.AUTH} state={{ from: location.pathname + location.search }}>
            {t('Войти', 'Sign in', 'เข้าสู่ระบบ')}
          </Link>
        </Button>
      </PageState>
    );
  }

  if (receipt.isError || !receipt.data) {
    return (
      <PageState
        heading="h1"
        icon={AlertTriangle}
        tone="warning"
        announcement="alert"
        title={t('Не удалось проверить предоплату', 'Deposit status is unavailable', 'ไม่สามารถตรวจสอบสถานะเงินมัดจำได้')}
        description={t('Проверьте последнее состояние бронирования в разделе поездок.', 'Check the latest status in your trips.', 'ตรวจสอบสถานะล่าสุดในทริปของคุณ')}
      >
        <div className="flex flex-wrap gap-2">
          {receipt.isError && (
            <Button onClick={() => void receipt.refetch()} disabled={receipt.isFetching}>
              {t('Повторить', 'Try again', 'ลองอีกครั้ง')}
            </Button>
          )}
          {trips}
        </div>
      </PageState>
    );
  }

  const { id, number, status, currency, payment } = receipt.data;
  let outcome: keyof typeof outcomeTitle = 'pending';
  if (status === 'refunded') outcome = 'refunded';
  else if (payment?.status === 'failed') outcome = 'failed';
  else if (status === 'cancelled') outcome = 'cancelled';
  else if (payment?.status === 'succeeded') outcome = 'received';
  const showDeposit = outcome === 'received' && payment;
  const locale = language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB';

  return (
    <div className="ds-frame ds-frame-detail ds-page">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <PageState
          heading="h1"
          icon={showDeposit ? Check : outcome === 'pending' ? Clock : AlertTriangle}
          tone={showDeposit ? 'success' : 'warning'}
          announcement="status"
          title={pickLang(language, outcomeTitle[outcome])}
          description={outcome === 'pending'
            ? t('Проверьте статус ещё раз, если вы только что завершили оплату.', 'If you just completed payment, check the status again.', 'หากเพิ่งชำระเงินเสร็จ ให้ตรวจสอบสถานะอีกครั้ง')
            : t('Посмотрите актуальный статус бронирования на странице заказа.', 'Track your order for the latest booking status.', 'ติดตามคำสั่งซื้อเพื่อดูสถานะการจองล่าสุด')}
          compact
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={APP_ROUTES.ORDER_TRACKING(id)}>
                {t('Отследить заказ', 'Track order', 'ติดตามคำสั่งซื้อ')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            {trips}
            {outcome === 'pending' && (
              <Button variant="ghost" onClick={() => void receipt.refetch()} disabled={receipt.isFetching}>
                {t('Проверить статус', 'Check status', 'ตรวจสอบสถานะ')}
              </Button>
            )}
          </div>
        </PageState>
        {(number || showDeposit) && (
          <Card>
            <CardHeader>
              <CardTitle>{t('Детали оплаты', 'Payment details', 'รายละเอียดการชำระเงิน')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-body-sm">
                {number && (
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt>{t('Номер заказа', 'Order number', 'หมายเลขคำสั่งซื้อ')}</dt>
                    <dd className="font-semibold">{number}</dd>
                  </div>
                )}
                {showDeposit && (
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt>{t('Предоплата', 'Deposit paid', 'เงินมัดจำที่ชำระแล้ว')}</dt>
                    <dd className="font-semibold tabular-nums">{new Intl.NumberFormat(locale, { style: 'currency', currency }).format(showDeposit.amount)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
      {showDeposit && (
        <div className="mt-6">
          <TripServicesGrid variant="compact" maxItems={6} bookingId={id} />
        </div>
      )}
    </div>
  );
}
