import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Calendar, 
  Tag, 
  Info,
  ChevronLeft,
  Settings,
  Plus,
  Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

export default function Notifications() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const {
    notifications,
    preferences,
    isSupported,
    isSubscribed,
    isLoading,
    unreadCount,
    subscribe,
    unsubscribe,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createDemoNotification,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-primary" />;
      case 'promotion':
        return <Tag className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: language === 'ru' ? ru : enUS,
    });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {language === 'ru' ? 'Уведомления' : 'Notifications'}
            </h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ru' 
                  ? 'Войдите, чтобы управлять уведомлениями' 
                  : 'Sign in to manage notifications'}
              </p>
              <Button className="mt-4" onClick={() => navigate('/auth')}>
                {t('auth.login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {language === 'ru' ? 'Уведомления' : 'Notifications'}
            </h1>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Прочитать все' : 'Mark all read'}
            </Button>
          )}
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Уведомления' : 'Notifications'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Настройки' : 'Settings'}
            </TabsTrigger>
          </TabsList>

          {/* Notifications List */}
          <TabsContent value="notifications" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'ru' 
                      ? 'Нет уведомлений' 
                      : 'No notifications'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map(notification => (
                <Card 
                  key={notification.id}
                  className={`transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium line-clamp-1">{notification.title}</h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {language === 'ru' ? 'Прочитано' : 'Mark read'}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {language === 'ru' ? 'Удалить' : 'Delete'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            {/* Push Notifications Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isSubscribed ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  Push-{language === 'ru' ? 'уведомления' : 'notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isSupported ? (
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' 
                      ? 'Push-уведомления не поддерживаются в этом браузере' 
                      : 'Push notifications are not supported in this browser'}
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">
                        {language === 'ru' 
                          ? 'Получать уведомления на устройство' 
                          : 'Receive notifications on device'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isSubscribed 
                          ? (language === 'ru' ? 'Включено' : 'Enabled')
                          : (language === 'ru' ? 'Отключено' : 'Disabled')}
                      </p>
                    </div>
                    <Switch 
                      checked={isSubscribed}
                      onCheckedChange={(checked) => checked ? subscribe() : unsubscribe()}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {language === 'ru' ? 'Типы уведомлений' : 'Notification types'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {language === 'ru' ? 'Напоминания о бронированиях' : 'Booking reminders'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' 
                          ? 'За день и за час до встречи' 
                          : 'Day before and hour before'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.booking_reminders}
                    onCheckedChange={(checked) => updatePreferences({ booking_reminders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {language === 'ru' ? 'Акции и скидки' : 'Promotions & deals'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' 
                          ? 'Специальные предложения' 
                          : 'Special offers and discounts'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.promotions}
                    onCheckedChange={(checked) => updatePreferences({ promotions: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {language === 'ru' ? 'Обновления статуса' : 'Status updates'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' 
                          ? 'Изменения в ваших бронированиях' 
                          : 'Changes to your bookings'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.status_updates}
                    onCheckedChange={(checked) => updatePreferences({ status_updates: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Demo Notifications */}
            <Card className="border-dashed border-primary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Тестовые уведомления' : 'Demo Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ru' 
                    ? 'Создайте тестовые уведомления для проверки системы' 
                    : 'Create test notifications to check the system'}
                </p>
                <div className="grid gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => createDemoNotification('booking')}
                  >
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    {language === 'ru' ? 'Напоминание о бронировании' : 'Booking Reminder'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => createDemoNotification('promotion')}
                  >
                    <Tag className="w-4 h-4 mr-2 text-green-500" />
                    {language === 'ru' ? 'Акция / Скидка' : 'Promotion / Discount'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => createDemoNotification('status')}
                  >
                    <Info className="w-4 h-4 mr-2 text-blue-500" />
                    {language === 'ru' ? 'Обновление статуса' : 'Status Update'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
