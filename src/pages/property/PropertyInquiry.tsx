import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MessageCircle, Check, AlertCircle, Clock, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyAvailability, usePropertyBlockedDates, usePropertyRentalTerms } from '@/hooks/usePropertyAvailability';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, format, isSameDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRu = language === 'ru';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Get rental terms and blocked dates
  const { data: rentalTerms } = usePropertyRentalTerms(id);
  const { data: blockedDates } = usePropertyBlockedDates(id);
  const { data: availability } = usePropertyAvailability(id, formData.checkIn, formData.checkOut);

  // Calculate nights and total
  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    return differenceInDays(new Date(formData.checkOut), new Date(formData.checkIn));
  }, [formData.checkIn, formData.checkOut]);

  const totalPrice = useMemo(() => {
    if (!rentalTerms?.price_per_night || nights <= 0) return 0;
    return rentalTerms.price_per_night * nights;
  }, [rentalTerms?.price_per_night, nights]);

  // Check if date is blocked
  const isDateBlocked = (date: Date) => {
    if (!blockedDates) return false;
    return blockedDates.some(blocked => isSameDay(blocked.date, date));
  };

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (nights > 0 && rentalTerms?.min_stay_nights && nights < rentalTerms.min_stay_nights) {
      errors.push(isRu 
        ? `Минимальный срок проживания: ${rentalTerms.min_stay_nights} ночей` 
        : `Minimum stay: ${rentalTerms.min_stay_nights} nights`);
    }
    
    if (rentalTerms?.max_guests && formData.guests > rentalTerms.max_guests) {
      errors.push(isRu 
        ? `Максимум гостей: ${rentalTerms.max_guests}` 
        : `Maximum guests: ${rentalTerms.max_guests}`);
    }
    
    if (availability && !availability.isAvailable) {
      errors.push(isRu ? 'Выбранные даты недоступны' : 'Selected dates are not available');
    }
    
    return errors;
  }, [nights, rentalTerms, formData.guests, availability, isRu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: isRu ? 'Требуется авторизация' : 'Login Required',
        description: isRu 
          ? 'Пожалуйста, войдите для бронирования' 
          : 'Please login to make a booking',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (validationErrors.length > 0) {
      toast({
        title: isRu ? 'Ошибка валидации' : 'Validation Error',
        description: validationErrors[0],
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine if this is instant booking or requires confirmation
      const status = rentalTerms?.instant_booking ? 'confirmed' : 'submitted';

      // Create booking in the main bookings table
      const { error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          booking_type: 'property' as const,
          provider_id: id,
          scheduled_at: formData.checkIn,
          total_amount: totalPrice || null,
          currency: rentalTerms?.deposit_currency || 'THB',
          status,
          notes: JSON.stringify({
            check_out: formData.checkOut,
            guests_count: formData.guests,
            guest_name: formData.name,
            guest_email: formData.email,
            guest_phone: formData.phone,
            message: formData.message,
          }),
        }]);

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: rentalTerms?.instant_booking 
          ? (isRu ? 'Забронировано!' : 'Booked!')
          : (isRu ? 'Запрос отправлен!' : 'Request Sent!'),
        description: rentalTerms?.instant_booking
          ? (isRu ? 'Ваше бронирование подтверждено' : 'Your booking is confirmed')
          : (isRu ? 'Владелец свяжется с вами' : 'The owner will contact you'),
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu 
          ? 'Не удалось создать бронирование' 
          : 'Failed to create booking',
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
            {rentalTerms?.instant_booking 
              ? (isRu ? 'Забронировано!' : 'Booking Confirmed!')
              : (isRu ? 'Запрос отправлен!' : 'Request Sent!')}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {rentalTerms?.instant_booking
              ? (isRu 
                  ? 'Ваше бронирование подтверждено. Детали отправлены на email.'
                  : 'Your booking is confirmed. Details sent to your email.')
              : (isRu 
                  ? 'Владелец получил ваш запрос и свяжется с вами в ближайшее время.'
                  : 'The property owner has received your request and will contact you soon.')}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/property')}>
              {isRu ? 'К списку' : 'Browse More'}
            </Button>
            <Button onClick={() => navigate('/bookings')}>
              {isRu ? 'Мои бронирования' : 'My Bookings'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">
            {isRu ? 'Бронирование' : 'Book Property'}
          </h1>
        </div>

        {/* Rental Terms Summary */}
        {rentalTerms && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6 space-y-2">
            {rentalTerms.price_per_night && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Цена за ночь' : 'Price per night'}</span>
                <span className="font-bold text-primary">
                  {rentalTerms.deposit_currency === 'THB' ? '฿' : rentalTerms.deposit_currency === 'USD' ? '$' : '€'}
                  {rentalTerms.price_per_night.toLocaleString()}
                </span>
              </div>
            )}
            {rentalTerms.min_stay_nights && rentalTerms.min_stay_nights > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {isRu ? `Мин. ${rentalTerms.min_stay_nights} ночей` : `Min. ${rentalTerms.min_stay_nights} nights`}
              </div>
            )}
            {rentalTerms.instant_booking && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
              </Badge>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dates */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {isRu ? 'Даты проживания' : 'Stay Dates'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">
                  {isRu ? 'Заезд' : 'Check-in'}
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                  className="mt-1"
                />
                {rentalTerms?.check_in_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRu ? 'с' : 'from'} {rentalTerms.check_in_time}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="checkOut">
                  {isRu ? 'Выезд' : 'Check-out'}
                </Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  min={formData.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  required
                  className="mt-1"
                />
                {rentalTerms?.check_out_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRu ? 'до' : 'by'} {rentalTerms.check_out_time}
                  </p>
                )}
              </div>
            </div>

            {nights > 0 && (
              <div className="pt-2 border-t text-center">
                <span className="text-lg font-bold">{nights}</span>{' '}
                <span className="text-muted-foreground">
                  {isRu ? (nights === 1 ? 'ночь' : 'ночей') : (nights === 1 ? 'night' : 'nights')}
                </span>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
              {validationErrors.map((error, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Guests */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {isRu ? 'Количество гостей' : 'Number of Guests'}
              </span>
              {rentalTerms?.max_guests && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {isRu ? `макс. ${rentalTerms.max_guests}` : `max ${rentalTerms.max_guests}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, guests: Math.max(1, formData.guests - 1) })}
              >
                -
              </Button>
              <span className="text-xl font-bold w-12 text-center">{formData.guests}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ 
                  ...formData, 
                  guests: Math.min(rentalTerms?.max_guests || 20, formData.guests + 1) 
                })}
              >
                +
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h2 className="font-semibold">
              {isRu ? 'Контактная информация' : 'Contact Information'}
            </h2>
            
            <div>
              <Label htmlFor="name">
                {isRu ? 'Имя' : 'Full Name'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isRu ? 'Ваше имя' : 'Your name'}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">
                {isRu ? 'Телефон' : 'Phone'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+66 XX XXX XXXX"
                className="mt-1"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <Label htmlFor="message">
                {isRu ? 'Сообщение' : 'Message'}
              </Label>
            </div>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={isRu 
                ? 'Расскажите о себе и ваших пожеланиях...'
                : 'Tell us about yourself and any special requests...'}
              rows={4}
            />
          </div>

          {/* House Rules */}
          {(rentalTerms?.house_rules || rentalTerms?.house_rules_ru) && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <h3 className="font-medium text-sm">
                {isRu ? 'Правила дома' : 'House Rules'}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {isRu ? (rentalTerms.house_rules_ru || rentalTerms.house_rules) : rentalTerms.house_rules}
              </p>
            </div>
          )}

          {/* Price Summary */}
          {totalPrice > 0 && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center">
                <span>{isRu ? 'Итого' : 'Total'}</span>
                <span className="text-2xl font-bold text-primary">
                  {rentalTerms?.deposit_currency === 'THB' ? '฿' : rentalTerms?.deposit_currency === 'USD' ? '$' : '€'}
                  {totalPrice.toLocaleString()}
                </span>
              </div>
              {rentalTerms?.deposit_amount && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? 'Залог' : 'Deposit'}: {rentalTerms.deposit_currency === 'THB' ? '฿' : '$'}{rentalTerms.deposit_amount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting || !formData.name || !formData.checkIn || !formData.checkOut || validationErrors.length > 0}
          >
            {isSubmitting 
              ? (isRu ? 'Отправка...' : 'Sending...') 
              : rentalTerms?.instant_booking
                ? (isRu ? 'Забронировать' : 'Book Now')
                : (isRu ? 'Отправить запрос' : 'Send Request')}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
