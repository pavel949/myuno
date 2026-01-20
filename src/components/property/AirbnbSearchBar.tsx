import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AirbnbSearchBarProps {
  onSearch: (params: SearchParams) => void;
  className?: string;
}

export interface SearchParams {
  location: string;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  guests: number;
}

const locations = [
  { id: 'all', labelEn: 'Anywhere in Phuket', labelRu: 'Весь Пхукет' },
  { id: 'patong', labelEn: 'Patong', labelRu: 'Патонг' },
  { id: 'kata', labelEn: 'Kata', labelRu: 'Ката' },
  { id: 'karon', labelEn: 'Karon', labelRu: 'Карон' },
  { id: 'kamala', labelEn: 'Kamala', labelRu: 'Камала' },
  { id: 'surin', labelEn: 'Surin', labelRu: 'Сурин' },
  { id: 'bangtao', labelEn: 'Bang Tao', labelRu: 'Банг Тао' },
  { id: 'rawai', labelEn: 'Rawai', labelRu: 'Равай' },
  { id: 'chalong', labelEn: 'Chalong', labelRu: 'Чалонг' },
  { id: 'naiyang', labelEn: 'Nai Yang', labelRu: 'Най Янг' },
];

export function AirbnbSearchBar({ onSearch, className }: AirbnbSearchBarProps) {
  const { language, t } = useLanguage();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [location, setLocation] = useState('all');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);

  const handleSearch = () => {
    onSearch({ location, checkIn, checkOut, guests });
    setActiveField(null);
  };

  const clearDates = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
  };

  const selectedLocation = locations.find(l => l.id === location);
  const locationLabel = selectedLocation 
    ? (language === 'ru' ? selectedLocation.labelRu : selectedLocation.labelEn)
    : (language === 'ru' ? 'Куда?' : 'Where?');

  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, 'd MMM', { locale: language === 'ru' ? ru : undefined });
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Search Bar */}
      <div className="md:hidden">
        <div 
          className="flex items-center gap-3 p-4 bg-card rounded-full border shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setActiveField('mobile')}
        >
          <Search className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{locationLabel}</p>
            <p className="text-xs text-muted-foreground truncate">
              {checkIn && checkOut 
                ? `${formatDate(checkIn)} – ${formatDate(checkOut)} · ${guests} ${language === 'ru' ? 'гост.' : 'guests'}`
                : language === 'ru' ? 'Любые даты · Добавить гостей' : 'Any week · Add guests'
              }
            </p>
          </div>
          <Button size="icon" className="rounded-full shrink-0 h-10 w-10">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Full Screen Modal */}
        {activeField === 'mobile' && (
          <div className="fixed inset-0 z-50 bg-background">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon" onClick={() => setActiveField(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <span className="font-semibold">{language === 'ru' ? 'Поиск жилья' : 'Search homes'}</span>
                <Button variant="ghost" size="sm" onClick={clearDates}>
                  {language === 'ru' ? 'Сброс' : 'Clear'}
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Location */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{language === 'ru' ? 'Куда?' : 'Where to?'}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        className={cn(
                          "p-3 rounded-xl text-left text-sm font-medium transition-all border",
                          location === loc.id 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setLocation(loc.id)}
                      >
                        <MapPin className="w-4 h-4 mb-1 opacity-60" />
                        {language === 'ru' ? loc.labelRu : loc.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{language === 'ru' ? 'Когда?' : 'When?'}</h3>
                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: checkIn, to: checkOut }}
                      onSelect={(range) => {
                        setCheckIn(range?.from);
                        setCheckOut(range?.to);
                      }}
                      numberOfMonths={1}
                      disabled={(date) => date < new Date()}
                      className="rounded-xl border p-3"
                      locale={language === 'ru' ? ru : undefined}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{language === 'ru' ? 'Кто едет?' : 'Who\'s coming?'}</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl border">
                    <div>
                      <p className="font-medium">{language === 'ru' ? 'Гости' : 'Guests'}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ru' ? 'Сколько человек?' : 'How many?'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-8 w-8"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-semibold">{guests}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-8 w-8"
                        onClick={() => setGuests(Math.min(16, guests + 1))}
                        disabled={guests >= 16}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-background">
                <Button className="w-full h-12 rounded-xl text-base gap-2" onClick={handleSearch}>
                  <Search className="w-5 h-5" />
                  {language === 'ru' ? 'Найти жильё' : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center bg-card rounded-full border shadow-lg divide-x">
        {/* Location */}
        <Popover open={activeField === 'location'} onOpenChange={(open) => setActiveField(open ? 'location' : null)}>
          <PopoverTrigger asChild>
            <button 
              className={cn(
                "flex-1 px-6 py-4 text-left rounded-l-full hover:bg-muted/50 transition-colors",
                activeField === 'location' && "bg-muted"
              )}
            >
              <p className="text-xs font-semibold">{language === 'ru' ? 'Куда' : 'Where'}</p>
              <p className={cn("text-sm", location === 'all' ? "text-muted-foreground" : "")}>
                {locationLabel}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-1">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-colors",
                    location === loc.id 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    setLocation(loc.id);
                    setActiveField('checkin');
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  {language === 'ru' ? loc.labelRu : loc.labelEn}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Check In */}
        <Popover open={activeField === 'checkin'} onOpenChange={(open) => setActiveField(open ? 'checkin' : null)}>
          <PopoverTrigger asChild>
            <button 
              className={cn(
                "px-6 py-4 text-left hover:bg-muted/50 transition-colors",
                activeField === 'checkin' && "bg-muted"
              )}
            >
              <p className="text-xs font-semibold">{language === 'ru' ? 'Заезд' : 'Check in'}</p>
              <p className={cn("text-sm", !checkIn && "text-muted-foreground")}>
                {checkIn ? formatDate(checkIn) : (language === 'ru' ? 'Добавить' : 'Add dates')}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <CalendarComponent
              mode="range"
              selected={{ from: checkIn, to: checkOut }}
              onSelect={(range) => {
                setCheckIn(range?.from);
                setCheckOut(range?.to);
                if (range?.to) {
                  setActiveField('guests');
                }
              }}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
              locale={language === 'ru' ? ru : undefined}
            />
          </PopoverContent>
        </Popover>

        {/* Check Out */}
        <Popover open={activeField === 'checkout'} onOpenChange={(open) => setActiveField(open ? 'checkout' : null)}>
          <PopoverTrigger asChild>
            <button 
              className={cn(
                "px-6 py-4 text-left hover:bg-muted/50 transition-colors",
                activeField === 'checkout' && "bg-muted"
              )}
            >
              <p className="text-xs font-semibold">{language === 'ru' ? 'Выезд' : 'Check out'}</p>
              <p className={cn("text-sm", !checkOut && "text-muted-foreground")}>
                {checkOut ? formatDate(checkOut) : (language === 'ru' ? 'Добавить' : 'Add dates')}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <CalendarComponent
              mode="range"
              selected={{ from: checkIn, to: checkOut }}
              onSelect={(range) => {
                setCheckIn(range?.from);
                setCheckOut(range?.to);
                if (range?.to) {
                  setActiveField('guests');
                }
              }}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
              locale={language === 'ru' ? ru : undefined}
            />
          </PopoverContent>
        </Popover>

        {/* Guests */}
        <Popover open={activeField === 'guests'} onOpenChange={(open) => setActiveField(open ? 'guests' : null)}>
          <PopoverTrigger asChild>
            <button 
              className={cn(
                "px-6 py-4 text-left hover:bg-muted/50 transition-colors",
                activeField === 'guests' && "bg-muted"
              )}
            >
              <p className="text-xs font-semibold">{language === 'ru' ? 'Гости' : 'Who'}</p>
              <p className="text-sm">
                {guests} {language === 'ru' ? (guests === 1 ? 'гость' : 'гостей') : (guests === 1 ? 'guest' : 'guests')}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === 'ru' ? 'Гости' : 'Guests'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Взрослые и дети' : 'Adults and children'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-8 w-8"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center font-semibold">{guests}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-8 w-8"
                  onClick={() => setGuests(Math.min(16, guests + 1))}
                  disabled={guests >= 16}
                >
                  +
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <div className="px-2 py-2">
          <Button 
            size="lg" 
            className="rounded-full h-12 px-6 gap-2"
            onClick={handleSearch}
          >
            <Search className="w-5 h-5" />
            <span className="hidden lg:inline">{language === 'ru' ? 'Найти' : 'Search'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
