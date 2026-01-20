/**
 * DEPRECATED: This hook is maintained for backwards compatibility.
 * All new code should use useOrders() from '@/hooks/useOrders'
 * 
 * This wrapper delegates to useOrders internally while maintaining
 * the legacy API for existing booking pages.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useOrders, CreateOrderInput, PaymentMethod } from '@/hooks/useOrders';
import type { Database } from '@/integrations/supabase/types';

type BookingType = Database['public']['Enums']['booking_type'];

export interface BookingItem {
  item_type: string;
  item_id?: string;
  item_name: string;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
}

export interface BookingParticipant {
  name: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
}

export interface BookingAddress {
  address: string;
  address_type: 'pickup' | 'dropoff' | 'delivery' | 'service';
  lat?: number;
  lng?: number;
  notes?: string;
}

export interface BookingPayment {
  amount: number;
  payment_method: 'cash' | 'card' | 'wallet' | 'online';
  status?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface CreateBookingParams {
  booking_type: BookingType;
  scheduled_at?: Date | string;
  total_amount: number;
  currency?: string;
  provider_id?: string;
  service_id?: string;
  notes?: string;
  items?: BookingItem[];
  participants?: BookingParticipant[];
  addresses?: BookingAddress[];
  payment?: BookingPayment;
  metadata?: Record<string, unknown>;
  serviceName?: string;
  providerName?: string;
  openWhatsAppOnCash?: boolean;
}

export interface BookingResult {
  success: boolean;
  booking_id?: string;
  error?: string;
}

// Map legacy booking types to new order types
const mapBookingTypeToOrderType = (bookingType: BookingType): CreateOrderInput['order_type'] => {
  const mapping: Record<string, CreateOrderInput['order_type']> = {
    'service': 'service',
    'tour': 'tour',
    'property': 'property',
    'yacht': 'yacht',
    'vehicle': 'vehicle',
    'event': 'event',
    'activity': 'activity',
    'beauty': 'beauty',
    'cleaning': 'cleaning',
    'babysitter': 'babysitter',
    'education': 'education',
    'medical': 'medical',
    'legal': 'legal',
    'pet_service': 'pet_service',
    'flowers': 'flowers',
    'food': 'food',
    'transport': 'vehicle',
    'rental': 'property',
    'restaurant': 'food',
  };
  return mapping[bookingType] || 'service';
};

// Map legacy payment methods to new ones
const mapPaymentMethod = (method: BookingPayment['payment_method']): PaymentMethod => {
  const mapping: Record<string, PaymentMethod> = {
    'cash': 'cash',
    'card': 'stripe',
    'wallet': 'wallet',
    'online': 'stripe',
  };
  return mapping[method] || 'cash';
};

/**
 * @deprecated Use useOrders() instead
 */
export function useBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { createOrder, cancelOrder, isCreating } = useOrders();

  const t = useCallback((key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'booking.success': { en: 'Booking confirmed!', ru: 'Бронирование подтверждено!' },
      'booking.error': { en: 'Booking failed', ru: 'Ошибка бронирования' },
      'booking.loginRequired': { en: 'Please login to continue', ru: 'Войдите для продолжения' },
      'booking.cancelled': { en: 'Booking cancelled', ru: 'Бронирование отменено' },
    };
    return translations[key]?.[language] || key;
  }, [language]);

  const createBooking = useCallback(async (params: CreateBookingParams): Promise<BookingResult> => {
    if (!user) {
      toast({ title: t('booking.loginRequired'), variant: 'destructive' });
      navigate('/auth');
      return { success: false, error: 'not_authenticated' };
    }

    try {
      // Convert legacy booking params to new order input
      const orderInput: CreateOrderInput = {
        order_type: mapBookingTypeToOrderType(params.booking_type),
        provider_org_id: params.provider_id,
        start_at: params.scheduled_at,
        total_amount: params.total_amount,
        currency: params.currency || 'THB',
        notes: params.notes,
        metadata: {
          ...params.metadata,
          service_id: params.service_id,
          legacy_booking_type: params.booking_type,
        },
        items: (params.items || []).map(item => ({
          product_id: item.item_id,
          item_name: item.item_name,
          item_type: item.item_type,
          qty: item.quantity || 1,
          unit_price: item.unit_price || 0,
          amount: item.subtotal || (item.unit_price || 0) * (item.quantity || 1),
        })),
        participants: (params.participants || []).map((p, idx) => ({
          role: p.is_primary || idx === 0 ? 'primary' as const : 'guest' as const,
          name: p.name,
          phone: p.phone,
          email: p.email,
        })),
        addresses: (params.addresses || []).map(addr => ({
          address_type: addr.address_type === 'delivery' ? 'service' as const : addr.address_type as 'pickup' | 'service' | 'dropoff',
          address_text: addr.address,
          lat: addr.lat,
          lng: addr.lng,
          notes: addr.notes,
        })),
        payment: params.payment ? {
          method: mapPaymentMethod(params.payment.payment_method),
          amount: params.payment.amount,
        } : undefined,
        serviceName: params.serviceName,
        providerName: params.providerName,
        openWhatsAppOnCash: params.openWhatsAppOnCash,
      };

      // If no items provided but we have service details, create a default item
      if (orderInput.items.length === 0 && params.serviceName) {
        orderInput.items = [{
          item_name: params.serviceName,
          item_type: params.booking_type,
          qty: 1,
          unit_price: params.total_amount,
          amount: params.total_amount,
        }];
      }

      const result = await createOrder(orderInput);

      if (result.success) {
        return { 
          success: true, 
          booking_id: result.order_id,
        };
      }

      return { 
        success: false, 
        error: result.error,
      };

    } catch (error) {
      console.error('Booking error:', error);
      toast({ title: t('booking.error'), variant: 'destructive' });
      return { success: false, error: error instanceof Error ? error.message : 'unknown' };
    }
  }, [user, navigate, toast, t, createOrder]);

  const cancelBookingFn = useCallback(async (bookingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const result = await cancelOrder(bookingId);
      if (result) {
        toast({ title: t('booking.cancelled') });
      }
      return result;
    } catch (error) {
      console.error('Cancel error:', error);
      toast({ 
        title: language === 'ru' ? 'Ошибка отмены' : 'Cancel failed', 
        variant: 'destructive' 
      });
      return false;
    }
  }, [user, cancelOrder, toast, language, t]);

  return {
    createBooking,
    cancelBooking: cancelBookingFn,
    isSubmitting: isCreating,
  };
}
