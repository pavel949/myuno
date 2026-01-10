import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PawPrint, Dog, Cat } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  BookingDateTimeSelect, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type ContactFormData,
  type PaymentMethod 
} from '@/components/booking';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { addDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const selectedServiceFromState = location.state?.selectedService;

  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState('');
  const [petType, setPetType] = useState('dog');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [contactData, setContactData] = useState<ContactFormData>({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  const service = {
    id: id || 'pet-service',
    name: 'Pet Service',
    nameRu: 'Услуга для питомцев',
    price: selectedServiceFromState?.price || 1500,
  };

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/pets/${id}/booking` } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' ? service.nameRu : service.name}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          total={service.price}
          currency="THB"
          continuePath="/pets"
          continueLabel={language === 'ru' ? 'К услугам для питомцев' : 'Browse Pet Services'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time || !contactData.name || !contactData.phone || !petName) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: service.price,
      currency: 'THB',
      provider_id: id,
      notes: `Pet: ${petName} (${petType}, ${petBreed}). ${contactData.notes || ''}`,
      items: [{
        item_type: 'pet-service',
        item_id: selectedServiceFromState?.id || 'general',
        item_name: selectedServiceFromState?.name || service.name,
        quantity: 1,
        unit_price: service.price,
        subtotal: service.price,
      }],
      participants: [{
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        is_primary: true,
      }],
      payment: {
        amount: service.price,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  const isValid = date && time && contactData.name && contactData.phone && petName;

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Запись на услугу' : 'Book Service'} 
          showBack 
        />

        {/* Service Info */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border mt-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold">{language === 'ru' ? service.nameRu : service.name}</h3>
            <p className="text-sm text-muted-foreground">฿{service.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Pet Info */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">{language === 'ru' ? 'Питомец' : 'Pet'}</h3>
          <RadioGroup value={petType} onValueChange={setPetType} className="flex gap-2 mb-4">
            {petTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Label 
                  key={type.id} 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all", 
                    petType === type.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={type.id} className="sr-only" />
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{language === 'ru' ? type.labelRu : type.label}</span>
                </Label>
              );
            })}
          </RadioGroup>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{language === 'ru' ? 'Кличка' : 'Name'} *</Label>
              <Input 
                value={petName} 
                onChange={(e) => setPetName(e.target.value)} 
                placeholder={language === 'ru' ? 'Кличка питомца' : 'Pet name'} 
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Порода' : 'Breed'}</Label>
              <Input 
                value={petBreed} 
                onChange={(e) => setPetBreed(e.target.value)} 
                placeholder={language === 'ru' ? 'Порода' : 'Breed'} 
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Дата и время' : 'Date & Time'}
          </h3>
          <BookingDateTimeSelect
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            availableTimes={timeSlots}
            showQuickDates
          />
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showNotes
          />
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={service.price}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={service.price}
          currency="THB"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!isValid}
          submitLabel={language === 'ru' ? 'Подтвердить' : 'Confirm'}
        />
      </PageContainer>
    </AppLayout>
  );
}
