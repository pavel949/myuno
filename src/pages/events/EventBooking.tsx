import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Phone, Mail, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEvent } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EventBooking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { event, isLoading } = useEvent(id);

  const ticketCount = parseInt(searchParams.get('tickets') || '1');
  const totalPrice = (event?.price || 0) * ticketCount;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hotelName: '',
    roomNumber: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите в аккаунт' : 'Please login first');
      navigate('/auth');
      return;
    }

    if (!event) return;

    setIsSubmitting(true);

    try {
      // Use the dedicated event_bookings table
      const { error: bookingError } = await supabase
        .from('event_bookings')
        .insert({
          event_id: event.id,
          user_id: user.id,
          tickets: ticketCount,
          total_amount: totalPrice,
          currency: event.currency,
          contact_name: formData.name,
          contact_phone: formData.phone,
          contact_email: formData.email || null,
          pickup_hotel: formData.hotelName || null,
          pickup_room: formData.roomNumber || null,
          notes: formData.notes || null,
          status: 'pending',
        });

      if (bookingError) throw bookingError;

      setIsSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(language === 'ru' ? 'Ошибка бронирования' : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-10 w-32 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">
          {language === 'ru' ? 'Событие не найдено' : 'Event not found'}
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            {language === 'ru' ? 'Бронирование подтверждено!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-muted-foreground mb-2">
            {language === 'ru' ? event.title_ru : event.title_en}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            {formatDate(event.event_date)} • {event.event_time}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {ticketCount} {language === 'ru' ? 'билет(ов)' : 'ticket(s)'} • ฿{totalPrice.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            {language === 'ru' 
              ? 'Мы свяжемся с вами для подтверждения деталей'
              : 'We will contact you to confirm the details'}
          </p>
          <Button onClick={() => navigate('/events')}>
            {language === 'ru' ? 'Вернуться к событиям' : 'Back to Events'}
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
            {language === 'ru' ? 'Оформление билетов' : 'Book Tickets'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Order Summary */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-3">
            {language === 'ru' ? 'Ваш заказ' : 'Your Order'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{language === 'ru' ? event.title_ru : event.title_en}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(event.event_date)} • {event.event_time}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {ticketCount} {language === 'ru' ? 'билет(ов)' : 'ticket(s)'}
              </span>
              <span>฿{event.price?.toLocaleString()} × {ticketCount}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-semibold">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary">฿{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">{language === 'ru' ? 'Имя' : 'Full Name'} *</Label>
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
            <Label htmlFor="phone">{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
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
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Место забора' : 'Pickup Location'}
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="hotelName">
              {language === 'ru' ? 'Название отеля' : 'Hotel Name'}
            </Label>
            <Input
              id="hotelName"
              value={formData.hotelName}
              onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
              placeholder={language === 'ru' ? 'Где вас забрать?' : 'Where should we pick you up?'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomNumber">
              {language === 'ru' ? 'Номер комнаты' : 'Room Number'}
            </Label>
            <Input
              id="roomNumber"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'ru' ? 'Комментарий' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'ru' ? 'Особые пожелания...' : 'Special requests...'}
            />
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting 
            ? (language === 'ru' ? 'Оформление...' : 'Processing...')
            : (language === 'ru' ? `Оплатить ฿${totalPrice.toLocaleString()}` : `Pay ฿${totalPrice.toLocaleString()}`)
          }
        </Button>
      </form>
    </div>
  );
};

export default EventBooking;
