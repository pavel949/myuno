import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CrossSellRecommendations } from '@/components/orders/CrossSellRecommendations';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

type ReadPhase = 'loading' | 'ready' | 'error' | 'missing' | 'signed_out';

interface OrderRow {
  id: string;
  order_number: string | null;
  status: string;
  total_amount: number;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const VERTICAL_PATHS: Record<string, { en: string; ru: string; path: string }> = {
  beauty: { en: 'Beauty & Spa', ru: 'Красота и СПА', path: '/beauty' },
  fitness: { en: 'Fitness', ru: 'Фитнес', path: '/fitness' },
  medical: { en: 'Medical', ru: 'Медицина', path: '/medical' },
};

export default function WellnessOrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user, isLoading: authLoading } = useAuth();
  const actorId = user?.id;

  const readKey = JSON.stringify([actorId, sessionId]);
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; phase: ReadPhase; row: OrderRow | null }>(
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
    const publish = (phase: ReadPhase, row: OrderRow | null = null) => {
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
        const query = supabase.from('orders')
          .select('id, order_number, status, total_amount, currency, metadata, created_at, payment_intents!inner(provider_ref)')
          .eq('customer_user_id', actorId)
          .in('order_type', ['beauty', 'fitness', 'medical'])
          .eq('payment_intents.provider_ref', sessionId!);
        const { data, error } = await query.abortSignal(controller.signal).maybeSingle();
        clearTimeout(deadline);
        if (stopped) return;
        if (error) { publish('error'); return; }
        const row = data as unknown as OrderRow | null;
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
    else if (!sessionId) publish('missing');
    else void poll();
    return () => { stopped = true; clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [actorId, authLoading, sessionId, readKey, retry]);

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

  const vertical = typeof order?.metadata?.vertical === 'string' ? order.metadata.vertical : undefined;
  const info = vertical ? VERTICAL_PATHS[vertical] : undefined;

  const details = order ? (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{isRu ? 'Сумма' : 'Amount'}</span>
        <span className="font-semibold">
          {order.total_amount?.toLocaleString()} {order.currency}
        </span>
      </div>
      {info && <div className="flex justify-between">
        <span className="text-muted-foreground">{isRu ? 'Категория' : 'Category'}</span>
        <span>{isRu ? info.ru : info.en}</span>
      </div>}
    </div>
  ) : null;

  return (
    <UnifiedSuccessLayout
      isLoading={loading}
      status={{ title, tone: confirmed ? 'success' : 'neutral',
        onRetry: actorId && sessionId ? () => setRetry(value => value + 1) : undefined }}
      hideWhatsApp={!order}
      orderNumber={order?.order_number || undefined}
      note={{
        ru: 'Статус относится к заказу. Время и исполнитель услуги требуют отдельного подтверждения.',
        en: 'This is the order status. Service time and provider require separate confirmation.',
      }}
      details={details}
      extras={confirmed ? <CrossSellRecommendations orderType="wellness" /> : undefined}
      primaryHref="/bookings"
      secondaryHref={info?.path || '/services'}
      secondaryLabel={{
        ru: info ? `К разделу ${info.ru}` : 'К услугам',
        en: info ? `Browse ${info.en}` : 'Browse services',
      }}
    />
  );
}
