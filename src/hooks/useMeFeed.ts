/**
 * useMeFeed — universal "Лента действий" aggregator for /me.
 *
 * Combines four sources into a single prioritized list, mirroring the
 * Gosuslugi-style "Что нужно сделать" pattern (rule §13.1: every new
 * feature gated; this hook is consumed only inside /me).
 *
 *  - compliance_filings (status=pending, due_date soon) → high priority
 *  - notification_deliveries (read_at IS NULL)         → medium priority
 *  - orders (status=pending, customer is current user) → medium priority
 *  - concierge_journeys (latest)                       → personalised tail
 *
 * All errors are swallowed silently so a single failing source never blanks
 * the feed; missing tables are tolerated for forward compatibility.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FeedPriority = 'high' | 'medium' | 'low';
export type FeedSource =
  | 'compliance'
  | 'notification'
  | 'order'
  | 'booking'
  | 'journey';

export interface MeFeedItem {
  id: string;
  source: FeedSource;
  priority: FeedPriority;
  titleEn: string;
  titleRu: string;
  descriptionEn?: string;
  descriptionRu?: string;
  ctaPath?: string;
  ctaLabelEn?: string;
  ctaLabelRu?: string;
  dueAt?: string | null;
  createdAt: string;
}

const DAY = 24 * 60 * 60 * 1000;

function safeArray<T>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows : [];
}

async function fetchFeed(userId: string): Promise<MeFeedItem[]> {
  const horizon = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
  const items: MeFeedItem[] = [];

  // 1) Compliance — high priority
  try {
    const { data } = await supabase
      .from('compliance_filings')
      .select('id, obligation_code, due_date, status, created_at')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .lte('due_date', horizon)
      .order('due_date', { ascending: true })
      .limit(10);
    for (const r of safeArray(data)) {
      const code = (r.obligation_code as string) ?? 'compliance';
      items.push({
        id: `compliance-${r.id}`,
        source: 'compliance',
        priority: 'high',
        titleEn: `Compliance: ${code}`,
        titleRu: `Срок: ${code}`,
        descriptionEn: r.due_date ? `Due ${r.due_date}` : 'Action required',
        descriptionRu: r.due_date ? `До ${r.due_date}` : 'Требуется действие',
        ctaPath: '/me/documents',
        ctaLabelEn: 'Resolve',
        ctaLabelRu: 'Решить',
        dueAt: r.due_date,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
      });
    }
  } catch { /* silent */ }

  // 2) Unread notifications — medium
  try {
    const { data } = await supabase
      .from('notification_deliveries')
      .select('id, subject, body, channel, scheduled_for, created_at')
      .eq('user_id', userId)
      .is('read_at', null)
      .order('scheduled_for', { ascending: false })
      .limit(8);
    for (const r of safeArray(data)) {
      items.push({
        id: `notif-${r.id}`,
        source: 'notification',
        priority: 'medium',
        titleEn: (r.subject as string) ?? 'Notification',
        titleRu: (r.subject as string) ?? 'Уведомление',
        descriptionEn: (r.body as string) ?? undefined,
        descriptionRu: (r.body as string) ?? undefined,
        ctaPath: '/notifications',
        ctaLabelEn: 'Open',
        ctaLabelRu: 'Открыть',
        createdAt:
          (r.scheduled_for as string) ??
          (r.created_at as string) ??
          new Date().toISOString(),
      });
    }
  } catch { /* silent */ }

  // 3) Pending orders — medium
  try {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, order_type, total_amount, currency, status, created_at')
      .eq('customer_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(6);
    for (const r of safeArray(data)) {
      items.push({
        id: `order-${r.id}`,
        source: 'order',
        priority: 'medium',
        titleEn: `Pending payment: ${r.order_type}`,
        titleRu: `К оплате: ${r.order_type}`,
        descriptionEn: `${r.total_amount} ${r.currency}`,
        descriptionRu: `${r.total_amount} ${r.currency}`,
        ctaPath: '/me/payments',
        ctaLabelEn: 'Pay',
        ctaLabelRu: 'Оплатить',
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
      });
    }
  } catch { /* silent */ }

  // 4) Latest concierge journey — low (personal recommendations)
  try {
    const { data } = await supabase
      .from('concierge_journeys')
      .select('id, primary_cta, reasoning, created_at, recommended_routes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    const j = safeArray(data)[0];
    if (j) {
      items.push({
        id: `journey-${j.id}`,
        source: 'journey',
        priority: 'low',
        titleEn: 'Your concierge plan',
        titleRu: 'Ваш план',
        descriptionEn: (j.reasoning as string) ?? 'Personalised routes ready',
        descriptionRu: (j.reasoning as string) ?? 'Персональные маршруты готовы',
        ctaPath: (j.primary_cta as string) || '/me/services',
        ctaLabelEn: 'View',
        ctaLabelRu: 'Открыть',
        createdAt: (j.created_at as string) ?? new Date().toISOString(),
      });
    }
  } catch { /* silent */ }

  // Sort by priority then date
  const order: Record<FeedPriority, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => {
    const p = order[a.priority] - order[b.priority];
    if (p !== 0) return p;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return items;
}

export function useMeFeed() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['me-feed', user?.id ?? null],
    queryFn: () => (user ? fetchFeed(user.id) : Promise.resolve([] as MeFeedItem[])),
    enabled: !!user,
    staleTime: 60_000,
  });
}
