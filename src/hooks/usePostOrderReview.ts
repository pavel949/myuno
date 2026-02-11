/**
 * usePostOrderReview — checks if user has completed orders pending review
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PendingReview {
  orderId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  completedAt: string;
}

export function usePostOrderReview() {
  const { user } = useAuth();
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkPendingReviews = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get completed orders with their items
      const { data: orders } = await supabase
        .from('orders')
        .select('id, vertical, updated_at, order_items(item_name, product_id, resource_id)')
        .eq('customer_user_id', user.id)
        .eq('status', 'completed')
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!orders?.length) return;

      for (const order of orders) {
        const key = `reviewed-order-${order.id}`;
        if (localStorage.getItem(key)) continue;

        const firstItem = order.order_items?.[0];
        const entityId = firstItem?.product_id || firstItem?.resource_id || order.id;

        // Check if review exists
        const { count } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('item_id', entityId);

        if (!count || count === 0) {
          setPendingReview({
            orderId: order.id,
            entityType: order.vertical || 'service',
            entityId,
            entityName: firstItem?.item_name || '',
            completedAt: order.updated_at,
          });
          
          setTimeout(() => setIsOpen(true), 2000);
          return;
        }
      }
    };

    checkPendingReviews();
  }, [user]);

  const dismiss = () => {
    setIsOpen(false);
    if (pendingReview) {
      localStorage.setItem(`reviewed-order-${pendingReview.orderId}`, 'skipped');
    }
  };

  return { pendingReview, isOpen, setIsOpen, dismiss };
}
