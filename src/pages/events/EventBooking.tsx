import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvents";
import { useBooking } from "@/hooks/useBooking";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { LoadingSpinner } from "@/components/uno/LoadingSpinner";
import { 
  BookingSummary, 
  BookingParticipants,
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  BookingStepProgress,
  eventBookingSteps,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EventBooking() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { event, isLoading } = useEvent(id);
  const { createBooking, isSubmitting } = useBooking();

  const ticketCount = parseInt(searchParams.get('tickets') || '1');

  // Form state
  const [participants, setParticipants] = useState(ticketCount);
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [pickupInfo, setPickupInfo] = useState({ hotelName: "", roomNumber: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (paymentMethod) return 2; // Payment step
    if (contactData.name && contactData.phone) return 2; // Moving to payment
    if (participants > 0) return 1; // Contact step
    return 0; // Details step
  };
  const currentStep = getCurrentStep();

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/events/booking/${id}` } });
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
  if (!event) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p>{language === 'ru' ? 'Событие не найдено' : 'Event not found'}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalAmount = (event.price || 0) * participants;
  const eventTitle = language === 'ru' ? event.title_ru : event.title_en;
  const eventDate = event.event_date 
    ? format(new Date(event.event_date), 'PPP', { locale: language === 'ru' ? ru : undefined })
    : undefined;

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={eventTitle}
          date={eventDate}
          time={event.event_time || undefined}
          total={totalAmount}
          currency={event.currency || 'THB'}
          continuePath="/events"
          continueLabel={language === 'ru' ? 'К событиям' : 'Browse Events'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!contactData.name || !contactData.phone) return;

    const scheduledAt = event.event_date ? new Date(event.event_date) : new Date();
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
    }

    const result = await createBooking({
      booking_type: 'event',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: event.currency || 'THB',
      notes: `Event: ${eventTitle}. Tickets: ${participants}. Pickup: ${pickupInfo.hotelName} ${pickupInfo.roomNumber}`.trim(),
      items: [{
        item_type: 'event_ticket',
        item_id: event.id,
        item_name: eventTitle,
        quantity: participants,
        unit_price: event.price || 0,
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
          title={language === 'ru' ? 'Оформление билетов' : 'Book Tickets'} 
          showBack 
          fallbackPath="/events"
        />

        {/* Step Progress */}
        <BookingStepProgress steps={eventBookingSteps} currentStep={currentStep} className="mt-4" />

        {/* Summary Card */}
        <div className="mb-6">
          <BookingSummary
            image={event.cover_image || undefined}
            title={eventTitle}
            subtitle={eventDate}
            duration={event.duration_hours ? `${event.duration_hours}h` : undefined}
            location={language === 'ru' ? event.location_ru : event.location_name || undefined}
            date={event.event_date ? new Date(event.event_date) : undefined}
            time={event.event_time || undefined}
            participants={participants}
            price={event.price || 0}
            currency={event.currency || 'THB'}
          />
        </div>

        {/* Participants */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <BookingParticipants
            count={participants}
            onChange={setParticipants}
            min={1}
            max={event.max_spots || 10}
            pricePerPerson={event.price || 0}
            currency={event.currency || 'THB'}
            label={language === 'ru' ? 'Билетов' : 'Tickets'}
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
          />
        </div>

        {/* Pickup Info */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Место забора' : 'Pickup Location'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ru' ? 'Название отеля' : 'Hotel Name'}</Label>
              <Input
                value={pickupInfo.hotelName}
                onChange={(e) => setPickupInfo({ ...pickupInfo, hotelName: e.target.value })}
                placeholder={language === 'ru' ? 'Где вас забрать?' : 'Where should we pick you up?'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Номер комнаты' : 'Room Number'}</Label>
              <Input
                value={pickupInfo.roomNumber}
                onChange={(e) => setPickupInfo({ ...pickupInfo, roomNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
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
            currency={event.currency || 'THB'}
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          currency={event.currency || 'THB'}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Купить билеты' : 'Buy Tickets'}
        />
      </PageContainer>
    </AppLayout>
  );
}
