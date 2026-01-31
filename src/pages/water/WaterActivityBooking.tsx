import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWaterActivity } from "@/hooks/useWaterActivities";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { 
  BookingSummary, 
  BookingDateTimeSelect, 
  BookingParticipants, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Shield } from "lucide-react";

export default function WaterActivityBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { activity, isLoading } = useWaterActivity(id);
  const { createBooking, isSubmitting } = useBooking();

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [participants, setParticipants] = useState(1);
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/water/${id}/book` } });
    return null;
  }

  // Loading
  if (isLoading || authLoading || !activity) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const totalAmount = (activity.price || 0) * participants;
  const activityTitle = language === 'ru' ? activity.title_ru : activity.title_en;

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={activityTitle}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          location={activity.meeting_point || undefined}
          total={totalAmount}
          currency={activity.currency || 'THB'}
          continuePath="/water"
          continueLabel={language === 'ru' ? 'Другие активности' : 'Browse Activities'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time || !contactData.name || !contactData.phone) {
      return;
    }

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: activity.currency || 'THB',
      notes: `Water Activity: ${activityTitle}. Participants: ${participants}${contactData.notes ? `. Notes: ${contactData.notes}` : ''}`,
      items: [{
        item_type: 'water_activity',
        item_id: activity.id,
        item_name: activityTitle,
        quantity: participants,
        unit_price: activity.price || 0,
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

  const durationFormatted = activity.duration_minutes 
    ? activity.duration_minutes >= 60 
      ? `${Math.round(activity.duration_minutes / 60)}h` 
      : `${activity.duration_minutes}min`
    : undefined;

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Booking'}
          showBack
          fallbackPath="/water"
        />

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            image={activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200'}
            title={activityTitle}
            subtitle={activity.is_certified ? (language === 'ru' ? '✓ Сертифицировано' : '✓ Certified') : undefined}
            duration={durationFormatted}
            maxParticipants={activity.max_participants || undefined}
            location={activity.location_name || undefined}
            date={date}
            time={time}
            participants={participants}
            price={activity.price || 0}
            sourceCurrency={activity.currency || 'THB'}
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
            availableTimes={activity.available_times || ['09:00', '10:00', '14:00', '15:00']}
            showQuickDates
          />
        </div>

        {/* Participants */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <BookingParticipants
            count={participants}
            onChange={setParticipants}
            min={activity.min_participants || 1}
            max={activity.max_participants || 10}
            pricePerPerson={activity.price || 0}
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
            showNotes
            notesPlaceholder={language === 'ru' ? 'Особые пожелания или требования...' : 'Special requests or requirements...'}
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
            currency={activity.currency || 'THB'}
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Подтвердить бронирование' : 'Confirm Booking'}
        />
      </PageContainer>
    </AppLayout>
  );
}
