import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, CheckCheck, Loader2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/uno/EmptyState';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { NotificationFilters, NotificationFilterType } from './NotificationFilters';
import { notificationActionPath, type NotificationItemData } from './NotificationItem';
import { VirtualNotificationList } from './VirtualNotificationList';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

interface NotificationInboxProps {
  notifications: NotificationItemData[];
  isLoading: boolean;
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => Promise<boolean>;
  onDelete: (id: string) => void;
}

function notificationCategory(notification: NotificationItemData): Exclude<NotificationFilterType, 'all'> | 'other' {
  const { type } = notification;
  if (type === 'promotion') return type;
  const action = notificationActionPath(notification.data);
  if (type === 'booking' || action?.startsWith(APP_ROUTES.TRIP_DETAIL('')) || action?.startsWith(APP_ROUTES.BOOKING_DETAIL(''))) return 'booking';
  if (type === 'order' || action?.startsWith('/orders/')) return 'order';
  return type === 'status' ? 'status' : 'other';
}

/**
 * NotificationInbox component displays notifications with filtering.
 * Note: Real-time subscription is handled by useNotificationActions hook,
 * so we don't duplicate it here.
 */
export function NotificationInbox({
  notifications,
  isLoading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationInboxProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markAllFailed, setMarkAllFailed] = useState(false);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setMarkAllFailed(false);
    try {
      setMarkAllFailed(!(await onMarkAllRead()));
    } catch {
      setMarkAllFailed(true);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const entries = useMemo(() => notifications.map(notification => ({
    notification,
    category: notificationCategory(notification),
  })), [notifications]);
  const counts = {
    all: unreadCount,
    booking: entries.filter(({ notification, category }) => category === 'booking' && !notification.is_read).length,
    order: entries.filter(({ notification, category }) => category === 'order' && !notification.is_read).length,
    promotion: entries.filter(({ notification, category }) => category === 'promotion' && !notification.is_read).length,
    status: notifications.filter(notification => notification.type === 'status' && !notification.is_read).length,
  };
  const groups = activeFilter === 'all' ? [
    {
      id: 'booking',
      title: local('Поездки и бронирования', 'Trips and bookings', 'ทริปและการจอง'),
      items: entries.filter(({ category }) => category === 'booking'),
    },
    {
      id: 'order',
      title: local('Заказы', 'Orders', 'คำสั่งซื้อ'),
      items: entries.filter(({ category }) => category === 'order'),
    },
    {
      id: 'updates',
      title: local('Обновления', 'Updates', 'การอัปเดต'),
      items: entries.filter(({ category }) => category !== 'booking' && category !== 'order'),
    },
  ] : [{
    id: activeFilter,
    title: null,
    items: entries.filter(({ notification, category }) =>
      (activeFilter === 'status' ? notification.type : category) === activeFilter,
    ),
  }];
  const visibleGroups = groups.filter(({ items }) => items.length > 0);

  if (isLoading) {
    return (
      <div className="space-y-4" role="status">
        <span className="sr-only">{local('Загружаем уведомления', 'Loading notifications', 'กำลังโหลดการแจ้งเตือน')}</span>
        <div aria-hidden="true"><ContentSkeleton variant="list" count={4} /></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={local('Нет уведомлений', 'No notifications', 'ไม่มีการแจ้งเตือน')}
        description={local('Здесь появятся напоминания о бронированиях и обновления', 'Your booking reminders and updates will appear here', 'การแจ้งเตือนการจองและการอัปเดตของคุณจะแสดงที่นี่')}
        action={
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.NOTIFICATION_SETTINGS)}>
            <Settings className="size-4" aria-hidden="true" />
            {local('Настроить уведомления', 'Configure notifications', 'ตั้งค่าการแจ้งเตือน')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={isMarkingAll}
            onClick={handleMarkAllRead}
          >
            {isMarkingAll
              ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
              : <CheckCheck className="size-4" aria-hidden="true" />}
            {local('Прочитать все', 'Mark all read', 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด')}
          </Button>
        )}
      </div>
      {markAllFailed && (
        <p role="alert" className="text-body-sm text-destructive">
          {local('Не удалось отметить уведомления прочитанными. Попробуйте ещё раз.', 'Could not mark all notifications as read. Try again.', 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้วทั้งหมด โปรดลองอีกครั้ง')}
        </p>
      )}

      {/* Notifications list with virtualization for large lists */}
      <AnimatePresence mode="popLayout">
        {visibleGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8"
          >
            <EmptyState
              icon={BellOff}
              title={local('Нет уведомлений', 'No notifications', 'ไม่มีการแจ้งเตือน')}
              description={local('В этой категории нет уведомлений', 'No notifications in this category', 'ไม่มีการแจ้งเตือนในหมวดหมู่นี้')}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {visibleGroups.map(({ id, title, items }) => (
              <section key={id} aria-labelledby={title ? `notifications-${id}` : undefined} className="space-y-2">
                {title && <h2 id={`notifications-${id}`} className="text-h4 font-display">{title}</h2>}
                <VirtualNotificationList
                  notifications={items.map(({ notification }) => notification)}
                  onMarkRead={onMarkRead}
                  onDelete={onDelete}
                />
              </section>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
