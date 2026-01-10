import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PawPrint, Calendar, Clock, User, Phone, Mail, FileText, Dog, Cat } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const petTypes = [
  { id: 'dog', label: 'Dog', labelRu: 'Собака', icon: Dog },
  { id: 'cat', label: 'Cat', labelRu: 'Кошка', icon: Cat },
  { id: 'other', label: 'Other', labelRu: 'Другое', icon: PawPrint },
];

export default function PetServiceBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const selectedServiceFromState = location.state?.selectedService;

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [petType, setPetType] = useState('dog');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null);

  const service = {
    id: id || 'pet-service',
    name: 'Pet Service',
    nameRu: 'Услуга для питомцев',
    price: selectedServiceFromState?.price || 1500,
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }
    if (!date || !time || !contactName || !contactPhone) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    try {
      const result = await createBooking({
        bookingType: 'service',
        providerId: id,
        scheduledAt: scheduledAt.toISOString(),
        totalAmount: service.price,
        currency: 'THB',
        notes: `Pet: ${petName} (${petType}, ${petBreed}). ${notes}`,
        items: [{
          item_type: 'pet-service',
          item_id: selectedServiceFromState?.id || 'general',
          item_name: selectedServiceFromState?.name || service.name,
          quantity: 1,
          unit_price: service.price,
          subtotal: service.price,
        }],
        participants: [{
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          is_primary: true,
        }],
        addresses: [],
      });
      setBookingResult({ bookingId: result.bookingId });
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  if (bookingResult) {
    return (
      <BookingConfirmation
        bookingId={bookingResult.bookingId}
        serviceName={language === 'ru' ? service.nameRu : service.name}
        date={date ? format(date, 'PPP') : ''}
        time={time}
        totalAmount={service.price}
        onViewBookings={() => navigate('/bookings')}
        onBackToHome={() => navigate(`/pets/${id}`)}
      />
    );
  }

  const isValid = date && time && contactName && contactPhone && petName;

  return (
    <AppLayout title={language === 'ru' ? 'Запись' : 'Booking'}>
      <PageContainer className="pb-32">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">{language === 'ru' ? service.nameRu : service.name}</h2>
              <p className="text-sm text-muted-foreground">฿{service.price.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-semibold">{language === 'ru' ? 'Питомец' : 'Pet'}</h3>
          <RadioGroup value={petType} onValueChange={setPetType} className="flex gap-2">
            {petTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Label key={type.id} className={cn("flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer", petType === type.id ? "border-primary bg-primary/5" : "border-border")}>
                  <RadioGroupItem value={type.id} className="sr-only" />
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{language === 'ru' ? type.labelRu : type.label}</span>
                </Label>
              );
            })}
          </RadioGroup>
          <div className="grid grid-cols-2 gap-3">
            <Input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder={language === 'ru' ? 'Кличка *' : 'Name *'} />
            <Input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder={language === 'ru' ? 'Порода' : 'Breed'} />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-semibold">{language === 'ru' ? 'Дата и время' : 'Date & Time'}</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                {date ? format(date, 'PPP') : (language === 'ru' ? 'Выбрать дату' : 'Pick date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} /></PopoverContent>
          </Popover>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((slot) => (
              <Button key={slot} variant={time === slot ? 'default' : 'outline'} size="sm" onClick={() => setTime(slot)}>{slot}</Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">{language === 'ru' ? 'Контакты' : 'Contact'}</h3>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={language === 'ru' ? 'Имя *' : 'Name *'} />
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={language === 'ru' ? 'Телефон *' : 'Phone *'} />
          <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" />
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={language === 'ru' ? 'Примечания' : 'Notes'} rows={2} />
        </div>
      </PageContainer>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div><div className="text-sm text-muted-foreground">{language === 'ru' ? 'Итого' : 'Total'}</div><div className="text-xl font-bold">฿{service.price.toLocaleString()}</div></div>
          <Button onClick={handleSubmit} size="lg" className="flex-1" disabled={!isValid || isSubmitting}>
            {isSubmitting ? '...' : (language === 'ru' ? 'Подтвердить' : 'Confirm')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
