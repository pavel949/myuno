import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Lock, Unlock, DollarSign, X, Calendar as CalendarIcon, Save } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getEffectiveNightlyRate, buildPricingRulesFromSeasons, type SeasonalPricingRule, type RateSeasonRecord } from '@/lib/pricingEngine';
import type { UnifiedDayMeta } from '@/hooks/useStaysUnifiedCalendar';
import { getStaysChannelColor, STAYS_CHANNEL_COLORS } from '@/lib/staysCalendarChannelColors';
import type { StaysChannelKey } from '@/lib/staysCalendarChannelColors';

export interface AvailabilityEntry {
  date: Date;
  status: 'available' | 'blocked' | 'booked';
  priceOverride?: number;
  minNightsOverride?: number;
  note?: string;
  bookingId?: string;
}

export interface ActivityLogEntry {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

interface PropertyCalendarProps {
  availability: AvailabilityEntry[];
  onChange: (availability: AvailabilityEntry[]) => void;
  basePrice?: number;
  currency?: string;
  seasonalPricing?: SeasonalPricingRule[];
  rateSeasons?: RateSeasonRecord[];
  onLogActivity?: (entry: ActivityLogEntry) => void;
  className?: string;
  /** STAYS: merged OTA/manual bookings per night — channel stripes + conflict badge */
  unifiedDayMeta?: Map<string, UnifiedDayMeta>;
}

export function PropertyCalendar({ 
  availability, 
  onChange, 
  basePrice = 0,
  currency = 'THB',
  seasonalPricing,
  rateSeasons,
  onLogActivity,
  className,
  unifiedDayMeta,
}: PropertyCalendarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [editPopoverOpen, setEditPopoverOpen] = useState(false);
  const [editData, setEditData] = useState<{
    priceOverride?: number;
    minNightsOverride?: number;
    note?: string;
  }>({});

  // Get availability map for quick lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityEntry>();
    availability.forEach(entry => {
      map.set(format(entry.date, 'yyyy-MM-dd'), entry);
    });
    return map;
  }, [availability]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const startDay = start.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const paddedStart = new Date(start);
    paddedStart.setDate(paddedStart.getDate() - paddingDays);
    
    const allDays: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(paddedStart);
      day.setDate(day.getDate() + i);
      allDays.push(day);
    }
    
    return allDays;
  }, [currentMonth]);

  const getDateStatus = useCallback((date: Date): AvailabilityEntry['status'] => {
    const entry = availabilityMap.get(format(date, 'yyyy-MM-dd'));
    return entry?.status || 'available';
  }, [availabilityMap]);

  const effectiveSeasonalPricing = useMemo(() => {
    if (rateSeasons && rateSeasons.length > 0 && basePrice > 0) {
      const rules = buildPricingRulesFromSeasons({ price_per_night: basePrice }, rateSeasons);
      return rules.seasonalPricing;
    }
    return seasonalPricing;
  }, [rateSeasons, seasonalPricing, basePrice]);

  const getDatePrice = useCallback((date: Date): number => {
    const entry = availabilityMap.get(format(date, 'yyyy-MM-dd'));
    if (entry?.priceOverride) return entry.priceOverride;
    return getEffectiveNightlyRate(date, basePrice, effectiveSeasonalPricing);
  }, [availabilityMap, basePrice, effectiveSeasonalPricing]);

  const isDateInSelection = useCallback((date: Date): boolean => {
    if (!selectionStart) return false;
    if (!selectionEnd) return isSameDay(date, selectionStart);
    
    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart < selectionEnd ? selectionEnd : selectionStart;
    
    return date >= start && date <= end;
  }, [selectionStart, selectionEnd]);

  const handleMouseDown = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return;
    setSelectionStart(date);
    setSelectionEnd(date);
    setIsDragging(true);
    setHasDragged(false);
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging && selectionStart) {
      if (!isSameDay(date, selectionStart)) {
        setHasDragged(true);
      }
      setSelectionEnd(date);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectionStart && selectionEnd) {
      const isSingleClick = isSameDay(selectionStart, selectionEnd) && !hasDragged;
      if (isSingleClick) {
        // Pre-fill edit data from existing entry for single date
        const entry = availabilityMap.get(format(selectionStart, 'yyyy-MM-dd'));
        setEditData({
          priceOverride: entry?.priceOverride,
          minNightsOverride: entry?.minNightsOverride,
          note: entry?.note,
        });
      }
      setEditPopoverOpen(true);
    }
    setIsDragging(false);
  };

  const getSelectedDates = useCallback((): Date[] => {
    if (!selectionStart || !selectionEnd) return [];
    
    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart < selectionEnd ? selectionEnd : selectionStart;
    
    return eachDayOfInterval({ start, end });
  }, [selectionStart, selectionEnd]);

  const applyToSelection = (status: AvailabilityEntry['status']) => {
    const dates = getSelectedDates();
    const newAvailability = [...availability];
    
    dates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingIndex = newAvailability.findIndex(e => format(e.date, 'yyyy-MM-dd') === dateKey);
      const oldEntry = existingIndex >= 0 ? newAvailability[existingIndex] : undefined;
      
      const entry: AvailabilityEntry = {
        date,
        status,
        priceOverride: editData.priceOverride,
        minNightsOverride: editData.minNightsOverride,
        note: editData.note,
      };
      
      if (existingIndex >= 0) {
        if (newAvailability[existingIndex].status !== 'booked') {
          newAvailability[existingIndex] = entry;
        }
      } else {
        newAvailability.push(entry);
      }

      // Log price override changes
      if (onLogActivity && editData.priceOverride !== undefined) {
        const oldPrice = oldEntry?.priceOverride ?? getEffectiveNightlyRate(date, basePrice, effectiveSeasonalPricing);
        if (editData.priceOverride !== oldPrice) {
          onLogActivity({
            action: 'price_override',
            entity_type: 'availability',
            details: { date: dateKey, old_value: oldPrice, new_value: editData.priceOverride },
          });
        }
      }
    });

    // Log availability status changes
    if (onLogActivity && dates.length > 0) {
      onLogActivity({
        action: 'availability_changed',
        entity_type: 'availability',
        details: {
          dates: dates.map(d => format(d, 'yyyy-MM-dd')),
          status,
          count: dates.length,
        },
      });
    }
    
    onChange(newAvailability);
    clearSelection();
  };

  /** Save only the price/settings for the selected dates without changing status */
  const savePriceOnly = () => {
    const dates = getSelectedDates();
    const newAvailability = [...availability];
    
    dates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingIndex = newAvailability.findIndex(e => format(e.date, 'yyyy-MM-dd') === dateKey);
      const oldEntry = existingIndex >= 0 ? newAvailability[existingIndex] : undefined;
      const currentStatus = oldEntry?.status || 'available';

      if (currentStatus === 'booked') return;

      const entry: AvailabilityEntry = {
        date,
        status: currentStatus,
        priceOverride: editData.priceOverride,
        minNightsOverride: editData.minNightsOverride,
        note: editData.note,
      };

      if (existingIndex >= 0) {
        newAvailability[existingIndex] = entry;
      } else {
        newAvailability.push(entry);
      }

      // Log
      if (onLogActivity && editData.priceOverride !== undefined) {
        const oldPrice = oldEntry?.priceOverride ?? getEffectiveNightlyRate(date, basePrice, effectiveSeasonalPricing);
        if (editData.priceOverride !== oldPrice) {
          onLogActivity({
            action: 'price_override',
            entity_type: 'availability',
            details: { date: dateKey, old_value: oldPrice, new_value: editData.priceOverride },
          });
        }
      }
    });

    onChange(newAvailability);
    clearSelection();
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setEditPopoverOpen(false);
    setEditData({});
  };

  const statusColors = {
    available: 'bg-success/10 text-success',
    blocked: 'bg-muted text-muted-foreground',
    booked: 'bg-destructive/10 text-destructive',
  };

  const weekDays = isRu 
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const selectedDates = getSelectedDates();
  const isSingleDate = selectedDates.length === 1;

  return (
    <Card className={cn("", className)} onMouseUp={handleMouseUp} onMouseLeave={() => setIsDragging(false)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isRu ? 'Календарь доступности' : 'Availability Calendar'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Кликните на дату или выделите диапазон для настройки' : 'Click a date or drag to select a range'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-32 text-center">
            {format(currentMonth, 'LLLL yyyy', { locale })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded", statusColors.available)} />
            <span>{isRu ? 'Свободно' : 'Available'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded", statusColors.blocked)} />
            <span>{isRu ? 'Заблокировано' : 'Blocked'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-4 h-4 rounded", statusColors.booked)} />
            <span>{isRu ? 'Забронировано' : 'Booked'}</span>
          </div>
          {unifiedDayMeta && (
            <div className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-3 mt-1">
              <span className="text-muted-foreground shrink-0">
                {isRu ? 'Каналы:' : 'Channels:'}
              </span>
              {(Object.keys(STAYS_CHANNEL_COLORS) as StaysChannelKey[]).map((k) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-sm border border-border/50 shrink-0"
                    style={{ backgroundColor: getStaysChannelColor(k) }}
                  />
                  <span className="text-[10px] capitalize">
                    {k === 'booking' ? 'Booking.com' : k === 'manual' ? (isRu ? 'Вручную' : 'Manual') : k}
                  </span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm ring-2 ring-destructive bg-background shrink-0" />
                <span className="text-[10px]">{isRu ? 'Конфликт' : 'Conflict'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="select-none">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const status = getDateStatus(day);
              const price = getDatePrice(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPast = isBefore(day, startOfDay(new Date()));
              const isSelected = isDateInSelection(day);
              const dayKey = format(day, 'yyyy-MM-dd');
              const unified = unifiedDayMeta?.get(dayKey);
              const conflictCount = unified?.conflictBadgeCount ?? 0;
              const channelKeys = unified?.channelKeys ?? [];

              return (
                <div
                  key={index}
                  className={cn(
                    "relative h-16 p-1 rounded-md border transition-all cursor-pointer overflow-hidden",
                    !isCurrentMonth && "opacity-40",
                    isPast && "opacity-30 cursor-not-allowed",
                    isToday(day) && !conflictCount && "ring-2 ring-primary",
                    isSelected && !conflictCount && "ring-2 ring-primary bg-primary/10",
                    conflictCount > 0 && "ring-2 ring-destructive bg-destructive/5",
                    !isSelected && !isPast && !conflictCount && statusColors[status],
                    !isPast && !conflictCount && "hover:ring-2 hover:ring-primary/50"
                  )}
                  onMouseDown={() => handleMouseDown(day)}
                  onMouseEnter={() => handleMouseEnter(day)}
                >
                  <span className={cn(
                    "text-xs font-medium relative z-[1]",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>

                  {conflictCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-0.5 right-0.5 h-5 min-w-[1.25rem] px-1 text-[10px] leading-none z-[2]"
                    >
                      {conflictCount}
                    </Badge>
                  )}

                  {channelKeys.length > 0 && !isPast && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5 flex pointer-events-none z-[1]"
                      aria-hidden
                    >
                      {channelKeys.map((k) => (
                        <div
                          key={k}
                          className="flex-1 min-w-0"
                          style={{ backgroundColor: getStaysChannelColor(k) }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {isCurrentMonth && !isPast && price > 0 && (
                    <div
                      className={cn(
                        'absolute left-1 right-1 z-[1]',
                        channelKeys.length > 0 ? 'bottom-2' : 'bottom-1',
                      )}
                    >
                      <span className={cn(
                        "text-[10px] block truncate",
                        price > basePrice
                          ? "font-semibold text-warning"
                          : price < basePrice
                            ? "font-semibold text-success"
                            : "text-muted-foreground"
                      )}>
                        {price.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {status === 'blocked' && !isPast && (
                    <Lock
                      className={cn(
                        'absolute top-1 h-3 w-3 text-muted-foreground z-[2] pointer-events-none',
                        conflictCount > 0 ? 'left-1' : 'right-1',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Actions Popover */}
        <Popover open={editPopoverOpen} onOpenChange={setEditPopoverOpen}>
          <PopoverTrigger asChild>
            <span />
          </PopoverTrigger>
          <PopoverContent className="w-72" align="center">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {isSingleDate
                    ? (isRu ? format(selectedDates[0], 'd MMMM', { locale: ru }) : format(selectedDates[0], 'MMM d'))
                    : `${selectedDates.length} ${isRu ? 'дней выбрано' : 'days selected'}`
                  }
                </h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isSingleDate && (
                <div className="text-xs text-muted-foreground">
                  {isRu ? 'Текущая цена' : 'Current price'}: {getDatePrice(selectedDates[0]).toLocaleString()} {currency}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">
                    {isRu ? 'Цена за ночь (переопределить)' : 'Price per night (override)'}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder={basePrice.toString()}
                      value={editData.priceOverride ?? ''}
                      onChange={(e) => setEditData({ ...editData, priceOverride: e.target.value ? Number(e.target.value) : undefined })}
                      className="h-8"
                    />
                    <span className="text-xs text-muted-foreground">{currency}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">
                    {isRu ? 'Мин. ночей (переопределить)' : 'Min nights (override)'}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    value={editData.minNightsOverride ?? ''}
                    onChange={(e) => setEditData({ ...editData, minNightsOverride: e.target.value ? Number(e.target.value) : undefined })}
                    className="h-8 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    {isRu ? 'Заметка' : 'Note'}
                  </Label>
                  <Input
                    placeholder={isRu ? 'Причина блокировки...' : 'Reason for blocking...'}
                    value={editData.note ?? ''}
                    onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                    className="h-8 mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Save price only button */}
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={savePriceOnly}
                  disabled={editData.priceOverride === undefined && editData.minNightsOverride === undefined && !editData.note}
                >
                  <Save className="h-3 w-3 mr-1" />
                  {isRu ? 'Сохранить цену' : 'Save Price'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => applyToSelection('available')}
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    {isRu ? 'Открыть' : 'Open'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => applyToSelection('blocked')}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    {isRu ? 'Закрыть' : 'Block'}
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
