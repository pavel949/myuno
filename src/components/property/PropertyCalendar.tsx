import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Lock, Unlock, DollarSign, X, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getEffectiveNightlyRate, type SeasonalPricingRule } from '@/lib/pricingEngine';

export interface AvailabilityEntry {
  date: Date;
  status: 'available' | 'blocked' | 'booked';
  priceOverride?: number;
  minNightsOverride?: number;
  note?: string;
  bookingId?: string;
}

interface PropertyCalendarProps {
  availability: AvailabilityEntry[];
  onChange: (availability: AvailabilityEntry[]) => void;
  basePrice?: number;
  currency?: string;
  seasonalPricing?: SeasonalPricingRule[];
  className?: string;
}

export function PropertyCalendar({ 
  availability, 
  onChange, 
  basePrice = 0,
  currency = 'THB',
  seasonalPricing,
  className 
}: PropertyCalendarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
    const days = eachDayOfInterval({ start, end });
    
    // Pad with days from previous month to start on Monday
    const startDay = start.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const paddedStart = new Date(start);
    paddedStart.setDate(paddedStart.getDate() - paddingDays);
    
    // Generate 6 weeks of days
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

  const getDatePrice = useCallback((date: Date): number => {
    const entry = availabilityMap.get(format(date, 'yyyy-MM-dd'));
    // Manual override takes priority, then seasonal rule, then base price
    if (entry?.priceOverride) return entry.priceOverride;
    return getEffectiveNightlyRate(date, basePrice, seasonalPricing);
  }, [availabilityMap, basePrice, seasonalPricing]);

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
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging && selectionStart) {
      setSelectionEnd(date);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectionStart && selectionEnd) {
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
      
      const entry: AvailabilityEntry = {
        date,
        status,
        priceOverride: editData.priceOverride,
        minNightsOverride: editData.minNightsOverride,
        note: editData.note,
      };
      
      if (existingIndex >= 0) {
        // Don't override booked dates
        if (newAvailability[existingIndex].status !== 'booked') {
          newAvailability[existingIndex] = entry;
        }
      } else {
        newAvailability.push(entry);
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

  return (
    <Card className={cn("", className)} onMouseUp={handleMouseUp} onMouseLeave={() => setIsDragging(false)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isRu ? 'Календарь доступности' : 'Availability Calendar'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Выделите даты для блокировки или настройки цен' : 'Select dates to block or set custom prices'}
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
        </div>

        {/* Calendar Grid */}
        <div className="select-none">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const status = getDateStatus(day);
              const price = getDatePrice(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPast = isBefore(day, startOfDay(new Date()));
              const isSelected = isDateInSelection(day);
              const entry = availabilityMap.get(format(day, 'yyyy-MM-dd'));

              return (
                <div
                  key={index}
                  className={cn(
                    "relative h-16 p-1 rounded-md border transition-all cursor-pointer",
                    !isCurrentMonth && "opacity-40",
                    isPast && "opacity-30 cursor-not-allowed",
                    isToday(day) && "ring-2 ring-primary",
                    isSelected && "ring-2 ring-primary bg-primary/10",
                    !isSelected && !isPast && statusColors[status],
                    !isPast && "hover:ring-2 hover:ring-primary/50"
                  )}
                  onMouseDown={() => handleMouseDown(day)}
                  onMouseEnter={() => handleMouseEnter(day)}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Price indicator — shows effective nightly rate */}
                  {isCurrentMonth && !isPast && price > 0 && (
                    <div className="absolute bottom-1 left-1 right-1">
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

                  {/* Status icon */}
                  {status === 'blocked' && !isPast && (
                    <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
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
                  {getSelectedDates().length} {isRu ? 'дней выбрано' : 'days selected'}
                </h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

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
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
