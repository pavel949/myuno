import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, Phone, User, CheckCircle, MapPin, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface PropertyTourLeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function PropertyTourLeadForm({ open, onOpenChange, source = 'home_banner' }: PropertyTourLeadFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferredDate: '',
    guests: '2',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    try {
      const preferredDates = formData.preferredDate
        ? [{ date: formData.preferredDate, time: '' }]
        : null;

      const { data, error } = await supabase.from('consultation_requests').insert({
        user_id: user?.id || null,
        request_type: 'property_tour',
        name: formData.name,
        phone: formData.phone,
        preferred_dates: preferredDates,
        guests_count: parseInt(formData.guests) || 2,
        notes: `[Free Property Tour] Source: ${source}. ${formData.notes}`.trim(),
        status: 'pending',
        vertical_id: 'property',
        lead_source: 'website',
        entry_point: source,
      }).select().single();

      if (error) throw error;

      if (data) {
        supabase.functions.invoke('notify-admin-order', {
          body: {
            order_id: data.id,
            order_number: `TOUR-${data.id.slice(0, 8).toUpperCase()}`,
            order_type: 'property',
            total_amount: 0,
            currency: 'THB',
            customer_name: formData.name,
            customer_phone: formData.phone,
            notes: `🏠 Free Property Tour Request\nGuests: ${formData.guests}\nPreferred date: ${formData.preferredDate || 'Flexible'}\n${formData.notes}`,
          },
        }).catch(err => logger.error('Failed to send tour notification:', err));
      }

      setIsSuccess(true);
      toast.success(isRu ? 'Заявка отправлена!' : 'Request submitted!');
    } catch (err) {
      logger.error('Lead form error:', err);
      toast.error(isRu ? 'Ошибка, попробуйте позже' : 'Error, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (isSuccess) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', phone: '', preferredDate: '', guests: '2', notes: '' });
      }, 300);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleClose}
      title={isRu ? 'Бесплатный тур по недвижимости' : 'Free Property Tour'}
      description={isRu
        ? 'Заполните форму — мы организуем индивидуальный тур'
        : "Fill the form — we'll organize a personalized tour"}
      icon={<Gift className="w-5 h-5 text-primary" />}
      size="md"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {isRu ? 'Спасибо за заявку!' : 'Thank you!'}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {isRu
              ? 'Мы свяжемся с вами в WhatsApp в течение часа для согласования деталей тура.'
              : "We'll contact you via WhatsApp within an hour to arrange tour details."}
          </p>
          <Button onClick={handleClose} className="mt-2">
            {isRu ? 'Закрыть' : 'Close'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {isRu ? 'Имя' : 'Name'} *
            </Label>
            <Input
              required
              placeholder={isRu ? 'Ваше имя' : 'Your name'}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'} *
            </Label>
            <Input
              required
              type="tel"
              placeholder="+66..."
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {isRu ? 'Желаемая дата' : 'Preferred date'}
              </Label>
              <Input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {isRu ? 'Гостей' : 'Guests'}
              </Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.guests}
                onChange={(e) => setFormData(prev => ({ ...prev, guests: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {isRu ? 'Пожелания (район, тип, бюджет)' : 'Preferences (area, type, budget)'}
            </Label>
            <Textarea
              placeholder={isRu ? 'Например: виллы в Банг Тао, бюджет до 10М ฿' : 'E.g.: villas in Bang Tao, budget up to 10M ฿'}
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting
              ? (isRu ? 'Отправка...' : 'Submitting...')
              : (isRu ? 'Записаться на тур' : 'Book a Free Tour')}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            {isRu
              ? 'Нажимая кнопку, вы соглашаетесь на обработку данных'
              : 'By clicking, you agree to data processing'}
          </p>
        </form>
      )}
    </ResponsiveModal>
  );
}
