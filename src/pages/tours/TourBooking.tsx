import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/hooks/useTours";
import { useBooking } from "@/hooks/useBooking";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { LoadingSpinner } from "@/components/uno/LoadingSpinner";
import { 
  BookingSummary, 
  BookingDateTimeSelect, 
  BookingParticipants, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  BookingStepProgress,
  defaultBookingSteps,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";

export default function TourBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { tour, isLoading } = useTour(id);
  const { createBooking, isSubmitting } = useBooking();

  // Form state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [participants, setParticipants] = useState(1);
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (paymentMethod) return 2; // Payment step
    if (contactData.name && contactData.phone) return 2; // Moving to payment
    if (date && time) return 1; // Contact step
    return 0; // Details step
  };
  const currentStep = getCurrentStep();

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/tours/${id}/book` } });
    return null;
  }

  // Loading state
  if (isLoading || authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // Not found
  if (!tour) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p>{t('tours.notFound')}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalAmount = (tour.price || 0) * participants;
  const tourTitle = language === 'ru' ? tour.title_ru : tour.title_en;

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={tourTitle}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          location={tour.meeting_point || undefined}
          total={totalAmount}
          currency={tour.currency || 'THB'}
          continuePath="/tours"
          continueLabel={language === 'ru' ? 'Другие туры' : 'Browse Tours'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time) {
      return;
    }
    if (!contactData.name || !contactData.phone) {
      return;
    }

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const result = await createBooking({
      booking_type: 'tour',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: tour.currency || 'THB',
      notes: `Tour: ${tourTitle}. Participants: ${participants}`,
      items: [{
        item_type: 'tour',
        item_id: tour.id,
        item_name: tourTitle,
        quantity: participants,
        unit_price: tour.price || 0,
        subtotal: totalAmount,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: totalAmount,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование тура' : 'Book Tour'} 
          showBack 
          fallbackPath="/tours"
        />

        {/* Step Progress */}
        <BookingStepProgress steps={defaultBookingSteps} currentStep={currentStep} className="mt-4" />

        {/* Summary Card */}
        <div className="mb-6">
          <BookingSummary
            image={tour.cover_image || undefined}
            title={tourTitle}
            duration={tour.duration_hours ? `${tour.duration_hours}h` : undefined}
            maxParticipants={tour.max_participants || undefined}
            location={tour.meeting_point || undefined}
            date={date}
            time={time}
            participants={participants}
            price={tour.price || 0}
            sourceCurrency={tour.currency || 'THB'}
          />
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
            availableTimes={tour.start_times || ['09:00', '14:00']}
            showQuickDates
          />
        </div>

        {/* Participants */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <BookingParticipants
            count={participants}
            onChange={setParticipants}
            min={1}
            max={tour.max_participants || 10}
            pricePerPerson={tour.price || 0}
            currency={tour.currency || 'THB'}
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
            showEmail
            showNotes={false}
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
            amount={totalAmount}
            currency={tour.currency || 'THB'}
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          currency={tour.currency || 'THB'}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Подтвердить бронирование' : 'Confirm Booking'}
        />
      </PageContainer>
    </AppLayout>
  );
}
