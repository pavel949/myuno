/**
 * usePostOrderReview — checks if user has completed orders pending review
 * Uses React Query for deduplication and caching
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

interface PendingReview {
  orderId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  completedAt: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function findPendingReview(userId: string): Promise<PendingReview | null> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, vertical, updated_at, order_items(item_name, product_id, resource_id)')
    .eq('customer_user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', sevenDaysAgo)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (!orders?.length) return null;

  for (const order of orders) {
    const key = `reviewed-order-${order.id}`;
    if (localStorage.getItem(key)) continue;

    const firstItem = order.order_items?.[0];
    const entityId = firstItem?.product_id || firstItem?.resource_id || order.id;

    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('item_id', entityId);

    if (!count || count === 0) {
      return {
        orderId: order.id,
        entityType: order.vertical || 'service',
        entityId,
        entityName: firstItem?.item_name || '',
        completedAt: order.updated_at,
      };
    }
  }

  return null;
}

export function usePostOrderReview() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: pendingReview = null } = useQuery({
    queryKey: ['post-order-review', user?.id],
    queryFn: async () => {
      const result = await findPendingReview(user!.id);
      if (result) {
        setTimeout(() => setIsOpen(true), 2000);
      }
      return result;
    },
    enabled: !!user,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  const dismiss = () => {
    setIsOpen(false);
    if (pendingReview) {
      localStorage.setItem(`reviewed-order-${pendingReview.orderId}`, 'skipped');
    }
  };

  return { pendingReview, isOpen, setIsOpen, dismiss };
}
