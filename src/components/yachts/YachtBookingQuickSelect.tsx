import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Calendar, Clock, Users, ShoppingCart, Zap, Check, Anchor, Sun, Moon, Sunset, Shield } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart, CartItem } from '@/contexts/CartContext';
import { Yacht } from '@/hooks/useYachts';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface YachtBookingQuickSelectProps {
  yacht: Yacht;
}

type CharterType = 'half_day' | 'full_day' | 'sunset' | 'overnight';

interface CharterOption {
  type: CharterType;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  icon: typeof Sun;
  price: number;
}

export function YachtBookingQuickSelect({ yacht }: YachtBookingQuickSelectProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guests, setGuests] = useState(2);
  const [showCalendar, setShowCalendar] = useState(false);

  // Build available charter options from pricing
  const charterOptions = useMemo((): CharterOption[] => {
    const options: CharterOption[] = [];
    if (yacht.price_half_day && yacht.price_half_day > 0) {
      options.push({ type: 'half_day', labelEn: 'Half Day', labelRu: 'Полдня', descEn: '4-5 hours', descRu: '4-5 часов', icon: Sun, price: yacht.price_half_day });
    }
    if (yacht.price_full_day && yacht.price_full_day > 0) {
      options.push({ type: 'full_day', labelEn: 'Full Day', labelRu: 'Полный день', descEn: '8-10 hours', descRu: '8-10 часов', icon: Calendar, price: yacht.price_full_day });
    }
    if (yacht.price_sunset && yacht.price_sunset > 0) {
      options.push({ type: 'sunset', labelEn: 'Sunset Cruise', labelRu: 'Закатный круиз', descEn: '2-3 hours', descRu: '2-3 часа', icon: Sunset, price: yacht.price_sunset });
    }
    if (yacht.price_overnight && yacht.price_overnight > 0) {
      options.push({ type: 'overnight', labelEn: 'Overnight', labelRu: 'С ночёвкой', descEn: '24 hours', descRu: '24 часа', icon: Moon, price: yacht.price_overnight });
    }
    return options;
  }, [yacht]);

  const [charterType, setCharterType] = useState<CharterType>(charterOptions[0]?.type || 'full_day');

  const selectedOption = charterOptions.find(o => o.type === charterType) || charterOptions[0];
  const basePrice = selectedOption?.price || 0;

  const today = new Date();
  const tomorrow = addDays(today, 1);

  const defaultTimes: Record<CharterType, string[]> = {
    half_day: ['09:00', '14:00'],
    full_day: ['08:00', '09:00', '10:00'],
    sunset: ['16:00', '16:30', '17:00'],
    overnight: ['10:00', '12:00'],
  };
  const availableTimes = yacht.departure_times?.length ? yacht.departure_times : (defaultTimes[charterType] || defaultTimes.full_day);

  const totalPrice = basePrice;
  const currencySymbol = getCurrencySymbol(yacht.currency || 'THB');
  const yachtName = language === 'ru' ? yacht.name_ru : yacht.name_en;

  const cartItemId = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    return `${yacht.id}-${format(selectedDate, 'yyyy-MM-dd')}-${selectedTime}-${charterType}`;
  }, [yacht.id, selectedDate, selectedTime, charterType]);

  const isInCart = useMemo(() => items.some(item => item.id === cartItemId), [items, cartItemId]);

  const quickDates = [
    { label: language === 'ru' ? 'Сегодня' : 'Today', date: today },
    { label: language === 'ru' ? 'Завтра' : 'Tomorrow', date: tomorrow },
  ];

  const handleAddToCart = () => {
    if (!selectedDate || !selectedTime) return;
    const cartItem: Omit<CartItem, 'quantity'> = {
      id: cartItemId!,
      type: 'yacht',
      name: yacht.name_en,
      nameRu: yacht.name_ru,
      price: totalPrice,
      currency: yacht.currency || 'THB',
      image: yacht.cover_image || undefined,
      providerId: yacht.provider_id || undefined,
      scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
      scheduledTime: selectedTime,
      participants: guests,
      charterType,
    };
    addItem(cartItem);
    setIsOpen(false);
  };

  const handleBookNow = () => {
    if (!selectedDate || !selectedTime) return;
    const state = {
      bookNowData: { date: selectedDate.toISOString(), time: selectedTime, guests, charterType },
    };
    navigate(`/yachts/${yacht.id}/booking?type=${charterType}`, { state });
    setIsOpen(false);
  };

  const canProceed = selectedDate && selectedTime;

  // "From" price for bottom bar
  const fromPrice = Math.min(...charterOptions.map(o => o.price).filter(p => p > 0)) || 0;
  const fromLabel = charterOptions.find(o => o.price === fromPrice);

  const footer = (
    <div className="flex gap-3 w-full">
      <Button variant="outline" className="flex-1 h-12 gap-2" disabled={!canProceed || isInCart} onClick={handleAddToCart}>
        {isInCart ? (<><Check className="w-4 h-4" />{language === 'ru' ? 'В корзине' : 'In Cart'}</>) : (<><ShoppingCart className="w-4 h-4" />{language === 'ru' ? 'В корзину' : 'Add to Cart'}</>)}
      </Button>
      <Button className="flex-1 h-12 gap-2" disabled={!canProceed} onClick={handleBookNow}>
        <Zap className="w-4 h-4" />
        {yacht.booking_flow === 'instant'
          ? (language === 'ru' ? 'Забронировать' : 'Book Now')
          : (language === 'ru' ? 'Отправить заявку' : 'Send Request')}
      </Button>
    </div>
  );

  return (
    <>
      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'от' : 'from'}</p>
            <p className="text-xl font-bold text-primary">
              {currencySymbol}{fromPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {fromLabel ? (language === 'ru' ? `/${fromLabel.labelRu.toLowerCase()}` : `/${fromLabel.labelEn.toLowerCase()}`) : ''}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </Button>
            <Button className="gap-2" onClick={() => setIsOpen(true)}>
              <Zap className="w-4 h-4" />
              {language === 'ru' ? 'Выбрать дату' : 'Choose Date'}
            </Button>
          </div>
        </div>
      </div>

      <ResponsiveModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={language === 'ru' ? 'Спланируйте морской день' : 'Plan Your Sea Day'}
        description={yachtName}
        icon={<Anchor className="w-5 h-5 text-primary" />}
        size="lg"
        footer={footer}
      >
        {/* Charter Type Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {language === 'ru' ? 'Какой формат?' : 'What experience?'}
          </h4>
          <div className={cn("grid gap-2", charterOptions.length <= 2 ? "grid-cols-2" : "grid-cols-2")}>
            {charterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => setCharterType(option.type)}
                  className={cn(
                    "p-3 rounded-none border-2 text-left transition-all",
                    charterType === option.type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {language === 'ru' ? option.labelRu : option.labelEn}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? option.descRu : option.descEn}</p>
                  <p className="text-primary font-semibold mt-1">
                    {currencySymbol}{option.price.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {language === 'ru' ? 'Когда?' : 'When?'}
          </h4>
          
          {!showCalendar ? (
            <div className="flex gap-2 flex-wrap">
              {quickDates.map((qd) => (
                <button
                  key={qd.label}
                  onClick={() => setSelectedDate(qd.date)}
                  className={cn(
                    "px-4 py-2 rounded-full border transition-all text-sm",
                    selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(qd.date, 'yyyy-MM-dd')
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  )}
                >
                  {qd.label}
                </button>
              ))}
              <button
                onClick={() => setShowCalendar(true)}
                className={cn(
                  "px-4 py-2 rounded-full border transition-all text-sm",
                  selectedDate && !quickDates.some(qd => format(selectedDate, 'yyyy-MM-dd') === format(qd.date, 'yyyy-MM-dd'))
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {selectedDate && !quickDates.some(qd => format(selectedDate, 'yyyy-MM-dd') === format(qd.date, 'yyyy-MM-dd'))
                  ? format(selectedDate, 'd MMM', { locale: language === 'ru' ? ru : enUS })
                  : (language === 'ru' ? 'Другая дата' : 'Other date')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
                disabled={(date) => date < today}
                locale={language === 'ru' ? ru : enUS}
                className="rounded-none border p-3 pointer-events-auto"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowCalendar(false)} className="w-full">
                {language === 'ru' ? 'Назад' : 'Back'}
              </Button>
            </div>
          )}
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {language === 'ru' ? 'Время отправления' : 'Departure Time'}
            </h4>
            <div className="flex gap-2 flex-wrap">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    "px-4 py-2 rounded-full border transition-all text-sm",
                    selectedTime === time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guests Selection */}
        {selectedDate && selectedTime && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              {language === 'ru' ? 'Сколько гостей?' : 'How many guests?'}
            </h4>
            <div className="flex items-center gap-4 bg-muted/50 rounded-none p-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                disabled={guests <= 1}
                className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-lg font-medium disabled:opacity-50"
              >−</button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold">{guests}</span>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? `макс. ${yacht.capacity}` : `max ${yacht.capacity}`}
                </p>
              </div>
              <button
                onClick={() => setGuests(Math.min(yacht.capacity || 12, guests + 1))}
                disabled={guests >= (yacht.capacity || 12)}
                className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-lg font-medium disabled:opacity-50"
              >+</button>
            </div>
          </div>
        )}

        {/* Summary */}
        {canProceed && (
          <div className="p-4 bg-muted/50 rounded-none space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedOption ? (language === 'ru' ? `Аренда (${selectedOption.labelRu.toLowerCase()})` : `Charter (${selectedOption.labelEn.toLowerCase()})`) : ''}
              </span>
              <span>{currencySymbol}{basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary text-lg">{currencySymbol}{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Trust banner */}
        <div className="flex items-center gap-3 p-3 bg-success/10/60 dark:bg-success/20 rounded-none border border-success/40/50 dark:border-success/40/30">
          <Shield className="w-5 h-5 text-success dark:text-success flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-success dark:text-success">
              {language === 'ru' ? 'Защищено myUNO' : 'Protected by myUNO'}
            </p>
            <p className="text-[11px] text-success/70 dark:text-success/60">
              {language === 'ru' ? 'Проверенный оператор • Экипаж • Страховка' : 'Verified operator • Crew • Insurance'}
            </p>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
