import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Calendar, Clock, Users, ShoppingCart, Zap, Check, Anchor } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart, CartItem } from '@/contexts/CartContext';
import { Yacht } from '@/hooks/useYachts';
import { cn } from '@/lib/utils';

interface YachtBookingQuickSelectProps {
  yacht: Yacht;
}

type CharterType = 'half_day' | 'full_day';

export function YachtBookingQuickSelect({ yacht }: YachtBookingQuickSelectProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guests, setGuests] = useState(2);
  const [charterType, setCharterType] = useState<CharterType>('full_day');
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date();
  const tomorrow = addDays(today, 1);

  const availableTimes = charterType === 'half_day' 
    ? ['09:00', '14:00']
    : ['08:00', '09:00', '10:00'];

  const basePrice = charterType === 'half_day'
    ? (yacht.price_half_day || 0)
    : (yacht.price_full_day || 0);
  
  const totalPrice = basePrice;
  const currencySymbol = yacht.currency === 'THB' ? '฿' : '$';

  const yachtName = language === 'ru' ? yacht.name_ru : yacht.name_en;

  // Check if yacht is already in cart with same date/time/type
  const cartItemId = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    return `${yacht.id}-${format(selectedDate, 'yyyy-MM-dd')}-${selectedTime}-${charterType}`;
  }, [yacht.id, selectedDate, selectedTime, charterType]);

  const isInCart = useMemo(() => {
    return items.some(item => item.id === cartItemId);
  }, [items, cartItemId]);

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
      charterType: charterType,
    };

    addItem(cartItem);
    setIsOpen(false);
  };

  const handleBookNow = () => {
    if (!selectedDate || !selectedTime) return;
    
    const state = {
      bookNowData: {
        date: selectedDate.toISOString(),
        time: selectedTime,
        guests,
        charterType,
      }
    };
    
    navigate(`/yachts/${yacht.id}/booking?type=${charterType === 'half_day' ? 'half' : 'full'}`, { state });
    setIsOpen(false);
  };

  const canProceed = selectedDate && selectedTime;

  return (
    <>
      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'от' : 'from'}</p>
            <p className="text-xl font-bold text-primary">
              {currencySymbol}{(yacht.price_half_day || yacht.price_full_day || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {yacht.price_half_day 
                ? (language === 'ru' ? '/полдня' : '/half day')
                : (language === 'ru' ? '/день' : '/day')}
            </p>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </Button>
                <Button className="gap-2">
                  <Zap className="w-4 h-4" />
                  {language === 'ru' ? 'Забронировать' : 'Book Now'}
                </Button>
              </div>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Бронирование яхты' : 'Book Yacht'}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">{yachtName}</p>
              </SheetHeader>
              
              <div className="overflow-y-auto py-4 space-y-6 pb-32">
                {/* Charter Type Selection */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {language === 'ru' ? 'Тип аренды' : 'Charter Type'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {yacht.price_half_day && (
                      <button
                        onClick={() => setCharterType('half_day')}
                        className={cn(
                          "p-3 rounded-xl border-2 text-left transition-all",
                          charterType === 'half_day'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <p className="font-medium text-sm">
                          {language === 'ru' ? 'Полдня' : 'Half Day'}
                        </p>
                        <p className="text-xs text-muted-foreground">4 {language === 'ru' ? 'часа' : 'hours'}</p>
                        <p className="text-primary font-semibold mt-1">
                          {currencySymbol}{yacht.price_half_day?.toLocaleString()}
                        </p>
                      </button>
                    )}
                    {yacht.price_full_day && (
                      <button
                        onClick={() => setCharterType('full_day')}
                        className={cn(
                          "p-3 rounded-xl border-2 text-left transition-all",
                          charterType === 'full_day'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <p className="font-medium text-sm">
                          {language === 'ru' ? 'Полный день' : 'Full Day'}
                        </p>
                        <p className="text-xs text-muted-foreground">8 {language === 'ru' ? 'часов' : 'hours'}</p>
                        <p className="text-primary font-semibold mt-1">
                          {currencySymbol}{yacht.price_full_day?.toLocaleString()}
                        </p>
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {language === 'ru' ? 'Выберите дату' : 'Select Date'}
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
                          selectedDate && !quickDates.some(qd => 
                            format(selectedDate, 'yyyy-MM-dd') === format(qd.date, 'yyyy-MM-dd')
                          )
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {selectedDate && !quickDates.some(qd => 
                          format(selectedDate, 'yyyy-MM-dd') === format(qd.date, 'yyyy-MM-dd')
                        )
                          ? format(selectedDate, 'd MMM', { locale: language === 'ru' ? ru : enUS })
                          : (language === 'ru' ? 'Другая дата' : 'Other date')
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setShowCalendar(false);
                        }}
                        disabled={(date) => date < today}
                        locale={language === 'ru' ? ru : enUS}
                        className="rounded-xl border p-3"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowCalendar(false)}
                        className="w-full"
                      >
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
                      {language === 'ru' ? 'Количество гостей' : 'Number of Guests'}
                    </h4>
                    <div className="flex items-center gap-4 bg-muted/50 rounded-xl p-3">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-lg font-medium disabled:opacity-50"
                      >
                        −
                      </button>
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
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {canProceed && (
                  <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {charterType === 'half_day' 
                          ? (language === 'ru' ? 'Аренда (полдня)' : 'Charter (half day)')
                          : (language === 'ru' ? 'Аренда (полный день)' : 'Charter (full day)')
                        }
                      </span>
                      <span>{currencySymbol}{basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
                      <span className="text-primary text-lg">
                        {currencySymbol}{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 gap-2"
                    disabled={!canProceed || isInCart}
                    onClick={handleAddToCart}
                  >
                    {isInCart ? (
                      <>
                        <Check className="w-4 h-4" />
                        {language === 'ru' ? 'В корзине' : 'In Cart'}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        {language === 'ru' ? 'В корзину' : 'Add to Cart'}
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1 h-12 gap-2"
                    disabled={!canProceed}
                    onClick={handleBookNow}
                  >
                    <Zap className="w-4 h-4" />
                    {language === 'ru' ? 'Забронировать' : 'Book Now'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
