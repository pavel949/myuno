import { useMemo, useState } from 'react';
import { addDays, format, isPast, isToday, isTomorrow, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, Clock3, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DEFAULT_TIME = '18:00';
const TIME_PRESETS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '18:00', '20:00'];

interface TaskDueDateTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
}

function parseLocalDateTime(value: string) {
  if (!value) {
    return { selectedDate: undefined as Date | undefined, selectedTime: '' };
  }

  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  if (Number.isNaN(parsed.getTime())) {
    return { selectedDate: undefined as Date | undefined, selectedTime: '' };
  }

  return {
    selectedDate: parsed,
    selectedTime: format(parsed, 'HH:mm'),
  };
}

function buildLocalDateTime(date: Date, time: string) {
  return `${format(date, 'yyyy-MM-dd')}T${time}`;
}

export function TaskDueDateTimeField({
  value,
  onChange,
  allowClear = true,
}: TaskDueDateTimeFieldProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { selectedDate, selectedTime } = useMemo(() => parseLocalDateTime(value), [value]);

  const dateLocale = isRu ? ru : undefined;
  const t = (en: string, ruText: string) => (isRu ? ruText : en);

  const dueBadge = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    if (isToday(selectedDate)) {
      return {
        label: t('Today', 'Сегодня'),
        className: 'border-info/30 bg-info/10 text-info',
      };
    }

    if (isTomorrow(selectedDate)) {
      return {
        label: t('Tomorrow', 'Завтра'),
        className: 'border-primary/30 bg-primary/10 text-primary',
      };
    }

    if (isPast(selectedDate) && !isToday(selectedDate)) {
      return {
        label: t('Overdue', 'Просрочено'),
        className: 'border-destructive/30 bg-destructive/10 text-destructive',
      };
    }

    return {
      label: format(selectedDate, 'dd MMM, HH:mm', { locale: dateLocale }),
      className: 'border-muted-foreground/20 bg-muted text-foreground',
    };
  }, [dateLocale, isRu, selectedDate]);

  const quickDates = useMemo(
    () => [
      { label: t('Today', 'Сегодня'), date: new Date() },
      { label: t('Tomorrow', 'Завтра'), date: addDays(new Date(), 1) },
      { label: format(addDays(new Date(), 2), 'dd MMM', { locale: dateLocale }), date: addDays(new Date(), 2) },
    ],
    [dateLocale, isRu],
  );

  const handleDateSelect = (date?: Date) => {
    if (!date) return;
    const nextTime = selectedTime || DEFAULT_TIME;
    onChange(buildLocalDateTime(date, nextTime));
    setCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    if (!selectedDate) return;
    onChange(buildLocalDateTime(selectedDate, time));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label>{t('Due Date & Time', 'Срок и время')}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              'Pick a date first, then set a time or keep the default 18:00.',
              'Сначала выберите дату, затем время, либо оставьте стандартное 18:00.',
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dueBadge && (
            <Badge variant="outline" className={cn('shrink-0', dueBadge.className)}>
              {dueBadge.label}
            </Badge>
          )}
          {allowClear && value && (
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={handleClear}>
              <X className="mr-1 h-3.5 w-3.5" />
              {t('Clear', 'Очистить')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickDates.map((item) => (
          <Button
            key={item.label}
            type="button"
            size="sm"
            variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(item.date, 'yyyy-MM-dd') ? 'default' : 'outline'}
            onClick={() => handleDateSelect(item.date)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('Pick Date', 'Выбрать дату')}
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, 'PPP', { locale: dateLocale })
                  : t('Pick due date', 'Выберите срок')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('Pick Time', 'Выбрать время')}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_PRESETS.map((time) => (
              <Button
                key={time}
                type="button"
                size="sm"
                variant={selectedTime === time ? 'default' : 'outline'}
                onClick={() => handleTimeChange(time)}
                disabled={!selectedDate}
              >
                {time}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="time"
              className="pl-9"
              value={selectedTime || DEFAULT_TIME}
              onChange={(event) => handleTimeChange(event.target.value)}
              disabled={!selectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
