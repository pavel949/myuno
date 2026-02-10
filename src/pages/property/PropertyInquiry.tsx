import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, MessageCircle, AlertCircle, Zap, ChevronRight, ChevronDown, ChevronUp, CalendarIcon, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import { usePropertyBlockedDates } from '@/hooks/usePropertyAvailability';
import { DepositPaymentOptions } from '@/components/property/DepositPaymentOptions';
import { BookingTermsCard } from '@/components/property/BookingTermsCard';
import { BookingStepProgress, type BookingStep } from '@/components/booking/BookingStepProgress';
import { differenceInDays, format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const propertyBookingSteps: BookingStep[] = [
  { id: 'dates', labelEn: 'Dates', labelRu: 'Даты' },
  { id: 'contact', labelEn: 'Contact', labelRu: 'Контакты' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
];

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { profile } = useProfile();
  const isRu = language === 'ru';

  // Get dates from URL params if available
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  // Date range state — initialized from URL or empty
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (checkInParam && checkOutParam) {
      return { from: parseISO(checkInParam), to: parseISO(checkOutParam) };
    }
    return undefined;
  });
  const [guests, setGuests] = useState(guestsParam ? parseInt(guestsParam, 10) : 2);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  const checkIn = dateRange?.from || null;
  const checkOut = dateRange?.to || null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Current step: 0 = dates, 1 = contact, 2 = payment
  const currentStep = !checkIn || !checkOut ? 0 : !formData.name || !formData.phone ? 1 : 2;

  const { data: property } = usePropertyWithRentalTerms(id);
  const rentalTerms = property?.rentalTerms;
  const { data: blockedDates } = usePropertyBlockedDates(id);

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

  const isDateBlocked = (date: Date) => {
    return blockedDates?.some(
      blocked => blocked.date.toDateString() === date.toDateString()
    ) ?? false;
  };

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(checkOut, checkIn);
  }, [checkIn, checkOut]);

  const pricePerNight = rentalTerms?.price_per_night || property?.price || 0;

  const pricing = useMemo(() => {
    if (!pricePerNight || nights <= 0) {
      return { subtotal: 0, discount: 0, total: 0, discountPercent: 0 };
    }
    const subtotal = pricePerNight * nights;
    let discountPercent = 0;
    if (nights >= 30 && rentalTerms?.monthly_discount) {
      discountPercent = rentalTerms.monthly_discount;
    } else if (nights >= 7 && rentalTerms?.weekly_discount) {
      discountPercent = rentalTerms.weekly_discount;
    }
    const discount = Math.round(subtotal * (discountPercent / 100));
    const total = subtotal - discount;
    return { subtotal, discount, total, discountPercent };
  }, [pricePerNight, nights, rentalTerms]);

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
    return errors;
  }, [nights, rentalTerms, guests, isRu]);

  const isFormValid = formData.name && formData.phone && checkIn && checkOut && validationErrors.length === 0;
  const propertyTitle = isRu ? property?.title_ru : property?.title_en;

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-8">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center gap-4 p-4">
            <BackButton fallbackPath={`/property/${id}`} variant="ghost" />
            <div>
              <h1 className="text-lg font-display font-bold">
                {isRu ? 'Бронирование' : 'Book Property'}
              </h1>
              {property && (
                <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                  {propertyTitle}
                </p>
              )}
            </div>
          </div>
          <div className="px-4 pb-2">
            <BookingStepProgress steps={propertyBookingSteps} currentStep={currentStep} />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Price & Instant Booking Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">{formatPrice(pricePerNight)}</span>
              <span className="text-muted-foreground ml-1">/ {isRu ? 'ночь' : 'night'}</span>
            </div>
            {rentalTerms?.instant_booking && (
              <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
                <Zap className="h-3 w-3" />
                {isRu ? 'Мгновенное' : 'Instant'}
              </Badge>
            )}
          </div>

          {/* ===== STEP 0: DATE & GUEST SELECTION ===== */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {isRu ? 'Выберите даты' : 'Select Dates'}
            </h2>

            {/* Inline Calendar */}
            <div className="flex justify-center">
              <Calendar
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
                className="pointer-events-auto"
              />
            </div>

            {/* Selected dates display */}
            {checkIn && checkOut && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{isRu ? 'Заезд' : 'Check-in'}</p>
                    <p className="font-semibold text-sm">{format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })}</p>
                    {rentalTerms?.check_in_time && (
                      <p className="text-[10px] text-muted-foreground">{isRu ? 'с' : 'from'} {rentalTerms.check_in_time}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{isRu ? 'Выезд' : 'Check-out'}</p>
                    <p className="font-semibold text-sm">{format(checkOut, 'd MMM', { locale: isRu ? ru : undefined })}</p>
                    {rentalTerms?.check_out_time && (
                      <p className="text-[10px] text-muted-foreground">{isRu ? 'до' : 'by'} {rentalTerms.check_out_time}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {nights} {isRu ? (nights === 1 ? 'ночь' : 'ночей') : (nights === 1 ? 'night' : 'nights')}
                </Badge>
              </div>
            )}

            {/* Guests */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{isRu ? 'Гости' : 'Guests'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                >
                  -
                </Button>
                <span className="w-6 text-center font-medium">{guests}</span>
                <Button
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
            {rentalTerms?.max_guests && (
              <p className="text-xs text-muted-foreground text-right">
                {isRu ? `Максимум ${rentalTerms.max_guests} гостей` : `Maximum ${rentalTerms.max_guests} guests`}
              </p>
            )}
          </div>

          {/* ===== PRICE BREAKDOWN ===== */}
          {nights > 0 && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <button
                className="flex items-center justify-between w-full text-sm"
                onClick={() => setShowPriceDetails(!showPriceDetails)}
              >
                <span className="underline">
                  {formatPrice(pricePerNight)} × {nights} {isRu ? 'ночей' : 'nights'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatPrice(pricing.subtotal)}</span>
                  {showPriceDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {showPriceDetails && pricing.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>
                    {pricing.discountPercent}% {isRu ? 'скидка' : 'discount'}
                    {pricing.discountPercent === rentalTerms?.monthly_discount
                      ? ` (${isRu ? 'месяц' : 'monthly'})`
                      : ` (${isRu ? 'неделя' : 'weekly'})`
                    }
                  </span>
                  <span>-{formatPrice(pricing.discount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between font-semibold text-lg">
                <span>{isRu ? 'Итого' : 'Total'}</span>
                <span>{formatPrice(pricing.total)}</span>
              </div>

              {/* 10% deposit info */}
              <div className="pt-2 border-t border-dashed">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isRu ? 'Предоплата 10%' : '10% Deposit'}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPrice(Math.round(pricing.total * 0.1))}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {isRu
                    ? 'Невозвратная предоплата для подтверждения'
                    : 'Non-refundable to confirm booking'}
                </p>
              </div>
            </div>
          )}

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

          {/* Min stay info */}
          {rentalTerms?.min_stay_nights && rentalTerms.min_stay_nights > 1 && (
            <p className="text-xs text-center text-muted-foreground">
              {isRu
                ? `Мин. срок проживания: ${rentalTerms.min_stay_nights} ночей`
                : `Minimum stay: ${rentalTerms.min_stay_nights} nights`
              }
            </p>
          )}

          {/* ===== STEP 1: CONTACT INFO (only when dates selected) ===== */}
          {checkIn && checkOut && nights > 0 && validationErrors.length === 0 && (
            <div className="space-y-4">
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
                    <Label htmlFor="phone">{isRu ? 'Телефон' : 'Phone'} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+66..."
                      required
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
            </div>
          )}

          {/* Auth check */}
          {!user && checkIn && checkOut && (
            <div className="p-4 rounded-xl bg-muted/50 border text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Для бронирования необходимо войти в аккаунт' : 'Please sign in to book'}
              </p>
              <Button onClick={() => navigate('/auth')} variant="outline">
                {isRu ? 'Войти' : 'Sign In'}
              </Button>
            </div>
          )}

          {/* ===== STEP 2: PAYMENT (only when contact filled) ===== */}
          {user && isFormValid && (
            <DepositPaymentOptions
              propertyId={id!}
              propertyTitle={propertyTitle || 'Property'}
              checkIn={checkIn!}
              checkOut={checkOut!}
              guests={guests}
              nights={nights}
              totalAmount={pricing.total}
              guestName={formData.name}
              guestPhone={formData.phone}
              guestEmail={formData.email}
            />
          )}

          {/* Form incomplete message */}
          {user && !isFormValid && checkIn && checkOut && (
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Заполните имя и телефон для продолжения'
                  : 'Fill in name and phone to continue'}
              </p>
            </div>
          )}

          {/* Booking Terms */}
          <BookingTermsCard
            cancellationPolicy={rentalTerms?.cancellation_policy}
            securityDeposit={rentalTerms?.deposit_amount}
            cleaningFee={rentalTerms?.extra_cleaning_price}
            checkInTime={rentalTerms?.check_in_time}
            checkOutTime={rentalTerms?.check_out_time}
            houseRules={rentalTerms?.house_rules}
            houseRulesRu={rentalTerms?.house_rules_ru}
            smokingPenalty={rentalTerms?.smoking_penalty}
            lateCheckoutPenalty={rentalTerms?.late_checkout_penalty}
            petDeposit={rentalTerms?.pet_deposit}
          />
        </div>
      </div>
    </AppLayout>
  );
}
