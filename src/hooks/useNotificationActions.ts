import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Json;
  is_read: boolean;
  created_at: string;
}

export function useNotificationActions() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ['in-app-notifications', userId] as const;
  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, data, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = useCallback(async () => {
    if (userId) await refetch({ cancelRefetch: false });
  }, [userId, refetch]);

  // Real-time subscription. Use a unique channel name per mount to avoid
  // "cannot add postgres_changes callbacks after subscribe()" when the hook
  // is mounted from multiple components or remounted under StrictMode/HMR.
  useEffect(() => {
    if (!userId) return;

    const channelName = `notifications-${userId}-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('id', notificationId);
    if (!error) await queryClient.invalidateQueries({ queryKey });
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!userId) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return false;
    await queryClient.invalidateQueries({ queryKey });
    return true;
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('id', notificationId);
    if (!error) await queryClient.invalidateQueries({ queryKey });
  };

  return {
    notifications,
    unreadCount: notifications.filter(notification => !notification.is_read).length,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}
