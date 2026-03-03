/**
 * VendorNotificationBell - Live notifications with dropdown
 * Fetches from notifications table, no mock data.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ShoppingBag, MessageSquare, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: Date;
  isRead: boolean;
  data: Record<string, unknown> | null;
}

interface VendorNotificationBellProps {
  className?: string;
}

export function VendorNotificationBell({ className }: VendorNotificationBellProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!cancelled && data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type || 'alert',
          title: n.title,
          body: n.body,
          createdAt: new Date(n.created_at),
          isRead: n.is_read,
          data: n.data as Record<string, unknown> | null,
        })));
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    if (type.includes('order') || type.includes('booking')) return <ShoppingBag className="h-4 w-4 text-info" />;
    if (type.includes('message')) return <MessageSquare className="h-4 w-4 text-primary" />;
    if (type.includes('review')) return <Star className="h-4 w-4 text-warning" />;
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    }
    const href = (notification.data as any)?.href;
    if (href) navigate(href);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (user?.id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: isRu ? ru : enUS });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{isRu ? 'Уведомления' : 'Notifications'}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {isRu ? 'Прочитать все' : 'Mark all read'}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isRu ? 'Нет уведомлений' : 'No notifications'}
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.isRead && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className={cn("text-sm leading-tight", !notification.isRead && "font-medium")}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary"
          onClick={() => navigate('/notifications')}
        >
          {isRu ? 'Все уведомления' : 'View all notifications'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
