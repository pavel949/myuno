import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationItem, NotificationItemData } from './NotificationItem';

interface VirtualNotificationListProps {
  notifications: NotificationItemData[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function VirtualNotificationList({ notifications, onMarkRead, onDelete }: VirtualNotificationListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkRead}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
