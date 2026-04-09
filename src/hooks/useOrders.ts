import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { openWhatsApp } from '@/hooks/useChat';
import { format } from 'date-fns';
import { createErrorHandler } from '@/lib/errorHandler';
import { getLocalizedRpcError, isRpcError } from '@/lib/rpcErrorMessages';
import type { Database } from '@/integrations/supabase/types';

import { toast } from 'sonner';
const errorLog = createErrorHandler('useOrders');

// Type definitions
export type OrderType = 
  | 'service' | 'tour' | 'property' | 'yacht' | 'vehicle' 
  | 'event' | 'activity' | 'beauty' | 'cleaning' | 'babysitter'
  | 'education' | 'medical' | 'legal' | 'pet_service' | 'flowers' | 'food' | 'mixed';

export type OrderStatus = 
  | 'draft' | 'pending' | 'confirmed' | 'in_progress' 
  | 'completed' | 'cancelled' | 'refunded' | 'disputed';

export type PaymentMethod = 'cash' | 'wallet' | 'stripe' | 'bank_transfer';

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_user_id: string;
  provider_org_id: string | null;
  status: OrderStatus;
  start_at: string | null;
  end_at: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations
  order_items?: OrderItem[];
  order_participants?: OrderParticipant[];
  order_addresses?: OrderAddress[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  resource_id: string | null;
  provider_org_id: string | null;
  item_name: string;
  item_type: string;
  qty: number;
  unit_price: number;
  amount: number;
  status: string;
  start_at: string | null;
  end_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OrderParticipant {
  id: string;
  order_id: string;
  role: 'primary' | 'guest' | 'attendee' | 'driver' | 'guide';
  name: string;
  phone: string | null;
  email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OrderAddress {
  id: string;
  order_id: string;
  address_type: 'pickup' | 'service' | 'dropoff' | 'billing';
  address_text: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateOrderInput {
  order_type: OrderType;
  provider_org_id?: string;
  start_at?: Date | string;
  end_at?: Date | string;
  total_amount: number;
  currency?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  items: {
    product_id?: string;
    resource_id?: string;
    provider_org_id?: string;
    item_name: string;
    item_type: string;
    qty?: number;
    unit_price: number;
    amount: number;
    start_at?: Date | string;
    end_at?: Date | string;
    metadata?: Record<string, unknown>;
  }[];
  participants?: {
    role?: 'primary' | 'guest' | 'attendee';
    name: string;
    phone?: string;
    email?: string;
  }[];
  addresses?: {
    address_type: 'pickup' | 'service' | 'dropoff';
    address_text: string;
    lat?: number;
    lng?: number;
    notes?: string;
  }[];
  payment?: {
    method: PaymentMethod;
    amount: number;
  };
  // For WhatsApp notification
  serviceName?: string;
  providerName?: string;
  openWhatsAppOnCash?: boolean;
}

export interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  order_number?: string;
  error?: string;
}

/**
 * Canonical order hook - replaces all *_booking specific hooks
 */
export function useOrders() {
  const { user } = useAuth();
  const { language } = useLanguage();
const queryClient = useQueryClient();

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'order.success': { en: 'Order confirmed!', ru: 'Заказ подтверждён!' },
      'order.error': { en: 'Order failed', ru: 'Ошибка заказа' },
      'order.loginRequired': { en: 'Please login to continue', ru: 'Войдите для продолжения' },
      'order.cancelled': { en: 'Order cancelled', ru: 'Заказ отменён' },
      'order.refunded': { en: 'Payment refunded to wallet', ru: 'Оплата возвращена на кошелёк' },
      'order.insufficientBalance': { en: 'Insufficient wallet balance', ru: 'Недостаточно средств на кошельке' },
    };
    return translations[key]?.[language] || key;
  };

  // Fetch user's orders
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
   queryKey: ['orders', user?.id, 'recent'],
    queryFn: async (): Promise<Order[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          order_participants(*),
          order_addresses(*)
        `)
        .eq('customer_user_id', user.id)
       .is('deleted_at', null)
       .order('created_at', { ascending: false })
       .limit(100); // P0 FIX: Limit for scalability

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!user?.id,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResult> => {
      if (!user?.id) {
        toast.error(t('order.loginRequired'));
        return { success: false, error: 'not_authenticated' };
      }

      const startAt = input.start_at 
        ? (input.start_at instanceof Date ? input.start_at.toISOString() : input.start_at)
        : null;
      const endAt = input.end_at
        ? (input.end_at instanceof Date ? input.end_at.toISOString() : input.end_at)
        : null;

      // P0 FIX: Use atomic RPC to eliminate zombie records
      // Prepare items for RPC - cast to Json compatible type
      const itemsJson = JSON.parse(JSON.stringify(input.items.map(item => ({
        product_id: item.product_id || null,
        resource_id: item.resource_id || null,
        provider_org_id: item.provider_org_id || input.provider_org_id || null,
        item_name: item.item_name,
        item_type: item.item_type,
        qty: item.qty || 1,
        unit_price: item.unit_price,
        amount: item.amount,
        start_at: item.start_at ? (item.start_at instanceof Date ? item.start_at.toISOString() : item.start_at) : null,
        end_at: item.end_at ? (item.end_at instanceof Date ? item.end_at.toISOString() : item.end_at) : null,
        metadata: item.metadata || {},
      }))));

      // Prepare participants for RPC
      const participantsJson = input.participants 
        ? JSON.parse(JSON.stringify(input.participants.map((p, idx) => ({
            role: p.role || (idx === 0 ? 'primary' : 'guest'),
            name: p.name,
            phone: p.phone || null,
            email: p.email || null,
          }))))
        : null;

      // Prepare addresses for RPC
      const addressesJson = input.addresses 
        ? JSON.parse(JSON.stringify(input.addresses.map(addr => ({
            address_type: addr.address_type,
            address_text: addr.address_text,
            lat: addr.lat || null,
            lng: addr.lng || null,
            notes: addr.notes || null,
          }))))
        : null;

      // Call atomic RPC
      const { data: orderResult, error: orderError } = await supabase
        .rpc('create_order_atomic', {
          p_order_type: input.order_type,
          p_customer_user_id: user.id,
          p_provider_org_id: input.provider_org_id || null,
          p_start_at: startAt,
          p_end_at: endAt,
          p_total_amount: input.total_amount,
          p_currency: input.currency || 'THB',
          p_notes: input.notes || null,
          p_metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null,
          p_items: itemsJson,
          p_participants: participantsJson,
          p_addresses: addressesJson,
          p_payment_method: input.payment?.method || null,
          p_payment_amount: input.payment?.amount || null,
        });

      if (orderError) {
        // P0 FIX: Better error handling with localized messages
        const errorMessage = getLocalizedRpcError(orderError, language as 'en' | 'ru');
        throw new Error(errorMessage);
      }
      
      // Type assertion for RPC result
      const result = orderResult as { success: boolean; order_id?: string; order_number?: string; error?: string };
      
      if (!result.success) {
        const errorMessage = getLocalizedRpcError(result.error || 'order_creation_failed', language as 'en' | 'ru');
        throw new Error(errorMessage);
      }

      const orderId = result.order_id!;
      const orderNumber = result.order_number!;

      // Create notification for customer
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: language === 'ru' ? 'Заказ создан' : 'Order Created',
        body: language === 'ru' 
          ? `Ваш заказ ${orderNumber} успешно создан`
          : `Your order ${orderNumber} has been created`,
        type: 'booking',
        data: { order_id: orderId, order_type: input.order_type },
      });

      // Send customer email notification (non-blocking)
      supabase.functions.invoke('send-order-email', {
        body: {
          type: 'order_request_received',
          order_id: orderId,
          user_id: user.id,
          payment_method: input.payment?.method || 'cash',
        },
      }).catch(err => errorLog.silent(err, 'send_customer_email'));

      // Send admin email notification (non-blocking)
      const primaryParticipant = input.participants?.find(p => p.role === 'primary') || input.participants?.[0];
      const meta = input.metadata as Record<string, unknown> | undefined;
      supabase.functions.invoke('notify-admin-order', {
        body: {
          order_id: orderId,
          order_number: orderNumber,
          order_type: input.order_type,
          total_amount: input.total_amount,
          currency: input.currency || 'THB',
          customer_name: primaryParticipant?.name || user.email?.split('@')[0],
          customer_email: primaryParticipant?.email || user.email,
          customer_phone: primaryParticipant?.phone,
          items: input.items?.map(i => ({
            name: i.item_name,
            quantity: i.qty || 1,
            price: i.unit_price,
          })),
          scheduled_at: startAt,
          notes: input.notes,
          provider_name: input.providerName,
          payment_method: input.payment?.method || 'cash',
          addresses: input.addresses?.map(a => ({
            type: a.address_type,
            address: a.address_text,
          })),
          // Manager contact info from metadata
          manager_email: meta?.manager_email || null,
          manager_phone: meta?.manager_phone || null,
        },
      }).catch(err => errorLog.silent(err, 'send_admin_notification'));

      toast(t('order.success'), {
        description: orderNumber,
      });

      // WhatsApp for cash payments
      if (input.payment?.method === 'cash' && input.openWhatsAppOnCash !== false) {
        const scheduledFormatted = startAt ? format(new Date(startAt), 'dd.MM.yyyy HH:mm') : '';
        const primaryParticipant = input.participants?.find(p => p.role === 'primary') || input.participants?.[0];
        const itemsList = input.items?.map(i => `• ${i.item_name}${i.qty && i.qty > 1 ? ` x${i.qty}` : ''}`).join('\n') || '';
        
        const message = language === 'ru'
          ? `🔔 *Новый заказ UNO*\n\n📋 *Номер:* ${orderNumber}\n📁 *Тип:* ${input.order_type}\n${input.serviceName ? `🏷️ *Услуга:* ${input.serviceName}\n` : ''}${input.providerName ? `🏢 *Провайдер:* ${input.providerName}\n` : ''}\n📅 *Дата:* ${scheduledFormatted}\n💰 *Сумма:* ${input.currency || 'THB'} ${input.total_amount.toLocaleString()}\n💵 *Оплата:* Наличными\n\n${primaryParticipant ? `👤 *Контакт:* ${primaryParticipant.name}${primaryParticipant.phone ? ` | ${primaryParticipant.phone}` : ''}` : ''}${itemsList ? `\n\n📦 *Состав:*\n${itemsList}` : ''}${input.notes ? `\n\n📝 *Примечание:* ${input.notes}` : ''}\n\nПрошу подтвердить заказ.`
          : `🔔 *New UNO Order*\n\n📋 *Number:* ${orderNumber}\n📁 *Type:* ${input.order_type}\n${input.serviceName ? `🏷️ *Service:* ${input.serviceName}\n` : ''}${input.providerName ? `🏢 *Provider:* ${input.providerName}\n` : ''}\n📅 *Date:* ${scheduledFormatted}\n💰 *Amount:* ${input.currency || 'THB'} ${input.total_amount.toLocaleString()}\n💵 *Payment:* Cash\n\n${primaryParticipant ? `👤 *Contact:* ${primaryParticipant.name}${primaryParticipant.phone ? ` | ${primaryParticipant.phone}` : ''}` : ''}${itemsList ? `\n\n📦 *Items:*\n${itemsList}` : ''}${input.notes ? `\n\n📝 *Note:* ${input.notes}` : ''}\n\nPlease confirm my order.`;

        openWhatsApp(message);
      }

      return { success: true, order_id: orderId, order_number: orderNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
    onError: (error) => {
      errorLog.error(error, 'create_order');
      // P0 FIX: Use localized error message instead of generic one
      const localizedError = getLocalizedRpcError(error, language as 'en' | 'ru');
      toast.error(t('order.error'), {
        description: localizedError,
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string): Promise<boolean> => {
      if (!user?.id) return false;

      // Get current order status
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle();

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('customer_user_id', user.id);

      if (error) throw error;

      // Record status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        from_status: currentOrder?.status || 'pending',
        to_status: 'cancelled',
        actor_user_id: user.id,
        reason: 'Cancelled by customer',
      });

      toast(t('order.cancelled'));
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  // Get single order
  const getOrder = async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_participants(*),
        order_addresses(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) return null;
    return data as Order;
  };

  return {
    orders: orders || [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
    createOrder: createOrderMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isCancelling: cancelOrderMutation.isPending,
    getOrder,
  };
}

/**
 * Hook for vendors to view and manage orders for their org
 */
export function useVendorOrders(orgId?: string) {
  const { user } = useAuth();
  const { activeOrgId } = useUserContext();
  const queryClient = useQueryClient();
  
  const effectiveOrgId = orgId || activeOrgId;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['vendor-orders', effectiveOrgId],
    queryFn: async (): Promise<Order[]> => {
      if (!effectiveOrgId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          order_participants(*),
          order_addresses(*)
        `)
        .eq('provider_org_id', effectiveOrgId)
       .is('deleted_at', null)
       .order('created_at', { ascending: false })
       .limit(200); // P0 FIX: Limit for scalability

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!effectiveOrgId,
  });

  // Update order status
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, reason }: { orderId: string; status: OrderStatus; reason?: string }) => {
      // Get current status
      const { data: current } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      // Update
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      // Record history
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        from_status: current?.status,
        to_status: status,
        actor_user_id: user?.id,
        reason: reason || `Status updated to ${status}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders', effectiveOrgId] });
    },
  });

  // Summary stats
  const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;
  const confirmedCount = orders?.filter(o => o.status === 'confirmed').length || 0;
  const completedCount = orders?.filter(o => o.status === 'completed').length || 0;
  const totalRevenue = orders?.reduce((sum, o) => 
    ['confirmed', 'completed'].includes(o.status) ? sum + o.total_amount : sum, 0) || 0;

  return {
    orders: orders || [],
    isLoading,
    updateStatus: updateStatus.mutateAsync,
    isUpdating: updateStatus.isPending,
    stats: {
      pendingCount,
      confirmedCount,
      completedCount,
      totalRevenue,
    },
  };
}
