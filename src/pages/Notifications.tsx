import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { EmptyState } from '@/components/uno/EmptyState';
import { NotificationInbox } from '@/components/notifications/NotificationInbox';
import { NotificationItemData } from '@/components/notifications/NotificationItem';

export default function Notifications() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

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
            title={isRu ? 'Уведомления' : 'Notifications'} 
            showBack 
          />
          <EmptyState
            icon={Bell}
            title={isRu ? 'Войдите в аккаунт' : 'Sign in required'}
            description={isRu 
              ? 'Войдите, чтобы управлять уведомлениями' 
              : 'Sign in to manage notifications'}
            action={
              <Button onClick={() => navigate('/auth')}>
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
          title={isRu ? 'Уведомления' : 'Notifications'}
          showBack
          badge={unreadCount}
          actions={
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile/notifications')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          }
        />

        <NotificationInbox
          notifications={transformedNotifications}
          isLoading={isLoading}
          unreadCount={unreadCount}
          onMarkRead={(id) => markAsRead(id)}
          onMarkAllRead={markAllAsRead}
          onDelete={deleteNotification}
          onRefetch={refresh}
        />
      </PageContainer>
    </AppLayout>
  );
}
