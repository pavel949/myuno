import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, addDays, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, User, Phone, Mail, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddBookingFromCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  initialDate?: Date;
  onSuccess?: () => void;
}

const BOOKING_SOURCES = [
  { value: 'manual', labelEn: 'Manual', labelRu: 'Вручную' },
  { value: 'airbnb', labelEn: 'Airbnb', labelRu: 'Airbnb' },
  { value: 'booking', labelEn: 'Booking.com', labelRu: 'Booking.com' },
  { value: 'agoda', labelEn: 'Agoda', labelRu: 'Agoda' },
  { value: 'vrbo', labelEn: 'VRBO', labelRu: 'VRBO' },
  { value: 'direct', labelEn: 'Direct', labelRu: 'Напрямую' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

export function AddBookingFromCalendarDialog({
  open,
  onOpenChange,
  propertyId,
  initialDate,
  onSuccess,
}: AddBookingFromCalendarDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRu = language === 'ru';
  
  const [checkIn, setCheckIn] = useState<Date | undefined>(initialDate);
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestsCount, setGuestsCount] = useState('2');
  const [totalAmount, setTotalAmount] = useState('');
  const [source, setSource] = useState('manual');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  
  const { createBooking, bookings, isCreating } = usePropertyBookings(propertyId);
  const { availability } = usePropertyAvailabilityManagement(propertyId);
  
  // Check for conflicts with existing bookings
  const conflictingBookings = useMemo(() => {
    if (!checkIn || !checkOut || !bookings) return [];
    
    return bookings.filter(booking => {
      const bookingStart = new Date(booking.check_in);
      const bookingEnd = new Date(booking.check_out);
      
      // Check if booking overlaps with selected range
      return bookingStart < checkOut && bookingEnd > checkIn;
    });
  }, [checkIn, checkOut, bookings]);
  
  // Check for blocked dates in range
  const blockedDatesInRange = useMemo(() => {
    if (!checkIn || !checkOut || !availability) return [];
    
    const range = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
    return range.filter(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return availability.some(a => 
        format(a.date, 'yyyy-MM-dd') === dateStr && a.status === 'blocked'
      );
    });
  }, [checkIn, checkOut, availability]);
  
  const hasConflicts = conflictingBookings.length > 0 || blockedDatesInRange.length > 0;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  
  // Disable dates that are booked or blocked
  const disabledDates = useMemo(() => {
    const disabled: Date[] = [];
    
    // Add booked dates
    bookings?.forEach(booking => {
      const start = new Date(booking.check_in);
      const end = new Date(booking.check_out);
      let current = start;
      while (current < end) {
        disabled.push(new Date(current));
        current = addDays(current, 1);
      }
    });
    
    // Add blocked dates
    availability?.forEach(a => {
      if (a.status === 'blocked') {
        disabled.push(a.date);
      }
    });
    
    return disabled;
  }, [bookings, availability]);
  
  const handleSubmit = async () => {
    if (!checkIn || !checkOut) {
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Выберите даты заезда и выезда' : 'Select check-in and check-out dates',
        variant: 'destructive',
      });
      return;
    }
    
    if (hasConflicts) {
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu 
          ? 'Выбранные даты пересекаются с существующими бронированиями или закрыты'
          : 'Selected dates overlap with existing bookings or are blocked',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createBooking({
        property_id: propertyId,
        check_in: format(checkIn, 'yyyy-MM-dd'),
        check_out: format(checkOut, 'yyyy-MM-dd'),
        guest_name: guestName || undefined,
        guest_phone: guestPhone || undefined,
        guest_email: guestEmail || undefined,
        guests_count: parseInt(guestsCount) || undefined,
        total_amount: parseFloat(totalAmount) || undefined,
        source,
        notes: notes || undefined,
        status: 'confirmed',
      });
      
      toast({
        title: isRu ? 'Бронирование создано' : 'Booking Created',
        description: guestName 
          ? `${guestName} • ${nights} ${isRu ? 'ноч.' : 'nights'}`
          : `${nights} ${isRu ? 'ночей' : 'nights'}`,
      });
      
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось создать бронирование' : 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setGuestsCount('2');
    setTotalAmount('');
    setSource('manual');
    setNotes('');
  };
  
  // Update checkIn when initialDate changes
  useState(() => {
    if (initialDate) {
      setCheckIn(initialDate);
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isRu ? 'Новое бронирование' : 'New Booking'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">{isRu ? 'Заезд' : 'Check-in'}</Label>
              <div className="p-2.5 bg-muted rounded-lg text-sm font-medium">
                {checkIn ? format(checkIn, 'd MMM', { locale: isRu ? ru : undefined }) : '—'}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{isRu ? 'Выезд' : 'Check-out'}</Label>
              <Popover open={showCheckOutPicker} onOpenChange={setShowCheckOutPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-medium",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut 
                      ? format(checkOut, 'd MMM', { locale: isRu ? ru : undefined })
                      : isRu ? 'Выбрать' : 'Select'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => {
                      setCheckOut(date);
                      setShowCheckOutPicker(false);
                    }}
                    disabled={(date) => {
                      // Disable dates before check-in
                      if (checkIn && date <= checkIn) return true;
                      // Disable already booked dates
                      return disabledDates.some(d => 
                        format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                      );
                    }}
                    locale={isRu ? ru : undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {nights > 0 && (
            <div className="text-center py-1 text-sm text-muted-foreground">
              {nights} {isRu ? 'ночей' : 'nights'}
            </div>
          )}
          
          {/* Conflict Warning */}
          {hasConflicts && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  {isRu ? 'Конфликт дат' : 'Date Conflict'}
                </p>
                <p className="text-muted-foreground">
                  {conflictingBookings.length > 0 && (
                    <>{isRu ? 'Бронирования: ' : 'Bookings: '}
                    {conflictingBookings.map(b => b.guest_name || (isRu ? 'Гость' : 'Guest')).join(', ')}</>
                  )}
                  {blockedDatesInRange.length > 0 && (
                    <>{conflictingBookings.length > 0 ? '. ' : ''}
                    {isRu ? 'Закрытые даты: ' : 'Blocked dates: '}{blockedDatesInRange.length}</>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* Guest Info */}
          <div>
            <Label htmlFor="guestName" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {isRu ? 'Имя гостя' : 'Guest Name'}
            </Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={isRu ? 'Иван Петров' : 'John Doe'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guestPhone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {isRu ? 'Телефон' : 'Phone'}
              </Label>
              <Input
                id="guestPhone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+7..."
              />
            </div>
            <div>
              <Label htmlFor="guestEmail" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {isRu ? 'Email' : 'Email'}
              </Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="guest@email.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guestsCount" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {isRu ? 'Гостей' : 'Guests'}
              </Label>
              <Input
                id="guestsCount"
                type="number"
                min="1"
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="totalAmount" className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                {isRu ? 'Сумма' : 'Amount'}
              </Label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="source">{isRu ? 'Источник' : 'Source'}</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_SOURCES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {isRu ? s.labelRu : s.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRu ? 'Дополнительная информация...' : 'Additional information...'}
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!checkIn || !checkOut || hasConflicts || isSubmitting || isCreating}
          >
            {isSubmitting || isCreating
              ? (isRu ? 'Сохранение...' : 'Saving...')
              : (isRu ? 'Добавить бронирование' : 'Add Booking')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
