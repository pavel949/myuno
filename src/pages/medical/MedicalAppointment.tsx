import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { useWellnessCheckout } from "@/hooks/useWellnessCheckout";
import { useClinic, useDoctors, useMedicalServices } from "@/hooks/useClinics";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { 
  BookingSummary, 
  BookingDateTimeSelect, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function MedicalAppointment() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctor');
  const serviceId = searchParams.get('service');
  
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();
  const { createWellnessCheckout, isProcessing: isStripeProcessing } = useWellnessCheckout();

  // Fetch clinic, doctors, and services
  const { clinic, isLoading: clinicLoading } = useClinic(id);
  const { doctors } = useDoctors(id);
  const { services } = useMedicalServices(id);

  // Find selected doctor or service
  const selectedDoctor = doctors.find(d => d.id === doctorId);
  const selectedService = services.find(s => s.id === serviceId);

  // Form state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [symptoms, setSymptoms] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Calculate price
  const price = selectedService?.price || selectedDoctor?.consultation_price || clinic?.consultation_price || 1500;

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: `/medical/appointment/${id}` } });
    }
  }, [authLoading, user, navigate, id]);

  if (authLoading || clinicLoading) {
    return (
      <AppLayout>
        <PageContainer className="pb-32">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-48 w-full mb-4" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!user) return null;

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    const bookingTitle = selectedService
      ? (language === 'ru' ? selectedService.name_ru : selectedService.name_en)
      : selectedDoctor
        ? `${language === 'ru' ? 'Консультация:' : 'Consultation:'} ${language === 'ru' ? selectedDoctor.name_ru : selectedDoctor.name_en}`
        : (language === 'ru' ? 'Запись к врачу' : 'Medical Appointment');

    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={bookingTitle}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          total={price}
          currency="THB"
          continuePath="/medical"
          continueLabel={language === 'ru' ? 'К клиникам' : 'Browse Clinics'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time) return;
    if (!contactData.name || !contactData.phone) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const itemName = selectedService
      ? (language === 'ru' ? selectedService.name_ru : selectedService.name_en)
      : selectedDoctor
        ? `${language === 'ru' ? 'Консультация:' : 'Consultation:'} ${language === 'ru' ? selectedDoctor.name_ru : selectedDoctor.name_en}`
        : (language === 'ru' ? 'Консультация врача' : 'Medical Consultation');

    const result = await createBooking({
      booking_type: 'medical',
      scheduled_at: scheduledAt,
      total_amount: price,
      currency: 'THB',
      notes: `Clinic: ${clinic?.name_en || id}. ${selectedDoctor ? `Doctor: ${selectedDoctor.name_en}.` : ''} Symptoms: ${symptoms}`,
      items: [{
        item_type: selectedService ? 'medical_service' : 'medical_consultation',
        item_id: selectedService?.id || selectedDoctor?.id || id || 'consultation',
        item_name: itemName,
        quantity: 1,
        unit_price: price,
        subtotal: price,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: price,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ];

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Запись на приём' : 'Book Appointment'} 
          showBack 
        />

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            title={selectedService 
              ? (language === 'ru' ? selectedService.name_ru : selectedService.name_en)
              : selectedDoctor
                ? `${language === 'ru' ? selectedDoctor.name_ru : selectedDoctor.name_en}`
                : (language === 'ru' ? 'Консультация врача' : 'Medical Consultation')}
            subtitle={clinic ? (language === 'ru' ? clinic.name_ru : clinic.name_en) : undefined}
            date={date}
            time={time}
            price={price}
            sourceCurrency="THB"
          />
        </div>

        {/* Date & Time */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Дата и время' : 'Date & Time'}
          </h3>
          <BookingDateTimeSelect
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            availableTimes={availableTimes}
            showQuickDates
          />
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
          </h3>
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showEmail
          />
        </div>

        {/* Symptoms */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <Label className="font-semibold mb-4 block">
            {language === 'ru' ? 'Опишите симптомы' : 'Describe Symptoms'}
          </Label>
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder={language === 'ru' ? 'Что вас беспокоит?' : 'What concerns do you have?'}
            rows={4}
            className="mt-2"
          />
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={price}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={price}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Записаться' : 'Book Appointment'}
        />
      </PageContainer>
    </AppLayout>
  );
}
