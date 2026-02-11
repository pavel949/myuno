import React, { useState, useEffect, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { createPortal } from 'react-dom';
import { Search, MapPin, Globe, X, Minus, Plus, Check, Bed, Home, Zap,
  Waves, Footprints, Eye, Droplets, Lock, WashingMachine, PawPrint, Baby, Car, Wifi, Sparkles
} from 'lucide-react';
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

type MobileTab = 'type' | 'beach' | 'dates' | 'details';

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

// Key differentiators for the Details tab — Phuket-specific
const DETAIL_AMENITIES = [
  { id: 'private_pool', icon: Lock, labelEn: 'Private pool', labelRu: 'Свой бассейн' },
  { id: 'walk_to_beach', icon: Footprints, labelEn: 'Walk to beach', labelRu: 'Пешком до пляжа' },
  { id: 'washer', icon: WashingMachine, labelEn: 'Washer', labelRu: 'Стиралка' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pets OK', labelRu: 'С питомцами' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Для детей' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea view', labelRu: 'Вид на море' },
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
];

// Popular beaches first, then others
const POPULAR_BEACHES = [
  'bangtao', 'surin', 'kamala', 'kata', 'karon', 'patong', 'nai-harn', 'layan',
  'nai-yang', 'mai-khao', 'rawai', 'chalong'
];

export function AirbnbSearchBar({ onSearch, className }: AirbnbSearchBarProps) {
  const { language } = useLanguage();
  const { districts: dbDistricts } = usePropertyQuickFilters();
  const { propertyTypes } = usePropertyFilterOptions();
  const isRu = language === 'ru';

  // Sort districts: popular beaches first
  const locations = useMemo(() => {
    const sorted = [...dbDistricts].sort((a, b) => {
      const aIdx = POPULAR_BEACHES.indexOf(a.valueKey);
      const bIdx = POPULAR_BEACHES.indexOf(b.valueKey);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return 0;
    });
    return sorted.map(d => ({ id: d.valueKey, labelEn: d.labelEn, labelRu: d.labelRu }));
  }, [dbDistricts]);

  const popularBeaches = useMemo(() => locations.filter(l => POPULAR_BEACHES.includes(l.id)), [locations]);
  const otherAreas = useMemo(() => locations.filter(l => !POPULAR_BEACHES.includes(l.id)), [locations]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('type');
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

  const detailsFilterCount = selectedBedrooms.length + selectedAmenities.length + (instantBooking ? 1 : 0) + (totalGuests !== 2 ? 1 : 0);

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
    setSelectedLocations(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    );
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
      : `${selectedLocations.length} ${isRu ? 'пляжей' : 'beaches'}`;

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
    if (mobileTab === 'type') setMobileTab('beach');
    else if (mobileTab === 'beach') setMobileTab('dates');
    else if (mobileTab === 'dates') setMobileTab('details');
  };

  // Build smart summary for the collapsed pill
  const pillTitle = useMemo(() => {
    const parts: string[] = [];
    if (selectedPropertyTypes.length === 1) {
      const pt = propertyTypes.find(t => t.id === selectedPropertyTypes[0]);
      if (pt) parts.push(isRu ? pt.labelRu : pt.labelEn);
    }
    if (selectedLocations.length === 1) {
      const loc = locations.find(l => l.id === selectedLocations[0]);
      if (loc) parts.push(isRu ? loc.labelRu : loc.labelEn);
    } else if (selectedLocations.length > 1) {
      parts.push(`${selectedLocations.length} ${isRu ? 'пляжей' : 'beaches'}`);
    }
    if (parts.length === 0) return isRu ? 'Куда угодно' : 'Where to?';
    return parts.join(' · ');
  }, [selectedPropertyTypes, selectedLocations, propertyTypes, locations, isRu]);

  const pillSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (checkIn && checkOut) {
      parts.push(`${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`);
    } else {
      parts.push(isRu ? 'Любые даты' : 'Any dates');
    }
    if (selectedBedrooms.length === 1) {
      parts.push(selectedBedrooms[0] === 'studio' ? (isRu ? 'Студия' : 'Studio') : `${selectedBedrooms[0]} ${isRu ? 'сп.' : 'BR'}`);
    }
    if (selectedAmenities.length > 0) {
      const first = DETAIL_AMENITIES.find(a => a.id === selectedAmenities[0]);
      if (first) parts.push(isRu ? first.labelRu : first.labelEn);
    }
    if (totalGuests !== 2) parts.push(`${totalGuests} ${isRu ? 'гост.' : 'guests'}`);
    return parts.join(' · ');
  }, [checkIn, checkOut, selectedBedrooms, selectedAmenities, totalGuests, isRu]);

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

  // ── Details Tab Content (bedrooms + guests + amenity toggles + instant) ──
  const DetailsTabContent = () => (
    <div className="space-y-5">
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

      {/* Guests */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{isRu ? 'Гости' : 'Guests'}</h4>
        <GuestCounter label={isRu ? 'Взрослые' : 'Adults'} sublabel={isRu ? 'От 13 лет' : 'Ages 13+'} value={adults} onChange={setAdults} min={1} />
        <GuestCounter label={isRu ? 'Дети' : 'Children'} sublabel={isRu ? 'От 2 до 12 лет' : 'Ages 2-12'} value={children} onChange={setChildren} />
      </div>

      <div className="border-t" />

      {/* Key Differentiators */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{isRu ? 'Важные удобства' : 'Key features'}</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {DETAIL_AMENITIES.map(cat => {
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
      {/* ═══ Mobile Search Bar — Airbnb-style minimal pill ═══ */}
      <div className="md:hidden">
        <motion.div
          className="flex items-center gap-3 px-4 py-3 bg-card rounded-full border shadow-sm cursor-pointer"
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-5 h-5 text-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{pillTitle}</p>
            <p className="text-xs text-muted-foreground leading-tight truncate">{pillSubtitle}</p>
          </div>
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

                    {/* Tab Navigation — Type | Beach | Dates | Details */}
                    <div className="flex px-4 gap-1">
                      {(['type', 'beach', 'dates', 'details'] as MobileTab[]).map((tab) => (
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
                          {tab === 'type' && (
                            <span className="inline-flex items-center gap-1">
                              {isRu ? 'Тип' : 'Type'}
                              {selectedPropertyTypes.length > 0 && (
                                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] inline-flex items-center justify-center">
                                  {selectedPropertyTypes.length}
                                </span>
                              )}
                            </span>
                          )}
                          {tab === 'beach' && (
                            <span className="inline-flex items-center gap-1">
                              {isRu ? 'Пляж' : 'Beach'}
                              {selectedLocations.length > 0 && (
                                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] inline-flex items-center justify-center">
                                  {selectedLocations.length}
                                </span>
                              )}
                            </span>
                          )}
                          {tab === 'dates' && (isRu ? 'Даты' : 'Dates')}
                          {tab === 'details' && (
                            <span className="inline-flex items-center gap-1">
                              {isRu ? 'Детали' : 'Details'}
                              {detailsFilterCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] inline-flex items-center justify-center">
                                  {detailsFilterCount}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Type Tab */}
                    {mobileTab === 'type' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{isRu ? 'Какой тип жилья?' : 'What type of place?'}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {propertyTypes.map(type => (
                            <button
                              key={type.id}
                              onClick={() => togglePropertyType(type.id)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all border-2",
                                selectedPropertyTypes.includes(type.id)
                                  ? "bg-primary/10 border-primary text-primary font-semibold"
                                  : "border-border hover:bg-muted"
                              )}
                            >
                              <Home className="w-5 h-5 shrink-0" />
                              <span className="flex-1 text-sm truncate">{isRu ? type.labelRu : type.labelEn}</span>
                              {selectedPropertyTypes.includes(type.id) && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                        <NextStepNudge
                          message={isRu ? 'Выберите пляж →' : 'Pick a beach →'}
                          direction="right"
                          visible={selectedPropertyTypes.length > 0 && mobileTab === 'type'}
                          hintId="search-type-to-beach"
                          className="mt-2 self-center w-fit mx-auto pointer-events-auto cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Beach / Area Tab */}
                    {mobileTab === 'beach' && (
                      <div className="p-4 space-y-4">
                        <h3 className="text-xl font-bold">{isRu ? 'Какой пляж / район?' : 'Which beach / area?'}</h3>
                        
                        {/* Popular beaches */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                            {isRu ? 'Популярные пляжи' : 'Popular beaches'}
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {popularBeaches.map((loc) => (
                              <button
                                key={loc.id}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors border",
                                  selectedLocations.includes(loc.id)
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "border-border hover:bg-muted"
                                )}
                                onClick={() => toggleLocation(loc.id)}
                              >
                                <Waves className="w-4 h-4 shrink-0" />
                                <span className="flex-1 text-xs font-medium truncate">{isRu ? loc.labelRu : loc.labelEn}</span>
                                {selectedLocations.includes(loc.id) && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Other areas */}
                        {otherAreas.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                              {isRu ? 'Другие районы' : 'Other areas'}
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {otherAreas.map((loc) => (
                                <button
                                  key={loc.id}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors border",
                                    selectedLocations.includes(loc.id)
                                      ? "bg-primary/10 border-primary/30 text-primary"
                                      : "border-border hover:bg-muted"
                                  )}
                                  onClick={() => toggleLocation(loc.id)}
                                >
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  <span className="flex-1 text-xs font-medium truncate">{isRu ? loc.labelRu : loc.labelEn}</span>
                                  {selectedLocations.includes(loc.id) && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Selected summary chips */}
                        {selectedLocations.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {selectedLocations.map(locId => {
                              const loc = locations.find(l => l.id === locId);
                              return loc ? (
                                <span key={locId} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                  <Waves className="w-3 h-3" /> {isRu ? loc.labelRu : loc.labelEn}
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
                          visible={selectedLocations.length > 0 && mobileTab === 'beach'}
                          hintId="search-beach-to-dates"
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
                          message={isRu ? 'Уточните детали →' : 'Add details →'}
                          direction="down"
                          visible={!!checkIn && !!checkOut && mobileTab === 'dates'}
                          hintId="search-dates-to-details"
                          className="self-center w-fit mx-auto"
                        />
                      </div>
                    )}

                    {/* Details Tab (bedrooms + guests + key amenities + instant) */}
                    {mobileTab === 'details' && (
                      <div className="p-4">
                        <h3 className="text-xl font-bold mb-4">{isRu ? 'Детали поиска' : 'Search details'}</h3>
                        <DetailsTabContent />
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
          {/* Type */}
          <Popover open={activeField === 'type'} onOpenChange={(open) => setActiveField(open ? 'type' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("flex-1 px-6 py-4 text-left rounded-l-full transition-all", activeField === 'type' ? "bg-card shadow-lg" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Тип' : 'Type'}</p>
                <p className={cn("text-sm", selectedPropertyTypes.length === 0 ? "text-muted-foreground" : "font-medium")}>
                  {selectedPropertyTypes.length === 0
                    ? (isRu ? 'Любой' : 'Any')
                    : selectedPropertyTypes.length === 1
                      ? (propertyTypes.find(t => t.id === selectedPropertyTypes[0])?.[isRu ? 'labelRu' : 'labelEn'] || '')
                      : `${selectedPropertyTypes.length} ${isRu ? 'типов' : 'types'}`
                  }
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start" sideOffset={8}>
              <h4 className="font-semibold mb-3">{isRu ? 'Тип жилья' : 'Property type'}</h4>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypes.map(type => (
                  <button key={type.id} className={cn("flex items-center gap-2 p-3 rounded-xl text-left text-sm transition-all border-2", selectedPropertyTypes.includes(type.id) ? "bg-primary/10 border-primary text-primary font-medium" : "border-transparent hover:bg-muted")} onClick={() => togglePropertyType(type.id)}>
                    <Home className="w-4 h-4 shrink-0" />
                    {isRu ? type.labelRu : type.labelEn}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Beach / Area */}
          <Popover open={activeField === 'beach'} onOpenChange={(open) => setActiveField(open ? 'beach' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("flex-1 px-6 py-4 text-left transition-all", activeField === 'beach' ? "bg-card shadow-lg rounded-full" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Пляж' : 'Beach'}</p>
                <p className={cn("text-sm", selectedLocations.length === 0 ? "text-muted-foreground" : "font-medium")}>{locationLabel}</p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="start" sideOffset={8}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{isRu ? 'Пляж / район' : 'Beach / area'}</h4>
                {selectedLocations.length > 0 && <Button variant="ghost" size="sm" onClick={() => setSelectedLocations([])}>{isRu ? 'Сбросить' : 'Clear'}</Button>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {locations.map((loc) => (
                  <button key={loc.id} className={cn("flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all border", selectedLocations.includes(loc.id) ? "bg-primary/10 border-primary text-primary font-medium" : "border-transparent hover:bg-muted")} onClick={() => toggleLocation(loc.id)}>
                    <Waves className="w-4 h-4 shrink-0 text-muted-foreground" />
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
                  <Button key={option.id} variant="outline" size="sm" className="rounded-full" onClick={() => { handleFlexibleDate(option); setActiveField('details'); }}>
                    {isRu ? option.labelRu : option.labelEn}
                  </Button>
                ))}
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: checkIn, to: checkOut } as DateRange}
                onSelect={(range: DateRange | undefined) => { setCheckIn(range?.from); setCheckOut(range?.to); if (range?.to) setActiveField('details'); }}
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
                onSelect={(range: DateRange | undefined) => { setCheckIn(range?.from); setCheckOut(range?.to); if (range?.to) setActiveField('details'); }}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                locale={isRu ? ru : undefined}
              />
            </PopoverContent>
          </Popover>

          <div className="w-px h-8 bg-border" />

          {/* Details (Desktop) */}
          <Popover open={activeField === 'details'} onOpenChange={(open) => setActiveField(open ? 'details' : null)}>
            <PopoverTrigger asChild>
              <button className={cn("px-5 py-4 text-left transition-all", activeField === 'details' ? "bg-card shadow-lg rounded-full" : activeField ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50")}>
                <p className="text-xs font-semibold">{isRu ? 'Детали' : 'Details'}</p>
                <p className={cn("text-sm", detailsFilterCount === 0 ? "text-muted-foreground" : "font-medium")}>
                  {detailsFilterCount === 0
                    ? (isRu ? 'Спальни, удобства' : 'Beds, features')
                    : `${detailsFilterCount} ${isRu ? 'фильтр.' : 'filters'}`
                  }
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-4 max-h-[70vh] overflow-y-auto" align="center" sideOffset={8}>
              <DetailsTabContent />
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
