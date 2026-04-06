import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

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

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
  }, []);

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
    } catch {
      // ignored — subscription status defaults to false on error
    }
    setIsLoading(false);
  }, [isSupported, user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

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
      // NOTE: VAPID key below is a placeholder. Replace with your own generated VAPID public key
      // before enabling push notifications in production.
      // Generate with: npx web-push generate-vapid-keys
      const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
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
    } catch {
      // ignored — error feedback provided via toast above
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

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
