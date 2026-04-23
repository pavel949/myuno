/**
 * PropertyDetailDateSheet — Mobile bottom sheet for date range + guest count selection.
 */
import { Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';

interface AvailabilityEntry {
  date: Date | string;
  status: string;
}

interface PropertyDetailDateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  guestCount: number;
  onGuestCountChange: (count: number) => void;
  maxGuests?: number;
  minStayNights?: number | null;
  availability: AvailabilityEntry[];
  unavailableDates: Set<string>;
  onConfirm: () => void;
}

export function PropertyDetailDateSheet({
  open,
  onOpenChange,
  dateRange,
  onDateRangeChange,
  guestCount,
  onGuestCountChange,
  maxGuests = 10,
  minStayNights,
  availability,
  unavailableDates,
  onConfirm,
}: PropertyDetailDateSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const nights =
    dateRange?.from && dateRange?.to
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-none max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle>{isRu ? 'Выберите даты' : 'Select dates'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={1}
              disabled={(date) => {
                if (date < new Date()) return true;
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                return unavailableDates.has(key);
              }}
              modifiers={{
                booked: availability
                  .filter((a) => a.status === 'booked')
                  .map((a) => (a.date instanceof Date ? a.date : new Date(a.date))),
                blocked: availability
                  .filter((a) => a.status === 'blocked')
                  .map((a) => (a.date instanceof Date ? a.date : new Date(a.date))),
              }}
              modifiersStyles={{
                booked: { textDecoration: 'line-through', opacity: 0.4 },
                blocked: { textDecoration: 'line-through', opacity: 0.3 },
              }}
              className="pointer-events-auto"
            />
          </div>

          {dateRange?.from && dateRange?.to && (
            <div className="flex items-center justify-between px-2 py-3 rounded-none bg-muted/50">
              <div className="text-sm">
                <span className="font-medium">
                  {format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })}
                </span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="font-medium">
                  {format(dateRange.to, 'd MMM', { locale: isRu ? ru : undefined })}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {nights} {isRu ? 'ночей' : 'nights'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium">{isRu ? 'Гости' : 'Guests'}</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onGuestCountChange(Math.max(1, guestCount - 1))}
                disabled={guestCount <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-6 text-center font-semibold">{guestCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onGuestCountChange(Math.min(maxGuests, guestCount + 1))}
                disabled={guestCount >= maxGuests}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {minStayNights && nights > 0 && nights < minStayNights && (
            <p className="text-xs text-destructive px-2">
              {isRu
                ? `Минимум ${minStayNights} ночей`
                : `Minimum stay: ${minStayNights} nights`}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!dateRange?.from || !dateRange?.to}
            onClick={onConfirm}
          >
            {dateRange?.from && dateRange?.to
              ? (isRu ? 'Перейти к бронированию' : 'Continue to booking')
              : (isRu ? 'Выберите даты' : 'Select dates')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
