import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Settings, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/uno/EmptyState';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { NotificationFilters, NotificationFilterType } from './NotificationFilters';
import { NotificationItemData } from './NotificationItem';
import { VirtualNotificationList } from './VirtualNotificationList';
import { groupNotifications, shortRef } from '@/lib/notifications/groupNotifications';

interface NotificationInboxProps {
  notifications: NotificationItemData[];
  isLoading: boolean;
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
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
  const isRu = language === 'ru';

  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');

  // Calculate filter counts
  const counts = useMemo(() => ({
    all: notifications.filter(n => !n.is_read).length,
    booking: notifications.filter(n => n.type === 'booking' && !n.is_read).length,
    promotion: notifications.filter(n => n.type === 'promotion' && !n.is_read).length,
    status: notifications.filter(n => n.type === 'status' && !n.is_read).length,
  }), [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const groups = useMemo(() => groupNotifications(filteredNotifications), [filteredNotifications]);
  const isGrouped = groups.some((g) => g.kind !== 'other');
  const groupTitle = (kind: string, ref: string | null) =>
    kind === 'trip' ? `${isRu ? 'Поездка' : 'Trip'} · ${shortRef(ref ?? '')}`
      : kind === 'purchase' ? `${isRu ? 'Покупка' : 'Purchase'} · ${shortRef(ref ?? '')}`
        : (isRu ? 'Другие уведомления' : 'Other updates');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ContentSkeleton variant="list" count={4} />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={isRu ? 'Нет уведомлений' : 'No notifications'}
        description={isRu 
          ? 'Здесь появятся ваши уведомления о бронированиях, акциях и обновлениях' 
          : 'Your booking reminders, promotions and updates will appear here'}
        action={
          <Button variant="outline" onClick={() => navigate('/profile/notifications')}>
            <Settings className="w-4 h-4 mr-2" />
            {isRu ? 'Настроить уведомления' : 'Configure notifications'}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between gap-3">
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0 h-8"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Notifications list with virtualization for large lists */}
      <AnimatePresence mode="popLayout">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8"
          >
            <EmptyState
              icon={BellOff}
              title={isRu ? 'Нет уведомлений' : 'No notifications'}
              description={isRu 
                ? 'В этой категории нет уведомлений' 
                : 'No notifications in this category'}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isGrouped ? (
              <div className="space-y-6">
                {groups.map((g) => (
                  <section key={g.key} aria-label={groupTitle(g.kind, g.ref)}>
                    <h2 className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                      {groupTitle(g.kind, g.ref)}
                    </h2>
                    <VirtualNotificationList notifications={g.items} onMarkRead={onMarkRead} onDelete={onDelete} />
                  </section>
                ))}
              </div>
            ) : (
              <VirtualNotificationList
                notifications={filteredNotifications}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
