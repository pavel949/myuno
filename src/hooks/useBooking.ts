import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { openWhatsApp } from '@/hooks/useChat';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type BookingType = Database['public']['Enums']['booking_type'];
type BookingStatus = Database['public']['Enums']['booking_status'];

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
  // For WhatsApp message
  serviceName?: string;
  providerName?: string;
  openWhatsAppOnCash?: boolean;
}

export interface BookingResult {
  success: boolean;
  booking_id?: string;
  error?: string;
}

export function useBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useCallback((key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'booking.success': { en: 'Booking confirmed!', ru: 'Бронирование подтверждено!' },
      'booking.error': { en: 'Booking failed', ru: 'Ошибка бронирования' },
      'booking.loginRequired': { en: 'Please login to continue', ru: 'Войдите для продолжения' },
      'booking.fillRequired': { en: 'Please fill all required fields', ru: 'Заполните обязательные поля' },
      'booking.processing': { en: 'Processing...', ru: 'Обработка...' },
      'booking.paymentFailed': { en: 'Payment failed', ru: 'Ошибка оплаты' },
      'booking.insufficientBalance': { en: 'Insufficient wallet balance', ru: 'Недостаточно средств на кошельке' },
      'booking.cancelled': { en: 'Booking cancelled', ru: 'Бронирование отменено' },
      'booking.refunded': { en: 'Payment refunded to wallet', ru: 'Оплата возвращена на кошелёк' },
    };
    return translations[key]?.[language] || key;
  }, [language]);

  const createBooking = useCallback(async (params: CreateBookingParams): Promise<BookingResult> => {
    if (!user) {
      toast({ title: t('booking.loginRequired'), variant: 'destructive' });
      navigate('/auth');
      return { success: false, error: 'not_authenticated' };
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = params.scheduled_at 
        ? (params.scheduled_at instanceof Date ? params.scheduled_at.toISOString() : params.scheduled_at)
        : null;

      let bookingId: string;

      // Use atomic function for wallet payments
      if (params.payment?.payment_method === 'wallet') {
        const { data, error } = await supabase.rpc('create_booking_with_wallet_payment', {
          p_user_id: user.id,
          p_booking_type: params.booking_type,
          p_scheduled_at: scheduledAt,
          p_total_amount: params.total_amount,
          p_currency: params.currency || 'THB',
          p_provider_id: params.provider_id || null,
          p_service_id: params.service_id || null,
          p_notes: params.notes || null,
        });

        if (error) {
          if (error.message.includes('Insufficient balance')) {
            toast({ title: t('booking.insufficientBalance'), variant: 'destructive' });
            return { success: false, error: 'insufficient_balance' };
          }
          throw error;
        }

        bookingId = data;
      } else {
        // Non-wallet payment: create booking normally
        let status: BookingStatus = 'submitted';
        if (params.payment?.status === 'paid') {
          status = 'confirmed';
        }

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            booking_type: params.booking_type,
            status,
            scheduled_at: scheduledAt,
            total_amount: params.total_amount,
            currency: params.currency || 'THB',
            provider_id: params.provider_id || null,
            service_id: params.service_id || null,
            notes: params.notes || null,
          })
          .select()
          .single();

        if (bookingError) throw bookingError;
        bookingId = booking.id;

        // Insert payment record for non-wallet
        if (params.payment) {
          await supabase.from('booking_payments').insert([{
            booking_id: bookingId,
            amount: params.payment.amount,
            payment_method: params.payment.payment_method,
            status: 'pending',
            currency: params.currency || 'THB',
          }]);
        }
      }

      // Insert booking items
      if (params.items && params.items.length > 0) {
        const itemsToInsert = params.items.map(item => ({
          booking_id: bookingId,
          item_type: item.item_type,
          item_id: item.item_id || null,
          item_name: item.item_name,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || null,
          subtotal: item.subtotal || null,
        }));

        await supabase.from('booking_items').insert(itemsToInsert);
      }

      // Insert participants
      if (params.participants && params.participants.length > 0) {
        const participantsToInsert = params.participants.map((p, idx) => ({
          booking_id: bookingId,
          name: p.name,
          phone: p.phone || null,
          email: p.email || null,
          is_primary: p.is_primary ?? idx === 0,
        }));

        await supabase.from('booking_participants').insert(participantsToInsert);
      }

      // Insert addresses
      if (params.addresses && params.addresses.length > 0) {
        const addressesToInsert = params.addresses.map(addr => ({
          booking_id: bookingId,
          address: addr.address,
          address_type: addr.address_type,
          lat: addr.lat || null,
          lng: addr.lng || null,
          notes: addr.notes || null,
        }));

        await supabase.from('booking_addresses').insert(addressesToInsert);
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: language === 'ru' ? 'Бронирование создано' : 'Booking Created',
        body: language === 'ru' 
          ? `Ваше бронирование #${bookingId.slice(0, 8)} успешно создано`
          : `Your booking #${bookingId.slice(0, 8)} has been created`,
        type: 'booking',
        data: { booking_id: bookingId, booking_type: params.booking_type },
      });

      // Record initial status in history
      await supabase.from('booking_status_history').insert({
        booking_id: bookingId,
        from_status: null,
        to_status: params.payment?.payment_method === 'wallet' ? 'confirmed' : 'submitted',
        changed_by: user.id,
        notes: 'Booking created',
      });

      toast({ 
        title: t('booking.success'),
        description: `#${bookingId.slice(0, 8).toUpperCase()}`,
      });

      // If cash payment, open WhatsApp with booking details
      if (params.payment?.payment_method === 'cash' && params.openWhatsAppOnCash !== false) {
        const scheduledAtFormatted = params.scheduled_at 
          ? format(new Date(params.scheduled_at), 'dd.MM.yyyy HH:mm')
          : '';
        
        const primaryParticipant = params.participants?.find(p => p.is_primary) || params.participants?.[0];
        const itemsList = params.items?.map(i => `• ${i.item_name}${i.quantity ? ` x${i.quantity}` : ''}`).join('\n') || '';
        
        const message = language === 'ru'
          ? `🔔 *Новое бронирование UNO*

📋 *Номер:* #${bookingId.slice(0, 8).toUpperCase()}
📁 *Тип:* ${params.booking_type}
${params.serviceName ? `🏷️ *Услуга:* ${params.serviceName}\n` : ''}${params.providerName ? `🏢 *Провайдер:* ${params.providerName}\n` : ''}
📅 *Дата:* ${scheduledAtFormatted}
💰 *Сумма:* ${params.currency || 'THB'} ${params.total_amount.toLocaleString()}
💵 *Оплата:* Наличными

${primaryParticipant ? `👤 *Контакт:* ${primaryParticipant.name}${primaryParticipant.phone ? ` | ${primaryParticipant.phone}` : ''}` : ''}
${itemsList ? `\n📦 *Состав:*\n${itemsList}` : ''}
${params.notes ? `\n📝 *Примечание:* ${params.notes}` : ''}

Прошу подтвердить бронирование.`
          : `🔔 *New UNO Booking*

📋 *Number:* #${bookingId.slice(0, 8).toUpperCase()}
📁 *Type:* ${params.booking_type}
${params.serviceName ? `🏷️ *Service:* ${params.serviceName}\n` : ''}${params.providerName ? `🏢 *Provider:* ${params.providerName}\n` : ''}
📅 *Date:* ${scheduledAtFormatted}
💰 *Amount:* ${params.currency || 'THB'} ${params.total_amount.toLocaleString()}
💵 *Payment:* Cash

${primaryParticipant ? `👤 *Contact:* ${primaryParticipant.name}${primaryParticipant.phone ? ` | ${primaryParticipant.phone}` : ''}` : ''}
${itemsList ? `\n📦 *Items:*\n${itemsList}` : ''}
${params.notes ? `\n📝 *Note:* ${params.notes}` : ''}

Please confirm my booking.`;

        openWhatsApp(message);
      }

      return { success: true, booking_id: bookingId };

    } catch (error) {
      console.error('Booking error:', error);
      toast({ title: t('booking.error'), variant: 'destructive' });
      return { success: false, error: error instanceof Error ? error.message : 'unknown' };
    } finally {
      setIsSubmitting(false);
    }
  }, [user, navigate, toast, t, language]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current booking status for history
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      // Try to refund if wallet payment
      const { data: refunded } = await supabase.rpc('refund_wallet_booking', {
        p_booking_id: bookingId,
        p_user_id: user.id,
      });

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_user' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Record status change
      await supabase.from('booking_status_history').insert({
        booking_id: bookingId,
        from_status: currentBooking?.status || 'submitted',
        to_status: 'cancelled_by_user',
        changed_by: user.id,
        notes: refunded ? 'Cancelled by user. Payment refunded.' : 'Cancelled by user',
      });

      // Create notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: language === 'ru' ? 'Бронирование отменено' : 'Booking Cancelled',
        body: language === 'ru' 
          ? `Бронирование #${bookingId.slice(0, 8)} отменено${refunded ? '. Средства возвращены на кошелёк.' : ''}`
          : `Booking #${bookingId.slice(0, 8)} cancelled${refunded ? '. Payment refunded to wallet.' : ''}`,
        type: 'booking',
        data: { booking_id: bookingId },
      });

      toast({ 
        title: t('booking.cancelled'),
        description: refunded ? t('booking.refunded') : undefined,
      });

      return true;
    } catch (error) {
      console.error('Cancel error:', error);
      toast({ 
        title: language === 'ru' ? 'Ошибка отмены' : 'Cancel failed', 
        variant: 'destructive' 
      });
      return false;
    }
  }, [user, toast, language, t]);

  return {
    createBooking,
    cancelBooking,
    isSubmitting,
  };
}