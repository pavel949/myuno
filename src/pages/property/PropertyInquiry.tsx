import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, AlertCircle, Zap, ChevronRight, ChevronDown, ChevronUp, CalendarIcon, Edit2, Shield, ScrollText, CreditCard, User, Loader2, Info, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthSheet } from '@/contexts/AuthSheetContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { usePropertyWithRentalTerms } from '@/hooks/useProperties';
import { usePropertyBlockedDates } from '@/hooks/usePropertyAvailability';
import { usePropertyRateSeasons } from '@/hooks/usePropertyRateSeasons';
import { useRareFindBadge } from '@/hooks/useRareFindBadge';
import { DepositPaymentOptions, type DepositPaymentOptionsHandle } from '@/components/property/DepositPaymentOptions';
import { PayWhenSelector, type PayWhenChoice } from '@/components/property/PayWhenSelector';
import type { PaymentMethodId } from '@/hooks/useLastPaymentMethod';
import { useOrders } from '@/hooks/useOrders';
import { calculatePricing, buildPricingRulesFromSeasons, type PricingRules } from '@/lib/pricingEngine';
import { pluralizeNights, pluralizeGuests } from '@/lib/i18n/pluralize';
import { differenceInDays, format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PropertyInquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { openAuthSheet } = useAuthSheet();
  const { profile } = useProfile();
  const isRu = language === 'ru';
  const { createOrder } = useOrders();

  // Draft persistence — survives the AuthSheet round-trip (including OAuth
  // full-page redirects) so guests never lose contact info / message after
  // signing in or after closing the sheet without signing in.
  // We use localStorage (not sessionStorage) so Google/Apple OAuth redirects
  // — which tear down the tab — don't wipe the draft.
  const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  const draftKey = id ? `uno_inquiry_draft_${id}` : null;

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

  const [formData, setFormData] = useState(() => {
    // Restore draft on mount — covers AuthSheet close, OAuth redirect-back,
    // accidental tab close, full reload.
    if (typeof window !== 'undefined' && draftKey) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const fresh = parsed?.ts && Date.now() - parsed.ts < DRAFT_TTL_MS;
          // Only restore if URL params match — prevents bleeding a draft
          // saved for one date range into a different one.
          const urlMatches =
            (!parsed?.checkIn || parsed.checkIn === checkInParam) &&
            (!parsed?.checkOut || parsed.checkOut === checkOutParam) &&
            (!parsed?.guests || String(parsed.guests) === String(guestsParam));
          if (fresh && urlMatches) {
            return {
              name: parsed.name ?? '',
              email: parsed.email ?? '',
              phone: parsed.phone ?? '',
              message: parsed.message ?? '',
            };
          }
          if (!fresh) {
            try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
    }
    return { name: '', email: '', phone: '', message: '' };
  });
  const [contactOpen, setContactOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A1 — "Choose when to pay". Only used when rentalTerms.allow_pay_later is on.
  // Default 'split' preserves the legacy behavior (charge prepay only).
  const [payWhen, setPayWhen] = useState<PayWhenChoice>('split');
  // A2 — current payment method, mirrored from DepositPaymentOptions so the
  // sticky footer can re-label its CTA ("Confirm and pay" vs "Message manager").
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('card');
  const depositPaymentRef = useRef<DepositPaymentOptionsHandle>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  // Listing currency — pulled out so we can also display it in the Total tooltip.
  const listingCurrency = useMemo(
    () =>
      ((property as any)?.currency?.trim?.() ||
        (rentalTerms as any)?.currency?.trim?.() ||
        'THB') as string,
    [property, rentalTerms],
  );
  const { data: isRareFind } = useRareFindBadge(id);

  // Persist form draft on every change, with current URL context attached
  // so a stale draft for different dates can be detected on restore.
  // Empty form → remove the key so we don't ressurect a cleared draft.
  useEffect(() => {
    if (!draftKey) return;
    const hasContent = !!(formData.name || formData.phone || formData.email || formData.message);
    try {
      if (hasContent) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            ...formData,
            checkIn: checkInParam,
            checkOut: checkOutParam,
            guests: guestsParam,
            ts: Date.now(),
          }),
        );
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch { /* ignore quota errors */ }
  }, [draftKey, formData, checkInParam, checkOutParam, guestsParam]);

  // Best-effort flush on tab hide / unload — in case the user closes the tab
  // mid-typing before React's effect commits.
  useEffect(() => {
    if (!draftKey) return;
    const flush = () => {
      const hasContent = !!(formData.name || formData.phone || formData.email || formData.message);
      if (!hasContent) return;
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            ...formData,
            checkIn: checkInParam,
            checkOut: checkOutParam,
            guests: guestsParam,
            ts: Date.now(),
          }),
        );
      } catch { /* ignore */ }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [draftKey, formData, checkInParam, checkOutParam, guestsParam]);

  // Cleared on successful submit (see navigate(`/bookings/:id`) handler below).


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

  // Pull rate seasons (per-property pricing overrides) for the central engine.
  const { data: rateSeasons } = usePropertyRateSeasons(id);

  // Single source of truth for ALL pricing — same engine PropertyBookingCard uses.
  const pricing = useMemo(() => {
    const baseRules: PricingRules = rateSeasons && rateSeasons.length > 0
      ? buildPricingRulesFromSeasons(
          {
            price_per_night: pricePerNight,
            weekly_discount: rentalTerms?.weekly_discount,
            monthly_discount: rentalTerms?.monthly_discount,
            early_booking_discount: (rentalTerms as any)?.early_booking_discount,
            early_booking_days: (rentalTerms as any)?.early_booking_days,
            last_minute_discount: (rentalTerms as any)?.last_minute_discount,
            last_minute_days: (rentalTerms as any)?.last_minute_days,
            custom_length_discounts: (rentalTerms as any)?.custom_length_discounts,
            deposit_amount: rentalTerms?.deposit_amount,
            deposit_currency: rentalTerms?.deposit_currency || 'THB',
            payment_policy: (rentalTerms as any)?.payment_policy || 'prepay_10',
            prepay_percent: (rentalTerms as any)?.prepay_percent,
          },
          rateSeasons,
        )
      : {
          pricePerNight,
          weeklyDiscount: rentalTerms?.weekly_discount,
          monthlyDiscount: rentalTerms?.monthly_discount,
          earlyBookingDiscount: (rentalTerms as any)?.early_booking_discount,
          earlyBookingDays: (rentalTerms as any)?.early_booking_days,
          lastMinuteDiscount: (rentalTerms as any)?.last_minute_discount,
          lastMinuteDays: (rentalTerms as any)?.last_minute_days,
          customLengthDiscounts: (rentalTerms as any)?.custom_length_discounts,
          seasonalPricing: (property as any)?.seasonal_pricing,
          depositAmount: rentalTerms?.deposit_amount,
          depositCurrency: rentalTerms?.deposit_currency || 'THB',
          paymentPolicy: (rentalTerms as any)?.payment_policy || 'prepay_10',
          prepayPercent: (rentalTerms as any)?.prepay_percent,
        };

    if (!checkIn || !checkOut || nights <= 0 || !pricePerNight) {
      return calculatePricing(baseRules, new Date(), new Date()); // empty breakdown
    }
    return calculatePricing(baseRules, checkIn, checkOut);
  }, [pricePerNight, nights, checkIn, checkOut, rentalTerms, rateSeasons, property]);

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
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {rentalTerms?.instant_booking && (
                      <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 text-[10px]">
                        <Zap className="h-2.5 w-2.5" />
                        {isRu ? 'Мгновенное бронирование' : 'Instant Book'}
                      </Badge>
                    )}
                    {/* B1 — Rare find trust badge (>70% occupancy in last 30d) */}
                    {isRareFind && (
                      <Badge className="gap-1 bg-warning/10 text-warning border-warning/20 text-[10px]">
                        <Sparkles className="h-2.5 w-2.5" />
                        {isRu ? 'Редкая находка' : 'Rare find'}
                      </Badge>
                    )}
                  </div>
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
                  {nights} {pluralizeNights(nights, language)}
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
                  {guests} {pluralizeGuests(guests, language)}
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
                  {formatPrice(pricing.nightlyRate || pricePerNight)} × {nights} {pluralizeNights(nights, language)}
                </span>
                <span>{formatPrice(pricing.subtotal)}</span>
              </div>

              {pricing.seasonalAdjustment !== 0 && (
                <div className={cn("flex items-center justify-between text-sm", pricing.seasonalAdjustment > 0 ? "text-warning" : "text-success")}>
                  <span>{isRu ? 'Сезонная корректировка' : 'Seasonal adjustment'}</span>
                  <span>{pricing.seasonalAdjustment > 0 ? '+' : ''}{formatPrice(pricing.seasonalAdjustment)}</span>
                </div>
              )}

              {pricing.lengthDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-success">
                  <span>{pricing.lengthDiscountPercent}% {isRu ? 'скидка за срок' : 'length discount'}</span>
                  <span>-{formatPrice(pricing.lengthDiscount)}</span>
                </div>
              )}

              {pricing.earlyBirdDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-success">
                  <span>{pricing.earlyBirdPercent}% {isRu ? 'раннее бронирование' : 'early booking'}</span>
                  <span>-{formatPrice(pricing.earlyBirdDiscount)}</span>
                </div>
              )}

              {pricing.lastMinuteDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-success">
                  <span>{pricing.lastMinutePercent}% {isRu ? 'горящее предложение' : 'last-minute deal'}</span>
                  <span>-{formatPrice(pricing.lastMinuteDiscount)}</span>
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
              <span className="flex items-center gap-1.5">
                {isRu ? 'Итого' : 'Total'}
                {/* B2 — Currency popover so guests on RUB/THB presets understand
                    what bank actually charges. */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={isRu ? 'Информация о валюте' : 'Currency info'}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-64 text-xs">
                    <p className="font-medium mb-1">
                      {isRu ? `Списание в ${listingCurrency}` : `Charged in ${listingCurrency}`}
                    </p>
                    <p className="text-muted-foreground">
                      {isRu
                        ? 'Сумма показана в выбранной валюте, но списание идёт в валюте объекта. Банк может удержать комиссию за конвертацию.'
                        : 'Shown in your selected currency, but billed in the property currency. Your bank may apply an FX fee.'}
                    </p>
                  </PopoverContent>
                </Popover>
              </span>
              <span className="flex items-baseline gap-1">
                {formatPrice(pricing.total)}
                <sup className="text-[10px] text-muted-foreground font-medium">{listingCurrency}</sup>
              </span>
            </div>

            {/* Prepayment callout — only for instant booking. Uses real prepay_percent. */}
            {isInstantBooking && pricing.prepayAmount > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isRu
                      ? `Предоплата ${pricing.prepayPercent}% сейчас`
                      : `${pricing.prepayPercent}% deposit due now`}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPrice(pricing.prepayAmount)}
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
                        <p className="text-xs text-warning">
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

          {/* ===== AUTH CHECK =====
              Guest sees the full booking form. Sign-in opens the AuthSheet
              in-place so URL params (dates, guests) and form draft survive
              the round-trip — onSuccess re-renders this page with `user` set. */}
          {!user && (
            <div className="p-4 rounded-xl bg-muted/50 border text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Войдите, чтобы продолжить — даты и контактные данные сохранятся'
                  : 'Sign in to continue — your dates and contact info will be kept'}
              </p>
              <Button
                onClick={() => openAuthSheet({ intent: 'booking' })}
                variant="default"
              >
                {isRu ? 'Войти и продолжить' : 'Sign in & continue'}
              </Button>
            </div>
          )}

          {/* ===== PAY-WHEN SELECTOR (A1) — instant booking with allow_pay_later only ===== */}
          {user && isFormValid && isInstantBooking && rentalTerms?.allow_pay_later && pricing.prepayAmount > 0 && pricing.prepayAmount < pricing.total && (
            <PayWhenSelector
              value={payWhen}
              onChange={setPayWhen}
              totalAmount={pricing.total}
              prepayAmount={pricing.prepayAmount}
              prepayPercent={pricing.prepayPercent}
              balanceDueDate={checkIn ? subDays(checkIn, 7) : null}
            />
          )}

          {/* ===== PAYMENT OPTIONS (instant booking only) ===== */}
          {user && isFormValid && isInstantBooking && (
            <section ref={paymentSectionRef}>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{isRu ? 'Оплата' : 'Pay with'}</h2>
              </div>
              <DepositPaymentOptions
                ref={depositPaymentRef}
                propertyId={id!}
                propertyTitle={propertyTitle || 'Property'}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={nights}
                totalAmount={pricing.total}
                prepayAmount={pricing.prepayAmount}
                prepayPercent={pricing.prepayPercent}
                payInFull={!!rentalTerms?.allow_pay_later && payWhen === 'full'}
                cleaningFee={rentalTerms?.extra_cleaning_price || (property as any)?.cleaning_fee || 0}
                guestName={formData.name}
                guestPhone={formData.phone}
                guestEmail={formData.email}
                providerOrgId={(property as any)?.provider_id || undefined}
                onMethodChange={setPaymentMethod}
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

        {/* ===== UNIFIED STICKY FOOTER (A3) — visible for both instant + request modes ===== */}
        {user && isFormValid && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t p-4 safe-area-bottom">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-medium">{formatPrice(pricing.total)}</span>
                <sup className="text-[10px] text-muted-foreground">{listingCurrency}</sup>
              </div>
              <span className="text-xs text-muted-foreground">
                {nights} {pluralizeNights(nights, language)}
              </span>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
              size="lg"
              disabled={isSubmitting}
              onClick={async () => {
                if (isSubmitting) return;

                // === INSTANT BOOKING PATH ===
                if (isInstantBooking) {
                  // If payment options aren't visible yet, scroll into view first.
                  if (!depositPaymentRef.current) {
                    paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    await depositPaymentRef.current.submit();
                  } finally {
                    setIsSubmitting(false);
                  }
                  return;
                }

                // === REQUEST BOOKING PATH ===
                setIsSubmitting(true);
                try {
                  // 0. Atomic availability check — prevents race conditions
                  // when multiple guests try to book the same dates simultaneously.
                  const { data: isAvailable, error: availErr } = await supabase.rpc(
                    'check_property_dates_available',
                    {
                      p_property_id: id!,
                      p_check_in: format(checkIn!, 'yyyy-MM-dd'),
                      p_check_out: format(checkOut!, 'yyyy-MM-dd'),
                    },
                  );
                  if (availErr) {
                    console.error('[PropertyInquiry] availability check error:', availErr);
                    toast.error(
                      isRu
                        ? 'Не удалось проверить доступность дат. Попробуйте ещё раз.'
                        : 'Could not verify date availability. Please try again.',
                    );
                    setIsSubmitting(false);
                    return;
                  }
                  if (isAvailable === false) {
                    toast.error(
                      isRu
                        ? 'Эти даты только что были забронированы. Выберите другие.'
                        : 'These dates were just booked. Please pick different dates.',
                    );
                    setIsSubmitting(false);
                    return;
                  }

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
                    toast.error(
                      isRu
                        ? `Не удалось сохранить запрос: ${inquiryError.message}`
                        : `Failed to save inquiry: ${inquiryError.message}`,
                    );
                    setIsSubmitting(false);
                    return;
                  }

                  // 2. Create order for booking tracking
                  const result = await createOrder({
                    order_type: 'property',
                    provider_org_id: (property as any)?.provider_id || undefined,
                    start_at: checkIn!,
                    end_at: checkOut!,
                    total_amount: pricing.total,
                    currency: listingCurrency,
                    notes: formData.message || undefined,
                    metadata: {
                      property_id: id,
                      property_title: propertyTitle,
                      guests,
                      nights,
                      price_per_night: pricePerNight,
                      // Bug #4 fix: this field is the *security* deposit
                      // (refundable on checkout), NOT the prepayment.
                      // Renaming it stops it being confused in finance reports.
                      security_deposit_amount: rentalTerms?.deposit_amount || 0,
                      discount_percent: pricing.lengthDiscountPercent,
                      length_discount: pricing.lengthDiscount,
                      early_bird_discount: pricing.earlyBirdDiscount,
                      last_minute_discount: pricing.lastMinuteDiscount,
                      seasonal_adjustment: pricing.seasonalAdjustment,
                      prepay_amount: pricing.prepayAmount,
                      prepay_percent: pricing.prepayPercent,
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
                    if (draftKey) {
                      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
                    }
                    toast.success(isRu
                      ? 'Запрос отправлен! Хозяин ответит в течение 24 часов.'
                      : 'Request sent! The host will respond within 24 hours.');
                    navigate(`/bookings/${result.order_id}`, { replace: true });
                  } else {
                    // Bug #3 fix: surface failures from createOrder so the user
                    // is never left staring at a silent footer.
                    toast.error(
                      isRu
                        ? 'Не удалось создать запрос на бронирование. Попробуйте ещё раз.'
                        : 'Could not create the booking request. Please try again.',
                    );
                  }
                } catch (err) {
                  // Error toast is handled by useOrders
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              {isInstantBooking
                ? (paymentMethod === 'card'
                    ? (isRu
                        ? `Подтвердить и оплатить ${formatPrice(payWhen === 'full' ? pricing.total : pricing.prepayAmount)}`
                        : `Confirm and pay ${formatPrice(payWhen === 'full' ? pricing.total : pricing.prepayAmount)}`)
                    : (isRu ? 'Связаться с менеджером' : 'Contact manager'))
                : (isRu ? 'Запросить бронирование' : 'Request to book')}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              {isInstantBooking
                ? (paymentMethod === 'card'
                    ? (isRu ? 'Платёж защищён Stripe' : 'Payment secured by Stripe')
                    : (isRu ? 'Менеджер свяжется в WhatsApp' : 'Manager will reach out on WhatsApp'))
                : (isRu
                    ? 'Оплата не списывается. Хозяин подтвердит бронирование.'
                    : "You won't be charged. The host will confirm your booking.")}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
