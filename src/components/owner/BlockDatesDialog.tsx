import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, eachDayOfInterval, isWithinInterval, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { toast } from 'sonner';
interface BlockDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  initialDate?: Date;
  mode?: 'block' | 'unblock';
  onSuccess?: () => void;
}

export function BlockDatesDialog({
  open,
  onOpenChange,
  propertyId,
  initialDate,
  mode = 'block',
  onSuccess,
}: BlockDatesDialogProps) {
  const { language } = useLanguage();
const isRu = language === 'ru';
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { upsertAvailability, deleteAvailability, availability, isSaving } = usePropertyAvailabilityManagement(propertyId);
  const { bookings } = usePropertyBookings(propertyId);
  
  // Sync dateRange with initialDate when dialog opens
  useEffect(() => {
    if (open && initialDate) {
      setDateRange({ from: initialDate, to: initialDate });
      setNote('');
    }
  }, [open, initialDate]);
  
  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDateRange(undefined);
      setNote('');
    }
    onOpenChange(isOpen);
  };
  
  // Check if any date in range has a booking
  const conflictingBookings = useMemo(() => {
    if (!dateRange?.from || !bookings) return [];
    
    const endDate = dateRange.to || dateRange.from;
    
    return bookings.filter(booking => {
      const bookingStart = new Date(booking.check_in);
      const bookingEnd = new Date(booking.check_out);
      
      // Check if booking overlaps with selected range
      return bookingStart < addDays(endDate, 1) && bookingEnd > dateRange.from;
    });
  }, [dateRange, bookings]);
  
  const hasConflicts = conflictingBookings.length > 0;
  
  const handleSubmit = async () => {
    if (!dateRange?.from) return;
    
    if (mode === 'block' && hasConflicts) {
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: isRu 
          ? 'Невозможно заблокировать даты с существующими бронированиями'
          : 'Cannot block dates with existing bookings',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endDate = dateRange.to || dateRange.from;
      const dates = eachDayOfInterval({ start: dateRange.from, end: endDate });
      
      if (mode === 'block') {
        // Block dates
        const entries = dates.map(date => ({
          date,
          status: 'blocked' as const,
          note: note || undefined,
        }));
        
        await upsertAvailability(entries);
        
        toast(isRu ? 'Даты закрыты' : 'Dates Blocked', {
          description: isRu 
            ? `${dates.length} ${dates.length === 1 ? 'дата закрыта' : 'дат закрыто'}`
            : `${dates.length} ${dates.length === 1 ? 'date' : 'dates'} blocked`,
        });
      } else {
        // Unblock dates
        await deleteAvailability(dates);
        
        toast(isRu ? 'Даты открыты' : 'Dates Unblocked', {
          description: isRu 
            ? `${dates.length} ${dates.length === 1 ? 'дата открыта' : 'дат открыто'}`
            : `${dates.length} ${dates.length === 1 ? 'date' : 'dates'} unblocked`,
        });
      }
      
      onSuccess?.();
      onOpenChange(false);
      setDateRange(undefined);
      setNote('');
    } catch (error) {
      console.error('Error managing dates:', error);
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: isRu ? 'Не удалось обновить даты' : 'Failed to update dates',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Modifiers for blocked dates
  const blockedDates = useMemo(() => {
    return availability
      .filter(a => a.status === 'blocked')
      .map(a => a.date);
  }, [availability]);
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'block' ? (
              <>
                <Lock className="h-5 w-5 text-destructive" />
                {isRu ? 'Закрыть даты' : 'Block Dates'}
              </>
            ) : (
              <>
                <Unlock className="h-5 w-5 text-success" />
                {isRu ? 'Открыть даты' : 'Unblock Dates'}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              {isRu ? 'Выберите диапазон дат' : 'Select date range'}
            </Label>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              locale={isRu ? ru : undefined}
              disabled={mode === 'block' ? (date) => {
                // Disable dates that have bookings
                if (!bookings) return false;
                const dateStr = format(date, 'yyyy-MM-dd');
                return bookings.some(b => 
                  dateStr >= b.check_in && dateStr < b.check_out
                );
              } : undefined}
              modifiers={{
                blocked: blockedDates,
              }}
              modifiersClassNames={{
                blocked: 'bg-destructive/20 text-destructive',
              }}
              className="rounded-md border"
            />
          </div>
          
          {dateRange?.from && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">
                {format(dateRange.from, 'd MMMM yyyy', { locale: isRu ? ru : undefined })}
                {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() && (
                  <> — {format(dateRange.to, 'd MMMM yyyy', { locale: isRu ? ru : undefined })}</>
                )}
              </p>
              <p className="text-muted-foreground">
                {dateRange.to ? (
                  eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length
                ) : 1}{' '}
                {isRu ? 'дн.' : 'days'}
              </p>
            </div>
          )}
          
          {mode === 'block' && hasConflicts && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  {isRu ? 'Конфликт с бронированиями' : 'Booking Conflict'}
                </p>
                <p className="text-muted-foreground">
                  {conflictingBookings.map(b => b.guest_name || (isRu ? 'Гость' : 'Guest')).join(', ')}
                </p>
              </div>
            </div>
          )}
          
          {mode === 'block' && (
            <div>
              <Label htmlFor="note">{isRu ? 'Причина (опционально)' : 'Reason (optional)'}</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isRu ? 'Например: Ремонт' : 'E.g.: Maintenance'}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!dateRange?.from || isSubmitting || (mode === 'block' && hasConflicts)}
            variant={mode === 'block' ? 'destructive' : 'default'}
          >
            {isSubmitting ? (
              isRu ? 'Сохранение...' : 'Saving...'
            ) : mode === 'block' ? (
              isRu ? 'Закрыть даты' : 'Block Dates'
            ) : (
              isRu ? 'Открыть даты' : 'Unblock Dates'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
