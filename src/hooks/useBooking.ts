import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { openWhatsApp, UNO_WHATSAPP } from '@/hooks/useChat';
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
      // Handle wallet payment if selected
      if (params.payment?.payment_method === 'wallet') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .single();

        if (walletError || !wallet || wallet.balance < params.total_amount) {
          toast({ title: t('booking.insufficientBalance'), variant: 'destructive' });
          return { success: false, error: 'insufficient_balance' };
        }

        // Deduct from wallet
        const { error: deductError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance - params.total_amount })
          .eq('user_id', user.id);

        if (deductError) throw deductError;

        // Record transaction
        await supabase.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          user_id: user.id,
          amount: -params.total_amount,
          type: 'payment',
          description: `Booking payment - ${params.booking_type}`,
          status: 'completed',
        });
      }

      // Determine initial status
      let status: BookingStatus = 'submitted';
      if (params.payment?.payment_method === 'wallet' || params.payment?.status === 'paid') {
        status = 'confirmed';
      }

      // Create main booking
      const scheduledAt = params.scheduled_at 
        ? (params.scheduled_at instanceof Date ? params.scheduled_at.toISOString() : params.scheduled_at)
        : null;

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

      // Insert booking items
      if (params.items && params.items.length > 0) {
        const itemsToInsert = params.items.map(item => ({
          booking_id: booking.id,
          item_type: item.item_type,
          item_id: item.item_id || null,
          item_name: item.item_name,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || null,
          subtotal: item.subtotal || null,
        }));

        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(itemsToInsert);

        if (itemsError) console.error('Items insert error:', itemsError);
      }

      // Insert participants
      if (params.participants && params.participants.length > 0) {
        const participantsToInsert = params.participants.map((p, idx) => ({
          booking_id: booking.id,
          name: p.name,
          phone: p.phone || null,
          email: p.email || null,
          is_primary: p.is_primary ?? idx === 0,
        }));

        const { error: participantsError } = await supabase
          .from('booking_participants')
          .insert(participantsToInsert);

        if (participantsError) console.error('Participants insert error:', participantsError);
      }

      // Insert addresses
      if (params.addresses && params.addresses.length > 0) {
        const addressesToInsert = params.addresses.map(addr => ({
          booking_id: booking.id,
          address: addr.address,
          address_type: addr.address_type,
          lat: addr.lat || null,
          lng: addr.lng || null,
          notes: addr.notes || null,
        }));

        const { error: addressesError } = await supabase
          .from('booking_addresses')
          .insert(addressesToInsert);

        if (addressesError) console.error('Addresses insert error:', addressesError);
      }

      // Insert payment record
      if (params.payment) {
        // Map our payment status to DB enum
        const paymentStatus = params.payment.payment_method === 'wallet' ? 'completed' : 'pending';
        
        const { error: paymentError } = await supabase
          .from('booking_payments')
          .insert([{
            booking_id: booking.id,
            amount: params.payment.amount,
            payment_method: params.payment.payment_method,
            status: paymentStatus as 'pending' | 'completed',
            paid_at: params.payment.payment_method === 'wallet' ? new Date().toISOString() : null,
          }]);

        if (paymentError) console.error('Payment insert error:', paymentError);
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: language === 'ru' ? 'Бронирование создано' : 'Booking Created',
        body: language === 'ru' 
          ? `Ваше бронирование #${booking.id.slice(0, 8)} успешно создано`
          : `Your booking #${booking.id.slice(0, 8)} has been created`,
        type: 'booking',
        data: { booking_id: booking.id, booking_type: params.booking_type },
      });

      toast({ 
        title: t('booking.success'),
        description: `#${booking.id.slice(0, 8).toUpperCase()}`,
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

📋 *Номер:* #${booking.id.slice(0, 8).toUpperCase()}
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

📋 *Number:* #${booking.id.slice(0, 8).toUpperCase()}
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

      return { success: true, booking_id: booking.id };

    } catch (error) {
      console.error('Booking error:', error);
      toast({ title: t('booking.error'), variant: 'destructive' });
      return { success: false, error: error instanceof Error ? error.message : 'unknown' };
    } finally {
      setIsSubmitting(false);
    }
  }, [user, navigate, toast, t, language]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_user' })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Record status change
      await supabase.from('booking_status_history').insert({
        booking_id: bookingId,
        from_status: 'submitted',
        to_status: 'cancelled_by_user',
        changed_by: user?.id,
        notes: 'Cancelled by user',
      });

      toast({ 
        title: language === 'ru' ? 'Бронирование отменено' : 'Booking cancelled' 
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
  }, [user, toast, language]);

  return {
    createBooking,
    cancelBooking,
    isSubmitting,
  };
}
