import { getServiceRequestConfirmationNote, serviceRequestConfirmationNote } from '@/lib/services/serviceRequestCopy';
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Phone } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

type ReadPhase = 'loading' | 'ready' | 'error' | 'missing' | 'signed_out';

interface OrderData {
  id: string;
  order_number: string | null;
  total_amount: number;
  currency: string | null;
  status: string | null;
  start_at: string | null;
  metadata: {
    provider_name?: string;
    address?: string;
    contact_name?: string;
    contact_phone?: string;
    stripe_session_id?: string;
  } | null;
}

export default function ServiceOrderSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user, isLoading: authLoading } = useAuth();
  const actorId = user?.id;

  const sessionId = searchParams.get('session_id');
  const navState = (location.state as {
    functionName?: string;
    functionIcon?: string;
    orderId?: string;
    orderNumber?: string;
  } | null) || {};
  const { functionName, functionIcon, orderId: stateOrderId } = navState;

  const readKey = JSON.stringify([actorId, sessionId, stateOrderId]);
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; phase: ReadPhase; row: OrderData | null }>(
    { key: '', phase: 'loading', row: null },
  );
  // Hide previous actor/URL data during the render before the effect resets it.
  const current = snapshot.key === readKey ? snapshot : { phase: 'loading' as const, row: null };
  const order = current.row;
  const loading = authLoading || current.phase === 'loading';

  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const publish = (phase: ReadPhase, row: OrderData | null = null) => {
      if (!stopped) setSnapshot({ key: readKey, phase, row });
    };
    publish('loading');
    const poll = async () => {
      try {
        deadline = setTimeout(() => {
          publish('error');
          stopped = true;
          controller.abort();
        }, 10000);
        let query = supabase.from('orders')
          .select('id, order_number, total_amount, currency, status, start_at, metadata')
          .eq('customer_user_id', actorId).eq('order_type', 'service');
        query = stateOrderId ? query.eq('id', stateOrderId)
          : query.filter('metadata->>stripe_session_id', 'eq', sessionId!);
        const { data, error } = await query.abortSignal(controller.signal).maybeSingle();
        clearTimeout(deadline);
        if (stopped) return;
        if (error) { publish('error'); return; }
        const row = data as unknown as OrderData | null;
        if (row && typeof row.id !== 'string') { publish('error'); return; }
        if (row) {
          publish('ready', row);
          if (!['draft', 'pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit'].includes(row.status ?? '')) return;
        }
        if (++attempts < 10) timer = setTimeout(poll, 2000);
        else if (!row) publish('missing');
      } catch {
        clearTimeout(deadline);
        publish('error');
      }
    };
    if (authLoading) { /* wait for an actor before querying */ }
    else if (!actorId) publish('signed_out');
    else if (!(sessionId || stateOrderId)) publish('missing');
    else void poll();
    return () => { stopped = true; clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [actorId, authLoading, sessionId, stateOrderId, readKey, retry]);

  const confirmed = !!order && ['confirmed', 'in_progress', 'completed'].includes(order.status ?? '');
  const pending = !!order && ['draft', 'pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit'].includes(order.status ?? '');
  const title = confirmed
    ? (order.status === 'completed' ? { ru: 'Заказ завершён.', en: 'Order completed.' }
      : order.status === 'in_progress' ? { ru: 'Заказ выполняется.', en: 'Order in progress.' }
      : { ru: 'Заказ подтверждён.', en: 'Order confirmed.' })
    : pending ? { ru: 'Ожидаем подтверждения заказа.', en: 'Order confirmation pending.' }
    : current.phase === 'signed_out' ? { ru: 'Войдите, чтобы проверить заказ.', en: 'Sign in to check your order.' }
    : current.phase === 'error' ? { ru: 'Не удалось проверить заказ.', en: 'Could not check your order.' }
    : { ru: 'Статус заказа не подтверждён.', en: 'Order status not verified.' };

  const details = order ? (
    <div className="space-y-2 text-sm">
      {functionName && (
        <div className="flex items-center gap-2">
          {(() => { const Icon = resolveIcon(functionIcon); return <Icon className="w-4 h-4 text-muted-foreground shrink-0" />; })()}
          <span>{functionName}</span>
        </div>
      )}
      {order.metadata?.provider_name && (
        <div className="font-medium">{order.metadata.provider_name}</div>
      )}
      <div className="font-semibold">
        {order.total_amount?.toLocaleString()} {order.currency}
      </div>
      {order.start_at && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{format(new Date(order.start_at), 'dd MMM yyyy, HH:mm')}</span>
        </div>
      )}
      {order.metadata?.address && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="line-clamp-2">{order.metadata.address}</span>
        </div>
      )}
      {order.metadata?.contact_phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4 shrink-0" />
          <span>{order.metadata.contact_phone}</span>
        </div>
      )}
    </div>
  ) : functionName ? (
    <div className="flex items-center gap-2 text-sm">
      {(() => { const Icon = resolveIcon(functionIcon); return <Icon className="w-4 h-4 text-muted-foreground" />; })()}
      <span>{functionName}</span>
    </div>
  ) : null;

  const serviceLabel = order?.metadata?.provider_name || functionName;
  const whenStr = order?.start_at ? format(new Date(order.start_at), 'dd MMM yyyy, HH:mm') : '';
  const summaryRu = [serviceLabel && `Услуга: ${serviceLabel}`, whenStr && `Время: ${whenStr}`]
    .filter(Boolean).join(' · ');
  const summaryEn = [serviceLabel && `Service: ${serviceLabel}`, whenStr && `When: ${whenStr}`]
    .filter(Boolean).join(' · ');

  return (
    <UnifiedSuccessLayout
      isLoading={loading}
      status={{ title, tone: confirmed ? 'success' : 'neutral',
        onRetry: actorId && (sessionId || stateOrderId) ? () => setRetry(value => value + 1) : undefined }}
      hideWhatsApp={!order}
      orderNumber={order?.order_number || undefined}
      note={{
        ru: serviceRequestConfirmationNote.ru,
        en: getServiceRequestConfirmationNote(language),
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="service" /> : undefined}
      primaryHref={confirmed ? '/services' : '/bookings'}
      primaryLabel={confirmed ? { ru: 'Заказать ещё', en: 'Order more' } : { ru: 'Мои заказы', en: 'My orders' }}
      secondaryHref={confirmed ? '/bookings' : '/services'}
      secondaryLabel={confirmed ? { ru: 'Мои заказы', en: 'My orders' } : { ru: 'Вернуться в каталог', en: 'Back to catalog' }}
      totalAmount={order?.total_amount}
      currency={order?.currency || undefined}
      whatsappSummary={summaryRu || summaryEn ? { ru: summaryRu, en: summaryEn } : undefined}
    />
  );
}
