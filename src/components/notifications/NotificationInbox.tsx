import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Settings, BellOff } from 'lucide-react';
import { isToday, isYesterday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/uno/EmptyState';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { NotificationFilters, NotificationFilterType } from './NotificationFilters';
import { NotificationGroup } from './NotificationGroup';
import { NotificationItem, NotificationItemData } from './NotificationItem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationInboxProps {
  notifications: NotificationItemData[];
  isLoading: boolean;
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onRefetch?: () => void;
}

export function NotificationInbox({
  notifications,
  isLoading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onRefetch,
}: NotificationInboxProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          onRefetch?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, onRefetch]);

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

  // Group by date
  const groupedNotifications = useMemo(() => {
    const today: NotificationItemData[] = [];
    const yesterday: NotificationItemData[] = [];
    const earlier: NotificationItemData[] = [];

    filteredNotifications.forEach(notification => {
      const date = parseISO(notification.created_at);
      if (isToday(date)) {
        today.push(notification);
      } else if (isYesterday(date)) {
        yesterday.push(notification);
      } else {
        earlier.push(notification);
      }
    });

    return { today, yesterday, earlier };
  }, [filteredNotifications]);

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

      {/* Grouped notifications */}
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
          <div className="space-y-4">
            {groupedNotifications.today.length > 0 && (
              <NotificationGroup label="Today" labelRu="Сегодня">
                {groupedNotifications.today.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={onMarkRead}
                    onDelete={onDelete}
                  />
                ))}
              </NotificationGroup>
            )}

            {groupedNotifications.yesterday.length > 0 && (
              <NotificationGroup label="Yesterday" labelRu="Вчера">
                {groupedNotifications.yesterday.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={onMarkRead}
                    onDelete={onDelete}
                  />
                ))}
              </NotificationGroup>
            )}

            {groupedNotifications.earlier.length > 0 && (
              <NotificationGroup label="Earlier" labelRu="Ранее">
                {groupedNotifications.earlier.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={onMarkRead}
                    onDelete={onDelete}
                  />
                ))}
              </NotificationGroup>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
