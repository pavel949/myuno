import React, { useState } from 'react';
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
  Settings,
  Sparkles,
  RefreshCw,
  Gift,
  Percent,
  Send
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { EmptyState } from '@/components/uno/EmptyState';
import { AnimatedList, AnimatedItem } from '@/components/layout/AnimatedList';
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
    triggerBookingReminders,
    sendPromotion,
  } = useNotifications();

  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoForm, setPromoForm] = useState({
    title: '',
    title_ru: '',
    body: '',
    body_ru: '',
    promo_code: '',
    discount: '',
  });

  const handleSendPromo = async () => {
    if (!promoForm.title_ru || !promoForm.body_ru) {
      return;
    }
    setPromoLoading(true);
    await sendPromotion({
      ...promoForm,
      discount: promoForm.discount ? parseInt(promoForm.discount) : undefined,
    });
    setPromoLoading(false);
    setShowPromoForm(false);
    setPromoForm({ title: '', title_ru: '', body: '', body_ru: '', promo_code: '', discount: '' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-primary" />;
      case 'promotion':
        return <Tag className="w-5 h-5 text-success" />;
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
        <PageContainer>
          <PageHeader 
            title={language === 'ru' ? 'Уведомления' : 'Notifications'} 
            showBack 
          />
          <EmptyState
            icon={Bell}
            title={language === 'ru' ? 'Войдите в аккаунт' : 'Sign in required'}
            description={language === 'ru' 
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
          title={language === 'ru' ? 'Уведомления' : 'Notifications'}
          showBack
          badge={unreadCount}
          actions={
            notifications.length > 0 && unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Прочитать все' : 'Mark all read'}
              </Button>
            )
          }
        />

        <Tabs defaultValue="notifications" className="w-full">
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
          <TabsContent value="notifications" className="space-y-3 mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <SectionCard key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </SectionCard>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={language === 'ru' ? 'Нет уведомлений' : 'No notifications'}
                description={language === 'ru' 
                  ? 'Здесь появятся ваши уведомления' 
                  : 'Your notifications will appear here'}
              />
            ) : (
              <AnimatedList className="space-y-3">
                {notifications.map(notification => (
                  <AnimatedItem key={notification.id}>
                    <SectionCard 
                      className={`transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-secondary rounded-xl">
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
                    </SectionCard>
                  </AnimatedItem>
                ))}
              </AnimatedList>
            )}
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4 mt-0">
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
                    <Tag className="w-5 h-5 text-success" />
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
                    <Info className="w-5 h-5 text-info" />
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

            {/* Auto Reminders */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Автоматические напоминания' : 'Automatic Reminders'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'Проверить предстоящие бронирования и отправить напоминания' 
                    : 'Check upcoming bookings and send reminders'}
                </p>
                <Button 
                  variant="default"
                  className="w-full"
                  onClick={triggerBookingReminders}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Запустить проверку' : 'Trigger Check'}
                </Button>
              </CardContent>
            </Card>

            {/* Send Promotion */}
            <Card className="border-success/30 bg-success/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="w-5 h-5 text-success" />
                  {language === 'ru' ? 'Отправить акцию' : 'Send Promotion'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'Отправить уведомление об акции всем подписанным пользователям' 
                    : 'Send a promotion notification to all subscribed users'}
                </p>
                
                {!showPromoForm ? (
                  <Button 
                    variant="default"
                    className="w-full bg-success hover:bg-success/90"
                    onClick={() => setShowPromoForm(true)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Создать акцию' : 'Create Promotion'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder={language === 'ru' ? 'Заголовок (рус)' : 'Title (Russian)'}
                      value={promoForm.title_ru}
                      onChange={(e) => setPromoForm(p => ({ ...p, title_ru: e.target.value }))}
                    />
                    <Textarea
                      placeholder={language === 'ru' ? 'Текст акции (рус)' : 'Promotion text (Russian)'}
                      value={promoForm.body_ru}
                      onChange={(e) => setPromoForm(p => ({ ...p, body_ru: e.target.value }))}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder={language === 'ru' ? 'Промокод' : 'Promo code'}
                        value={promoForm.promo_code}
                        onChange={(e) => setPromoForm(p => ({ ...p, promo_code: e.target.value.toUpperCase() }))}
                      />
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder={language === 'ru' ? 'Скидка' : 'Discount'}
                          className="pl-9"
                          value={promoForm.discount}
                          onChange={(e) => setPromoForm(p => ({ ...p, discount: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowPromoForm(false)}
                      >
                        {language === 'ru' ? 'Отмена' : 'Cancel'}
                      </Button>
                      <Button 
                        className="flex-1 bg-success hover:bg-success/90"
                        onClick={handleSendPromo}
                        disabled={promoLoading || !promoForm.title_ru || !promoForm.body_ru}
                      >
                        {promoLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {language === 'ru' ? 'Отправить' : 'Send'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demo Notifications */}
            <Card className="border-dashed border-muted-foreground/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Тестовые уведомления' : 'Demo Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'Создайте тестовые уведомления для проверки' 
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
                    <Tag className="w-4 h-4 mr-2 text-success" />
                    {language === 'ru' ? 'Акция / Скидка' : 'Promotion / Discount'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => createDemoNotification('status')}
                  >
                    <Info className="w-4 h-4 mr-2 text-info" />
                    {language === 'ru' ? 'Обновление статуса' : 'Status Update'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  );
}
