import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvents";
import { useBooking } from "@/hooks/useBooking";
import { useStripeUnifiedCheckout } from "@/hooks/useStripeUnifiedCheckout";
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
  const { createCheckout, isProcessing } = useStripeUnifiedCheckout();

  const ticketCount = parseInt(searchParams.get('tickets') || '1');
  const isRu = language === 'ru';

  // Form state
  const [participants, setParticipants] = useState(ticketCount);
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [pickupInfo, setPickupInfo] = useState({ hotelName: "", roomNumber: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (paymentMethod) return 2;
    if (contactData.name && contactData.phone) return 2;
    if (participants > 0) return 1;
    return 0;
  };
  const currentStep = getCurrentStep();

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/events/booking/${id}` } });
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p>{isRu ? 'Событие не найдено' : 'Event not found'}</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalAmount = (event.price || 0) * participants;
  const eventTitle = isRu ? event.title_ru : event.title_en;
  const eventDate = event.event_date 
    ? format(new Date(event.event_date), 'PPP', { locale: isRu ? ru : undefined })
    : undefined;

  // Success state (for cash/wallet bookings)
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
          continueLabel={isRu ? 'К событиям' : 'Browse Events'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!contactData.name || !contactData.phone) return;

    // Stripe card payment → Edge Function
    if (paymentMethod === 'card' || paymentMethod === 'online') {
      await createCheckout('create-event-checkout', {
        event_id: event.id,
        event_title: eventTitle,
        ticket_count: participants,
        unit_price: event.price || 0,
        currency: event.currency || 'THB',
        contact_name: contactData.name,
        contact_phone: contactData.phone,
        contact_email: contactData.email || undefined,
        pickup_hotel: pickupInfo.hotelName || undefined,
        pickup_room: pickupInfo.roomNumber || undefined,
        event_date: event.event_date || undefined,
        event_time: event.event_time || undefined,
      });
      return;
    }

    // Cash / Wallet → existing booking flow
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

  const isBusy = isSubmitting || isProcessing;

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={isRu ? 'Оформление билетов' : 'Book Tickets'} 
          showBack 
          fallbackPath="/events"
        />

        <BookingStepProgress steps={eventBookingSteps} currentStep={currentStep} className="mt-4" />

        {/* Summary Card */}
        <div className="mb-6">
          <BookingSummary
            image={event.cover_image || undefined}
            title={eventTitle}
            subtitle={eventDate}
            duration={event.duration_hours ? `${event.duration_hours}h` : undefined}
            location={isRu ? event.location_ru : event.location_name || undefined}
            date={event.event_date ? new Date(event.event_date) : undefined}
            time={event.event_time || undefined}
            participants={participants}
            price={event.price || 0}
            sourceCurrency={event.currency || 'THB'}
          />
        </div>

        {/* Participants */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <BookingParticipants
            count={participants}
            onChange={setParticipants}
            min={1}
            max={event.spots_left || event.max_spots || 10}
            pricePerPerson={event.price || 0}
            label={isRu ? 'Билетов' : 'Tickets'}
          />
        </div>

        {/* Spots left indicator */}
        {event.spots_left !== null && event.spots_left <= 10 && (
          <div className="text-center text-sm text-destructive font-medium mb-4">
            🔥 {isRu ? `Осталось ${event.spots_left} мест` : `Only ${event.spots_left} spots left`}
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {isRu ? 'Контактные данные' : 'Contact Information'}
          </h3>
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showEmail
          />
        </div>

        {/* Pickup Info */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {isRu ? 'Место забора' : 'Pickup Location'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label>{isRu ? 'Название отеля' : 'Hotel Name'}</Label>
              <Input
                value={pickupInfo.hotelName}
                onChange={(e) => setPickupInfo({ ...pickupInfo, hotelName: e.target.value })}
                placeholder={isRu ? 'Где вас забрать?' : 'Where should we pick you up?'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRu ? 'Номер комнаты' : 'Room Number'}</Label>
              <Input
                value={pickupInfo.roomNumber}
                onChange={(e) => setPickupInfo({ ...pickupInfo, roomNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {isRu ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={totalAmount}
            currency={event.currency || 'THB'}
            showWallet
            showCash
            showCard
            showOnline
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          onSubmit={handleSubmit}
          isSubmitting={isBusy}
          disabled={!contactData.name || !contactData.phone}
          submitLabel={isRu ? 'Купить билеты' : 'Buy Tickets'}
        />
      </PageContainer>
    </AppLayout>
  );
}
