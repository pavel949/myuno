import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { Button } from '@/components/ui/button';
import { servicePriceLabel as formatServicePrice } from '@/lib/services/servicePresentation';
import { pickLang } from '@/lib/i18n/pickLang';

interface OrderReceipt {
  id: string;
  customer_user_id: string;
  order_number: string | null;
  total_amount: number;
  currency: string | null;
  status: string;
  start_at: string | null;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A saved order receipt is distinct from payment or provider confirmation. */
export default function ServiceOrderSuccess() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const actorId = user?.id;
  const { language } = useLanguage();
  const L = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const stateId = (location.state as { orderId?: unknown } | null)?.orderId;
  const suppliedOrderId = params.get('order_id') ?? (typeof stateId === 'string' ? stateId : null);
  const orderId = suppliedOrderId && uuid.test(suppliedOrderId) ? suppliedOrderId.toLowerCase() : suppliedOrderId;
  const sessionId = params.get('session_id');
  const validLookup = !!((orderId && uuid.test(orderId)) || (!orderId && sessionId && sessionId.length <= 250));
  const identity = JSON.stringify([actorId, orderId, sessionId]);
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<{ identity: string; order: OrderReceipt | null; failed: boolean; loading: boolean }>({ identity, order: null, failed: false, loading: true });
  const current = snapshot.identity === identity ? snapshot : null;
  const order = current?.order ?? null;
  const loading = !!actorId && validLookup && (!current || current.loading);

  // The saved identifier survives reload without relying on ephemeral router state.
  useEffect(() => {
    if (!params.has('order_id') && orderId && uuid.test(orderId)) {
      const next = new URLSearchParams(params); next.set('order_id', orderId); navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace: true, state: location.state });
    }
  }, [orderId, params, navigate, location.pathname, location.hash, location.state]);

  useEffect(() => {
    let active = true;
    setSnapshot({ identity, order: null, failed: false, loading: !!actorId && validLookup });
    if (!actorId || !validLookup) return () => { active = false; };
    void (async () => {
      try {
        let query = supabase.from('orders').select('id,customer_user_id,order_number,total_amount,currency,status,start_at').eq('order_type', 'service').eq('customer_user_id', actorId).is('deleted_at', null);
        query = orderId ? query.eq('id', orderId) : query.filter('metadata->>stripe_session_id', 'eq', sessionId!);
        const { data, error } = await query.maybeSingle();
        if (!active) return;
        if (error || !data || data.customer_user_id !== actorId || !uuid.test(data.id) || (orderId && data.id.toLowerCase() !== orderId)) {
          setSnapshot({ identity, order: null, failed: true, loading: false }); return;
        }
        setSnapshot({ identity, order: data as OrderReceipt, failed: false, loading: false });
      } catch {
        if (active) setSnapshot({ identity, order: null, failed: true, loading: false });
      }
    })();
    return () => { active = false; };
  }, [identity, actorId, orderId, sessionId, validLookup, retry]);

  return <AppLayout showHeader={false}><PageShell width="narrow" className="space-y-4">
    {loading ? <p role="status">{L('Проверяем сохранённый заказ…', 'Checking the saved order…', 'กำลังตรวจสอบคำสั่งซื้อ…')}</p>
      : order ? <section aria-labelledby="service-receipt-title" className="space-y-3 border border-border bg-card p-4">
        <h1 id="service-receipt-title" className="font-display text-h2">{L('Заказ сохранён', 'Order saved', 'บันทึกคำสั่งซื้อแล้ว')}</h1>
        <p>{L('Сохранение заказа не подтверждает оплату, исполнителя или время оказания услуги.', 'Saving the order does not confirm payment, provider or service time.', 'การบันทึกคำสั่งซื้อไม่ได้ยืนยันการชำระเงิน ผู้ให้บริการ หรือเวลาให้บริการ')}</p>
        {order.order_number && <p>{L('Номер заказа', 'Order number', 'หมายเลขคำสั่งซื้อ')}: {order.order_number}</p>}
        <p>{L('Статус', 'Status', 'สถานะ')}: {order.status}</p>
        <p>{formatServicePrice(order.total_amount, order.currency, language)}</p>
        {order.start_at && <p>{new Date(order.start_at).toLocaleString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'Asia/Bangkok' })} · {L('Пхукет', 'Phuket', 'ภูเก็ต')}</p>}
      </section>
        : <section className="space-y-3"><h1 className="font-display text-h2">{L('Результат пока не подтверждён', 'Result not confirmed', 'ยังไม่ยืนยันผลลัพธ์')}</h1>
          <p role="alert">{!user ? L('Войдите, чтобы проверить свой заказ.', 'Sign in to check your order.', 'เข้าสู่ระบบเพื่อตรวจสอบคำสั่งซื้อของคุณ') : L('Не удалось подтвердить сохранённый заказ. Повторите проверку; не создавайте новую заявку до уточнения результата.', 'The saved order could not be confirmed. Retry checking before creating another request.', 'ยังยืนยันคำสั่งซื้อไม่ได้ โปรดตรวจสอบอีกครั้งก่อนสร้างคำขอใหม่')}</p>
          {user && validLookup && <Button onClick={() => setRetry(n => n + 1)}>{L('Проверить ещё раз', 'Check again', 'ตรวจสอบอีกครั้ง')}</Button>}
        </section>}
    <div className="flex flex-wrap gap-2"><Button asChild><Link to="/bookings">{L('Мои заказы', 'My orders', 'คำสั่งซื้อของฉัน')}</Link></Button><Button variant="outline" asChild><Link to="/discover/services">{L('К услугам', 'Browse services', 'ดูบริการ')}</Link></Button></div>
  </PageShell></AppLayout>;
}
