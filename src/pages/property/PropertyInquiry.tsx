import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, AlertCircle, Zap, ChevronRight, ChevronDown, ChevronUp, CalendarIcon, Edit2, Shield, ScrollText, CreditCard, User, Loader2 } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import { usePropertyBlockedDates } from '@/hooks/usePropertyAvailability';
import { DepositPaymentOptions } from '@/components/property/DepositPaymentOptions';
import { useOrders } from '@/hooks/useOrders';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Russian pluralization helper for nights
function pluralizeNights(n: number, isRu: boolean): string {
  if (!isRu) return n === 1 ? 'night' : 'nights';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ночь';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'ночи';
  return 'ночей';
}

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { profile } = useProfile();
  const isRu = language === 'ru';
  const { createOrder } = useOrders();

  // Determine booking mode from property data
  const { data: property } = usePropertyWithRentalTerms(id);
  const rentalTerms = property?.rentalTerms;
  const isInstantBooking = !!(property?.instant_booking || rentalTerms?.instant_booking);
  // Get dates and guests from URL params (set on the property detail page)
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  const checkIn = checkInParam ? parseISO(checkInParam) : null;
  const checkOut = checkOutParam ? parseISO(checkOutParam) : null;
  const guests = guestsParam ? parseInt(guestsParam, 10) : 2;

  const hasDates = checkIn && checkOut;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [contactOpen, setContactOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // rentalTerms already derived above from property
  // Autofill from profile
  useEffect(() => {
    if (profile) {
      const name = profile.full_name || '';
      const email = profile.email || '';
      const phone = profile.phone || '';
      setFormData(prev => ({
        ...prev,
        name: prev.name || name,
        email: prev.email || email,
        phone: prev.phone || phone,
      }));
      // If profile has incomplete data, open the contact section
      if (!name || !phone) {
        setContactOpen(true);
      }
    } else {
      setContactOpen(true);
    }
  }, [profile]);

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

  const isFormValid = formData.name && formData.phone && hasDates && validationErrors.length === 0;
  const propertyTitle = isRu ? property?.title_ru : property?.title_en;
  const propertyImage = property?.cover_image || property?.images?.[0];

  const editUrl = `/property/${id}`;

  const cancellationLabels: Record<string, { en: string; ru: string }> = {
    flexible: { en: 'Free cancellation up to 24h before check-in', ru: 'Бесплатная отмена за 24ч до заезда' },
    moderate: { en: 'Free cancellation up to 5 days before check-in', ru: 'Бесплатная отмена за 5 дней до заезда' },
    strict: { en: 'Non-refundable after booking', ru: 'Невозвратная после бронирования' },
  };

  // If no dates, prompt the user to go back
  if (!hasDates) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-4">
          <CalendarIcon className="w-12 h-12 text-muted-foreground" />
          <h1 className="text-xl font-display font-bold">
            {isRu ? 'Выберите даты' : 'Select your dates'}
          </h1>
          <p className="text-muted-foreground max-w-sm">
            {isRu
              ? 'Чтобы забронировать, сначала выберите даты заезда и выезда на странице объекта.'
              : 'To book, please select check-in and check-out dates on the property page first.'}
          </p>
          <Button onClick={() => navigate(editUrl)} size="lg">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {isRu ? 'Выбрать даты' : 'Select dates'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-28">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center gap-4 p-4">
            <BackButton fallbackPath={editUrl} variant="ghost" />
            <h1 className="text-lg font-display font-bold">
              {isInstantBooking 
                ? (isRu ? 'Подтвердить и оплатить' : 'Confirm and pay')
                : (isRu ? 'Запросить бронирование' : 'Request to book')}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-6">

          {/* ===== YOUR TRIP ===== */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{isRu ? 'Ваша поездка' : 'Your trip'}</h2>

            {/* Property mini-card */}
            {property && (
              <div className="flex gap-3 p-3 rounded-xl border bg-card">
                {propertyImage && (
                  <img
                    src={propertyImage}
                    alt={propertyTitle || ''}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm line-clamp-2">{propertyTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {property.district || 'Phuket'}
                  </p>
                  {rentalTerms?.instant_booking && (
                    <Badge className="mt-1 gap-1 bg-primary/10 text-primary border-primary/20 text-[10px]">
                      <Zap className="h-2.5 w-2.5" />
                      {isRu ? 'Мгновенное бронирование' : 'Instant Book'}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Dates row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isRu ? 'Даты' : 'Dates'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })}
                  {' → '}
                  {format(checkOut, 'd MMM', { locale: isRu ? ru : undefined })}
                  {' · '}
                  {nights} {pluralizeNights(nights, isRu)}
                </p>
                {(rentalTerms?.check_in_time || rentalTerms?.check_out_time) && (
                  <p className="text-xs text-muted-foreground">
                    {rentalTerms?.check_in_time && `${isRu ? 'Заезд с' : 'Check-in from'} ${rentalTerms.check_in_time}`}
                    {rentalTerms?.check_in_time && rentalTerms?.check_out_time && ' · '}
                    {rentalTerms?.check_out_time && `${isRu ? 'Выезд до' : 'Check-out by'} ${rentalTerms.check_out_time}`}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(editUrl)} className="text-primary shrink-0">
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                {isRu ? 'Изменить' : 'Edit'}
              </Button>
            </div>

            <Separator />

            {/* Guests row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isRu ? 'Гости' : 'Guests'}</p>
                <p className="text-sm text-muted-foreground">
                  {guests} {isRu ? (guests === 1 ? 'гость' : (guests >= 2 && guests <= 4 ? 'гостя' : 'гостей')) : (guests === 1 ? 'guest' : 'guests')}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(editUrl)} className="text-primary shrink-0">
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                {isRu ? 'Изменить' : 'Edit'}
              </Button>
            </div>
          </section>

          <Separator />

          {/* ===== PRICE BREAKDOWN ===== */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{isRu ? 'Стоимость' : 'Price details'}</h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatPrice(pricePerNight)} × {nights} {isRu ? 'ночей' : 'nights'}
                </span>
                <span>{formatPrice(pricing.subtotal)}</span>
              </div>

              {pricing.discount > 0 && (
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

              {rentalTerms?.deposit_amount && rentalTerms.deposit_amount > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{isRu ? 'Залог (возвратный)' : 'Security deposit (refundable)'}</span>
                  <span>{formatPrice(rentalTerms.deposit_amount)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between font-semibold text-lg">
              <span>{isRu ? 'Итого' : 'Total'}</span>
              <span>{formatPrice(pricing.total)}</span>
            </div>

            {/* 10% deposit callout — only for instant booking */}
            {isInstantBooking && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isRu ? 'Предоплата 10% сейчас' : '10% deposit due now'}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPrice(Math.round(pricing.total * 0.1))}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {isRu
                    ? 'Остаток оплачивается при заезде'
                    : 'Remaining balance due at check-in'}
                </p>
              </div>
            )}

            {/* Request info — only for non-instant */}
            {!isInstantBooking && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  {isRu
                    ? 'Оплата не списывается сейчас. Хозяин рассмотрит ваш запрос в течение 24 часов.'
                    : "You won't be charged yet. The host will review your request within 24 hours."}
                </p>
              </div>
            )}
          </section>

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

          <Separator />

          {/* ===== CONTACT INFO (collapsible, auto-filled) ===== */}
          <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{isRu ? 'Контактные данные' : 'Contact info'}</h2>
              </div>
              <div className="flex items-center gap-2">
                {formData.name && formData.phone && !contactOpen && (
                  <span className="text-xs text-muted-foreground">{formData.name}</span>
                )}
                <ChevronDown className={cn("h-4 w-4 transition-transform", contactOpen && "rotate-180")} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
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
                <Label htmlFor="message">{isRu ? 'Сообщение хозяину (опционально)' : 'Message to host (optional)'}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={isRu ? 'Особые пожелания...' : 'Special requests...'}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ===== CANCELLATION POLICY ===== */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{isRu ? 'Условия отмены' : 'Cancellation policy'}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {rentalTerms?.cancellation_policy
                ? (cancellationLabels[rentalTerms.cancellation_policy]?.[isRu ? 'ru' : 'en'] || rentalTerms.cancellation_policy)
                : (isRu ? 'Уточняйте у хозяина' : 'Check with the host')}
            </p>
          </section>

          <Separator />

          {/* ===== GROUND RULES (collapsible) ===== */}
          {(rentalTerms?.house_rules || rentalTerms?.house_rules_ru) && (
            <>
              <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{isRu ? 'Правила дома' : 'Ground rules'}</h2>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", rulesOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="text-sm text-muted-foreground whitespace-pre-line rounded-lg bg-muted/30 p-3">
                    {isRu ? (rentalTerms?.house_rules_ru || rentalTerms?.house_rules) : rentalTerms?.house_rules}
                  </div>
                  {(rentalTerms?.smoking_penalty || rentalTerms?.late_checkout_penalty || rentalTerms?.pet_deposit) && (
                    <div className="mt-2 space-y-1">
                      {rentalTerms?.smoking_penalty && (
                        <p className="text-xs text-destructive">
                          {isRu ? `Штраф за курение: ${formatPrice(rentalTerms.smoking_penalty)}` : `Smoking penalty: ${formatPrice(rentalTerms.smoking_penalty)}`}
                        </p>
                      )}
                      {rentalTerms?.late_checkout_penalty && (
                        <p className="text-xs text-amber-600">
                          {isRu ? `Поздний выезд: ${formatPrice(rentalTerms.late_checkout_penalty)}` : `Late checkout: ${formatPrice(rentalTerms.late_checkout_penalty)}`}
                        </p>
                      )}
                      {rentalTerms?.pet_deposit && (
                        <p className="text-xs text-muted-foreground">
                          {isRu ? `Залог за питомца: ${formatPrice(rentalTerms.pet_deposit)}` : `Pet deposit: ${formatPrice(rentalTerms.pet_deposit)}`}
                        </p>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* ===== AUTH CHECK ===== */}
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

          {/* ===== PAYMENT OPTIONS (only for instant booking) ===== */}
          {user && isFormValid && isInstantBooking && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{isRu ? 'Оплата' : 'Pay with'}</h2>
              </div>
              <DepositPaymentOptions
                propertyId={id!}
                propertyTitle={propertyTitle || 'Property'}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={nights}
                totalAmount={pricing.total}
                cleaningFee={rentalTerms?.extra_cleaning_price || (property as any)?.cleaning_fee || 0}
                guestName={formData.name}
                guestPhone={formData.phone}
                guestEmail={formData.email}
                providerOrgId={(property as any)?.provider_id || undefined}
              />
            </section>
          )}

          {/* Form incomplete nudge */}
          {user && !isFormValid && (
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                {!formData.name || !formData.phone
                  ? (isRu ? 'Заполните контактные данные для продолжения' : 'Fill in your contact info to continue')
                  : (isRu ? 'Проверьте параметры бронирования' : 'Check your booking details')}
              </p>
            </div>
          )}
        </div>

        {/* ===== STICKY CONFIRM / REQUEST BUTTON (only for non-instant / request mode) ===== */}
        {user && isFormValid && !isInstantBooking && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t p-4 safe-area-bottom">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{formatPrice(pricing.total)}</span>
              <span className="text-xs text-muted-foreground">
                {nights} {pluralizeNights(nights, isRu)}
              </span>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
              size="lg"
              disabled={isSubmitting}
              onClick={async () => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  // 1. Save to property_inquiries for owner dashboard visibility
                  const { error: inquiryError } = await supabase
                    .from('property_inquiries')
                    .insert({
                      property_id: id!,
                      user_id: user!.id,
                      check_in: format(checkIn!, 'yyyy-MM-dd'),
                      check_out: format(checkOut!, 'yyyy-MM-dd'),
                      guests,
                      name: formData.name,
                      email: formData.email || null,
                      phone: formData.phone || null,
                      message: formData.message || null,
                      status: 'pending',
                    });
                  if (inquiryError) {
                    console.error('[PropertyInquiry] inquiry insert error:', inquiryError);
                  }

                  // 2. Create order for booking tracking
                  const result = await createOrder({
                    order_type: 'property',
                    provider_org_id: (property as any)?.provider_id || undefined,
                    start_at: checkIn!,
                    end_at: checkOut!,
                    total_amount: pricing.total,
                    currency: 'THB',
                    notes: formData.message || undefined,
                    metadata: {
                      property_id: id,
                      property_title: propertyTitle,
                      guests,
                      nights,
                      price_per_night: pricePerNight,
                      deposit_amount: rentalTerms?.deposit_amount || 0,
                      discount_percent: pricing.discountPercent,
                      booking_mode: 'request',
                      ...((rentalTerms as any)?.manager_email ? { manager_email: (rentalTerms as any).manager_email } : {}),
                      ...((rentalTerms as any)?.manager_phone ? { manager_phone: (rentalTerms as any).manager_phone } : {}),
                    },
                    items: [{
                      item_name: propertyTitle || 'Property booking',
                      item_type: 'property_rental',
                      qty: nights,
                      unit_price: pricePerNight,
                      amount: pricing.total,
                      start_at: checkIn!,
                      end_at: checkOut!,
                      metadata: { source_id: id },
                    }],
                    participants: [{
                      role: 'primary',
                      name: formData.name,
                      phone: formData.phone,
                      email: formData.email || undefined,
                    }],
                    serviceName: propertyTitle || 'Property',
                  });
                  if (result.success && result.order_id) {
                    toast.success(isRu 
                      ? 'Запрос отправлен! Хозяин ответит в течение 24 часов.' 
                      : 'Request sent! The host will respond within 24 hours.');
                    navigate(`/bookings/${result.order_id}`, { replace: true });
                  }
                } catch (err) {
                  // Error toast is handled by useOrders
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              {isRu ? 'Запросить бронирование' : 'Request to book'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              {isRu 
                ? 'Оплата не списывается. Хозяин подтвердит бронирование.' 
                : "You won't be charged. The host will confirm your booking."}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
