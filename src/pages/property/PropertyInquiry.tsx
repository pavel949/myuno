import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, MessageCircle, AlertCircle, Zap, ChevronRight } from 'lucide-react';
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
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import { DepositPaymentOptions } from '@/components/property/DepositPaymentOptions';
import { BookingTermsCard } from '@/components/property/BookingTermsCard';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { profile } = useProfile();
  const isRu = language === 'ru';

  // Get dates from URL params (set by PropertyBookingCard)
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  // Parse dates
  const checkIn = checkInParam ? parseISO(checkInParam) : null;
  const checkOut = checkOutParam ? parseISO(checkOutParam) : null;
  const guests = guestsParam ? parseInt(guestsParam, 10) : 2;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Get property info with rental terms
  const { data: property } = usePropertyWithRentalTerms(id);
  const rentalTerms = property?.rentalTerms;

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

  // Redirect if no dates selected
  useEffect(() => {
    if (!checkIn || !checkOut) {
      toast.error(isRu ? 'Сначала выберите даты' : 'Please select dates first');
      navigate(`/property/${id}`);
    }
  }, [checkIn, checkOut, id, navigate, isRu]);

  // Calculate nights and total
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(checkOut, checkIn);
  }, [checkIn, checkOut]);

  const pricePerNight = rentalTerms?.price_per_night || property?.price || 0;

  const totalPrice = useMemo(() => {
    if (!pricePerNight || nights <= 0) return 0;
    
    let subtotal = pricePerNight * nights;
    let discountPercent = 0;
    
    // Apply weekly/monthly discount
    if (nights >= 30 && rentalTerms?.monthly_discount) {
      discountPercent = rentalTerms.monthly_discount;
    } else if (nights >= 7 && rentalTerms?.weekly_discount) {
      discountPercent = rentalTerms.weekly_discount;
    }
    
    const discount = Math.round(subtotal * (discountPercent / 100));
    return subtotal - discount;
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

  if (!checkIn || !checkOut) {
    return null; // Will redirect
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-8">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center gap-4 p-4 bg-background/95 backdrop-blur-md border-b">
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

          {/* Selected Dates Summary (read-only) */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{isRu ? 'Заезд' : 'Check-in'}</p>
                  <p className="font-semibold">{format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })}</p>
                  {rentalTerms?.check_in_time && (
                    <p className="text-xs text-muted-foreground">{isRu ? 'с' : 'from'} {rentalTerms.check_in_time}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{isRu ? 'Выезд' : 'Check-out'}</p>
                  <p className="font-semibold">{format(checkOut, 'd MMM', { locale: isRu ? ru : undefined })}</p>
                  {rentalTerms?.check_out_time && (
                    <p className="text-xs text-muted-foreground">{isRu ? 'до' : 'by'} {rentalTerms.check_out_time}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {nights} {isRu ? (nights === 1 ? 'ночь' : 'ночей') : (nights === 1 ? 'night' : 'nights')}
              </Badge>
            </div>
            
            {/* Guests */}
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{isRu ? 'Гости' : 'Guests'}</span>
              </div>
              <span className="font-medium">
                {guests} {isRu ? (guests === 1 ? 'гость' : 'гостей') : (guests === 1 ? 'guest' : 'guests')}
              </span>
            </div>
            
            {/* Edit link */}
            <Button 
              variant="link" 
              size="sm" 
              className="mt-2 h-auto p-0 text-xs"
              onClick={() => navigate(`/property/${id}`)}
            >
              {isRu ? 'Изменить даты' : 'Change dates'}
            </Button>
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

          {/* Contact Info */}
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

          {/* Auth check */}
          {!user && (
            <div className="p-4 rounded-xl bg-muted/50 border text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Для бронирования необходимо войти в аккаунт' : 'Please sign in to book'}
              </p>
              <Button onClick={() => navigate('/auth')} variant="outline">
                {isRu ? 'Войти' : 'Sign In'}
              </Button>
            </div>
          )}

          {/* Payment Options (only show if user is logged in and form is valid) */}
          {user && isFormValid && (
            <DepositPaymentOptions
              propertyId={id!}
              propertyTitle={propertyTitle || 'Property'}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              nights={nights}
              totalAmount={totalPrice}
              guestName={formData.name}
              guestPhone={formData.phone}
              guestEmail={formData.email}
            />
          )}

          {/* Form incomplete message */}
          {user && !isFormValid && (
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? 'Заполните имя и телефон для продолжения'
                  : 'Fill in name and phone to continue'}
              </p>
            </div>
          )}

          {/* Booking Terms - Cancellation Policy & Rules */}
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
