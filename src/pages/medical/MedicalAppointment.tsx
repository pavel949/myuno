import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarIcon, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

const MedicalAppointment = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    symptoms: '',
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

    if (!selectedDate || !selectedTime) {
      toast.error(language === 'ru' ? 'Выберите дату и время' : 'Please select date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const scheduledAt = new Date(`${dateStr}T${selectedTime}:00`).toISOString();

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'service',
          status: 'submitted',
          total_amount: 1500,
          currency: 'THB',
          scheduled_at: scheduledAt,
          notes: `Medical Appointment. Symptoms: ${formData.symptoms}`,
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
          email: formData.email,
          is_primary: true,
        });

      setIsSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(language === 'ru' ? 'Ошибка записи' : 'Booking failed');
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
            {language === 'ru' ? 'Запись подтверждена!' : 'Appointment Confirmed!'}
          </h1>
          <p className="text-muted-foreground mb-2">
            {selectedDate && format(selectedDate, 'PPP', { locale: language === 'ru' ? ru : undefined })} {language === 'ru' ? 'в' : 'at'} {selectedTime}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {language === 'ru' 
              ? 'Мы отправим напоминание на ваш телефон'
              : 'We will send a reminder to your phone'}
          </p>
          <Button onClick={() => navigate('/medical')}>
            {language === 'ru' ? 'Вернуться к клиникам' : 'Back to Clinics'}
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
            {language === 'ru' ? 'Запись на приём' : 'Book Appointment'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Date & Time Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Выберите дату и время' : 'Select Date & Time'}
          </h3>
          
          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Дата' : 'Date'}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate 
                    ? format(selectedDate, "PPP", { locale: language === 'ru' ? ru : undefined }) 
                    : (language === 'ru' ? 'Выберите дату' : 'Pick a date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>{language === 'ru' ? 'Время' : 'Time'}</Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(slot => (
                <Button
                  key={slot}
                  type="button"
                  variant={selectedTime === slot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">{language === 'ru' ? 'Имя' : 'Full Name'}</Label>
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
            <Label htmlFor="email">{language === 'ru' ? 'Email' : 'Email'}</Label>
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

          <div className="space-y-2">
            <Label htmlFor="symptoms">
              {language === 'ru' ? 'Опишите симптомы' : 'Describe Symptoms'}
            </Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder={language === 'ru' ? 'Что вас беспокоит?' : 'What concerns do you have?'}
              rows={4}
            />
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting 
            ? (language === 'ru' ? 'Оформление...' : 'Processing...')
            : (language === 'ru' ? 'Подтвердить запись' : 'Confirm Appointment')
          }
        </Button>
      </form>
    </div>
  );
};

export default MedicalAppointment;