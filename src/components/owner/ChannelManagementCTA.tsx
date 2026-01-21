import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Globe, 
  MessageSquare, 
  Camera, 
  TrendingUp, 
  Clock,
  Check,
  Star,
  ArrowRight,
  X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const locale = {
  ru: {
    title: 'Доверьте управление каналами UNO',
    subtitle: 'Мы возьмём на себя размещение и синхронизацию на всех платформах',
    benefits: [
      { icon: Globe, text: 'Размещение на Airbnb, Booking, VRBO' },
      { icon: Clock, text: 'Синхронизация календарей 24/7' },
      { icon: TrendingUp, text: 'Динамическое ценообразование' },
      { icon: MessageSquare, text: 'Ответы гостям на 5 языках' },
      { icon: Camera, text: 'Профессиональные фото и описания' },
    ],
    plans: {
      basic: {
        name: 'Базовый',
        commission: '5%',
        commissionLabel: 'от OTA-бронирований',
        features: [
          'Синхронизация iCal 24/7',
          'Уведомления о бронях',
          'Базовая поддержка',
          'Мониторинг ошибок',
        ],
      },
      premium: {
        name: 'Премиум',
        commission: '10%',
        commissionLabel: 'от OTA-бронирований',
        badge: 'Популярный',
        features: [
          'Всё из базового тарифа',
          'Управление ценами',
          'Коммуникация с гостями',
          'Оптимизация листингов',
          'Приоритетная поддержка',
        ],
      },
    },
    fullManagement: 'Нужно полное управление? От 15%',
    cta: 'Оставить заявку',
    dialog: {
      title: 'Заявка на управление каналами',
      name: 'Ваше имя',
      phone: 'Телефон',
      email: 'Email (необязательно)',
      plan: 'Выберите тариф',
      properties: 'Выберите объекты',
      platforms: 'Какие платформы интересуют?',
      currentSituation: 'Уже есть листинги на OTA? Расскажите подробнее',
      notes: 'Дополнительные пожелания',
      submit: 'Отправить заявку',
      submitting: 'Отправка...',
    },
    platformOptions: ['Airbnb', 'Booking.com', 'VRBO', 'Expedia', 'Другие'],
    allProperties: 'Все мои объекты',
  },
  en: {
    title: 'Let UNO Manage Your Channels',
    subtitle: 'We handle listing and synchronization across all platforms',
    benefits: [
      { icon: Globe, text: 'Listing on Airbnb, Booking, VRBO' },
      { icon: Clock, text: '24/7 calendar synchronization' },
      { icon: TrendingUp, text: 'Dynamic pricing optimization' },
      { icon: MessageSquare, text: 'Guest communication in 5 languages' },
      { icon: Camera, text: 'Professional photos & descriptions' },
    ],
    plans: {
      basic: {
        name: 'Basic',
        commission: '5%',
        commissionLabel: 'of OTA bookings',
        features: [
          '24/7 iCal synchronization',
          'Booking notifications',
          'Basic support',
          'Error monitoring',
        ],
      },
      premium: {
        name: 'Premium',
        commission: '10%',
        commissionLabel: 'of OTA bookings',
        badge: 'Popular',
        features: [
          'Everything in Basic',
          'Price management',
          'Guest communication',
          'Listing optimization',
          'Priority support',
        ],
      },
    },
    fullManagement: 'Need full management? From 15%',
    cta: 'Request Service',
    dialog: {
      title: 'Channel Management Request',
      name: 'Your name',
      phone: 'Phone',
      email: 'Email (optional)',
      plan: 'Select plan',
      properties: 'Select properties',
      platforms: 'Which platforms are you interested in?',
      currentSituation: 'Do you have existing OTA listings? Tell us more',
      notes: 'Additional notes',
      submit: 'Submit Request',
      submitting: 'Submitting...',
    },
    platformOptions: ['Airbnb', 'Booking.com', 'VRBO', 'Expedia', 'Other'],
    allProperties: 'All my properties',
  },
};

export function ChannelManagementCTA() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { requestChannelManagement } = useConsultationRequests();
  const { data: properties } = useOwnerProperties();
  const t = locale[language as keyof typeof locale] || locale.en;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    plan: 'premium' as 'basic' | 'premium',
    propertyIds: [] as string[],
    platforms: [] as string[],
    currentSituation: '',
    notes: '',
  });

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handlePropertyToggle = (propertyId: string) => {
    setFormData(prev => ({
      ...prev,
      propertyIds: prev.propertyIds.includes(propertyId)
        ? prev.propertyIds.filter(id => id !== propertyId)
        : [...prev.propertyIds, propertyId],
    }));
  };

  const handleSelectAllProperties = () => {
    if (properties) {
      setFormData(prev => ({
        ...prev,
        propertyIds: prev.propertyIds.length === properties.length 
          ? [] 
          : properties.map(p => p.id),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    try {
      await requestChannelManagement.mutateAsync({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        property_ids: formData.propertyIds.length > 0 ? formData.propertyIds : undefined,
        notes: `План: ${formData.plan === 'basic' ? 'Базовый (5%)' : 'Премиум (10%)'}\nПлатформы: ${formData.platforms.join(', ')}\nТекущая ситуация: ${formData.currentSituation}\n${formData.notes}`,
      });
      setDialogOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        plan: 'premium',
        propertyIds: [],
        platforms: [],
        currentSituation: '',
        notes: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.phone && formData.platforms.length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{t.title}</h3>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {t.benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50"
            >
              <benefit.icon className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{benefit.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Basic Plan */}
          <div className="rounded-xl border border-border bg-background/80 p-5">
            <div className="mb-4">
              <h4 className="font-semibold text-foreground">{t.plans.basic.name}</h4>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-foreground">{t.plans.basic.commission}</span>
                <span className="text-sm text-muted-foreground">{t.plans.basic.commissionLabel}</span>
              </div>
            </div>
            <ul className="space-y-2">
              {t.plans.basic.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 relative">
            <div className="absolute -top-3 left-4">
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                <Star className="h-3 w-3" />
                {t.plans.premium.badge}
              </span>
            </div>
            <div className="mb-4 mt-2">
              <h4 className="font-semibold text-foreground">{t.plans.premium.name}</h4>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-primary">{t.plans.premium.commission}</span>
                <span className="text-sm text-muted-foreground">{t.plans.premium.commissionLabel}</span>
              </div>
            </div>
            <ul className="space-y-2">
              {t.plans.premium.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <PremiumButton
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            {t.cta}
            <ArrowRight className="h-4 w-4 ml-2" />
          </PremiumButton>
          <a
            href="/owner/full-management"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t.fullManagement} →
          </a>
        </div>
      </motion.div>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.dialog.title}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Contact Info */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">{t.dialog.name} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">{t.dialog.phone} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">{t.dialog.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <Label>{t.dialog.plan}</Label>
              <RadioGroup
                value={formData.plan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value as 'basic' | 'premium' }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="plan-basic" />
                  <Label htmlFor="plan-basic" className="font-normal cursor-pointer">
                    {t.plans.basic.name} — {t.plans.basic.commission}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premium" id="plan-premium" />
                  <Label htmlFor="plan-premium" className="font-normal cursor-pointer">
                    {t.plans.premium.name} — {t.plans.premium.commission}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Platforms */}
            <div>
              <Label>{t.dialog.platforms} *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {t.platformOptions.map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => handlePlatformToggle(platform)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.platforms.includes(platform)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Properties */}
            {properties && properties.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>{t.dialog.properties}</Label>
                  <button
                    type="button"
                    onClick={handleSelectAllProperties}
                    className="text-xs text-primary hover:underline"
                  >
                    {t.allProperties}
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {properties.map(property => (
                    <div key={property.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`property-${property.id}`}
                        checked={formData.propertyIds.includes(property.id)}
                        onCheckedChange={() => handlePropertyToggle(property.id)}
                      />
                      <Label htmlFor={`property-${property.id}`} className="font-normal cursor-pointer text-sm">
                        {property.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Situation */}
            <div>
              <Label htmlFor="currentSituation">{t.dialog.currentSituation}</Label>
              <Textarea
                id="currentSituation"
                value={formData.currentSituation}
                onChange={e => setFormData(prev => ({ ...prev, currentSituation: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">{t.dialog.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Submit */}
            <PremiumButton
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? t.dialog.submitting : t.dialog.submit}
            </PremiumButton>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
