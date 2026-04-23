/**
 * TransportHeroSearch — Sixt-style smart search module
 * Calm premium aesthetic, above-the-fold search
 */

import { useState, type ReactNode } from 'react';
import { Search, MapPin, Calendar as CalendarIcon, ChevronDown, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';

interface TransportHeroSearchProps {
  onSearch?: (params: SearchParams) => void;
}

interface SearchParams {
  location: string;
  pickupDate: string;
  returnDate: string;
  delivery: boolean;
  withDriver: boolean;
  monthly: boolean;
}

export function TransportHeroSearch({ onSearch }: TransportHeroSearchProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [withDriver, setWithDriver] = useState(false);
  const [monthly, setMonthly] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();

  const today = new Date();

  return (
    <section className="relative bg-gradient-to-br from-[hsl(var(--icon-dark))] via-[hsl(var(--primary))] to-[hsl(var(--icon-dark))] overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />

      <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10 md:pt-12 md:pb-14">
        {/* Title */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white leading-tight">
            {isRu ? 'Аренда транспорта' : 'Vehicle Rental'}
          </h1>
          <p className="text-white/85 text-base md:text-lg mt-2 leading-snug max-w-2xl">
            {isRu ? 'Проверенные автомобили и мотоциклы на Пхукете' : 'Verified cars & bikes in Phuket'}
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-none p-4 md:p-6 shadow-2xl shadow-black/20">
          {/* Main search row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Location */}
            <div className="flex items-center gap-3 min-h-11 p-3.5 rounded-none bg-muted/50 border border-border/50">
              <MapPin className="w-6 h-6 text-primary shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  {isRu ? 'Местоположение' : 'Location'}
                </p>
                <p className="text-base font-semibold text-foreground truncate mt-0.5">
                  {isRu ? 'Пхукет' : 'Phuket'}
                </p>
              </div>
            </div>

            {/* Pickup Date */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 min-h-11 p-3.5 rounded-none bg-muted/50 border border-border/50 text-left hover:border-primary/50 transition-colors w-full"
                >
                  <CalendarIcon className="w-6 h-6 text-primary shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      {isRu ? 'Получение' : 'Pick-up'}
                    </p>
                    <p className={cn('text-base font-semibold truncate mt-0.5', pickupDate ? 'text-foreground' : 'text-muted-foreground')}>
                      {pickupDate
                        ? format(pickupDate, 'dd MMM yyyy', { locale: isRu ? ruLocale : undefined })
                        : (isRu ? 'Выберите дату' : 'Select date')}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={pickupDate}
                  onSelect={(date) => {
                    setPickupDate(date);
                    if (date && (!returnDate || returnDate <= date)) {
                      setReturnDate(addDays(date, 1));
                    }
                  }}
                  disabled={(date) => date < today}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>

            {/* Return Date */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 min-h-11 p-3.5 rounded-none bg-muted/50 border border-border/50 text-left hover:border-primary/50 transition-colors w-full"
                >
                  <CalendarIcon className="w-6 h-6 text-primary shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      {isRu ? 'Возврат' : 'Return'}
                    </p>
                    <p className={cn('text-base font-semibold truncate mt-0.5', returnDate ? 'text-foreground' : 'text-muted-foreground')}>
                      {returnDate
                        ? format(returnDate, 'dd MMM yyyy', { locale: isRu ? ruLocale : undefined })
                        : (isRu ? 'Выберите дату' : 'Select date')}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={setReturnDate}
                  disabled={(date) => date < (pickupDate ? addDays(pickupDate, 1) : today)}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>

            {/* Search button */}
            <Button
              className="h-11 min-h-11 py-3 rounded-none text-sm font-semibold gap-2 sm:col-span-2 lg:col-span-1"
              onClick={() => onSearch?.({
                location: 'Phuket',
                pickupDate: pickupDate ? pickupDate.toISOString() : '',
                returnDate: returnDate ? returnDate.toISOString() : '',
                delivery,
                withDriver,
                monthly,
              })}
            >
              <Search className="w-5 h-5 shrink-0" aria-hidden />
              {isRu ? 'Найти' : 'Search'}
            </Button>
          </div>

          {/* Advanced toggle */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 py-1"
            >
              <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', showAdvanced && 'rotate-180')} aria-hidden />
              {isRu ? 'Дополнительные опции' : 'More options'}
            </button>

            {showAdvanced && (
              <div className="flex flex-wrap gap-2 mt-3">
                <ToggleChip
                  active={delivery}
                  onClick={() => setDelivery(!delivery)}
                  icon={<Truck className="w-4 h-4 shrink-0" aria-hidden />}
                  label={isRu ? 'Доставка' : 'Delivery'}
                />
                <ToggleChip
                  active={withDriver}
                  onClick={() => setWithDriver(!withDriver)}
                  label={isRu ? 'С водителем' : 'With driver'}
                />
                <ToggleChip
                  active={monthly}
                  onClick={() => setMonthly(!monthly)}
                  label={isRu ? 'Помесячно' : 'Monthly'}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleChip({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-full text-sm font-semibold border transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
