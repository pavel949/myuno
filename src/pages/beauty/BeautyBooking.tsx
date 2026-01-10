import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
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

export default function BeautyBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const { selectedServices = [], salon } = (location.state || {}) as {
    selectedServices?: string[];
    salon?: any;
  };

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/beauty/${id}/book` } });
    return null;
  }

  // Calculate totals
  const selectedServiceDetails = salon?.services?.filter((s: any) => 
    selectedServices.includes(s.id)
  ) || [];
  
  const totalPrice = selectedServiceDetails.reduce((sum: number, s: any) => sum + s.price, 0);
  const totalDuration = selectedServiceDetails.reduce((sum: number, s: any) => sum + s.duration, 0);

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={salon?.name || (language === 'ru' ? 'Салон красоты' : 'Beauty Salon')}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          total={totalPrice}
          currency="THB"
          continuePath="/beauty"
          continueLabel={language === 'ru' ? 'К салонам' : 'Browse Salons'}
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

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: totalPrice,
      currency: 'THB',
      notes: `Salon: ${salon?.name || 'Beauty Salon'}. Duration: ${totalDuration} min`,
      items: selectedServiceDetails.map((service: any) => ({
        item_type: 'service',
        item_id: service.id,
        item_name: language === 'ru' ? service.nameRu : service.name,
        quantity: 1,
        unit_price: service.price,
        subtotal: service.price,
      })),
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: totalPrice,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  const availableTimes = [
    '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Book Appointment'} 
          showBack 
        />

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            title={salon?.name || (language === 'ru' ? 'Салон красоты' : 'Beauty Salon')}
            subtitle={selectedServiceDetails.map((s: any) => 
              language === 'ru' ? s.nameRu : s.name
            ).join(', ')}
            duration={totalDuration ? `${totalDuration} min` : undefined}
            date={date}
            time={time}
            price={totalPrice}
            currency="THB"
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
            availableTimes={availableTimes}
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
            showEmail
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
            amount={totalPrice}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalPrice}
          currency="THB"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Подтвердить бронирование' : 'Confirm Booking'}
        />
      </PageContainer>
    </AppLayout>
  );
}
