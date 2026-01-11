import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyBookings, PropertyBooking, CreateBookingInput } from '@/hooks/usePropertyBookings';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarDays, Plus, User, Phone, Mail, DollarSign, Home, X, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';

interface BookingCalendarProps {
  propertyId?: string;
  showPropertySelector?: boolean;
}

export function BookingCalendar({ propertyId, showPropertySelector = true }: BookingCalendarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PropertyBooking | null>(null);
  const [month, setMonth] = useState(new Date());
  
  const { data: properties } = useOwnerProperties();
  const { 
    bookings, 
    createBooking, 
    updateBooking, 
    deleteBooking,
    isCreating,
    isDeleting,
    getBookingForDate 
  } = usePropertyBookings(selectedPropertyId || undefined);

  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    guests_count: 1,
    total_amount: 0,
    source: 'manual',
    notes: '',
  });

  // Build a map of dates to bookings for highlighting
  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    bookings?.forEach(booking => {
      let current = new Date(booking.check_in);
      const end = new Date(booking.check_out);
      while (current < end) {
        dates.push(new Date(current));
        current = addDays(current, 1);
      }
    });
    return dates;
  }, [bookings]);

  const handleDayClick = (day: Date) => {
    const booking = getBookingForDate(day);
    if (booking) {
      setSelectedBooking(booking);
      setShowBookingDialog(true);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from && range?.to) {
      // Check if any date in range is already booked
      let current = new Date(range.from);
      while (current <= range.to) {
        const booking = getBookingForDate(current);
        if (booking) {
          toast.error(isRu ? 'Выбранные даты уже забронированы' : 'Selected dates are already booked');
          setSelectedRange(undefined);
          return;
        }
        current = addDays(current, 1);
      }
    }
  };

  const handleAddBooking = async () => {
    if (!selectedPropertyId || !selectedRange?.from || !selectedRange?.to) {
      toast.error(isRu ? 'Выберите объект и даты' : 'Select property and dates');
      return;
    }

    try {
      await createBooking({
        property_id: selectedPropertyId,
        check_in: format(selectedRange.from, 'yyyy-MM-dd'),
        check_out: format(selectedRange.to, 'yyyy-MM-dd'),
        ...formData,
      } as CreateBookingInput);

      toast.success(isRu ? 'Бронирование добавлено' : 'Booking added');
      setShowAddDialog(false);
      setSelectedRange(undefined);
      setFormData({
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        guests_count: 1,
        total_amount: 0,
        source: 'manual',
        notes: '',
      });
    } catch (error) {
      toast.error(isRu ? 'Ошибка при добавлении' : 'Error adding booking');
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      await deleteBooking(selectedBooking.id);
      toast.success(isRu ? 'Бронирование удалено' : 'Booking deleted');
      setShowBookingDialog(false);
      setSelectedBooking(null);
    } catch (error) {
      toast.error(isRu ? 'Ошибка при удалении' : 'Error deleting booking');
    }
  };

  const modifiers = {
    booked: bookedDates,
    rangeStart: selectedRange?.from ? [selectedRange.from] : [],
    rangeEnd: selectedRange?.to ? [selectedRange.to] : [],
  };

  const modifiersClassNames = {
    booked: 'bg-primary/20 text-primary font-semibold rounded-none first:rounded-l-md last:rounded-r-md',
    rangeStart: 'bg-primary text-primary-foreground rounded-l-md',
    rangeEnd: 'bg-primary text-primary-foreground rounded-r-md',
  };

  return (
    <div className="space-y-4">
      {/* Property Selector */}
      {showPropertySelector && properties && properties.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Label className="mb-2 block">
              {isRu ? 'Выберите объект' : 'Select Property'}
            </Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      {isRu ? property.title_ru || property.title : property.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {isRu ? 'Календарь бронирований' : 'Booking Calendar'}
            </CardTitle>
            {selectedPropertyId && selectedRange?.from && selectedRange?.to && (
              <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
                <Plus className="w-4 h-4" />
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedPropertyId ? (
            <>
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect}
                month={month}
                onMonthChange={setMonth}
                numberOfMonths={1}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                onDayClick={handleDayClick}
                className="pointer-events-auto"
              />
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <span>{isRu ? 'Забронировано' : 'Booked'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span>{isRu ? 'Выбрано' : 'Selected'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{isRu ? 'Выберите объект для просмотра календаря' : 'Select a property to view calendar'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Bookings List */}
      {bookings && bookings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRu ? 'Ближайшие бронирования' : 'Upcoming Bookings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings
              .filter(b => new Date(b.check_out) >= new Date())
              .slice(0, 5)
              .map((booking) => {
                const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
                const isActive = new Date(booking.check_in) <= new Date() && new Date(booking.check_out) > new Date();
                
                return (
                  <div
                    key={booking.id}
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowBookingDialog(true);
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      isActive && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.check_in), 'dd MMM', { locale: isRu ? ru : undefined })} — {format(new Date(booking.check_out), 'dd MMM', { locale: isRu ? ru : undefined })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                        {isActive 
                          ? (isRu ? 'Сейчас' : 'Now') 
                          : `${nights} ${isRu ? 'ноч.' : 'nights'}`
                        }
                      </Badge>
                      {booking.source && booking.source !== 'manual' && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {booking.source}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Add Booking Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Добавить бронирование' : 'Add Booking'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRange?.from && selectedRange?.to && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium">
                {format(selectedRange.from, 'dd MMMM yyyy', { locale: isRu ? ru : undefined })} — {format(selectedRange.to, 'dd MMMM yyyy', { locale: isRu ? ru : undefined })}
              </p>
              <p className="text-xs text-muted-foreground">
                {differenceInDays(selectedRange.to, selectedRange.from)} {isRu ? 'ночей' : 'nights'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>{isRu ? 'Имя гостя' : 'Guest Name'}</Label>
              <Input
                value={formData.guest_name}
                onChange={(e) => setFormData(f => ({ ...f, guest_name: e.target.value }))}
                placeholder={isRu ? 'Иван Иванов' : 'John Doe'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                <Input
                  value={formData.guest_phone}
                  onChange={(e) => setFormData(f => ({ ...f, guest_phone: e.target.value }))}
                  placeholder="+66..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData(f => ({ ...f, guest_email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? 'Гостей' : 'Guests'}</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.guests_count}
                  onChange={(e) => setFormData(f => ({ ...f, guests_count: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Сумма' : 'Amount'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.total_amount}
                  onChange={(e) => setFormData(f => ({ ...f, total_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label>{isRu ? 'Источник' : 'Source'}</Label>
              <Select value={formData.source} onValueChange={(v) => setFormData(f => ({ ...f, source: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{isRu ? 'Вручную' : 'Manual'}</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="direct">{isRu ? 'Напрямую' : 'Direct'}</SelectItem>
                  <SelectItem value="other">{isRu ? 'Другое' : 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder={isRu ? 'Особые пожелания...' : 'Special requests...'}
                rows={2}
              />
            </div>

            <Button onClick={handleAddBooking} disabled={isCreating} className="w-full">
              {isCreating 
                ? (isRu ? 'Добавление...' : 'Adding...') 
                : (isRu ? 'Добавить бронирование' : 'Add Booking')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Детали бронирования' : 'Booking Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold text-lg mb-1">
                  {selectedBooking.guest_name || (isRu ? 'Гость' : 'Guest')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedBooking.check_in), 'dd MMMM yyyy', { locale: isRu ? ru : undefined })} — {format(new Date(selectedBooking.check_out), 'dd MMMM yyyy', { locale: isRu ? ru : undefined })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {differenceInDays(new Date(selectedBooking.check_out), new Date(selectedBooking.check_in))} {isRu ? 'ночей' : 'nights'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedBooking.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.guest_phone}</span>
                  </div>
                )}
                {selectedBooking.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.guest_email}</span>
                  </div>
                )}
                {selectedBooking.guests_count && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.guests_count} {isRu ? 'гостей' : 'guests'}</span>
                  </div>
                )}
                {selectedBooking.total_amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.total_amount} {selectedBooking.currency}</span>
                  </div>
                )}
              </div>

              {selectedBooking.source && selectedBooking.source !== 'manual' && (
                <Badge variant="outline" className="capitalize">
                  {selectedBooking.source}
                </Badge>
              )}

              {selectedBooking.notes && (
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {selectedBooking.notes}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteBooking}
                  disabled={isDeleting}
                  className="flex-1 gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {isRu ? 'Удалить' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
