import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Tag, Info, Check, Trash2, ChevronRight, MessageSquare, Package, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ru, th } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

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

const typeConfig: Record<string, { icon: React.ElementType; iconBg: string }> = {
  booking: {
    icon: Calendar,
    iconBg: 'bg-primary/10 text-primary',
  },
  promotion: {
    icon: Tag,
    iconBg: 'bg-warning/10 text-warning',
  },
  status: {
    icon: Info,
    iconBg: 'bg-success/10 text-success',
  },
  order: {
    icon: Package,
    iconBg: 'bg-primary/10 text-primary',
  },
  message: {
    icon: MessageSquare,
    iconBg: 'bg-primary/10 text-primary',
  },
  wallet: {
    icon: Wallet,
    iconBg: 'bg-success/10 text-success',
  },
};

export function notificationActionPath(data: NotificationItemData['data']): string | undefined {
  const path = data?.action_url;
  if (
    typeof path === 'string'
    && path.startsWith('/')
    && !path.startsWith('//')
    && !path.includes('\\')
    && !Array.from(path).some(char => char.charCodeAt(0) <= 32)
  ) return path;
  if (typeof data?.booking_id === 'string' && data.booking_id) {
    return APP_ROUTES.BOOKING_DETAIL(encodeURIComponent(data.booking_id));
  }
  if (typeof data?.order_id === 'string' && data.order_id) {
    return APP_ROUTES.ORDER_TRACKING(encodeURIComponent(data.order_id));
  }
}

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const { language } = useLanguage();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const config = typeConfig[notification.type] || typeConfig.status;
  const Icon = config.icon;
  const path = notificationActionPath(notification.data);
  const createdAt = new Date(notification.created_at);
  const hasTimestamp = Number.isFinite(createdAt.getTime());
  const content = (
    <div className="flex min-w-0 items-start gap-3">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[var(--bible-radius-control)]", config.iconBg)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="break-words text-body-sm font-semibold">{notification.title}</h3>
          {!notification.is_read && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
              <span className="sr-only">{local('Непрочитанное', 'Unread', 'ยังไม่ได้อ่าน')}</span>
            </span>
          )}
        </div>
        <p className="break-words text-body-sm text-muted-foreground">{notification.body}</p>
        {typeof notification.data?.promo_code === 'string' && notification.data.promo_code && (
          <code className="inline-block break-all rounded-[var(--bible-radius-control)] bg-primary/10 px-2 py-1 text-body-sm text-primary">
            {notification.data.promo_code}
          </code>
        )}
        {hasTimestamp && (
          <time dateTime={createdAt.toISOString()} className="block text-body-sm text-muted-foreground">
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: language === 'ru' ? ru : language === 'th' ? th : enUS })}
          </time>
        )}
      </div>
      {path && <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
    </div>
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "rounded-[var(--bible-radius-card)] border p-3",
        !notification.is_read
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card",
        path && "hover:border-primary/50"
      )}
    >
      {path ? (
        <Link
          to={path}
          aria-label={notification.title}
          className="block rounded-[var(--bible-radius-control)]"
          onClick={() => { if (!notification.is_read) onMarkRead(notification.id); }}
        >
          {content}
        </Link>
      ) : content}

      <div className="mt-2 flex flex-wrap items-center justify-end gap-1 border-t border-border/50 pt-2">
        {!notification.is_read && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => onMarkRead(notification.id)}
          >
            <Check className="size-4" aria-hidden="true" />
            {local('Прочитано', 'Mark read', 'ทำเครื่องหมายว่าอ่านแล้ว')}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 text-destructive hover:text-destructive"
          onClick={() => onDelete(notification.id)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {local('Удалить', 'Delete', 'ลบ')}
        </Button>
      </div>
    </motion.li>
  );
}
