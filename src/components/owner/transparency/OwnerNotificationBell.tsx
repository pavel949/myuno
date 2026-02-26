import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerNotifications, OwnerNotification } from '@/hooks/useOwnerNotifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatNotifTime(dateStr: string, isRu: boolean) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return isRu ? 'Вчера' : 'Yesterday';
  return format(d, 'd MMM', { locale: isRu ? ru : undefined });
}

export function OwnerNotificationBell() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useOwnerNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-semibold">
            {isRu ? 'Уведомления' : 'Notifications'}
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => markAllAsRead()}>
              <CheckCheck className="w-3.5 h-3.5" />
              {isRu ? 'Прочитать все' : 'Read all'}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isRu ? 'Нет уведомлений' : 'No notifications'}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !n.is_read && "bg-primary/5"
                  )}
                  onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                      {formatNotifTime(n.created_at, isRu)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
