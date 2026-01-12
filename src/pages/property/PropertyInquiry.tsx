import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, MessageCircle, Check, AlertCircle, Clock, Shield, Zap, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyAvailability, usePropertyBlockedDates, usePropertyRentalTerms } from '@/hooks/usePropertyAvailability';
import { useProfile } from '@/hooks/useProfile';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { differenceInDays, format, isSameDay, addDays, startOfDay, isAfter, isBefore, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast: toastHook } = useToast();
  const { profile } = useProfile();
  const isRu = language === 'ru';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Get property info
  const { data: property } = usePropertyWithRentalTerms(id);

  // Get rental terms and blocked dates
  const { data: rentalTerms } = usePropertyRentalTerms(id);
  const { data: blockedDates } = usePropertyBlockedDates(id);
  const { data: availability } = usePropertyAvailability(
    id, 
    dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  // Autofill from profile
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile.full_name || '',
        email: prev.email || profile.email || '',
        phone: prev.phone || profile.phone || '',
      }));
    }
  }, [profile]);

  // Calculate nights and total
  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from);
  }, [dateRange]);

  const pricePerNight = rentalTerms?.price_per_night || property?.price || 0;
  const currency = rentalTerms?.deposit_currency || 'THB';
  const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : '€';

  const totalPrice = useMemo(() => {
    if (!pricePerNight || nights <= 0) return 0;
    return pricePerNight * nights;
  }, [pricePerNight, nights]);

  // Check if date is blocked
  const isDateBlocked = (date: Date) => {
    if (!blockedDates) return false;
    return blockedDates.some(blocked => isSameDay(blocked.date, date));
  };

  // Disable dates: past dates and blocked dates
  const disabledDays = useMemo(() => {
    const disabled: Date[] = [];
    const today = startOfDay(new Date());
    
    // Add all blocked dates
    if (blockedDates) {
      blockedDates.forEach(blocked => {
        disabled.push(blocked.date);
      });
    }
    
    return disabled;
  }, [blockedDates]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (nights > 0 && rentalTerms?.min_stay_nights && nights < rentalTerms.min_stay_nights) {
      errors.push(isRu 
        ? `Минимальный срок проживания: ${rentalTerms.min_stay_nights} ночей` 
        : `Minimum stay: ${rentalTerms.min_stay_nights} nights`);
    }
    
    if (rentalTerms?.max_guests && guests > rentalTerms.max_guests) {
      errors.push(isRu 
        ? `Максимум гостей: ${rentalTerms.max_guests}` 
        : `Maximum guests: ${rentalTerms.max_guests}`);
    }
    
    if (availability && !availability.isAvailable) {
      errors.push(isRu ? 'Выбранные даты недоступны' : 'Selected dates are not available');
    }
    
    return errors;
  }, [nights, rentalTerms, guests, availability, isRu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(isRu ? 'Войдите для бронирования' : 'Please login to book');
      navigate('/auth');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error(isRu ? 'Выберите даты' : 'Select dates');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine if this is instant booking or requires confirmation
      const status = rentalTerms?.instant_booking ? 'confirmed' : 'submitted';

      // Create booking in the main bookings table
      // The trigger sync_booking_to_owner_calendar will sync to property_bookings
      const { error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          booking_type: 'property' as const,
          provider_id: id,
          scheduled_at: format(dateRange.from, 'yyyy-MM-dd'),
          total_amount: totalPrice || null,
          currency: currency,
          status,
          notes: JSON.stringify({
            check_out: format(dateRange.to, 'yyyy-MM-dd'),
            guests_count: guests,
            guest_name: formData.name,
            guest_email: formData.email,
            guest_phone: formData.phone,
            message: formData.message,
            property_title: isRu ? property?.title_ru : property?.title_en,
          }),
        }]);

      if (error) throw error;

      setIsSuccess(true);
      toast.success(
        rentalTerms?.instant_booking 
          ? (isRu ? 'Забронировано!' : 'Booked!')
          : (isRu ? 'Запрос отправлен!' : 'Request Sent!')
      );
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error(isRu ? 'Не удалось создать бронирование' : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {rentalTerms?.instant_booking 
              ? (isRu ? 'Забронировано!' : 'Booking Confirmed!')
              : (isRu ? 'Запрос отправлен!' : 'Request Sent!')}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            {rentalTerms?.instant_booking
              ? (isRu 
                  ? 'Ваше бронирование подтверждено.'
                  : 'Your booking is confirmed.')
              : (isRu 
                  ? 'Владелец свяжется с вами в ближайшее время.'
                  : 'The property owner will contact you soon.')}
          </p>
          
          {/* Booking Summary */}
          <div className="w-full max-w-sm p-4 rounded-xl bg-muted/50 mb-6 space-y-2">
            {property && (
              <p className="font-medium text-sm">
                {isRu ? property.title_ru : property.title_en}
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isRu ? 'Даты' : 'Dates'}</span>
              <span>{dateRange?.from && dateRange?.to && (
                `${format(dateRange.from, 'dd MMM', { locale: isRu ? ru : undefined })} — ${format(dateRange.to, 'dd MMM', { locale: isRu ? ru : undefined })}`
              )}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isRu ? 'Гостей' : 'Guests'}</span>
              <span>{guests}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>{isRu ? 'Итого' : 'Total'}</span>
              <span>{currencySymbol}{totalPrice.toLocaleString()}</span>
            </div>
          </div>
          
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
      <div className="pb-32">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center gap-4 p-4 bg-background/95 backdrop-blur-md border-b">
          <BackButton fallbackPath={`/property/${id}`} variant="ghost" />
          <div>
            <h1 className="text-lg font-display font-bold">
              {isRu ? 'Бронирование' : 'Book Property'}
            </h1>
            {property && (
              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                {isRu ? property.title_ru : property.title_en}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Price & Instant Booking Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">{currencySymbol}{pricePerNight.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">/ {isRu ? 'ночь' : 'night'}</span>
            </div>
            {rentalTerms?.instant_booking && (
              <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
                <Zap className="h-3 w-3" />
                {isRu ? 'Мгновенное' : 'Instant'}
              </Badge>
            )}
          </div>

          {/* Visual Calendar */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-semibold">{isRu ? 'Выберите даты' : 'Select Dates'}</span>
              {rentalTerms?.min_stay_nights && rentalTerms.min_stay_nights > 1 && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {isRu ? `мин. ${rentalTerms.min_stay_nights} ночей` : `min. ${rentalTerms.min_stay_nights} nights`}
                </Badge>
              )}
            </div>
            
            <CalendarComponent
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              disabled={(date) => 
                isBefore(date, startOfDay(new Date())) || isDateBlocked(date)
              }
              modifiers={{
                booked: blockedDates?.map(b => b.date) || [],
              }}
              modifiersClassNames={{
                booked: 'bg-destructive/20 text-destructive line-through',
              }}
              locale={isRu ? ru : undefined}
              className={cn("p-0 pointer-events-auto w-full")}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-between",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2 justify-between",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto",
                  "hover:bg-accent hover:text-accent-foreground rounded-md"
                ),
                day_range_start: "day-range-start rounded-l-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_range_end: "day-range-end rounded-r-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
            
            {/* Selected dates display */}
            {dateRange?.from && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{isRu ? 'Заезд' : 'Check-in'}</p>
                    <p className="font-medium">{format(dateRange.from, 'dd MMM', { locale: isRu ? ru : undefined })}</p>
                    {rentalTerms?.check_in_time && (
                      <p className="text-xs text-muted-foreground">{isRu ? 'с' : 'from'} {rentalTerms.check_in_time}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{isRu ? 'Выезд' : 'Check-out'}</p>
                    <p className="font-medium">
                      {dateRange.to 
                        ? format(dateRange.to, 'dd MMM', { locale: isRu ? ru : undefined })
                        : '—'
                      }
                    </p>
                    {rentalTerms?.check_out_time && (
                      <p className="text-xs text-muted-foreground">{isRu ? 'до' : 'by'} {rentalTerms.check_out_time}</p>
                    )}
                  </div>
                </div>
                {nights > 0 && (
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {nights} {isRu ? (nights === 1 ? 'ночь' : 'ночей') : (nights === 1 ? 'night' : 'nights')}
                  </Badge>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-destructive/20" />
                <span>{isRu ? 'Занято' : 'Booked'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>{isRu ? 'Выбрано' : 'Selected'}</span>
              </div>
            </div>
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
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">{isRu ? 'Гости' : 'Guests'}</span>
                {rentalTerms?.max_guests && (
                  <span className="text-xs text-muted-foreground">
                    ({isRu ? `макс. ${rentalTerms.max_guests}` : `max ${rentalTerms.max_guests}`})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center font-semibold">{guests}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGuests(Math.min(rentalTerms?.max_guests || 20, guests + 1))}
                  disabled={guests >= (rentalTerms?.max_guests || 20)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              {isRu ? 'Контактная информация' : 'Contact Information'}
            </h2>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">{isRu ? 'Имя' : 'Full Name'} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isRu ? 'Ваше имя' : 'Your name'}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{isRu ? 'Телефон' : 'Phone'}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+66..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">{isRu ? 'Сообщение (опционально)' : 'Message (optional)'}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={isRu 
                    ? 'Особые пожелания или вопросы...'
                    : 'Special requests or questions...'}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </form>

          {/* House Rules */}
          {(rentalTerms?.house_rules || rentalTerms?.house_rules_ru) && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {isRu ? 'Правила дома' : 'House Rules'}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {isRu ? (rentalTerms.house_rules_ru || rentalTerms.house_rules) : rentalTerms.house_rules}
              </p>
            </div>
          )}
        </div>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-4 z-30">
          <div className="max-w-lg mx-auto">
            {/* Price breakdown */}
            {nights > 0 && (
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-muted-foreground">
                  {currencySymbol}{pricePerNight.toLocaleString()} × {nights} {isRu ? 'ночей' : 'nights'}
                </span>
                <span className="text-xl font-bold">{currencySymbol}{totalPrice.toLocaleString()}</span>
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold gap-2"
              disabled={isSubmitting || !formData.name || !dateRange?.from || !dateRange?.to || validationErrors.length > 0}
            >
              {isSubmitting ? (
                <span className="animate-pulse">{isRu ? 'Отправка...' : 'Sending...'}</span>
              ) : rentalTerms?.instant_booking ? (
                <>
                  <Zap className="w-4 h-4" />
                  {isRu ? 'Забронировать' : 'Book Now'}
                </>
              ) : (
                isRu ? 'Отправить запрос' : 'Send Request'
              )}
            </Button>
            
            {!user && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {isRu ? 'Для бронирования требуется авторизация' : 'Login required to book'}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
