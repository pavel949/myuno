import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface DemoNotificationData {
  booking: {
    title: string;
    body: string;
    type: string;
    data: { booking_id: string; service: string };
  };
  promotion: {
    title: string;
    body: string;
    type: string;
    data: { promo_code: string; discount: number };
  };
  status: {
    title: string;
    body: string;
    type: string;
    data: { booking_id: string; new_status: string };
  };
}

const demoNotifications: DemoNotificationData = {
  booking: {
    title: 'Напоминание о бронировании',
    body: 'Ваша запись в салон красоты "Glamour" завтра в 14:00. Не забудьте!',
    type: 'booking',
    data: { booking_id: 'demo-123', service: 'Стрижка' },
  },
  promotion: {
    title: '🎉 Специальное предложение!',
    body: 'Скидка 20% на все услуги спа в эти выходные. Используйте код: SPA20',
    type: 'promotion',
    data: { promo_code: 'SPA20', discount: 20 },
  },
  status: {
    title: 'Статус бронирования изменен',
    body: 'Ваше бронирование #12345 подтверждено провайдером.',
    type: 'status',
    data: { booking_id: '12345', new_status: 'confirmed' },
  },
};

export function useAdminNotifications() {
  const { user } = useAuth();

  // Create demo notification for testing
  const createDemoNotification = async (
    type: 'booking' | 'promotion' | 'status',
    onSuccess?: () => void
  ) => {
    if (!user) {
      toast.error('Войдите в систему');
      return false;
    }

    const notification = demoNotifications[type];

    const { error } = await supabase.from('notifications').insert({
      user_id: user.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data as Json,
      is_read: false,
    });

    if (error) {
      toast.error('Не удалось создать уведомление');
      return false;
    }

    toast.success('Демо-уведомление создано');
    onSuccess?.();

    // Also show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icons/icon-192x192.png',
      });
    }

    return true;
  };

  // Trigger booking reminders check via edge function
  const triggerBookingReminders = async (onSuccess?: () => void) => {
    try {
      const { data, error } = await supabase.functions.invoke('booking-reminders');
      
      if (error) throw error;
      
      toast.success(`Проверка завершена: отправлено ${data?.sent || 0} напоминаний`);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error triggering reminders:', error);
      toast.error('Не удалось запустить проверку напоминаний');
      return false;
    }
  };

  // Send promotion notification to all subscribed users
  const sendPromotion = async (
    promotion: {
      title: string;
      title_ru: string;
      body: string;
      body_ru: string;
      promo_code?: string;
      discount?: number;
      valid_until?: string;
      category?: string;
    },
    onSuccess?: () => void
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-promotions', {
        body: promotion,
      });
      
      if (error) throw error;
      
      toast.success(`Акция отправлена ${data?.sent || 0} пользователям`);
      onSuccess?.();
      return data;
    } catch (error) {
      console.error('Error sending promotion:', error);
      toast.error('Не удалось отправить акцию');
      return null;
    }
  };

  return {
    createDemoNotification,
    triggerBookingReminders,
    sendPromotion,
  };
}
