import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Phone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const membershipTypes = {
  day: { price: 800, labelEn: 'Day Pass', labelRu: 'Дневной абонемент' },
  week: { price: 4500, labelEn: 'Weekly Pass', labelRu: 'Недельный абонемент' },
  month: { price: 15000, labelEn: 'Monthly Pass', labelRu: 'Месячный абонемент' },
};

const FitnessBooking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  const membershipType = searchParams.get('type') || 'day';
  const membership = membershipTypes[membershipType as keyof typeof membershipTypes] || membershipTypes.day;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    startDate: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите в аккаунт' : 'Please login first');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'service',
          status: 'submitted',
          total_amount: membership.price,
          currency: 'THB',
          scheduled_at: formData.startDate || null,
          notes: `Fitness Membership: ${membershipType}. ${formData.notes}`,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      await supabase
        .from('booking_participants')
        .insert({
          booking_id: booking.id,
          name: formData.name,
          phone: formData.phone,
          is_primary: true,
        });

      setIsSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(language === 'ru' ? 'Ошибка бронирования' : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            {language === 'ru' ? 'Запись подтверждена!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === 'ru' 
              ? 'Мы свяжемся с вами для подтверждения'
              : 'We will contact you to confirm your booking'}
          </p>
          <Button onClick={() => navigate('/fitness')}>
            {language === 'ru' ? 'Вернуться к залам' : 'Back to Gyms'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {language === 'ru' ? 'Оформление записи' : 'Book Membership'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Membership Summary */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-2">
            {language === 'ru' ? 'Выбранный абонемент' : 'Selected Membership'}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {language === 'ru' ? membership.labelRu : membership.labelEn}
            </span>
            <span className="text-lg font-bold text-primary">
              ฿{membership.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">{language === 'ru' ? 'Имя' : 'Name'}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{language === 'ru' ? 'Телефон' : 'Phone'}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              {language === 'ru' ? 'Дата начала' : 'Start Date'}
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'ru' ? 'Комментарий' : 'Notes'} ({language === 'ru' ? 'необязательно' : 'optional'})
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'ru' ? 'Дополнительные пожелания...' : 'Any special requests...'}
            />
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting 
            ? (language === 'ru' ? 'Оформление...' : 'Processing...')
            : (language === 'ru' ? 'Подтвердить запись' : 'Confirm Booking')
          }
        </Button>
      </form>
    </div>
  );
};

export default FitnessBooking;