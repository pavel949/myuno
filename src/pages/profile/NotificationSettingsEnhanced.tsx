import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Save, Moon, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { AppLayout } from '@/components/layout/AppLayout';

const texts = {
  ru: {
    pageTitle: 'Уведомления',
    channels: 'Каналы уведомлений',
    channelsDesc: 'Выберите, как получать уведомления',
    push: 'Push-уведомления',
    pushDesc: 'Мгновенные уведомления на устройство',
    email: 'Email-уведомления',
    emailDesc: 'Сводки и важные обновления',
    sms: 'SMS-уведомления',
    smsDesc: 'Только критически важные сообщения',
    categories: 'Категории уведомлений',
    bookingReminders: 'Напоминания о бронированиях',
    bookingRemindersDesc: 'За 24 часа и 1 час до события',
    statusUpdates: 'Обновления статуса',
    statusUpdatesDesc: 'Изменения статуса заказов',
    promotions: 'Акции и скидки',
    promotionsDesc: 'Специальные предложения и новости',
    documentExpiry: 'Срок документов',
    documentExpiryDesc: 'За 30, 7 и 1 день до истечения',
    walletActivity: 'Активность кошелька',
    walletActivityDesc: 'Начисления и списания бонусов',
    quietHours: 'Тихие часы',
    quietHoursDesc: 'Без уведомлений в выбранное время',
    from: 'С',
    to: 'До',
    sounds: 'Звуки',
    soundsDesc: 'Звуковое оповещение',
    save: 'Сохранить настройки',
  },
  en: {
    pageTitle: 'Notifications',
    channels: 'Notification Channels',
    channelsDesc: 'Choose how to receive notifications',
    push: 'Push Notifications',
    pushDesc: 'Instant notifications on your device',
    email: 'Email Notifications',
    emailDesc: 'Digests and important updates',
    sms: 'SMS Notifications',
    smsDesc: 'Only critical messages',
    categories: 'Notification Categories',
    bookingReminders: 'Booking Reminders',
    bookingRemindersDesc: '24 hours and 1 hour before event',
    statusUpdates: 'Status Updates',
    statusUpdatesDesc: 'Order status changes',
    promotions: 'Promotions',
    promotionsDesc: 'Special offers and news',
    documentExpiry: 'Document Expiry',
    documentExpiryDesc: '30, 7, and 1 day before expiration',
    walletActivity: 'Wallet Activity',
    walletActivityDesc: 'Bonus credits and debits',
    quietHours: 'Quiet Hours',
    quietHoursDesc: 'No notifications during selected time',
    from: 'From',
    to: 'To',
    sounds: 'Sounds',
    soundsDesc: 'Sound alerts',
    save: 'Save Settings',
  },
};

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: `${String(i).padStart(2, '0')}:00`,
}));

export default function NotificationSettingsEnhanced() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = texts[language === 'th' ? 'en' : language] || texts.en;
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();

  const [formData, setFormData] = useState({
    // Channels
    push_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    // Categories
    booking_reminders: true,
    status_updates: true,
    promotions: true,
    document_expiry: true,
    wallet_activity: true,
    // Quiet Hours
    quiet_hours_enabled: false,
    quiet_hours_start: '22',
    quiet_hours_end: '08',
    // Sounds
    sounds_enabled: true,
  });

  useEffect(() => {
    if (preferences) {
      setFormData(prev => ({
        ...prev,
        booking_reminders: preferences.booking_reminders,
        promotions: preferences.promotions,
        status_updates: preferences.status_updates,
      }));
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences({
      booking_reminders: formData.booking_reminders,
      promotions: formData.promotions,
      status_updates: formData.status_updates,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={t.pageTitle} showBack />
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={t.pageTitle} showBack fallbackPath="/profile" />

        <div className="space-y-6 pb-24">
          {/* Channels */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Bell className="w-4 h-4" />
              {t.channels}
            </div>
            <SectionCard>
              <p className="text-xs text-muted-foreground mb-4">{t.channelsDesc}</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.push}</p>
                      <p className="text-xs text-muted-foreground">{t.pushDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.push_enabled}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, push_enabled: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.email}</p>
                      <p className="text-xs text-muted-foreground">{t.emailDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.email_enabled}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, email_enabled: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.sms}</p>
                      <p className="text-xs text-muted-foreground">{t.smsDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.sms_enabled}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, sms_enabled: v }))}
                  />
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Categories */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Bell className="w-4 h-4" />
              {t.categories}
            </div>
            <SectionCard className="divide-y divide-border">
              {[
                { key: 'booking_reminders', label: t.bookingReminders, desc: t.bookingRemindersDesc },
                { key: 'status_updates', label: t.statusUpdates, desc: t.statusUpdatesDesc },
                { key: 'promotions', label: t.promotions, desc: t.promotionsDesc },
                { key: 'document_expiry', label: t.documentExpiry, desc: t.documentExpiryDesc },
                { key: 'wallet_activity', label: t.walletActivity, desc: t.walletActivityDesc },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={formData[item.key as keyof typeof formData] as boolean}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </SectionCard>
          </motion.div>

          {/* Quiet Hours */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Moon className="w-4 h-4" />
              {t.quietHours}
            </div>
            <SectionCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-sm">{t.quietHours}</p>
                  <p className="text-xs text-muted-foreground">{t.quietHoursDesc}</p>
                </div>
                <Switch
                  checked={formData.quiet_hours_enabled}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, quiet_hours_enabled: v }))}
                />
              </div>
              {formData.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t.from}</Label>
                    <Select
                      value={formData.quiet_hours_start}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, quiet_hours_start: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map(h => (
                          <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t.to}</Label>
                    <Select
                      value={formData.quiet_hours_end}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, quiet_hours_end: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map(h => (
                          <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Sounds */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Volume2 className="w-4 h-4" />
              {t.sounds}
            </div>
            <SectionCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t.sounds}</p>
                  <p className="text-xs text-muted-foreground">{t.soundsDesc}</p>
                </div>
                <Switch
                  checked={formData.sounds_enabled}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, sounds_enabled: v }))}
                />
              </div>
            </SectionCard>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button className="w-full gap-2" size="lg" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
              {t.save}
            </Button>
          </motion.div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
