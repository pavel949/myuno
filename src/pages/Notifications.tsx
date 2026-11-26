import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { EmptyState } from '@/components/uno/EmptyState';
import { NotificationInbox } from '@/components/notifications/NotificationInbox';
import { NotificationItemData } from '@/components/notifications/NotificationItem';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

export default function Notifications() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const title = local('Уведомления', 'Notifications', 'การแจ้งเตือน');
  
  const {
    notifications,
    isLoading,
    isError,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotificationActions();

  // Transform notifications to match NotificationItemData interface
  const transformedNotifications: NotificationItemData[] = notifications.map(n => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    is_read: n.is_read,
    created_at: n.created_at,
    data: n.data as NotificationItemData['data'],
  }));

  if (!user) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader 
            title={title}
            showBack 
          />
          <EmptyState
            icon={Bell}
            title={local('Войдите в аккаунт', 'Sign in required', 'กรุณาเข้าสู่ระบบ')}
            description={local('Войдите, чтобы управлять уведомлениями', 'Sign in to manage notifications', 'เข้าสู่ระบบเพื่อจัดการการแจ้งเตือน')}
            action={
              <Button onClick={() => redirectToAuth(navigate)}>
                {t('auth.login')}
              </Button>
            }
          />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={title}
          showBack
          badge={unreadCount}
          actions={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(APP_ROUTES.NOTIFICATION_SETTINGS)}
              aria-label={local('Настройки уведомлений', 'Notification settings', 'ตั้งค่าการแจ้งเตือน')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          }
        />

        {isError && <QueryRecovery onRetry={refresh} stale={transformedNotifications.length > 0} />}
        {(!isError || transformedNotifications.length > 0) && (
          <NotificationInbox
            key={user.id}
            notifications={transformedNotifications}
            isLoading={isLoading}
            unreadCount={unreadCount}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
            onDelete={deleteNotification}
          />
        )}
      </PageContainer>
    </AppLayout>
  );
}
