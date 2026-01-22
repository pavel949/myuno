import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Tag, Info, Check, Trash2, ChevronRight, MessageSquare, Package, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NotificationItemData {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: {
    booking_id?: string;
    order_id?: string;
    promo_code?: string;
    action_url?: string;
  };
}

interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<string, { icon: React.ElementType; gradient: string; iconBg: string }> = {
  booking: {
    icon: Calendar,
    gradient: 'from-blue-500/10 to-transparent',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  promotion: {
    icon: Tag,
    gradient: 'from-amber-500/10 to-transparent',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  status: {
    icon: Info,
    gradient: 'from-green-500/10 to-transparent',
    iconBg: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  order: {
    icon: Package,
    gradient: 'from-purple-500/10 to-transparent',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  message: {
    icon: MessageSquare,
    gradient: 'from-cyan-500/10 to-transparent',
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
  wallet: {
    icon: Wallet,
    gradient: 'from-emerald-500/10 to-transparent',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
};

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const config = typeConfig[notification.type] || typeConfig.status;
  const Icon = config.icon;

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: isRu ? ru : enUS,
    });
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    
    if (notification.data?.action_url) {
      navigate(notification.data.action_url);
    } else if (notification.data?.booking_id) {
      navigate(`/bookings/${notification.data.booking_id}`);
    } else if (notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    }
  };

  const hasAction = notification.data?.action_url || notification.data?.booking_id || notification.data?.order_id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-3 transition-all",
        `bg-gradient-to-r ${config.gradient}`,
        !notification.is_read 
          ? "border-primary/30 bg-primary/5" 
          : "border-border bg-card",
        hasAction && "cursor-pointer hover:border-primary/50"
      )}
      onClick={hasAction ? handleClick : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-medium text-sm line-clamp-1",
              !notification.is_read && "text-foreground"
            )}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.body}
          </p>

          {notification.data?.promo_code && (
            <code className="inline-block mt-1.5 text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
              {notification.data.promo_code}
            </code>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatTime(notification.created_at)}
            </span>
            
            {hasAction && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {isRu ? 'Прочитано' : 'Mark read'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {isRu ? 'Удалить' : 'Delete'}
        </Button>
      </div>
    </motion.div>
  );
}
