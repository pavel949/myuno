import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BookingDateTimeSelectProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  availableTimes?: string[];
  minDate?: Date;
  maxDate?: Date;
  disabledDays?: Date[];
  showCalendarInline?: boolean;
  showQuickDates?: boolean;
}

const DEFAULT_TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function BookingDateTimeSelect({
  date,
  time,
  onDateChange,
  onTimeChange,
  availableTimes = DEFAULT_TIMES,
  minDate = new Date(),
  maxDate,
  disabledDays = [],
  showCalendarInline = false,
  showQuickDates = true,
}: BookingDateTimeSelectProps) {
  const { language } = useLanguage();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const quickDates = [
    { label: language === 'ru' ? 'Сегодня' : 'Today', date: new Date() },
    { label: language === 'ru' ? 'Завтра' : 'Tomorrow', date: addDays(new Date(), 1) },
    { label: format(addDays(new Date(), 2), 'EEE', { locale: language === 'ru' ? ru : undefined }), date: addDays(new Date(), 2) },
    { label: format(addDays(new Date(), 3), 'EEE', { locale: language === 'ru' ? ru : undefined }), date: addDays(new Date(), 3) },
  ];

  const isDateDisabled = (d: Date) => {
    if (d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return disabledDays.some(disabled => 
      disabled.toDateString() === d.toDateString()
    );
  };

  const CalendarComponent = (
    <Calendar
      mode="single"
      selected={date}
      onSelect={(d) => {
        onDateChange(d);
        setCalendarOpen(false);
      }}
      disabled={isDateDisabled}
      initialFocus
      className="pointer-events-auto"
    />
  );

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          {language === 'ru' ? 'Дата' : 'Date'}
        </Label>

        {showQuickDates && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {quickDates.map((qd, idx) => (
              <Button
                key={idx}
                type="button"
                variant={date?.toDateString() === qd.date.toDateString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDateChange(qd.date)}
                disabled={isDateDisabled(qd.date)}
                className="flex-shrink-0"
              >
                {qd.label}
              </Button>
            ))}
          </div>
        )}

        {showCalendarInline ? (
          <div className="bg-card rounded-none border p-4 flex justify-center">
            {CalendarComponent}
          </div>
        ) : (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-12",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, "PPP", { locale: language === 'ru' ? ru : undefined })
                ) : (
                  language === 'ru' ? 'Выберите дату' : 'Pick a date'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
              {CalendarComponent}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Time Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          {language === 'ru' ? 'Время' : 'Time'}
        </Label>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {availableTimes.map((t) => (
            <Button
              key={t}
              type="button"
              variant={time === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeChange(t)}
              className="text-sm"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
