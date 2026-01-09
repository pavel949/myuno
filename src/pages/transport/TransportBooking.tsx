import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function TransportBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    pickupDate: '',
    returnDate: '',
    pickupLocation: '',
    name: '',
    phone: '',
    notes: '',
  });

  const pricePerDay = 1500;
  const days = formData.pickupDate && formData.returnDate
    ? Math.max(1, Math.ceil((new Date(formData.returnDate).getTime() - new Date(formData.pickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const total = pricePerDay * days;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: language === 'ru' ? 'Требуется авторизация' : 'Login Required',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'transport',
          status: 'submitted',
          scheduled_at: formData.pickupDate,
          total_amount: total,
          notes: formData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: 'pickup',
        address: formData.pickupLocation,
      });

      await supabase.from('booking_participants').insert({
        booking_id: booking.id,
        name: formData.name,
        phone: formData.phone,
        is_primary: true,
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {language === 'ru' ? 'Бронь подтверждена!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {language === 'ru' 
              ? 'Владелец свяжется с вами для подтверждения.'
              : 'The owner will contact you to confirm details.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/transport')}>
              {language === 'ru' ? 'К транспорту' : 'Browse More'}
            </Button>
            <Button onClick={() => navigate('/bookings')}>
              {language === 'ru' ? 'Мои брони' : 'My Bookings'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">
            {language === 'ru' ? 'Бронирование' : 'Booking'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dates */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {language === 'ru' ? 'Даты аренды' : 'Rental Dates'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ru' ? 'Начало' : 'Pick-up'}</Label>
                <Input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === 'ru' ? 'Конец' : 'Return'}</Label>
                <Input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border/50 text-sm">
              <div className="flex justify-between">
                <span>{days} {language === 'ru' ? 'дней' : 'days'} × ฿{pricePerDay}</span>
                <span className="font-bold text-primary">฿{total}</span>
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <Label>{language === 'ru' ? 'Место получения' : 'Pick-up Location'}</Label>
            </div>
            <Input
              value={formData.pickupLocation}
              onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
              placeholder={language === 'ru' ? 'Отель, адрес...' : 'Hotel, address...'}
              required
            />
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="font-semibold">{language === 'ru' ? 'Контакты' : 'Contact'}</h2>
            <div>
              <Label>{language === 'ru' ? 'Имя' : 'Name'} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>{language === 'ru' ? 'Комментарий' : 'Notes'}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting 
              ? (language === 'ru' ? 'Бронирование...' : 'Booking...') 
              : (language === 'ru' ? `Забронировать за ฿${total}` : `Book for ฿${total}`)}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
