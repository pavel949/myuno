import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarCheck, MessageSquare, Shield, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminNotificationsList, AdminNotificationItem } from '@/hooks/useAdminNotificationsList';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeIcons: Record<AdminNotificationItem['type'], React.ElementType> = {
  booking: CalendarCheck,
  consultation: MessageSquare,
  moderation: Shield,
  provider: Building2,
};

const priorityColors: Record<AdminNotificationItem['priority'], string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

export function AdminNotificationsDropdown() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: notifications = [], isLoading } = useAdminNotificationsList();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: AdminNotificationItem) => {
    navigate(notification.link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{isRussian ? 'Уведомления' : 'Notifications'}</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} {isRussian ? 'новых' : 'new'}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <span>{isRussian ? 'Нет новых уведомлений' : 'No new notifications'}</span>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    notification.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                    notification.priority === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-tight truncate">
                      {isRussian ? notification.titleRu : notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isRussian ? notification.descriptionRu : notification.description}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: isRussian ? ru : enUS,
                        })}
                      </span>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0 mt-1",
                      priorityColors[notification.priority]
                    )} />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary font-medium"
              onClick={() => navigate('/admin/operations')}
            >
              {isRussian ? 'Все уведомления' : 'View all notifications'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
