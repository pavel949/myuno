import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Phone, MessageSquare, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Time slots
const timeSlots = [
  '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Generate next 7 days
const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
};

export default function BeautyBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const { selectedServices = [], salon } = (location.state || {}) as {
    selectedServices?: string[];
    salon?: any;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const days = getNextDays();

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', options);
  };

  const formatMonthDay = (date: Date) => {
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate totals
  const selectedServiceDetails = salon?.services?.filter((s: any) => 
    selectedServices.includes(s.id)
  ) || [];
  
  const totalPrice = selectedServiceDetails.reduce((sum: number, s: any) => sum + s.price, 0);
  const totalDuration = selectedServiceDetails.reduce((sum: number, s: any) => sum + s.duration, 0);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: language === 'ru' ? 'Требуется авторизация' : 'Login Required',
        description: language === 'ru' 
          ? 'Войдите в аккаунт для бронирования' 
          : 'Please login to make a booking',
        variant: 'destructive',
      });
      navigate('/auth', { state: { returnTo: location.pathname } });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: language === 'ru' ? 'Выберите дату и время' : 'Select Date & Time',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create booking
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'service',
          status: 'submitted',
          total_amount: totalPrice,
          currency: 'THB',
          scheduled_at: scheduledAt.toISOString(),
          notes: notes || null,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add booking items
      const bookingItems = selectedServiceDetails.map((service: any) => ({
        booking_id: booking.id,
        item_type: 'service',
        item_name: language === 'ru' ? service.nameRu : service.name,
        quantity: 1,
        unit_price: service.price,
        subtotal: service.price,
      }));

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(bookingItems);

      if (itemsError) throw itemsError;

      // Add participant if provided
      if (contactName || contactPhone) {
        const { error: participantError } = await supabase
          .from('booking_participants')
          .insert({
            booking_id: booking.id,
            name: contactName || user.email?.split('@')[0] || 'Guest',
            phone: contactPhone || null,
            is_primary: true,
          });

        if (participantError) throw participantError;
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);

    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: language === 'ru' ? 'Ошибка бронирования' : 'Booking Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            {language === 'ru' ? 'Бронирование создано!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ru' 
              ? 'Переходим к вашим бронированиям...' 
              : 'Redirecting to your bookings...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">
              {language === 'ru' ? 'Бронирование' : 'Book Appointment'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {salon?.name || (language === 'ru' ? 'Салон' : 'Salon')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Selected Services Summary */}
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <h2 className="font-medium mb-3">
            {language === 'ru' ? 'Выбранные услуги' : 'Selected Services'}
          </h2>
          <div className="space-y-2">
            {selectedServiceDetails.map((service: any) => (
              <div key={service.id} className="flex justify-between text-sm">
                <span>{language === 'ru' ? service.nameRu : service.name}</span>
                <span className="text-primary">฿{service.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-border/50">
            <span className="font-medium">
              {language === 'ru' ? 'Итого' : 'Total'} ({totalDuration} {language === 'ru' ? 'мин' : 'min'})
            </span>
            <span className="font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Выберите дату' : 'Select Date'}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {days.map((date, index) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isToday = index === 0;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex-shrink-0 w-16 py-3 rounded-xl border transition-all text-center",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className="text-xs opacity-70">
                    {isToday 
                      ? (language === 'ru' ? 'Сегодня' : 'Today')
                      : formatDate(date).split(' ')[0]
                    }
                  </div>
                  <div className="text-lg font-semibold">{date.getDate()}</div>
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatMonthDay(selectedDate)}
            </p>
          )}
        </div>

        {/* Time Selection */}
        <div>
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Выберите время' : 'Select Time'}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    "py-2 rounded-lg border transition-all text-sm font-medium",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card border-border/50 hover:border-primary/30"
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Контактная информация' : 'Contact Information'}
          </h2>
          <div className="space-y-3">
            <Input
              placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="bg-card"
            />
            <Input
              placeholder={language === 'ru' ? 'Телефон' : 'Phone number'}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="bg-card"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Примечания' : 'Notes'}
          </h2>
          <Textarea
            placeholder={language === 'ru' 
              ? 'Особые пожелания или комментарии...' 
              : 'Special requests or comments...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-card min-h-[100px]"
          />
        </div>
      </div>

      {/* Bottom Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
        <div className="max-w-lg mx-auto">
          <PremiumButton
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || isSubmitting}
            isLoading={isSubmitting}
            className="w-full"
            size="lg"
          >
            {language === 'ru' ? 'Подтвердить бронирование' : 'Confirm Booking'} • ฿{totalPrice.toLocaleString()}
          </PremiumButton>
        </div>
      </div>
    </div>
  );
}
