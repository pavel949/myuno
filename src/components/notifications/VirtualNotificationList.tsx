import { useMemo } from 'react';
import { isToday, isYesterday, parseISO } from 'date-fns';
import { GroupedVirtualList } from '@/components/ui/VirtualList';
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationItem, NotificationItemData } from './NotificationItem';

interface VirtualNotificationListProps {
  notifications: NotificationItemData[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  maxHeight?: string;
}

export function VirtualNotificationList({
  notifications,
  onMarkRead,
  onDelete,
  maxHeight = 'calc(100vh - 280px)',
}: VirtualNotificationListProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Group by date
  const groups = useMemo(() => {
    const today: NotificationItemData[] = [];
    const yesterday: NotificationItemData[] = [];
    const earlier: NotificationItemData[] = [];

    notifications.forEach(notification => {
      const date = parseISO(notification.created_at);
      if (isToday(date)) {
        today.push(notification);
      } else if (isYesterday(date)) {
        yesterday.push(notification);
      } else {
        earlier.push(notification);
      }
    });

    return [
      { label: isRu ? 'Сегодня' : 'Today', items: today },
      { label: isRu ? 'Вчера' : 'Yesterday', items: yesterday },
      { label: isRu ? 'Ранее' : 'Earlier', items: earlier },
    ].filter(g => g.items.length > 0);
  }, [notifications, isRu]);

  // For small lists, use regular rendering
  if (notifications.length < 50) {
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Use virtualization for large lists
  return (
    <GroupedVirtualList
      groups={groups}
      estimateSize={88}
      estimateHeaderSize={32}
      maxHeight={maxHeight}
      renderHeader={(label) => (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 py-2 bg-background sticky top-0">
          {label}
        </p>
      )}
      renderItem={(notification) => (
        <NotificationItem
          notification={notification}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      )}
      getItemKey={(item) => item.id}
    />
  );
}
