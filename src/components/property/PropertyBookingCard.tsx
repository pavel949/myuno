import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Info, ChevronDown, ChevronUp, Calendar as CalendarIcon, X, Shield, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePropertyBlockedDates } from '@/hooks/usePropertyAvailability';
import { PropertyRentalTerms } from '@/hooks/useProperties';
import { calculatePricing, buildPricingRulesFromSeasons, type PricingRules } from '@/lib/pricingEngine';
import { usePropertyRateSeasons } from '@/hooks/usePropertyRateSeasons';
import { GuestPriceProposal } from './GuestPriceProposal';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { format, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface PropertyBookingCardProps {
  propertyId: string;
  pricePerNight: number;
  rentalTerms?: PropertyRentalTerms | null;
  currency?: string;
  className?: string;
  earlyBookingDiscount?: number;
  earlyBookingDays?: number;
  lastMinuteDiscount?: number;
  lastMinuteDays?: number;
  paymentPolicy?: string;
  prepayPercent?: number;
  depositAmount?: number;
  depositCurrency?: string;
  customLengthDiscounts?: Array<{ min_nights: number; discount_percent: number }>;
  negotiationEnabled?: boolean;
  seasonalPricing?: any[];
}

export function PropertyBookingCard({
  propertyId,
  pricePerNight,
  rentalTerms,
  currency = 'THB',
  className,
  earlyBookingDiscount,
  earlyBookingDays,
  lastMinuteDiscount,
  lastMinuteDays,
  paymentPolicy,
  prepayPercent,
  depositAmount,
  depositCurrency,
  customLengthDiscounts,
  negotiationEnabled,
  seasonalPricing,
}: PropertyBookingCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { isDesktop } = useBreakpoint();
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout>>();
  
  const { data: blockedDates } = usePropertyBlockedDates(propertyId);
  const { data: rateSeasons } = usePropertyRateSeasons(propertyId);

  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from);
  }, [dateRange]);
  
  const isDateBlocked = (date: Date) => {
    return blockedDates?.some(
      blocked => blocked.date.toDateString() === date.toDateString()
    ) ?? false;
  };
  
  // Build pricing rules
  const pricing = useMemo(() => {
    let rules: PricingRules;

    if (rateSeasons && rateSeasons.length > 0) {
      rules = buildPricingRulesFromSeasons(
        {
          price_per_night: pricePerNight,
          weekly_discount: rentalTerms?.weekly_discount,
          monthly_discount: rentalTerms?.monthly_discount,
          early_booking_discount: earlyBookingDiscount,
          early_booking_days: earlyBookingDays,
          last_minute_discount: lastMinuteDiscount,
          last_minute_days: lastMinuteDays,
          custom_length_discounts: customLengthDiscounts,
          deposit_amount: depositAmount,
          deposit_currency: depositCurrency || 'USD',
          payment_policy: paymentPolicy || 'prepay_10',
          prepay_percent: prepayPercent,
        },
        rateSeasons
      );
    } else {
      rules = {
        pricePerNight,
        weeklyDiscount: rentalTerms?.weekly_discount,
        monthlyDiscount: rentalTerms?.monthly_discount,
        customLengthDiscounts,
        earlyBookingDiscount,
        earlyBookingDays,
        lastMinuteDiscount,
        lastMinuteDays,
        seasonalPricing,
        depositAmount,
        depositCurrency: depositCurrency || 'USD',
        paymentPolicy: paymentPolicy || 'prepay_10',
        prepayPercent,
      };
    }

    if (!dateRange?.from || !dateRange?.to || nights <= 0) {
      return {
        ...rules,
        subtotal: 0, total: 0, totalDiscount: 0, prepayAmount: 0, balanceAmount: 0,
        lengthDiscountPercent: 0, lengthDiscount: 0,
        earlyBirdPercent: 0, earlyBirdDiscount: 0,
        lastMinutePercent: 0, lastMinuteDiscount: 0,
        prepayPercent: prepayPercent ?? 10,
        depositAmount: depositAmount || 0,
        depositCurrency: depositCurrency || 'USD',
        nights: 0, nightlyRate: pricePerNight, basePrice: pricePerNight,
        seasonalAdjustment: 0,
      };
    }

    return calculatePricing(rules, dateRange.from, dateRange.to);
  }, [pricePerNight, nights, dateRange, rentalTerms, earlyBookingDiscount, earlyBookingDays, lastMinuteDiscount, lastMinuteDays, customLengthDiscounts, paymentPolicy, prepayPercent, depositAmount, depositCurrency, seasonalPricing, rateSeasons]);
  
  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (nights > 0 && rentalTerms?.min_stay_nights && nights < rentalTerms.min_stay_nights) {
      errors.push(isRu ? `Мин. срок: ${rentalTerms.min_stay_nights} ночей` : `Min. stay: ${rentalTerms.min_stay_nights} nights`);
    }
    if (rentalTerms?.max_guests && guests > rentalTerms.max_guests) {
      errors.push(isRu ? `Макс. гостей: ${rentalTerms.max_guests}` : `Max guests: ${rentalTerms.max_guests}`);
    }
    return errors;
  }, [nights, guests, rentalTerms, isRu]);
  
  const handleReserve = () => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    params.set('guests', guests.toString());
    navigate(`/property/${propertyId}/inquiry?${params.toString()}`);
  };

  // Trust signals
  const trustSignals = useMemo(() => {
    const signals: Array<{ icon: React.ReactNode; text: string }> = [];
    if (rentalTerms?.instant_booking) {
      signals.push({ icon: <Zap className="w-3.5 h-3.5 text-primary" />, text: isRu ? 'Мгновенное подтверждение' : 'Instant confirmation' });
    }
    if (rentalTerms?.cancellation_policy === 'flexible' || rentalTerms?.cancellation_policy === 'moderate') {
      signals.push({ icon: <Shield className="w-3.5 h-3.5 text-success" />, text: isRu ? 'Бесплатная отмена' : 'Free cancellation' });
    }
    signals.push({ icon: <Award className="w-3.5 h-3.5 text-primary" />, text: isRu ? 'Гарантия лучшей цены' : 'Best price guarantee' });
    return signals;
  }, [rentalTerms, isRu]);
  
  return (
    <Card variant="elevated" className={cn("sticky top-20", className)}>
      <CardContent className="p-6 space-y-5">
        {/* Price Header — prominent and clear */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[1.75rem] font-display font-bold tracking-tight text-foreground">
              {formatPrice(pricePerNight)}
            </span>
            <span className="text-base text-muted-foreground font-medium">
              /{isRu ? 'ночь' : 'night'}
            </span>
          </div>
          {rentalTerms?.weekly_discount && rentalTerms.weekly_discount > 0 && (
            <p className="text-xs text-success font-medium mt-1">
              {isRu ? `Скидка ${rentalTerms.weekly_discount}% от 7 ночей` : `${rentalTerms.weekly_discount}% off for 7+ nights`}
            </p>
          )}
        </div>
        
        {/* Date Selection — Airbnb-style split input */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "w-full rounded-xl border-2 border-border/80 hover:border-foreground/40 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                calendarOpen && "border-foreground/60 ring-1 ring-foreground/20"
              )}
            >
              <div className="grid grid-cols-2 divide-x divide-border/80">
                <div className="flex flex-col items-start px-4 py-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-1">
                    {isRu ? 'Заезд' : 'Check-in'}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    dateRange?.from ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {dateRange?.from ? format(dateRange.from, 'd MMM yyyy', { locale: isRu ? ru : undefined }) : (isRu ? 'Добавить дату' : 'Add date')}
                  </span>
                </div>
                <div className="flex flex-col items-start px-4 py-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-1">
                    {isRu ? 'Выезд' : 'Check-out'}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    dateRange?.to ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {dateRange?.to ? format(dateRange.to, 'd MMM yyyy', { locale: isRu ? ru : undefined }) : (isRu ? 'Добавить дату' : 'Add date')}
                  </span>
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
            <div className="p-1">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from && range?.to) {
                    clearTimeout(autoCloseTimer.current);
                    autoCloseTimer.current = setTimeout(() => setCalendarOpen(false), 500);
                  }
                }}
                numberOfMonths={isDesktop ? 2 : 1}
                disabled={(date) => isBefore(date, startOfDay(new Date())) || isDateBlocked(date)}
                modifiers={{ booked: blockedDates?.map(b => b.date) || [] }}
                modifiersClassNames={{ booked: 'bg-destructive/20 text-destructive line-through' }}
                locale={isRu ? ru : undefined}
              />
              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/60">
                <div>
                  {nights > 0 && (
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {nights} {isRu ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей') : (nights === 1 ? 'night' : 'nights')}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {dateRange?.from && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setDateRange(undefined)}>
                      <X className="w-3 h-3 mr-1" />
                      {isRu ? 'Очистить' : 'Clear'}
                    </Button>
                  )}
                  {dateRange?.from && dateRange?.to && (
                    <Button size="sm" className="text-xs h-7" onClick={() => setCalendarOpen(false)}>
                      {isRu ? 'Готово' : 'Done'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Guests Selection — matching style */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "w-full rounded-xl border-2 border-border/80 hover:border-foreground/40 transition-colors",
                "flex items-center justify-between px-4 py-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex flex-col items-start">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-1">
                  {isRu ? 'Гости' : 'Guests'}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {guests} {isRu ? (guests === 1 ? 'гость' : guests < 5 ? 'гостя' : 'гостей') : (guests === 1 ? 'guest' : 'guests')}
                </span>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60" align="start">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{isRu ? 'Гости' : 'Guests'}</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}>-</Button>
                <span className="w-6 text-center font-semibold text-foreground">{guests}</span>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setGuests(Math.min(rentalTerms?.max_guests || 20, guests + 1))} disabled={guests >= (rentalTerms?.max_guests || 20)}>+</Button>
              </div>
            </div>
            {rentalTerms?.max_guests && (
              <p className="text-xs text-muted-foreground mt-2">
                {isRu ? `Максимум ${rentalTerms.max_guests} гостей` : `Maximum ${rentalTerms.max_guests} guests`}
              </p>
            )}
          </PopoverContent>
        </Popover>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="text-sm text-destructive flex items-start gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">{validationErrors.map((error, i) => (<p key={i}>{error}</p>))}</div>
          </div>
        )}
        
        {/* Reserve Button — gradient CTA */}
        <Button 
          size="lg" 
          className={cn(
            "w-full text-base font-semibold h-12 rounded-xl",
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)]",
            "transition-all duration-200 hover:shadow-[0_6px_20px_-3px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5",
            rentalTerms?.instant_booking && dateRange?.from && dateRange?.to && "from-accent-amber to-accent-amber/80 shadow-[0_4px_14px_-3px_hsl(38_85%_48%/0.4)]"
          )}
          onClick={handleReserve}
          disabled={!dateRange?.from || !dateRange?.to || validationErrors.length > 0}
        >
          {!dateRange?.from || !dateRange?.to ? (
            <><CalendarIcon className="w-4 h-4 mr-2" />{isRu ? 'Проверить наличие' : 'Check availability'}</>
          ) : rentalTerms?.instant_booking ? (
            <><Zap className="w-4 h-4 mr-2" />{isRu ? 'Мгновенное бронирование' : 'Book instantly'}</>
          ) : (
            isRu ? 'Забронировать' : 'Reserve'
          )}
        </Button>
        
        {/* Trust Signals */}
        <div className="flex flex-col gap-1.5">
          {trustSignals.map((signal, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              {signal.icon}
              <span>{signal.text}</span>
            </div>
          ))}
        </div>

        {!nights ? (
          <p className="text-center text-sm text-muted-foreground">
            {isRu ? 'Выберите даты для расчёта стоимости' : 'Select dates to see total price'}
          </p>
        ) : (
          <>
            <Separator />
            {/* Price Breakdown */}
            <div className="space-y-2.5">
              <button 
                className="flex items-center justify-between w-full text-sm group" 
                onClick={() => setShowPriceDetails(!showPriceDetails)}
              >
                <span className="underline decoration-dotted underline-offset-4 text-foreground group-hover:text-foreground transition-colors">
                  {formatPrice(pricing.nightlyRate)} × {nights} {isRu ? 'ночей' : 'nights'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{formatPrice(pricing.subtotal)}</span>
                  {showPriceDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              
              {showPriceDetails && (
                <div className="space-y-2 pl-1">
                  {pricing.seasonalAdjustment !== 0 && (
                    <div className={cn("flex items-center justify-between text-sm", pricing.seasonalAdjustment > 0 ? "text-warning" : "text-success")}>
                      <span>{isRu ? 'Сезонная корректировка' : 'Seasonal adjustment'}</span>
                      <span className="font-medium">{pricing.seasonalAdjustment > 0 ? '+' : ''}{formatPrice(pricing.seasonalAdjustment)}</span>
                    </div>
                  )}
                  {pricing.lengthDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-success">
                      <span>{pricing.lengthDiscountPercent}% {isRu ? 'скидка за срок' : 'length discount'}</span>
                      <span className="font-medium">-{formatPrice(pricing.lengthDiscount)}</span>
                    </div>
                  )}
                  {pricing.earlyBirdDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-success">
                      <span>{pricing.earlyBirdPercent}% {isRu ? 'раннее бронирование' : 'early booking'}</span>
                      <span className="font-medium">-{formatPrice(pricing.earlyBirdDiscount)}</span>
                    </div>
                  )}
                  {pricing.lastMinuteDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-success">
                      <span>{pricing.lastMinutePercent}% {isRu ? 'горящее предложение' : 'last-minute deal'}</span>
                      <span className="font-medium">-{formatPrice(pricing.lastMinuteDiscount)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <Separator className="my-1" />
              
              {/* Total — bold and prominent */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">{isRu ? 'Итого' : 'Total'}</span>
                <span className="text-lg font-bold text-foreground">{formatPrice(pricing.total)}</span>
              </div>
              
              {/* Payment Schedule — subtle card */}
              <div className="pt-2 mt-1 space-y-2 p-3 rounded-xl bg-muted/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isRu ? `Предоплата ${pricing.prepayPercent}%` : `${pricing.prepayPercent}% Prepayment`}
                  </span>
                  <span className="font-bold text-primary">
                    {formatPrice(pricing.prepayAmount)}
                  </span>
                </div>
                {pricing.balanceAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isRu ? 'Остаток при заезде' : 'Balance on arrival'}
                    </span>
                    <span className="font-medium text-foreground">{formatPrice(pricing.balanceAmount)}</span>
                  </div>
                )}
                {pricing.depositAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isRu ? 'Возвратный депозит' : 'Refundable deposit'}
                    </span>
                    <span className="font-medium text-foreground">
                      {pricing.depositCurrency === 'USD' ? '$' : pricing.depositCurrency === 'EUR' ? '€' : '฿'}
                      {pricing.depositAmount.toLocaleString()} {pricing.depositCurrency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Negotiation button */}
        {negotiationEnabled && nights > 0 && (
          <GuestPriceProposal
            propertyId={propertyId}
            pricePerNight={pricePerNight}
            nights={nights}
            checkIn={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
            checkOut={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined}
          />
        )}
        
        {/* Min Stay Info */}
        {rentalTerms?.min_stay_nights && rentalTerms.min_stay_nights > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            {isRu ? `Мин. срок проживания: ${rentalTerms.min_stay_nights} ночей` : `Minimum stay: ${rentalTerms.min_stay_nights} nights`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
