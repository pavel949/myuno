import React, { useState, useEffect, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { createPortal } from 'react-dom';
import { Search, MapPin, Globe, X, Minus, Plus, Check, Bed } from 'lucide-react';
import { NextStepNudge } from '@/components/hints/NextStepNudge';
import { usePropertyQuickFilters, DistrictOption } from '@/hooks/usePropertyQuickFilters';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { DateRange } from 'react-day-picker';

interface AirbnbSearchBarProps {
  onSearch: (params: SearchParams) => void;
  className?: string;
}

export interface SearchParams {
  locations: string[];
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  guests: number;
  bedrooms: string[];
}

// Locations are now loaded dynamically from the database via usePropertyQuickFilters

const flexibleDates = [
  { id: 'weekend', labelEn: 'Weekend', labelRu: 'Выходные', getDates: () => ({ from: addDays(new Date(), (6 - new Date().getDay()) % 7), to: addDays(new Date(), (7 - new Date().getDay()) % 7 + 1) }) },
  { id: 'week', labelEn: 'Week', labelRu: 'Неделя', getDates: () => ({ from: new Date(), to: addWeeks(new Date(), 1) }) },
  { id: 'month', labelEn: 'Month', labelRu: 'Месяц', getDates: () => ({ from: new Date(), to: addMonths(new Date(), 1) }) },
];

type MobileTab = 'location' | 'dates' | 'bedrooms' | 'guests';

const BEDROOM_OPTIONS = [
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
  { id: '1', labelEn: '1', labelRu: '1' },
  { id: '2', labelEn: '2', labelRu: '2' },
  { id: '3', labelEn: '3', labelRu: '3' },
  { id: '4', labelEn: '4', labelRu: '4' },
  { id: '5+', labelEn: '5+', labelRu: '5+' },
];

export function AirbnbSearchBar({ onSearch, className }: AirbnbSearchBarProps) {
  const { language } = useLanguage();
  const { districts: dbDistricts } = usePropertyQuickFilters();

  // Build locations from DB districts
  const locations = useMemo(() => [
    { id: 'all', labelEn: 'All Phuket', labelRu: 'Весь Пхукет' },
    ...dbDistricts.map(d => ({ id: d.valueKey, labelEn: d.labelEn, labelRu: d.labelRu })),
  ], [dbDistricts]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('location');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);

  const totalGuests = adults + children;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSearch = () => {
    onSearch({ locations: selectedLocations, checkIn, checkOut, guests: totalGuests, bedrooms: selectedBedrooms });
    setActiveField(null);
    setIsOpen(false);
  };

  const clearAll = () => {
    setSelectedLocations([]);
    setCheckIn(undefined);
    setCheckOut(undefined);
    setAdults(2);
    setChildren(0);
    setSelectedBedrooms([]);
  };

  const toggleLocation = (locId: string) => {
    if (locId === 'all') {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(prev => 
        prev.includes(locId) 
          ? prev.filter(id => id !== locId)
          : [...prev, locId]
      );
    }
  };

  const locationLabel = selectedLocations.length === 0
    ? (language === 'ru' ? 'Весь Пхукет' : 'Anywhere in Phuket')
    : selectedLocations.length === 1
      ? locations.find(l => l.id === selectedLocations[0])?.[language === 'ru' ? 'labelRu' : 'labelEn'] || ''
      : `${selectedLocations.length} ${language === 'ru' ? 'районов' : 'areas'}`;

  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, 'd MMM', { locale: language === 'ru' ? ru : undefined });
  };

  const handleFlexibleDate = (dateOption: typeof flexibleDates[0]) => {
    const dates = dateOption.getDates();
    setCheckIn(dates.from);
    setCheckOut(dates.to);
  };

  const goToNextTab = () => {
    if (mobileTab === 'location') setMobileTab('dates');
    else if (mobileTab === 'dates') setMobileTab('bedrooms');
    else if (mobileTab === 'bedrooms') setMobileTab('guests');
  };

  const toggleBedroom = (id: string) => {
    setSelectedBedrooms(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const bedroomLabel = selectedBedrooms.length === 0
    ? (language === 'ru' ? 'Спальни' : 'Bedrooms')
    : selectedBedrooms.length === 1
      ? (selectedBedrooms[0] === 'studio' 
          ? (language === 'ru' ? 'Студия' : 'Studio')
          : `${selectedBedrooms[0]} ${language === 'ru' ? 'сп.' : 'bed'}`)
      : `${selectedBedrooms.length} ${language === 'ru' ? 'выбрано' : 'selected'}`;

  const GuestCounter = ({ label, sublabel, value, onChange, min = 0, max = 16 }: {
    label: string;
    sublabel: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-9 w-9 border-muted-foreground/30"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-8 text-center font-semibold text-lg">{value}</span>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-9 w-9 border-muted-foreground/30"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Search Bar - Enhanced visibility */}
      <div className="md:hidden">
        <motion.div 
          className="flex items-center gap-2 px-4 py-2.5 bg-card rounded-full border shadow-sm cursor-pointer"
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium truncate">{locationLabel}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground truncate">
                {checkIn && checkOut 
                  ? `${formatDate(checkIn)} – ${formatDate(checkOut)} · ${nights} ${language === 'ru' ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей') : 'nights'}`
                  : (language === 'ru' ? 'Даты' : 'Any week')
                }
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {totalGuests} {language === 'ru' ? 'гост.' : 'guests'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Mobile Full Screen Modal - Using Portal */}
        {createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                key="search-modal"
                className="fixed inset-0 z-[100] bg-background"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header with Tabs */}
                <div className="border-b shrink-0">
                  <div className="flex items-center justify-between px-4 py-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                    <span className="font-semibold">{language === 'ru' ? 'Поиск' : 'Search'}</span>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-primary">
                      {language === 'ru' ? 'Сброс' : 'Clear'}
                    </Button>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="flex px-4 gap-1">
                    {(['location', 'dates', 'bedrooms', 'guests'] as MobileTab[]).map((tab) => (
                      <button
                        key={tab}
                        className={cn(
                          "flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors",
                          mobileTab === tab 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground"
                        )}
                        onClick={() => setMobileTab(tab)}
                      >
                        {tab === 'location' && (language === 'ru' ? 'Куда' : 'Where')}
                        {tab === 'dates' && (language === 'ru' ? 'Когда' : 'When')}
                        {tab === 'bedrooms' && (language === 'ru' ? 'Спальни' : 'Beds')}
                        {tab === 'guests' && (language === 'ru' ? 'Кто' : 'Who')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Location Tab */}
                    {mobileTab === 'location' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{language === 'ru' ? 'Куда вы едете?' : 'Where are you going?'}</h3>
                        
                        <div className="grid grid-cols-2 gap-1.5">
                          {locations.map((loc) => (
                            <button
                              key={loc.id}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors border",
                                loc.id === 'all' && selectedLocations.length === 0
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : selectedLocations.includes(loc.id)
                                    ? "bg-primary/10 border-primary/30 text-primary" 
                                    : "border-border hover:bg-muted"
                              )}
                              onClick={() => toggleLocation(loc.id)}
                            >
                              {loc.id === 'all' 
                                ? <Globe className="w-4 h-4 shrink-0" />
                                : <MapPin className="w-4 h-4 shrink-0" />
                              }
                              <span className="flex-1 text-xs font-medium truncate">
                                {language === 'ru' ? loc.labelRu : loc.labelEn}
                              </span>
                              {(loc.id === 'all' && selectedLocations.length === 0) || selectedLocations.includes(loc.id) ? (
                                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                        
                        {selectedLocations.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {selectedLocations.map(locId => {
                              const loc = locations.find(l => l.id === locId);
                              return loc ? (
                                <span key={locId} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                  <MapPin className="w-3 h-3" /> {language === 'ru' ? loc.labelRu : loc.labelEn}
                                  <button onClick={(e) => { e.stopPropagation(); toggleLocation(locId); }} className="ml-1 hover:text-primary/70">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                         )}

                        {/* Nudge: selected locations → go to dates */}
                        <NextStepNudge
                          message={language === 'ru' ? 'Теперь выберите даты →' : 'Now select dates →'}
                          direction="right"
                          visible={selectedLocations.length > 0 && mobileTab === 'location'}
                          hintId="search-locations-to-dates"
                          className="mt-2 self-center w-fit mx-auto pointer-events-auto cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Dates Tab */}
                    {mobileTab === 'dates' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{language === 'ru' ? 'Когда поездка?' : 'When is your trip?'}</h3>
                        
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {flexibleDates.map((option) => (
                            <Button
                              key={option.id}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "rounded-full whitespace-nowrap",
                                checkIn && checkOut && "border-primary/50"
                              )}
                              onClick={() => {
                                handleFlexibleDate(option);
                                goToNextTab();
                              }}
                            >
                              {language === 'ru' ? option.labelRu : option.labelEn}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full whitespace-nowrap"
                            onClick={() => {
                              setCheckIn(undefined);
                              setCheckOut(undefined);
                            }}
                          >
                            {language === 'ru' ? 'Гибкие даты' : 'Flexible'}
                          </Button>
                        </div>

                        <div className="flex justify-center">
                          <CalendarComponent
                            mode="range"
                            selected={{ from: checkIn, to: checkOut } as DateRange}
                            onSelect={(range: DateRange | undefined) => {
                              setCheckIn(range?.from);
                              setCheckOut(range?.to);
                              if (range?.to) {
                                goToNextTab();
                              }
                            }}
                            numberOfMonths={1}
                            disabled={(date) => date < new Date()}
                            className="rounded-xl border-0 p-0"
                            locale={language === 'ru' ? ru : undefined}
                          />
                        </div>

                        {checkIn && checkOut && (
                          <div className="text-center p-3 bg-primary/5 rounded-xl">
                            <p className="text-sm font-medium text-primary">
                              {formatDate(checkIn)} – {formatDate(checkOut)}
                              <span className="mx-1.5 text-primary/60">·</span>
                              {nights} {language === 'ru' ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей') : 'nights'}
                            </p>
                          </div>
                        )}

                        {/* Nudge: dates selected → go to guests */}
                        <NextStepNudge
                          message={language === 'ru' ? 'Укажите гостей и нажмите Поиск' : 'Add guests and search'}
                          direction="down"
                          visible={!!checkIn && !!checkOut && mobileTab === 'dates'}
                          hintId="search-dates-to-guests"
                          className="self-center w-fit mx-auto"
                        />
                      </div>
                    )}

                    {/* Bedrooms Tab */}
                    {mobileTab === 'bedrooms' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{language === 'ru' ? 'Сколько спален?' : 'How many bedrooms?'}</h3>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {BEDROOM_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => toggleBedroom(option.id)}
                              className={cn(
                                "py-3 px-2 rounded-xl text-sm font-medium transition-all border text-center",
                                selectedBedrooms.includes(option.id)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border hover:border-primary/40 bg-card"
                              )}
                            >
                              {language === 'ru' ? option.labelRu : option.labelEn}
                            </button>
                          ))}
                        </div>

                        {selectedBedrooms.length > 0 && (
                          <button
                            onClick={() => setSelectedBedrooms([])}
                            className="text-xs text-primary hover:underline"
                          >
                            {language === 'ru' ? 'Сбросить' : 'Clear'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Guests Tab */}
                    {mobileTab === 'guests' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{language === 'ru' ? 'Кто едет?' : "Who's coming?"}</h3>
                        
                        <div className="space-y-2">
                          <GuestCounter
                            label={language === 'ru' ? 'Взрослые' : 'Adults'}
                            sublabel={language === 'ru' ? 'От 13 лет' : 'Ages 13+'}
                            value={adults}
                            onChange={setAdults}
                            min={1}
                          />
                          <GuestCounter
                            label={language === 'ru' ? 'Дети' : 'Children'}
                            sublabel={language === 'ru' ? 'От 2 до 12 лет' : 'Ages 2-12'}
                            value={children}
                            onChange={setChildren}
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-background shrink-0">
                  <Button 
                    className="w-full h-14 rounded-xl text-base gap-2 font-semibold"
                    onClick={handleSearch}
                  >
                    <Search className="w-5 h-5" />
                    {language === 'ru' ? 'Найти жильё' : 'Search'}
                  </Button>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* Desktop Search Bar with Backdrop */}
      <div className="hidden md:block relative">
        {/* Backdrop Overlay */}
        <AnimatePresence>
          {activeField && (
            <motion.div 
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveField(null)}
            />
          )}
        </AnimatePresence>

        <motion.div 
          className={cn(
            "relative z-50 flex items-center bg-card rounded-full border shadow-lg transition-shadow",
            activeField && "shadow-2xl"
          )}
          animate={{ 
            scale: activeField ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Location */}
          <Popover open={activeField === 'location'} onOpenChange={(open) => setActiveField(open ? 'location' : null)}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "flex-1 px-6 py-4 text-left rounded-l-full transition-all",
                  activeField === 'location' 
                    ? "bg-card shadow-lg" 
                    : activeField 
                      ? "bg-muted/30 hover:bg-muted/50" 
                      : "hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-semibold">{language === 'ru' ? 'Куда' : 'Where'}</p>
                <p className={cn("text-sm", selectedLocations.length === 0 ? "text-muted-foreground" : "font-medium")}>
                  {locationLabel}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="start" sideOffset={8}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{language === 'ru' ? 'Выберите районы' : 'Choose areas'}</h4>
                {selectedLocations.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLocations([])}>
                    {language === 'ru' ? 'Сбросить' : 'Clear'}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {locations.filter(l => l.id !== 'all').map((loc) => (
                  <button
                    key={loc.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border",
                      selectedLocations.includes(loc.id)
                        ? "bg-primary/10 border-primary text-primary font-medium" 
                        : "border-transparent hover:bg-muted"
                    )}
                    onClick={() => toggleLocation(loc.id)}
                  >
                    <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                    {language === 'ru' ? loc.labelRu : loc.labelEn}
                  </button>
                ))}
              </div>
              {selectedLocations.length > 0 && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setActiveField('checkin')}
                >
                  {language === 'ru' ? 'Выбрать даты' : 'Select dates'} →
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Check In */}
          <Popover open={activeField === 'checkin'} onOpenChange={(open) => setActiveField(open ? 'checkin' : null)}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "px-6 py-4 text-left transition-all",
                  activeField === 'checkin' 
                    ? "bg-card shadow-lg rounded-full" 
                    : activeField 
                      ? "bg-muted/30 hover:bg-muted/50" 
                      : "hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-semibold">{language === 'ru' ? 'Заезд' : 'Check in'}</p>
                <p className={cn("text-sm", !checkIn ? "text-muted-foreground" : "font-medium")}>
                  {checkIn ? formatDate(checkIn) : (language === 'ru' ? 'Добавить' : 'Add dates')}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="center" sideOffset={8}>
              <div className="flex gap-2 mb-4">
                {flexibleDates.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      handleFlexibleDate(option);
                      setActiveField('guests');
                    }}
                  >
                    {language === 'ru' ? option.labelRu : option.labelEn}
                  </Button>
                ))}
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: checkIn, to: checkOut } as DateRange}
                onSelect={(range: DateRange | undefined) => {
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

          <div className="w-px h-8 bg-border" />

          {/* Check Out */}
          <Popover open={activeField === 'checkout'} onOpenChange={(open) => setActiveField(open ? 'checkout' : null)}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "px-6 py-4 text-left transition-all",
                  activeField === 'checkout' 
                    ? "bg-card shadow-lg rounded-full" 
                    : activeField 
                      ? "bg-muted/30 hover:bg-muted/50" 
                      : "hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-semibold">{language === 'ru' ? 'Выезд' : 'Check out'}</p>
                <p className={cn("text-sm", !checkOut ? "text-muted-foreground" : "font-medium")}>
                  {checkOut 
                    ? `${formatDate(checkOut)}${nights > 0 ? ` · ${nights} ${language === 'ru' ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ноч.') : 'n.'}` : ''}`
                    : (language === 'ru' ? 'Добавить' : 'Add dates')}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="center" sideOffset={8}>
              <CalendarComponent
                mode="range"
                selected={{ from: checkIn, to: checkOut } as DateRange}
                onSelect={(range: DateRange | undefined) => {
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

          <div className="w-px h-8 bg-border" />

          {/* Bedrooms (Desktop) */}
          <Popover open={activeField === 'bedrooms'} onOpenChange={(open) => setActiveField(open ? 'bedrooms' : null)}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "px-5 py-4 text-left transition-all",
                  activeField === 'bedrooms' 
                    ? "bg-card shadow-lg rounded-full" 
                    : activeField 
                      ? "bg-muted/30 hover:bg-muted/50" 
                      : "hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-semibold">{language === 'ru' ? 'Спальни' : 'Beds'}</p>
                <p className={cn("text-sm", selectedBedrooms.length === 0 ? "text-muted-foreground" : "font-medium")}>
                  {bedroomLabel}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="center" sideOffset={8}>
              <div className="grid grid-cols-3 gap-1.5">
                {BEDROOM_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleBedroom(option.id)}
                    className={cn(
                      "py-2 px-2 rounded-lg text-sm font-medium transition-colors text-center",
                      selectedBedrooms.includes(option.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    )}
                  >
                    {language === 'ru' ? option.labelRu : option.labelEn}
                  </button>
                ))}
              </div>
              {selectedBedrooms.length > 0 && (
                <button
                  onClick={() => setSelectedBedrooms([])}
                  className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center py-1"
                >
                  {language === 'ru' ? 'Сбросить' : 'Clear'}
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* Guests */}
          <Popover open={activeField === 'guests'} onOpenChange={(open) => setActiveField(open ? 'guests' : null)}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "px-6 py-4 text-left transition-all",
                  activeField === 'guests' 
                    ? "bg-card shadow-lg rounded-full" 
                    : activeField 
                      ? "bg-muted/30 hover:bg-muted/50" 
                      : "hover:bg-muted/50"
                )}
              >
                <p className="text-xs font-semibold">{language === 'ru' ? 'Гости' : 'Who'}</p>
                <p className={cn("text-sm", totalGuests === 2 ? "text-muted-foreground" : "font-medium")}>
                  {totalGuests} {language === 'ru' ? (totalGuests === 1 ? 'гость' : 'гостей') : (totalGuests === 1 ? 'guest' : 'guests')}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
              <GuestCounter
                label={language === 'ru' ? 'Взрослые' : 'Adults'}
                sublabel={language === 'ru' ? 'От 13 лет' : 'Ages 13+'}
                value={adults}
                onChange={setAdults}
                min={1}
              />
              <GuestCounter
                label={language === 'ru' ? 'Дети' : 'Children'}
                sublabel={language === 'ru' ? 'От 2 до 12 лет' : 'Ages 2-12'}
                value={children}
                onChange={setChildren}
              />
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
        </motion.div>
      </div>
    </div>
  );
}
