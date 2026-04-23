/**
 * DateRangePickerCard - Unified date range picker for booking flows
 * 
 * Used across: Property, Transport Rental, Yacht bookings
 * Supports: blocked dates, min/max stay, localization
 */

import React, { useState } from 'react';
import { format, differenceInDays, addDays, isBefore, isAfter, isSameDay } from 'date-fns';
import { ru, th, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { DateRange } from 'react-day-picker';

export interface DateRangePickerCardProps {
  /** Selected start date */
  startDate: Date | null;
  /** Selected end date */
  endDate: Date | null;
  /** Callback when range changes */
  onRangeChange: (start: Date | null, end: Date | null) => void;
  /** Array of blocked dates (not selectable) */
  blockedDates?: Date[];
  /** Minimum nights/days required */
  minStay?: number;
  /** Maximum nights/days allowed */
  maxStay?: number;
  /** Label for start date field */
  startLabel?: string;
  /** Label for end date field */
  endLabel?: string;
  /** Disable the entire picker */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Show night/day count */
  showDuration?: boolean;
  /** Duration unit (night for properties, day for rentals) */
  durationUnit?: 'night' | 'day';
  /** Earliest selectable date (defaults to today) */
  fromDate?: Date;
  /** Latest selectable date */
  toDate?: Date;
}

export function DateRangePickerCard({
  startDate,
  endDate,
  onRangeChange,
  blockedDates = [],
  minStay = 1,
  maxStay,
  startLabel,
  endLabel,
  disabled = false,
  className,
  showDuration = true,
  durationUnit = 'night',
  fromDate,
  toDate,
}: DateRangePickerCardProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const dateLocale = language === 'ru' ? ru : language === 'th' ? th : enUS;

  // Default labels
  const defaultStartLabel = language === 'ru' ? 'Начало' : language === 'th' ? 'เริ่มต้น' : 'Start';
  const defaultEndLabel = language === 'ru' ? 'Конец' : language === 'th' ? 'สิ้นสุด' : 'End';

  const duration = startDate && endDate 
    ? differenceInDays(endDate, startDate) 
    : 0;

  const durationText = duration > 0 
    ? `${duration} ${
        durationUnit === 'night'
          ? (language === 'ru' ? (duration === 1 ? 'ночь' : duration < 5 ? 'ночи' : 'ночей') : 'nights')
          : (language === 'ru' ? (duration === 1 ? 'день' : duration < 5 ? 'дня' : 'дней') : 'days')
      }`
    : null;

  const formatDate = (date: Date | null) => {
    if (!date) return language === 'ru' ? 'Выберите' : 'Select';
    return format(date, 'd MMM', { locale: dateLocale });
  };

  // Check if a date is blocked
  const isBlocked = (date: Date) => {
    return blockedDates.some(blocked => isSameDay(blocked, date));
  };

  // Check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isBefore(date, today)) return true;
    
    // Before fromDate
    if (fromDate && isBefore(date, fromDate)) return true;
    
    // After toDate
    if (toDate && isAfter(date, toDate)) return true;
    
    // Blocked dates
    if (isBlocked(date)) return true;
    
    return false;
  };

  // Handle range selection
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onRangeChange(null, null);
      return;
    }

    const { from, to } = range;
    
    // Validate min/max stay
    if (from && to) {
      const days = differenceInDays(to, from);
      
      if (days < minStay) {
        // Auto-extend to min stay
        const newEnd = addDays(from, minStay);
        onRangeChange(from, newEnd);
        setOpen(false);
        return;
      }
      
      if (maxStay && days > maxStay) {
        // Limit to max stay
        const newEnd = addDays(from, maxStay);
        onRangeChange(from, newEnd);
        setOpen(false);
        return;
      }
      
      // Check if range includes blocked dates
      let current = from;
      while (current <= to) {
        if (isBlocked(current)) {
          // Range includes a blocked date - reset selection
          onRangeChange(from, null);
          return;
        }
        current = addDays(current, 1);
      }
      
      setOpen(false);
    }
    
    onRangeChange(from || null, to || null);
  };

  return (
    <div className={cn("bg-card rounded-none border p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {language === 'ru' ? 'Даты' : language === 'th' ? 'วันที่' : 'Dates'}
        </h3>
        {showDuration && durationText && (
          <span className="text-sm text-muted-foreground font-medium">
            {durationText}
          </span>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">
                {startLabel || defaultStartLabel}
              </Label>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(startDate)}
              </Button>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                {endLabel || defaultEndLabel}
              </Label>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(endDate)}
              </Button>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={startDate || new Date()}
            selected={{
              from: startDate || undefined,
              to: endDate || undefined,
            }}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={isDateDisabled}
            locale={dateLocale}
            modifiers={{
              blocked: blockedDates,
            }}
            modifiersStyles={{
              blocked: {
                textDecoration: 'line-through',
                opacity: 0.5,
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
              },
            }}
          />
          {minStay > 1 && (
            <p className="px-4 pb-3 text-xs text-muted-foreground">
              {language === 'ru' 
                ? `Минимум ${minStay} ${minStay < 5 ? 'дня' : 'дней'}`
                : `Minimum ${minStay} ${durationUnit === 'night' ? 'nights' : 'days'}`}
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
