import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserContext } from './useUserContext';
import { useMemo } from 'react';
import { isToday, isFuture, isPast, startOfMonth, endOfMonth } from 'date-fns';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  resource_id: string | null;
  product_name: string | null;
  qty: number;
  unit_price: number;
  amount: number;
  status: string;
}

interface Order {
  id: string;
  order_number: string;
  order_type: string;
  customer_user_id: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  total_amount: number;
  currency: string;
  created_at: string;
  metadata: Record<string, unknown>;
  items: OrderItem[];
}

interface ResourceRow {
  id: string;
}

interface OrderItemWithOrder {
  id: string;
  order_id: string;
  product_id: string | null;
  resource_id: string | null;
  product_name: string | null;
  qty: number;
  unit_price: number;
  amount: number;
  status: string;
  created_at: string;
  orders: {
    id: string;
    order_number: string;
    order_type: string;
    customer_user_id: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    total_amount: number;
    currency: string;
    created_at: string;
    metadata: Record<string, unknown> | null;
  };
}

export function useOwnerOrders() {
  const { activeOrgId, activeRole } = useUserContext();

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['owner-orders', activeOrgId],
    queryFn: async (): Promise<Order[]> => {
      if (!activeOrgId || activeRole !== 'owner') {
        return [];
      }

      // Query resources owned by this organization
      // Note: These tables exist but may not be in auto-generated types
      const { data: resources, error: resourcesError } = await supabase
        .from('resources' as never)
        .select('id')
        .eq('owner_org_id', activeOrgId) as { data: ResourceRow[] | null; error: Error | null };

      if (resourcesError || !resources || resources.length === 0) {
        return [];
      }

      const resourceIds = resources.map(r => r.id);

      // Get order items linked to owned resources
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items' as never)
        .select(`
          id,
          order_id,
          product_id,
          resource_id,
          product_name,
          qty,
          unit_price,
          amount,
          status,
          created_at,
          orders!inner (
            id,
            order_number,
            order_type,
            customer_user_id,
            status,
            start_at,
            end_at,
            total_amount,
            currency,
            created_at,
            metadata
          )
        `)
        .in('resource_id', resourceIds)
        .order('created_at', { ascending: false }) as { data: OrderItemWithOrder[] | null; error: Error | null };

      if (itemsError) throw itemsError;

      // Extract unique orders
      const ordersMap = new Map<string, Order>();
      (orderItems || []).forEach((item) => {
        const orderData = item.orders;
        if (orderData && !ordersMap.has(orderData.id)) {
          ordersMap.set(orderData.id, {
            id: orderData.id,
            order_number: orderData.order_number,
            order_type: orderData.order_type,
            customer_user_id: orderData.customer_user_id,
            status: orderData.status,
            start_at: orderData.start_at,
            end_at: orderData.end_at,
            total_amount: orderData.total_amount,
            currency: orderData.currency,
            created_at: orderData.created_at,
            metadata: orderData.metadata || {},
            items: []
          });
        }
        if (orderData) {
          ordersMap.get(orderData.id)!.items.push({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            resource_id: item.resource_id,
            product_name: item.product_name,
            qty: item.qty,
            unit_price: item.unit_price,
            amount: item.amount,
            status: item.status,
          });
        }
      });

      return Array.from(ordersMap.values());
    },
    enabled: !!activeOrgId && activeRole === 'owner',
    staleTime: 30000, // Cache for 30 seconds
  });

  // Computed values
  const activeOrders = useMemo(() => {
    return orders?.filter(o => {
      const startDate = o.start_at ? new Date(o.start_at) : null;
      const endDate = o.end_at ? new Date(o.end_at) : null;
      
      return o.status === 'confirmed' && 
             startDate && endDate &&
             isPast(startDate) && isFuture(endDate);
    }) || [];
  }, [orders]);

  const upcomingOrders = useMemo(() => {
    return orders?.filter(o => {
      const startDate = o.start_at ? new Date(o.start_at) : null;
      return o.status === 'confirmed' && startDate && isFuture(startDate);
    }).sort((a, b) => 
      new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime()
    ) || [];
  }, [orders]);

  const todayCheckIns = useMemo(() => {
    return orders?.filter(o => {
      const startDate = o.start_at ? new Date(o.start_at) : null;
      return startDate && isToday(startDate) && o.status === 'confirmed';
    }) || [];
  }, [orders]);

  const todayCheckOuts = useMemo(() => {
    return orders?.filter(o => {
      const endDate = o.end_at ? new Date(o.end_at) : null;
      return endDate && isToday(endDate) && o.status === 'confirmed';
    }) || [];
  }, [orders]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let monthlyRevenue = 0;
    let totalRevenue = 0;

    orders?.forEach(order => {
      if (order.status === 'confirmed' || order.status === 'completed') {
        const orderAmount = order.total_amount || 0;
        totalRevenue += orderAmount;

        const orderDate = new Date(order.created_at);
        if (orderDate >= monthStart && orderDate <= monthEnd) {
          monthlyRevenue += orderAmount;
        }
      }
    });

    return {
      totalOrders: orders?.length || 0,
      activeCount: activeOrders.length,
      upcomingCount: upcomingOrders.length,
      monthlyRevenue,
      totalRevenue,
    };
  }, [orders, activeOrders, upcomingOrders]);

  return {
    orders: orders || [],
    activeOrders,
    upcomingOrders,
    todayCheckIns,
    todayCheckOuts,
    stats,
    isLoading,
    error,
    refetch,
  };
}
