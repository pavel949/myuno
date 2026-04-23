/**
 * PropertySearchSheet — Airbnb-style mobile bottom sheet search.
 *
 * Replaces the 4-tab full-screen modal with a 3-section experience:
 *   1. Where  — Suggested destinations (Nearby + popular beaches), text autocomplete
 *   2. When   — Dates / Months / Flexible (±N days)
 *   3. Who    — Adults / Children / Infants
 *
 * Mirrors the "Searching homes" flow on Airbnb (Mobbin reference).
 * Mobile-first; on md+ the parent renders the existing AirbnbSearchBar desktop pill.
 *
 * State is fully controlled — parent owns SearchParams; this sheet just reads
 * an initial draft and emits onSearch when the user taps the CTA.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, addMonths, differenceInDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  X, Search, Navigation, Waves, MapPin, Building2, Plus, Minus,
  Check, ChevronRight, Loader2,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

import type { SearchParams } from './AirbnbSearchBar';

// ── Suggested destinations (Phuket-tuned) ──
const SUGGESTED_BEACHES = [
  { id: 'patong', icon: Waves, en: 'Patong', ru: 'Патонг', subEn: 'Nightlife & beach', subRu: 'Ночная жизнь и пляж' },
  { id: 'bangtao', icon: Waves, en: 'Bangtao', ru: 'Бангтао', subEn: 'Long beach, family', subRu: 'Длинный пляж, семьи' },
  { id: 'kata', icon: Waves, en: 'Kata', ru: 'Ката', subEn: 'Surfing & sunsets', subRu: 'Сёрфинг и закаты' },
  { id: 'karon', icon: Waves, en: 'Karon', ru: 'Карон', subEn: 'Quiet wide beach', subRu: 'Тихий широкий пляж' },
  { id: 'rawai', icon: Waves, en: 'Rawai', subEn: 'Local & expat hub', subRu: 'Локалы и экспаты' },
  { id: 'phuket-town', icon: Building2, en: 'Phuket Town', ru: 'Пхукет-таун', subEn: 'Old town, cafés', subRu: 'Старый город, кафе' },
];

type WhenMode = 'dates' | 'months' | 'flexible';
type Section = 'where' | 'when' | 'who';

interface PropertySearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<SearchParams>;
  onSearch: (params: SearchParams) => void;
}

export function PropertySearchSheet({ open, onOpenChange, initial, onSearch }: PropertySearchSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { districts: dbDistricts } = usePropertyQuickFilters();
  const geo = useGeolocation();

  // ── Draft state ──
  const [section, setSection] = useState<Section>('where');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initial?.locations ?? []);
  const [textQuery, setTextQuery] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>(initial?.checkIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initial?.checkOut);
  const [whenMode, setWhenMode] = useState<WhenMode>('dates');
  const [monthsLength, setMonthsLength] = useState(1);
  const [monthsStart, setMonthsStart] = useState<Date>(() => startOfDay(new Date()));
  const [flexRange, setFlexRange] = useState<0 | 1 | 2 | 7>(0); // ± days
  const [adults, setAdults] = useState(initial?.guests ?? 2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Reset when re-opening with new initial
  useEffect(() => {
    if (open) {
      setSelectedLocations(initial?.locations ?? []);
      setCheckIn(initial?.checkIn);
      setCheckOut(initial?.checkOut);
      setAdults(initial?.guests ?? 2);
      setSection('where');
      setTextQuery('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open (without nuking other modals — only when open=true and nobody else)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const totalGuests = adults + children;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  // Text autocomplete results — match districts by labelEn/labelRu/valueKey
  const autocompleteResults = useMemo(() => {
    const q = textQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return dbDistricts
      .filter(d =>
        d.valueKey.includes(q) ||
        d.labelEn.toLowerCase().includes(q) ||
        d.labelRu.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [textQuery, dbDistricts]);

  // ── Handlers ──
  const handleNearby = () => {
    geo.getPosition?.();
    // We just signal "nearby" via a dedicated id — the catalog can handle it
    // (or fall back to first popular beach if geo not granted).
    setSelectedLocations(['nearby']);
    setSection('when');
  };

  const handlePickSuggested = (id: string) => {
    setSelectedLocations([id]);
    setTextQuery('');
    setSection('when');
  };

  const handlePickAutocomplete = (valueKey: string) => {
    setSelectedLocations([valueKey]);
    setTextQuery('');
    setSection('when');
  };

  const computeWhenDates = (): { from?: Date; to?: Date } => {
    if (whenMode === 'dates') return { from: checkIn, to: checkOut };
    if (whenMode === 'months') {
      const from = monthsStart;
      const to = addMonths(from, monthsLength);
      return { from, to };
    }
    // flexible — keep checkIn/checkOut if set, otherwise compute next-week range
    if (checkIn && checkOut) return { from: checkIn, to: checkOut };
    return { from: addDays(new Date(), 7), to: addDays(new Date(), 10) };
  };

  const handleSearch = () => {
    const { from, to } = computeWhenDates();
    onSearch({
      locations: selectedLocations,
      checkIn: from,
      checkOut: to,
      guests: totalGuests,
      bedrooms: [],
      propertyTypes: [],
      amenities: [],
      instantBooking: false,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    setSelectedLocations([]);
    setTextQuery('');
    setCheckIn(undefined);
    setCheckOut(undefined);
    setWhenMode('dates');
    setMonthsLength(1);
    setFlexRange(0);
    setAdults(2);
    setChildren(0);
    setInfants(0);
    setSection('where');
  };

  // ── Section summaries (collapsed pill text) ──
  const whereSummary = selectedLocations.length === 0
    ? (isRu ? 'Куда поедем?' : 'Where to?')
    : selectedLocations[0] === 'nearby'
      ? (isRu ? 'Рядом со мной' : 'Nearby')
      : dbDistricts.find(d => d.valueKey === selectedLocations[0])?.[isRu ? 'labelRu' : 'labelEn']
        ?? (isRu ? `${selectedLocations.length} мест` : `${selectedLocations.length} places`);

  const whenSummary = (() => {
    if (whenMode === 'months') return `${monthsLength} ${isRu ? (monthsLength === 1 ? 'месяц' : monthsLength < 5 ? 'месяца' : 'месяцев') : monthsLength === 1 ? 'month' : 'months'}`;
    if (checkIn && checkOut) {
      const from = format(checkIn, 'd MMM', { locale: isRu ? ru : undefined });
      const to = format(checkOut, 'd MMM', { locale: isRu ? ru : undefined });
      const flexSuffix = flexRange > 0 ? ` ±${flexRange}` : '';
      return `${from} – ${to}${flexSuffix}`;
    }
    return isRu ? 'Любые даты' : 'Any dates';
  })();

  const whoSummary = totalGuests === 0
    ? (isRu ? 'Гости' : 'Guests')
    : `${totalGuests} ${isRu ? (totalGuests === 1 ? 'гость' : totalGuests < 5 ? 'гостя' : 'гостей') : totalGuests === 1 ? 'guest' : 'guests'}${infants > 0 ? `, ${infants} ${isRu ? 'до 2-х' : 'infant' + (infants > 1 ? 's' : '')}` : ''}`;

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-sheet-backdrop"
            className="fixed inset-0 z-[100] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            key="search-sheet"
            className="fixed inset-x-0 bottom-0 z-[101] bg-background rounded-none shadow-2xl flex flex-col max-h-[92vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label={isRu ? 'Поиск жилья' : 'Search homes'}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label={isRu ? 'Закрыть' : 'Close'}
              >
                <X className="w-5 h-5" />
              </Button>
              <span className="font-semibold text-base">
                {isRu ? 'Поиск жилья' : 'Search homes'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={handleClear}
              >
                {isRu ? 'Сброс' : 'Clear'}
              </Button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {/* ─── Where ─── */}
              <SearchCard
                title={isRu ? 'Куда' : 'Where'}
                summary={whereSummary}
                expanded={section === 'where'}
                onClick={() => setSection('where')}
                hasValue={selectedLocations.length > 0}
              >
                {/* Text search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={isRu ? 'Поиск пляжа или района' : 'Search beach or area'}
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    className="pl-9 h-11 rounded-none"
                    aria-label={isRu ? 'Поиск места' : 'Search location'}
                  />
                </div>

                {/* Autocomplete results */}
                {autocompleteResults.length > 0 && (
                  <div className="mb-4 border rounded-none overflow-hidden">
                    {autocompleteResults.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-muted active:bg-muted border-b last:border-b-0"
                        onClick={() => handlePickAutocomplete(d.valueKey)}
                      >
                        <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {isRu ? d.labelRu : d.labelEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isRu ? 'Район Пхукета' : 'Phuket area'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggested destinations grid (only when no autocomplete) */}
                {autocompleteResults.length === 0 && (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {isRu ? 'Популярные направления' : 'Suggested destinations'}
                    </p>

                    {/* Nearby */}
                    <button
                      type="button"
                      onClick={handleNearby}
                      className="w-full flex items-center gap-3 p-3 rounded-none border hover:bg-muted active:bg-muted mb-2"
                      disabled={geo.loading}
                    >
                      <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
                        {geo.loading ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <Navigation className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold">
                          {isRu ? 'Рядом со мной' : 'Nearby'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {isRu ? 'Найти что рядом' : 'Find what is around you'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {SUGGESTED_BEACHES.map(b => {
                        const Icon = b.icon;
                        const active = selectedLocations.includes(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handlePickSuggested(b.id)}
                            className={cn(
                              'flex flex-col items-start gap-1 p-3 rounded-none border text-left transition-colors',
                              active
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted',
                            )}
                          >
                            <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center mb-1">
                              <Icon className="w-4 h-4 text-foreground" />
                            </div>
                            <p className="text-sm font-semibold leading-tight">
                              {isRu ? b.ru : b.en}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">
                              {isRu ? b.subRu : b.subEn}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </SearchCard>

              {/* ─── When ─── */}
              <SearchCard
                title={isRu ? 'Когда' : 'When'}
                summary={whenSummary}
                expanded={section === 'when'}
                onClick={() => setSection('when')}
                hasValue={!!checkIn || whenMode === 'months'}
              >
                {/* Mode switcher */}
                <div className="flex gap-1 p-1 bg-muted rounded-full mb-4">
                  {(['dates', 'months', 'flexible'] as WhenMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWhenMode(m)}
                      className={cn(
                        'flex-1 py-2 text-xs font-semibold rounded-full transition-colors',
                        whenMode === m
                          ? 'bg-background shadow-sm text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {m === 'dates' && (isRu ? 'Даты' : 'Dates')}
                      {m === 'months' && (isRu ? 'Месяцы' : 'Months')}
                      {m === 'flexible' && (isRu ? 'Гибкие' : 'Flexible')}
                    </button>
                  ))}
                </div>

                {/* Dates mode — calendar + ±N flex chips */}
                {whenMode === 'dates' && (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <CalendarComponent
                        mode="range"
                        selected={{ from: checkIn, to: checkOut } as DateRange}
                        onSelect={(range: DateRange | undefined) => {
                          setCheckIn(range?.from);
                          setCheckOut(range?.to);
                        }}
                        numberOfMonths={1}
                        disabled={(date) => date < startOfDay(new Date())}
                        locale={isRu ? ru : undefined}
                        className={cn('rounded-none border-0 p-0 pointer-events-auto')}
                      />
                    </div>

                    {checkIn && checkOut && (
                      <>
                        <div className="text-center p-2.5 bg-primary/5 rounded-none">
                          <p className="text-sm font-medium text-primary">
                            {nights} {isRu ? (nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей') : nights === 1 ? 'night' : 'nights'}
                          </p>
                        </div>

                        {/* Exact / ±1 / ±2 / ±7 */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            {isRu ? 'Гибкость по датам' : 'Date flexibility'}
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            {([0, 1, 2, 7] as const).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setFlexRange(n)}
                                className={cn(
                                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                  flexRange === n
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'border-border bg-background hover:bg-muted',
                                )}
                              >
                                {n === 0
                                  ? (isRu ? 'Точные' : 'Exact')
                                  : `±${n} ${isRu ? (n === 1 ? 'день' : 'дн.') : n === 1 ? 'day' : 'days'}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Months mode */}
                {whenMode === 'months' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          {isRu ? 'Длительность' : 'How long?'}
                        </p>
                        <p className="text-base font-semibold text-primary">
                          {monthsLength} {isRu ? (monthsLength === 1 ? 'мес.' : 'мес.') : monthsLength === 1 ? 'month' : 'months'}
                        </p>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={12}
                        step={1}
                        value={monthsLength}
                        onChange={(e) => setMonthsLength(Number(e.target.value))}
                        className="w-full accent-primary"
                        aria-label={isRu ? 'Месяцев' : 'Months'}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>1</span><span>3</span><span>6</span><span>9</span><span>12</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">
                        {isRu ? 'С какого числа' : 'Starting from'}
                      </p>
                      <div className="flex justify-center">
                        <CalendarComponent
                          mode="single"
                          selected={monthsStart}
                          onSelect={(d) => d && setMonthsStart(startOfDay(d))}
                          disabled={(date) => date < startOfDay(new Date())}
                          locale={isRu ? ru : undefined}
                          numberOfMonths={1}
                          className={cn('rounded-none border-0 p-0 pointer-events-auto')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Flexible mode */}
                {whenMode === 'flexible' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {isRu
                        ? 'Покажем варианты на ближайшее свободное время.'
                        : "We'll show options for the nearest free time."}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'weekend', en: 'Weekend', ru: 'Выходные', days: 2 },
                        { id: 'week', en: 'A week', ru: 'Неделя', days: 7 },
                        { id: 'month', en: 'A month', ru: 'Месяц', days: 30 },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const from = addDays(new Date(), 7);
                            setCheckIn(from);
                            setCheckOut(addDays(from, opt.days));
                          }}
                          className="p-3 rounded-none border text-center hover:bg-muted"
                        >
                          <p className="text-sm font-semibold">{isRu ? opt.ru : opt.en}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {opt.days} {isRu ? (opt.days === 1 ? 'день' : 'дн.') : 'days'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </SearchCard>

              {/* ─── Who ─── */}
              <SearchCard
                title={isRu ? 'Кто' : 'Who'}
                summary={whoSummary}
                expanded={section === 'who'}
                onClick={() => setSection('who')}
                hasValue={totalGuests !== 2 || infants > 0}
              >
                <div className="space-y-1">
                  <GuestRow
                    label={isRu ? 'Взрослые' : 'Adults'}
                    sub={isRu ? 'От 13 лет' : 'Ages 13+'}
                    value={adults}
                    onChange={setAdults}
                    min={1}
                  />
                  <GuestRow
                    label={isRu ? 'Дети' : 'Children'}
                    sub={isRu ? 'От 2 до 12 лет' : 'Ages 2–12'}
                    value={children}
                    onChange={setChildren}
                  />
                  <GuestRow
                    label={isRu ? 'Младенцы' : 'Infants'}
                    sub={isRu ? 'До 2 лет' : 'Under 2'}
                    value={infants}
                    onChange={setInfants}
                  />
                </div>
              </SearchCard>
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t bg-background shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                className="w-full h-14 rounded-none text-base gap-2 font-semibold"
                onClick={handleSearch}
              >
                <Search className="w-5 h-5" />
                {isRu ? 'Найти жильё' : 'Search'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─────────────────────── Sub-components ───────────────────────

interface SearchCardProps {
  title: string;
  summary: string;
  expanded: boolean;
  hasValue: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SearchCard({ title, summary, expanded, hasValue, onClick, children }: SearchCardProps) {
  return (
    <div
      className={cn(
        'rounded-none border bg-card transition-shadow',
        expanded ? 'shadow-md' : 'shadow-sm',
      )}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={onClick}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-muted-foreground">{title}</span>
          <span className={cn('text-sm truncate ml-3', hasValue ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
            {summary}
          </span>
        </button>
      ) : (
        <div className="px-5 py-4">
          <h3 className="text-xl font-bold mb-3">{title}</h3>
          {children}
        </div>
      )}
    </div>
  );
}

interface GuestRowProps {
  label: string;
  sub: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}

function GuestRow({ label, sub, value, onChange, min = 0, max = 16 }: GuestRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-muted-foreground/30"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-muted-foreground/30"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
