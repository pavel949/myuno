/**
 * Unified Notifications Hook
 * 
 * This hook composes smaller, focused hooks for notification management:
 * - usePushSubscription: Browser push notification subscription
 * - useNotificationActions: CRUD operations for in-app notifications
 * - useNotificationPreferences: User notification preferences
 * - useAdminNotifications: Admin-only notification sending
 * 
 * For specific use cases, consider importing the individual hooks directly.
 */

import { useNotificationActions, type Notification } from './useNotificationActions';
import { usePushSubscription } from './usePushSubscription';
import { useNotificationPreferences } from './useNotificationPreferences';
import { useAdminNotifications } from './useAdminNotifications';

export type { Notification };

export function useNotifications() {
  // Compose all notification-related hooks
  const pushSubscription = usePushSubscription();
  const notificationActions = useNotificationActions();
  const { preferences, updatePreferences, isUpdating } = useNotificationPreferences();
  const adminNotifications = useAdminNotifications();

  // Compute combined loading state
  const isLoading = pushSubscription.isLoading || notificationActions.isLoading;

  return {
    // From useNotificationActions
    notifications: notificationActions.notifications,
    unreadCount: notificationActions.unreadCount,
    markAsRead: notificationActions.markAsRead,
    markAllAsRead: notificationActions.markAllAsRead,
    deleteNotification: notificationActions.deleteNotification,
    refresh: notificationActions.refresh,

    // From usePushSubscription
    isSupported: pushSubscription.isSupported,
    isSubscribed: pushSubscription.isSubscribed,
    subscribe: pushSubscription.subscribe,
    unsubscribe: pushSubscription.unsubscribe,

    // From useNotificationPreferences
    preferences: preferences ? {
      booking_reminders: preferences.booking_reminders,
      promotions: preferences.promotions,
      status_updates: preferences.status_updates,
    } : {
      booking_reminders: true,
      promotions: true,
      status_updates: true,
    },
    updatePreferences: async (newPrefs: { booking_reminders?: boolean; promotions?: boolean; status_updates?: boolean }) => {
      updatePreferences(newPrefs);
      return true;
    },

    // From useAdminNotifications
    createDemoNotification: (type: 'booking' | 'promotion' | 'status') => 
      adminNotifications.createDemoNotification(type, notificationActions.refresh),
    triggerBookingReminders: () => 
      adminNotifications.triggerBookingReminders(notificationActions.refresh),
    sendPromotion: (promotion: Parameters<typeof adminNotifications.sendPromotion>[0]) =>
      adminNotifications.sendPromotion(promotion, notificationActions.refresh),

    // Combined state
    isLoading,
  };
}
