/**
 * VendorNotificationBell - Live notifications with dropdown
 * Benchmark: Slack, Discord, Shopify
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ShoppingBag, MessageSquare, AlertTriangle, Star } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'alert' | 'review';
  titleEn: string;
  titleRu: string;
  descriptionEn?: string;
  descriptionRu?: string;
  createdAt: Date;
  isRead: boolean;
  href?: string;
}

interface VendorNotificationBellProps {
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAllRead?: () => void;
  className?: string;
}

// Mock data for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    titleEn: 'New order received',
    titleRu: 'Получен новый заказ',
    descriptionEn: 'Order #12345 - ฿2,500',
    descriptionRu: 'Заказ #12345 - ฿2,500',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
    href: '/vendor/bookings',
  },
  {
    id: '2',
    type: 'message',
    titleEn: 'New message from customer',
    titleRu: 'Новое сообщение от клиента',
    descriptionEn: 'Regarding booking #12340',
    descriptionRu: 'По поводу заказа #12340',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    href: '/vendor/messages',
  },
  {
    id: '3',
    type: 'review',
    titleEn: 'New 5-star review',
    titleRu: 'Новый отзыв 5 звёзд',
    descriptionEn: '"Excellent service!"',
    descriptionRu: '"Отличный сервис!"',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
    href: '/vendor/reviews',
  },
  {
    id: '4',
    type: 'alert',
    titleEn: 'Low stock warning',
    titleRu: 'Предупреждение о запасах',
    descriptionEn: 'Product "Gift Box" is running low',
    descriptionRu: 'Товар "Подарочная коробка" заканчивается',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    href: '/vendor/products',
  },
];

export function VendorNotificationBell({
  notifications = mockNotifications,
  unreadCount: externalUnreadCount,
  onMarkAllRead,
  className,
}: VendorNotificationBellProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [localNotifications, setLocalNotifications] = useState(notifications);

  const unreadCount = externalUnreadCount ?? localNotifications.filter(n => !n.isRead).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-4 w-4 text-info" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'review':
        return <Star className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setLocalNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    if (notification.href) {
      navigate(notification.href);
    }
  };

  const handleMarkAllRead = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    onMarkAllRead?.();
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: isRu ? ru : enUS 
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative", className)}
        >
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
          {localNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isRu ? 'Нет уведомлений' : 'No notifications'}
            </div>
          ) : (
            localNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.isRead && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className={cn(
                    "text-sm leading-tight",
                    !notification.isRead && "font-medium"
                  )}>
                    {isRu ? notification.titleRu : notification.titleEn}
                  </p>
                  {(notification.descriptionEn || notification.descriptionRu) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {isRu ? notification.descriptionRu : notification.descriptionEn}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatTime(notification.createdAt)}
                  </p>
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
