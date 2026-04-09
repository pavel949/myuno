import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ServiceOrder {
  id: string;
  order_number: string;
  booking_id: string | null;
  property_id: string | null;
  guest_id: string;
  provider_id: string | null;
  assigned_to: string | null;
  service_type: string;
  service_name: string;
  service_name_ru: string | null;
  description: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  amount: number | null;
  currency: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  notes: string | null;
  completion_notes: string | null;
  completion_photos: string[] | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title_en: string;
    title_ru: string;
    address: string | null;
  } | null;
}

export interface CreateServiceOrderInput {
  booking_id?: string;
  property_id?: string;
  service_type: string;
  service_name: string;
  service_name_ru?: string;
  description?: string;
  scheduled_at?: string;
  amount?: number;
  currency?: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Hook for guests to manage their orders
export function useGuestServiceOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['guest-service-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          property:properties(id, title_en, title_ru, address)
        `)
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ServiceOrder[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (input: CreateServiceOrderInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          ...input,
          guest_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-service-orders'] });
      toast('Заказ создан', { description: 'Ваш заказ успешно создан и ожидает обработки' });
    },
    onError: (error) => {
      toast.error('Ошибка', { description: error.message });
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('guest_id', user?.id)
        .eq('status', 'pending');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-service-orders'] });
      toast('Заказ отменён');
    },
  });

  const rateOrder = useMutation({
    mutationFn: async ({ orderId, rating, review }: { orderId: string; rating: number; review?: string }) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ rating, review })
        .eq('id', orderId)
        .eq('guest_id', user?.id)
        .eq('status', 'completed');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-service-orders'] });
      toast('Спасибо за отзыв!');
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('guest-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders',
          filter: `guest_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');

  return {
    orders,
    activeOrders,
    completedOrders,
    isLoading,
    createOrder,
    cancelOrder,
    rateOrder,
    refetch,
  };
}

// Hook for staff/executors to manage assigned orders
export function useStaffServiceOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['staff-service-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          property:properties(id, title_en, title_ru, address)
        `)
        .eq('assigned_to', user.id)
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data as ServiceOrder[];
    },
    enabled: !!user,
  });

  const startOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('assigned_to', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-service-orders'] });
      toast('Заказ начат');
    },
  });

  const completeOrder = useMutation({
    mutationFn: async ({ orderId, notes, photos }: { orderId: string; notes?: string; photos?: string[] }) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: notes,
          completion_photos: photos,
        })
        .eq('id', orderId)
        .eq('assigned_to', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-service-orders'] });
      toast('Заказ завершён');
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('staff-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders',
          filter: `assigned_to=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return {
    orders,
    isLoading,
    startOrder,
    completeOrder,
    refetch,
  };
}

// Hook for admin/operations to manage all orders
export function useAdminServiceOrders(filters?: { status?: string; priority?: string }) {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-service-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          property:properties(id, title_en, title_ru, address)
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as ServiceOrder[];
    },
  });

  const assignOrder = useMutation({
    mutationFn: async ({ orderId, staffId }: { orderId: string; staffId: string }) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ 
          assigned_to: staffId,
          status: 'assigned',
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-orders'] });
      toast('Исполнитель назначен');
    },
  });

  const updateOrderPriority = useMutation({
    mutationFn: async ({ orderId, priority }: { orderId: string; priority: string }) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ priority })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-orders'] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const assignedOrders = orders.filter(o => o.status === 'assigned');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');

  return {
    orders,
    pendingOrders,
    assignedOrders,
    inProgressOrders,
    isLoading,
    assignOrder,
    updateOrderPriority,
    refetch,
  };
}
