import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

export default function NotificationSettings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();

  const [formData, setFormData] = useState({
    booking_reminders: true,
    promotions: true,
    status_updates: true,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        booking_reminders: preferences.booking_reminders,
        promotions: preferences.promotions,
        status_updates: preferences.status_updates,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(formData);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Уведомления' : 'Notifications'} showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={isRu ? 'Уведомления' : 'Notifications'} showBack />

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
            <Bell className="w-4 h-4" />
            {isRu ? 'Настройки уведомлений' : 'Notification Settings'}
          </div>
          <SectionCard className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-sm">{isRu ? 'Напоминания о бронированиях' : 'Booking Reminders'}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Уведомления о предстоящих бронированиях' : 'Notifications about upcoming bookings'}</p>
              </div>
              <Switch
                checked={formData.booking_reminders}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, booking_reminders: v }))}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-sm">{isRu ? 'Акции и скидки' : 'Promotions'}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Специальные предложения и новости' : 'Special offers and news'}</p>
              </div>
              <Switch
                checked={formData.promotions}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, promotions: v }))}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-sm">{isRu ? 'Обновления статуса' : 'Status Updates'}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Изменения статуса заказов' : 'Order status changes'}</p>
              </div>
              <Switch
                checked={formData.status_updates}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, status_updates: v }))}
              />
            </div>
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button className="w-full gap-2" size="lg" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
            {isRu ? 'Сохранить настройки' : 'Save Settings'}
          </Button>
        </motion.div>
      </div>
    </PageContainer>
  );
}
