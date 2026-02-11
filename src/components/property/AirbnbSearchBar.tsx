import React, { useState, useEffect, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { createPortal } from 'react-dom';
import { Search, MapPin, Globe, X, Minus, Plus, Check, Bed, Home, Zap, Waves, Droplets, Eye, Mountain, TreePalm, Sparkles, Building, Fence, Dumbbell, PawPrint, Baby, Utensils, Wifi, Car, Sun } from 'lucide-react';
import { NextStepNudge } from '@/components/hints/NextStepNudge';
import { usePropertyQuickFilters, DistrictOption } from '@/hooks/usePropertyQuickFilters';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
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
  propertyTypes: string[];
  amenities: string[];
  instantBooking: boolean;
}

const flexibleDates = [
  { id: 'weekend', labelEn: 'Weekend', labelRu: 'Выходные', getDates: () => ({ from: addDays(new Date(), (6 - new Date().getDay()) % 7), to: addDays(new Date(), (7 - new Date().getDay()) % 7 + 1) }) },
  { id: 'week', labelEn: 'Week', labelRu: 'Неделя', getDates: () => ({ from: new Date(), to: addWeeks(new Date(), 1) }) },
  { id: 'month', labelEn: 'Month', labelRu: 'Месяц', getDates: () => ({ from: new Date(), to: addMonths(new Date(), 1) }) },
];

type MobileTab = 'location' | 'dates' | 'property' | 'guests';

const BEDROOM_OPTIONS = [
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
  { id: '1', labelEn: '1+', labelRu: '1+' },
  { id: '2', labelEn: '2+', labelRu: '2+' },
  { id: '3', labelEn: '3+', labelRu: '3+' },
  { id: '4', labelEn: '4+', labelRu: '4+' },
  { id: '5', labelEn: '5+', labelRu: '5+' },
  { id: '6', labelEn: '6+', labelRu: '6+' },
  { id: '8', labelEn: '8+', labelRu: '8+' },
  { id: '10', labelEn: '10+', labelRu: '10+' },
  { id: '12', labelEn: '12+', labelRu: '12+' },
];

// Amenity/category options with icons
const AMENITY_CATEGORIES = [
  { id: 'beachfront', icon: Waves, labelEn: 'Beachfront', labelRu: 'У пляжа' },
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea View', labelRu: 'Вид на море' },
  { id: 'mountain_view', icon: Mountain, labelEn: 'Mountain', labelRu: 'Горы' },
  { id: 'tropical', icon: TreePalm, labelEn: 'Tropical', labelRu: 'Тропики' },
  { id: 'luxury', icon: Sparkles, labelEn: 'Luxury', labelRu: 'Люкс' },
  { id: 'new_build', icon: Building, labelEn: 'New Build', labelRu: 'Новострой' },
  { id: 'garden', icon: Fence, labelEn: 'Garden', labelRu: 'Сад' },
  { id: 'gym', icon: Dumbbell, labelEn: 'Gym', labelRu: 'Спортзал' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pet Friendly', labelRu: 'С питомцами' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Для детей' },
  { id: 'kitchen', icon: Utensils, labelEn: 'Kitchen', labelRu: 'Кухня' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
  { id: 'rooftop', icon: Sun, labelEn: 'Rooftop', labelRu: 'Крыша' },
];

export function AirbnbSearchBar({ onSearch, className }: AirbnbSearchBarProps) {
  const { language } = useLanguage();
  const { districts: dbDistricts } = usePropertyQuickFilters();
  const { propertyTypes } = usePropertyFilterOptions();
  const isRu = language === 'ru';

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
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [instantBooking, setInstantBooking] = useState(false);

  const totalGuests = adults + children;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  // Count of property tab filters
  const propertyFilterCount = selectedPropertyTypes.length + selectedBedrooms.length + selectedAmenities.length + (instantBooking ? 1 : 0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSearch = () => {
    onSearch({
      locations: selectedLocations,
      checkIn,
      checkOut,
      guests: totalGuests,
      bedrooms: selectedBedrooms,
      propertyTypes: selectedPropertyTypes,
      amenities: selectedAmenities,
      instantBooking,
    });
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
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setInstantBooking(false);
  };

  const toggleLocation = (locId: string) => {
    if (locId === 'all') {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(prev =>
        prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
      );
    }
  };

  const toggleBedroom = (id: string) => {
    setSelectedBedrooms(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const togglePropertyType = (id: string) => {
    setSelectedPropertyTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const locationLabel = selectedLocations.length === 0
    ? (isRu ? 'Весь Пхукет' : 'Anywhere in Phuket')
    : selectedLocations.length === 1
      ? locations.find(l => l.id === selectedLocations[0])?.[isRu ? 'labelRu' : 'labelEn'] || ''
      : `${selectedLocations.length} ${isRu ? 'районов' : 'areas'}`;

  const formatDateShort = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, 'd MMM', { locale: isRu ? ru : undefined });
  };

  const handleFlexibleDate = (dateOption: typeof flexibleDates[0]) => {
    const dates = dateOption.getDates();
    setCheckIn(dates.from);
    setCheckOut(dates.to);
  };

  const goToNextTab = () => {
    if (mobileTab === 'location') setMobileTab('dates');
    else if (mobileTab === 'dates') setMobileTab('property');
    else if (mobileTab === 'property') setMobileTab('guests');
  };

  // Build compact summary for mobile bar
  const summaryParts: string[] = [];
  summaryParts.push(locationLabel);
  if (checkIn && checkOut) {
    summaryParts.push(`${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`);
  }
  if (totalGuests !== 2) {
    summaryParts.push(`${totalGuests} ${isRu ? 'гост.' : 'guests'}`);
  }
  if (selectedPropertyTypes.length > 0) {
    const firstType = propertyTypes.find(t => t.id === selectedPropertyTypes[0]);
    summaryParts.push(firstType ? (isRu ? firstType.labelRu : firstType.labelEn) : '');
  }
  if (selectedBedrooms.length > 0) {
    summaryParts.push(selectedBedrooms[0] === 'studio' ? (isRu ? 'Студия' : 'Studio') : `${selectedBedrooms[0]}+ ${isRu ? 'сп.' : 'BR'}`);
  }
  if (selectedAmenities.length > 0) {
    const firstAm = AMENITY_CATEGORIES.find(a => a.id === selectedAmenities[0]);
    summaryParts.push(firstAm ? (isRu ? firstAm.labelRu : firstAm.labelEn) : '');
  }
  if (instantBooking) {
    summaryParts.push(isRu ? 'Мгнов.' : 'Instant');
  }

  const bedroomLabel = selectedBedrooms.length === 0
    ? (isRu ? 'Спальни' : 'Bedrooms')
    : selectedBedrooms.length === 1
      ? (selectedBedrooms[0] === 'studio' ? (isRu ? 'Студия' : 'Studio') : `${selectedBedrooms[0]} ${isRu ? 'сп.' : 'bed'}`)
      : `${selectedBedrooms.length} ${isRu ? 'выбрано' : 'selected'}`;

  const propertyTabLabel = propertyFilterCount === 0
    ? (isRu ? 'Жильё' : 'Property')
    : `${isRu ? 'Жильё' : 'Property'} (${propertyFilterCount})`;

  const GuestCounter = ({ label, sublabel, value, onChange, min = 0, max = 16 }: {
    label: string; sublabel: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
  }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-muted-foreground/30" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-8 text-center font-semibold text-lg">{value}</span>
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-muted-foreground/30" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // ── Property Tab Content (shared between mobile & desktop) ──
  const PropertyTabContent = () => (
    <div className="space-y-5">
      {/* Property Type */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{isRu ? 'Тип жилья' : 'Property type'}</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {propertyTypes.map(type => (
            <button
              key={type.id}
              onClick={() => togglePropertyType(type.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors border text-sm",
                selectedPropertyTypes.includes(type.id)
                  ? "bg-primary/10 border-primary/30 text-primary font-medium"
                  : "border-border hover:bg-muted"
              )}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{isRu ? type.labelRu : type.labelEn}</span>
              {selectedPropertyTypes.includes(type.id) && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t" />

      {/* Bedrooms */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{isRu ? 'Спальни' : 'Bedrooms'}</h4>
        <div className="grid grid-cols-4 gap-2">
          {BEDROOM_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => toggleBedroom(option.id)}
              className={cn(
                "py-2.5 px-2 rounded-xl text-sm font-medium transition-all border text-center",
                selectedBedrooms.includes(option.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/40 bg-card"
              )}
            >
              {isRu ? option.labelRu : option.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t" />

      {/* Amenities & Features */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{isRu ? 'Удобства и особенности' : 'Amenities & features'}</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {AMENITY_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedAmenities.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleAmenity(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-center transition-all border",
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium leading-tight">{isRu ? cat.labelRu : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t" />

      {/* Instant Booking */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <div>
            <p className="text-sm font-medium">{isRu ? 'Мгновенное бронирование' : 'Instant booking'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Без ожидания подтверждения' : 'No waiting for approval'}</p>
          </div>
        </div>
        <Switch checked={instantBooking} onCheckedChange={setInstantBooking} />
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {/* ═══ Mobile Search Bar ═══ */}
      <div className="md:hidden">
        <motion.div
          className="flex items-center gap-2 px-4 py-2.5 bg-card rounded-full border shadow-sm cursor-pointer"
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium truncate">{summaryParts[0]}</span>
              {summaryParts.length > 1 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground truncate">
                    {summaryParts.slice(1).join(' · ')}
                  </span>
                </>
              )}
            </div>
          </div>
          {propertyFilterCount > 0 && (
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {propertyFilterCount}
            </span>
          )}
        </motion.div>

        {/* ═══ Mobile Full Screen Modal ═══ */}
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
                  {/* Header */}
                  <div className="border-b shrink-0">
                    <div className="flex items-center justify-between px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                      <span className="font-semibold">{isRu ? 'Поиск' : 'Search'}</span>
                      <Button variant="ghost" size="sm" onClick={clearAll} className="text-primary">
                        {isRu ? 'Сброс' : 'Clear'}
                      </Button>
                    </div>

                    {/* Tab Navigation — 4 tabs: Куда | Когда | Жильё | Кто */}
                    <div className="flex px-4 gap-1">
                      {(['location', 'dates', 'property', 'guests'] as MobileTab[]).map((tab) => (
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
                          {tab === 'location' && (isRu ? 'Куда' : 'Where')}
                          {tab === 'dates' && (isRu ? 'Когда' : 'When')}
                          {tab === 'property' && (
                            <span className="inline-flex items-center gap-1">
                              {isRu ? 'Жильё' : 'Property'}
                              {propertyFilterCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] inline-flex items-center justify-center">
                                  {propertyFilterCount}
                                </span>
                              )}
                            </span>
                          )}
                          {tab === 'guests' && (isRu ? 'Кто' : 'Who')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Location Tab */}
                    {mobileTab === 'location' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{isRu ? 'Куда вы едете?' : 'Where are you going?'}</h3>
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
                              {loc.id === 'all' ? <Globe className="w-4 h-4 shrink-0" /> : <MapPin className="w-4 h-4 shrink-0" />}
                              <span className="flex-1 text-xs font-medium truncate">{isRu ? loc.labelRu : loc.labelEn}</span>
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
                                  <MapPin className="w-3 h-3" /> {isRu ? loc.labelRu : loc.labelEn}
                                  <button onClick={(e) => { e.stopPropagation(); toggleLocation(locId); }} className="ml-1 hover:text-primary/70">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        <NextStepNudge
                          message={isRu ? 'Теперь выберите даты →' : 'Now select dates →'}
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
                        <h3 className="text-xl font-bold">{isRu ? 'Когда поездка?' : 'When is your trip?'}</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {flexibleDates.map((option) => (
                            <Button
                              key={option.id}
                              variant="outline"
                              size="sm"
                              className={cn("rounded-full whitespace-nowrap", checkIn && checkOut && "border-primary/50")}
                              onClick={() => { handleFlexibleDate(option); goToNextTab(); }}
                            >
                              {isRu ? option.labelRu : option.labelEn}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap" onClick={() => { setCheckIn(undefined); setCheckOut(undefined); }}>
                            {isRu ? 'Гибкие даты' : 'Flexible'}
                          </Button>
                        </div>
                        <div className="flex justify-center">
                          <CalendarComponent
                            mode="range"
                            selected={{ from: checkIn, to: checkOut } as DateRange}
                            onSelect={(range: DateRange | undefined) => {
                              setCheckIn(range?.from);
                              setCheckOut(range?.to);
                              if (range?.to) goToNextTab();
                            }}
                            numberOfMonths={1}
                            disabled={(date) => date < new Date()}
                            className="rounded-xl border-0 p-0"
                            locale={isRu ? ru : undefined}
                          />
                        </div>
                        {checkIn && checkOut && (
                          <div className="text-center p-3 bg-primary/5 rounded-xl">
                            <p className="text-sm font-medium text-primary">
                              {formatDateShort(checkIn)} – {formatDateShort(checkOut)}
                              <span className="mx-1.5 text-primary/60">·</span>
                              {nights} {isRu ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей') : 'nights'}
                            </p>
                          </div>
                        )}
                        <NextStepNudge
                          message={isRu ? 'Настройте жильё →' : 'Set property preferences →'}
                          direction="down"
                          visible={!!checkIn && !!checkOut && mobileTab === 'dates'}
                          hintId="search-dates-to-property"
                          className="self-center w-fit mx-auto"
                        />
                      </div>
                    )}

                    {/* Property Tab (NEW — unified type + bedrooms + amenities + instant) */}
                    {mobileTab === 'property' && (
                      <div className="p-4">
                        <h3 className="text-xl font-bold mb-4">{isRu ? 'Какое жильё ищете?' : 'What are you looking for?'}</h3>
                        <PropertyTabContent />
                      </div>
                    )}

                    {/* Guests Tab */}
                    {mobileTab === 'guests' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{isRu ? 'Кто едет?' : "Who's coming?"}</h3>
                        <div className="space-y-2">
                          <GuestCounter label={isRu ? 'Взрослые' : 'Adults'} sublabel={isRu ? 'От 13 лет' : 'Ages 13+'} value={adults} onChange={setAdults} min={1} />
                          <GuestCounter label={isRu ? 'Дети' : 'Children'} sublabel={isRu ? 'От 2 до 12 лет' : 'Ages 2-12'} value={children} onChange={setChildren} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t bg-background shrink-0">
                    <Button className="w-full h-14 rounded-xl text-base gap-2 font-semibold" onClick={handleSearch}>
                      <Search className="w-5 h-5" />
                      {isRu ? 'Найти жильё' : 'Search'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* ═══ Desktop Search Bar ═══ */}
      <div className="hidden md:block relative">
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
          className={cn("relative z-50 flex items-center bg-card rounded-full border shadow-lg transition-shadow", activeField && "shadow-2xl")}
          animate={{ scale: activeField ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Location */}
          <Popover open={activeField === 'location'} onOpenChange={(open) => setActiveField(open ? 'location' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("flex-1 px-6 py-4 text-left rounded-l-full transition-all", activeField === 'location' ? "bg-card shadow-lg" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Куда' : 'Where'}</p>
                <p className={cn("text-sm", selectedLocations.length === 0 ? "text-muted-foreground" : "font-medium")}>{locationLabel}</p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="start" sideOffset={8}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{isRu ? 'Выберите районы' : 'Choose areas'}</h4>
                {selectedLocations.length > 0 && <Button variant="ghost" size="sm" onClick={() => setSelectedLocations([])}>{isRu ? 'Сбросить' : 'Clear'}</Button>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {locations.filter(l => l.id !== 'all').map((loc) => (
                  <button key={loc.id} className={cn("flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border", selectedLocations.includes(loc.id) ? "bg-primary/10 border-primary text-primary font-medium" : "border-transparent hover:bg-muted")} onClick={() => toggleLocation(loc.id)}>
                    <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                    {isRu ? loc.labelRu : loc.labelEn}
                  </button>
                ))}
              </div>
              {selectedLocations.length > 0 && <Button className="w-full mt-4" onClick={() => setActiveField('checkin')}>{isRu ? 'Выбрать даты' : 'Select dates'} →</Button>}
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Check In */}
          <Popover open={activeField === 'checkin'} onOpenChange={(open) => setActiveField(open ? 'checkin' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("px-6 py-4 text-left transition-all", activeField === 'checkin' ? "bg-card shadow-lg rounded-full" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Заезд' : 'Check in'}</p>
                <p className={cn("text-sm", !checkIn ? "text-muted-foreground" : "font-medium")}>{checkIn ? formatDateShort(checkIn) : (isRu ? 'Добавить' : 'Add dates')}</p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="center" sideOffset={8}>
              <div className="flex gap-2 mb-4">
                {flexibleDates.map((option) => (
                  <Button key={option.id} variant="outline" size="sm" className="rounded-full" onClick={() => { handleFlexibleDate(option); setActiveField('property'); }}>
                    {isRu ? option.labelRu : option.labelEn}
                  </Button>
                ))}
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: checkIn, to: checkOut } as DateRange}
                onSelect={(range: DateRange | undefined) => { setCheckIn(range?.from); setCheckOut(range?.to); if (range?.to) setActiveField('property'); }}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                locale={isRu ? ru : undefined}
              />
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Check Out */}
          <Popover open={activeField === 'checkout'} onOpenChange={(open) => setActiveField(open ? 'checkout' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("px-6 py-4 text-left transition-all", activeField === 'checkout' ? "bg-card shadow-lg rounded-full" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Выезд' : 'Check out'}</p>
                <p className={cn("text-sm", !checkOut ? "text-muted-foreground" : "font-medium")}>
                  {checkOut ? `${formatDateShort(checkOut)}${nights > 0 ? ` · ${nights} ${isRu ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ноч.') : 'n.'}` : ''}` : (isRu ? 'Добавить' : 'Add dates')}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="center" sideOffset={8}>
              <CalendarComponent
                mode="range"
                selected={{ from: checkIn, to: checkOut } as DateRange}
                onSelect={(range: DateRange | undefined) => { setCheckIn(range?.from); setCheckOut(range?.to); if (range?.to) setActiveField('property'); }}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                locale={isRu ? ru : undefined}
              />
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Property (Desktop — replaces old Bedrooms segment) */}
          <Popover open={activeField === 'property'} onOpenChange={(open) => setActiveField(open ? 'property' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("px-5 py-4 text-left transition-all", activeField === 'property' ? "bg-card shadow-lg rounded-full" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Жильё' : 'Property'}</p>
                <p className={cn("text-sm", propertyFilterCount === 0 ? "text-muted-foreground" : "font-medium")}>
                  {propertyFilterCount === 0
                    ? (isRu ? 'Тип, удобства' : 'Type, amenities')
                    : `${propertyFilterCount} ${isRu ? 'фильтр.' : 'filters'}`
                  }
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-4 max-h-[70vh] overflow-y-auto" align="center" sideOffset={8}>
              <PropertyTabContent />
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Guests */}
          <Popover open={activeField === 'guests'} onOpenChange={(open) => setActiveField(open ? 'guests' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("px-6 py-4 text-left transition-all", activeField === 'guests' ? "bg-card shadow-lg rounded-full" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Гости' : 'Who'}</p>
                <p className={cn("text-sm", totalGuests === 2 ? "text-muted-foreground" : "font-medium")}>
                  {totalGuests} {isRu ? (totalGuests === 1 ? 'гость' : 'гостей') : (totalGuests === 1 ? 'guest' : 'guests')}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
              <GuestCounter label={isRu ? 'Взрослые' : 'Adults'} sublabel={isRu ? 'От 13 лет' : 'Ages 13+'} value={adults} onChange={setAdults} min={1} />
              <GuestCounter label={isRu ? 'Дети' : 'Children'} sublabel={isRu ? 'От 2 до 12 лет' : 'Ages 2-12'} value={children} onChange={setChildren} />
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <div className="px-2 py-2">
            <Button size="lg" className="rounded-full h-12 px-6 gap-2" onClick={handleSearch}>
              <Search className="w-5 h-5" />
              <span className="hidden lg:inline">{isRu ? 'Найти' : 'Search'}</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
