import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { readCheckoutReturnHint } from '@/hooks/useStripeUnifiedCheckout';

// Customer presentation of canonical orders only. useOrderTracking is not a
// substitute: it selects *, has an actor-free cache key, and subscribes to realtime.
// Neither this read nor a checkout-return URL proves payment or service capacity.
export interface ReturnOrder {
  id: string;
  order_number: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  start_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  order_items?: Array<{ item_name: string; qty: number; unit_price: number }>;
  order_addresses?: Array<{ address_type: string; address_text: string }>;
  order_participants?: Array<{ name: string; phone: string | null }>;
}
type ReadPhase = 'loading' | 'ready' | 'error' | 'missing' | 'signed_out';
const BASE_FIELDS = 'id, order_number, status, total_amount, currency, start_at, metadata, created_at';
const PENDING = ['draft', 'pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit'];

export function useOrderReturnRead(options: {
  orderTypes: readonly string[];
  orderId?: string | null;
  orderNumber?: string | null;
  sessionId?: string | null;
  legacySessionMetadata?: boolean;
  children?: 'items' | 'transfer';
}) {
  const { user, isLoading: authLoading } = useAuth();
  const actorId = user?.id;
  const { orderId, orderNumber, sessionId, legacySessionMetadata = false, children } = options;
  const selectorId = orderId || readCheckoutReturnHint(actorId, sessionId ?? null);
  const typesKey = options.orderTypes.join('|');
  const fields = BASE_FIELDS + (children === 'items' ? ', order_items(item_name, qty, unit_price)'
    : children === 'transfer' ? ', order_addresses(address_type, address_text), order_participants(name, phone)' : '');
  const readKey = JSON.stringify([actorId, selectorId, orderNumber, sessionId, legacySessionMetadata, typesKey, fields]);
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; phase: ReadPhase; row: ReturnOrder | null }>({ key: '', phase: 'loading', row: null });
  const current = snapshot.key === readKey ? snapshot : { phase: 'loading' as const, row: null };

  useEffect(() => {
    let stopped = false, attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined, deadline: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const publish = (phase: ReadPhase, row: ReturnOrder | null = null) => { if (!stopped) setSnapshot({ key: readKey, phase, row }); };
    publish('loading');
    const poll = async () => {
      try {
        deadline = setTimeout(() => { publish('error'); stopped = true; controller.abort(); }, 10000);
        let query = supabase.from('orders').select(fields)
          .eq('customer_user_id', actorId).in('order_type', typesKey.split('|'));
        // A selector never grants authority. No raw OR filters or broad fallback.
        query = selectorId ? query.eq('id', selectorId)
          : orderNumber ? query.eq('order_number', orderNumber)
          : query.filter('metadata->>stripe_session_id', 'eq', sessionId!);
        const { data, error } = await query.abortSignal(controller.signal).maybeSingle();
        clearTimeout(deadline);
        if (stopped) return;
        if (error) { publish('error'); return; }
        const row = data as unknown as ReturnOrder | null;
        if (row && typeof row.id !== 'string') { publish('error'); return; }
        if (row) {
          publish('ready', row);
          if (!PENDING.includes(row.status ?? '')) return;
        }
        if (++attempts < 10) timer = setTimeout(poll, 2000);
        else if (!row) publish('missing');
      } catch { clearTimeout(deadline); publish('error'); }
    };
    if (authLoading) { /* No privileged read until auth is resolved. */ }
    else if (!actorId) publish('signed_out');
    else if (!typesKey || (!selectorId && !orderNumber && !(legacySessionMetadata && sessionId))) publish('missing');
    else void poll();
    return () => { stopped = true; clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [actorId, authLoading, selectorId, orderNumber, sessionId, legacySessionMetadata, typesKey, fields, readKey, retry]);

  const order = current.row;
  const confirmed = !!order && ['confirmed', 'in_progress', 'completed'].includes(order.status ?? '');
  const pending = !!order && PENDING.includes(order.status ?? '');
  const title = confirmed
    ? order.status === 'completed' ? { ru: 'Статус заказа: завершён.', en: 'Order status: completed.' }
      : order.status === 'in_progress' ? { ru: 'Статус заказа: выполняется.', en: 'Order status: in progress.' }
      : { ru: 'Статус заказа: подтверждён.', en: 'Order status: confirmed.' }
    : pending ? { ru: 'Ожидаем подтверждения заказа.', en: 'Order confirmation pending.' }
    : order?.status === 'cancelled' ? { ru: 'Статус заказа: отменён.', en: 'Order status: cancelled.' }
    : order?.status === 'refunded' ? { ru: 'Статус заказа: возврат.', en: 'Order status: refunded.' }
    : order?.status === 'expired' ? { ru: 'Статус заказа: истёк.', en: 'Order status: expired.' }
    : order?.status === 'disputed' ? { ru: 'Статус заказа: спор.', en: 'Order status: disputed.' }
    : current.phase === 'signed_out' ? { ru: 'Войдите, чтобы проверить заказ.', en: 'Sign in to check your order.' }
    : current.phase === 'error' ? { ru: 'Не удалось проверить заказ.', en: 'Could not check your order.' }
    : { ru: 'Статус заказа не подтверждён.', en: 'Order status not verified.' };
  const canRetry = !!actorId && !!(selectorId || orderNumber || (legacySessionMetadata && sessionId));
  return { order, confirmed, pending, isLoading: authLoading || current.phase === 'loading', phase: current.phase,
    status: { title, tone: confirmed ? 'success' as const : 'neutral' as const,
      onRetry: canRetry ? () => setRetry(value => value + 1) : undefined } };
}
