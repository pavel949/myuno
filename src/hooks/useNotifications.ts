import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Json;
  is_read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  booking_reminders: boolean;
  promotions: boolean;
  status_updates: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    booking_reminders: true,
    promotions: true,
    status_updates: true,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [user]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!error && data) {
      setPreferences({
        booking_reminders: data.booking_reminders,
        promotions: data.promotions,
        status_updates: data.status_updates,
      });
    }
  }, [user]);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
    setIsLoading(false);
  }, [isSupported, user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
      checkSubscription();
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [user, fetchNotifications, fetchPreferences, checkSubscription]);

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported || !user) {
      toast.error('Push-уведомления не поддерживаются');
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Разрешение на уведомления отклонено');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // This is a demo VAPID key - in production, generate your own
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        ),
      });

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys as Json,
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Уведомления включены');
      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Не удалось подписаться на уведомления');
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success('Уведомления отключены');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Не удалось отключить уведомления');
      return false;
    }
  };

  // Update preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return false;

    const updated = { ...preferences, ...newPreferences };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...updated,
      });

    if (error) {
      toast.error('Не удалось сохранить настройки');
      return false;
    }

    setPreferences(updated);
    toast.success('Настройки сохранены');
    return true;
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Create demo notification
  const createDemoNotification = async (type: 'booking' | 'promotion' | 'status') => {
    if (!user) {
      toast.error('Войдите в систему');
      return false;
    }

    const demoNotifications = {
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

    await fetchNotifications();
    toast.success('Демо-уведомление создано');
    
    // Also show browser notification if subscribed
    if (isSubscribed && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icons/icon-192x192.png',
      });
    }

    return true;
  };

  // Trigger booking reminders check via edge function
  const triggerBookingReminders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('booking-reminders');
      
      if (error) throw error;
      
      toast.success(`Проверка завершена: отправлено ${data?.sent || 0} напоминаний`);
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error triggering reminders:', error);
      toast.error('Не удалось запустить проверку напоминаний');
      return false;
    }
  };

  // Send promotion notification to all subscribed users
  const sendPromotion = async (promotion: {
    title: string;
    title_ru: string;
    body: string;
    body_ru: string;
    promo_code?: string;
    discount?: number;
    valid_until?: string;
    category?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-promotions', {
        body: promotion,
      });
      
      if (error) throw error;
      
      toast.success(`Акция отправлена ${data?.sent || 0} пользователям`);
      await fetchNotifications();
      return data;
    } catch (error) {
      console.error('Error sending promotion:', error);
      toast.error('Не удалось отправить акцию');
      return null;
    }
  };

  return {
    notifications,
    preferences,
    isSupported,
    isSubscribed,
    isLoading,
    unreadCount,
    subscribe,
    unsubscribe,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createDemoNotification,
    triggerBookingReminders,
    sendPromotion,
    refresh: fetchNotifications,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
