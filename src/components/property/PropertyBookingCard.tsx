import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Info, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePropertyBlockedDates } from '@/hooks/usePropertyAvailability';
import { PropertyRentalTerms } from '@/hooks/useProperties';
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
}

export function PropertyBookingCard({
  propertyId,
  pricePerNight,
  rentalTerms,
  currency = 'THB',
  className,
}: PropertyBookingCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice, currencyInfo } = useCurrency();
  const isRu = language === 'ru';
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  
  const { data: blockedDates } = usePropertyBlockedDates(propertyId);
  
  const currencySymbol = currencyInfo.symbol;
  
  // Calculate nights and pricing
  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from);
  }, [dateRange]);
  
  const isDateBlocked = (date: Date) => {
    return blockedDates?.some(
      blocked => blocked.date.toDateString() === date.toDateString()
    ) ?? false;
  };
  
  // Price calculations
  const pricing = useMemo(() => {
    if (!pricePerNight || nights <= 0) {
      return { subtotal: 0, discount: 0, total: 0, discountPercent: 0 };
    }
    
    const subtotal = pricePerNight * nights;
    let discountPercent = 0;
    
    // Apply weekly/monthly discount
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
      errors.push(
        isRu 
          ? `Мин. срок: ${rentalTerms.min_stay_nights} ночей`
          : `Min. stay: ${rentalTerms.min_stay_nights} nights`
      );
    }
    
    if (rentalTerms?.max_guests && guests > rentalTerms.max_guests) {
      errors.push(
        isRu
          ? `Макс. гостей: ${rentalTerms.max_guests}`
          : `Max guests: ${rentalTerms.max_guests}`
      );
    }
    
    return errors;
  }, [nights, guests, rentalTerms, isRu]);
  
  const handleReserve = () => {
    // Navigate to inquiry with pre-filled data
    const params = new URLSearchParams();
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    params.set('guests', guests.toString());
    
    navigate(`/property/${propertyId}/inquiry?${params.toString()}`);
  };
  
  return (
    <Card className={cn("sticky top-20 shadow-lg border-border", className)}>
      <CardContent className="p-5 space-y-4">
        {/* Price Header */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">
            {formatPrice(pricePerNight)}
          </span>
          <span className="text-muted-foreground">
            /{isRu ? 'ночь' : 'night'}
          </span>
        </div>
        
        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-auto py-3",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {isRu ? 'Заезд' : 'Check-in'}
                  </span>
                  <span className="text-sm">
                    {dateRange?.from 
                      ? format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })
                      : (isRu ? 'Дата' : 'Add date')
                    }
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-auto py-3",
                  !dateRange?.to && "text-muted-foreground"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {isRu ? 'Выезд' : 'Check-out'}
                  </span>
                  <span className="text-sm">
                    {dateRange?.to 
                      ? format(dateRange.to, 'd MMM', { locale: isRu ? ru : undefined })
                      : (isRu ? 'Дата' : 'Add date')
                    }
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                disabled={(date) => 
                  isBefore(date, startOfDay(new Date())) || isDateBlocked(date)
                }
                locale={isRu ? ru : undefined}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Guests Selection */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left font-normal h-auto py-3"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {isRu ? 'Гости' : 'Guests'}
                </span>
                <span className="text-sm">
                  {guests} {isRu ? (guests === 1 ? 'гость' : 'гостей') : (guests === 1 ? 'guest' : 'guests')}
                </span>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60" align="start">
            <div className="flex items-center justify-between">
              <span className="font-medium">{isRu ? 'Гости' : 'Guests'}</span>
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
              <p className="text-xs text-muted-foreground mt-2">
                {isRu ? `Максимум ${rentalTerms.max_guests} гостей` : `Maximum ${rentalTerms.max_guests} guests`}
              </p>
            )}
          </PopoverContent>
        </Popover>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="text-sm text-destructive flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {validationErrors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          </div>
        )}
        
        {/* Reserve Button - Dynamic CTA */}
        <Button 
          size="lg" 
          className={cn(
            "w-full",
            rentalTerms?.instant_booking && dateRange?.from && dateRange?.to && "bg-amber-500 hover:bg-amber-600"
          )}
          onClick={handleReserve}
          disabled={!dateRange?.from || !dateRange?.to || validationErrors.length > 0}
        >
          {!dateRange?.from || !dateRange?.to ? (
            <>
              <CalendarIcon className="w-4 h-4 mr-2" />
              {isRu ? 'Проверить наличие' : 'Check availability'}
            </>
          ) : rentalTerms?.instant_booking ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {isRu ? 'Мгновенное бронирование' : 'Book instantly'}
            </>
          ) : (
            isRu ? 'Забронировать' : 'Reserve'
          )}
        </Button>
        
        {!nights ? (
          <p className="text-center text-sm text-muted-foreground">
            {isRu ? 'Выберите даты для расчёта стоимости' : 'Select dates to see total price'}
          </p>
        ) : (
          <>
            {/* Price Breakdown */}
            <div className="space-y-2 pt-2">
              <button
                className="flex items-center justify-between w-full text-sm"
                onClick={() => setShowPriceDetails(!showPriceDetails)}
              >
                <span className="underline">
                  {formatPrice(pricePerNight)} × {nights} {isRu ? 'ночей' : 'nights'}
                </span>
                <div className="flex items-center gap-2">
                  <span>{formatPrice(pricing.subtotal)}</span>
                  {showPriceDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              
              {showPriceDetails && pricing.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-success">
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
              
              <div className="flex items-center justify-between font-semibold">
                <span>{isRu ? 'Итого' : 'Total'}</span>
                <span>{formatPrice(pricing.total)}</span>
              </div>
              
              {/* 10% Deposit Info */}
              <div className="pt-2 mt-2 border-t border-dashed">
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
          </>
        )}
        
        {/* Min Stay Info */}
        {rentalTerms?.min_stay_nights && rentalTerms.min_stay_nights > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            {isRu 
              ? `Мин. срок проживания: ${rentalTerms.min_stay_nights} ночей`
              : `Minimum stay: ${rentalTerms.min_stay_nights} nights`
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
