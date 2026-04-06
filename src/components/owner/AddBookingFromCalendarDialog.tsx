import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, differenceInDays, addDays, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  CalendarIcon, User, Phone, Mail, Users, Banknote, AlertTriangle, 
  ChevronDown, Shield, FileText, Upload, X, Loader2, Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, formatCurrencyAmount } from '@/lib/config/currencies';
import { toast } from 'sonner';

// Helper to maintain backward compatibility with formatPriceWithSymbol calls
const formatPriceWithSymbol = (amount: number, currency: string = 'THB') => 
  formatCurrencyAmount(amount, currency);

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

const DOCUMENT_TYPES = [
  { value: 'passport', labelEn: 'Passport', labelRu: 'Паспорт' },
  { value: 'contract', labelEn: 'Contract', labelRu: 'Договор' },
  { value: 'payment', labelEn: 'Payment Receipt', labelRu: 'Чек об оплате' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

interface UploadedDocument {
  url: string;
  name: string;
  type: string;
}

export function AddBookingFromCalendarDialog({
  open,
  onOpenChange,
  propertyId,
  initialDate,
  onSuccess,
}: AddBookingFromCalendarDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [checkIn, setCheckIn] = useState<Date | undefined>(initialDate);
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestsCount, setGuestsCount] = useState('2');
  const [totalAmount, setTotalAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [source, setSource] = useState('manual');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  const { createBooking, bookings, isCreating } = usePropertyBookings(propertyId);
  const { availability } = usePropertyAvailabilityManagement(propertyId);
  
  // Sync checkIn with initialDate when dialog opens
  useEffect(() => {
    if (open && initialDate) {
      setCheckIn(initialDate);
      setCheckOut(undefined);
    }
  }, [open, initialDate]);
  
  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };
  
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
  
  // Calculate price per night
  const pricePerNight = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    if (nights > 0 && total > 0) {
      return Math.round(total / nights);
    }
    return 0;
  }, [totalAmount, nights]);
  
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
  
  // Handle document upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingDoc(true);
    
    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: isRu ? 'Ошибка' : 'Error',
            description: isRu ? 'Файл слишком большой (макс. 10 МБ)' : 'File too large (max 10MB)',
            variant: 'destructive',
          });
          continue;
        }
        
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${propertyId}/${Date.now()}_${crypto.randomUUID().slice(0, 12)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('booking-documents')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: isRu ? 'Ошибка загрузки' : 'Upload Error',
            description: uploadError.message,
            variant: 'destructive',
          });
          continue;
        }
        
        const { data: publicUrl } = supabase.storage
          .from('booking-documents')
          .getPublicUrl(fileName);
        
        setUploadedDocs(prev => [...prev, {
          url: publicUrl.publicUrl,
          name: file.name,
          type: fileExt?.includes('pdf') ? 'contract' : 'other',
        }]);
      }
      
      toast({
        title: isRu ? 'Загружено' : 'Uploaded',
        description: isRu ? 'Документы успешно загружены' : 'Documents uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось загрузить документ' : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDoc(false);
      // Reset input
      e.target.value = '';
    }
  };
  
  const removeDocument = (url: string) => {
    setUploadedDocs(prev => prev.filter(d => d.url !== url));
  };
  
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
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        guest_name: guestName || undefined,
        guest_phone: guestPhone || undefined,
        guest_email: guestEmail || undefined,
        guests_count: parseInt(guestsCount) || undefined,
        total_amount: parseFloat(totalAmount) || undefined,
        deposit_amount: parseFloat(depositAmount) || undefined,
        source,
        notes: notes || undefined,
        status: 'confirmed',
        documents: uploadedDocs.length > 0 ? uploadedDocs.map(d => d.url) : undefined,
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
    setCheckInTime('14:00');
    setCheckOutTime('11:00');
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setGuestsCount('2');
    setTotalAmount('');
    setDepositAmount('');
    setSource('manual');
    setNotes('');
    setShowCheckInPicker(false);
    setShowCheckOutPicker(false);
    setShowAdvanced(false);
    setUploadedDocs([]);
  };

  // Time options for check-in/out
  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isRu ? 'Новое бронирование' : 'New Booking'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date Selection - Required */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                {isRu ? 'Заезд' : 'Check-in'} <span className="text-destructive">*</span>
              </Label>
              <Popover open={showCheckInPicker} onOpenChange={setShowCheckInPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-medium",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn 
                      ? format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })
                      : isRu ? 'Выбрать' : 'Select'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => {
                      setCheckIn(date);
                      // Reset checkout if it's before or equal to new checkin
                      if (date && checkOut && checkOut <= date) {
                        setCheckOut(undefined);
                      }
                      setShowCheckInPicker(false);
                    }}
                    disabled={(date) => {
                      // Disable past dates
                      if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                      // Disable already booked dates
                      return disabledDates.some(d => 
                        format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                      );
                    }}
                    locale={isRu ? ru : undefined}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {isRu ? 'Выезд' : 'Check-out'} <span className="text-destructive">*</span>
              </Label>
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
          
          {/* Time Selection - Only show after dates selected */}
          {checkIn && checkOut && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  {isRu ? 'Время заезда' : 'Check-in time'}
                </Label>
                <Select value={checkInTime} onValueChange={setCheckInTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={`in-${time}`} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  {isRu ? 'Время выезда' : 'Check-out time'}
                </Label>
                <Select value={checkOutTime} onValueChange={setCheckOutTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={`out-${time}`} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
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
          
          {/* Pricing Section */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="totalAmount" className="flex items-center gap-1.5 text-xs">
                  <Banknote className="h-3.5 w-3.5" />
                  {isRu ? 'Сумма (฿)' : 'Total (฿)'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">฿</span>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="depositAmount" className="flex items-center gap-1.5 text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  {isRu ? 'Депозит (฿)' : 'Deposit (฿)'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">฿</span>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            
            {/* Price per night calculation */}
            {nights > 0 && pricePerNight > 0 && (
              <div className="flex items-center justify-between text-sm bg-background rounded px-3 py-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calculator className="h-3.5 w-3.5" />
                  {isRu ? 'За ночь' : 'Per night'}
                </span>
                <span className="font-medium">
                  {formatPriceWithSymbol(pricePerNight, 'THB')}
                </span>
              </div>
            )}
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
          </div>
          
          {/* Advanced Section (Documents, Notes) */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-9 px-3">
                <span className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  {isRu ? 'Документы и заметки' : 'Documents & Notes'}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showAdvanced && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Document Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {isRu ? 'Документы' : 'Documents'}
                </Label>
                
                {/* Uploaded documents list */}
                {uploadedDocs.length > 0 && (
                  <div className="space-y-2">
                    {uploadedDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{doc.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeDocument(doc.url)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload button */}
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleDocumentUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploadingDoc}
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isUploadingDoc}
                    type="button"
                  >
                    {isUploadingDoc ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isRu ? 'Загрузить документ' : 'Upload Document'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Паспорт, договор, чеки (PDF, JPG, PNG)' 
                    : 'Passport, contract, receipts (PDF, JPG, PNG)'}
                </p>
              </div>
              
              {/* Notes */}
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
            </CollapsibleContent>
          </Collapsible>
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
