import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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

const membershipTypes = {
  day: { price: 800, labelEn: 'Day Pass', labelRu: 'Дневной абонемент' },
  week: { price: 4500, labelEn: 'Weekly Pass', labelRu: 'Недельный абонемент' },
  month: { price: 15000, labelEn: 'Monthly Pass', labelRu: 'Месячный абонемент' },
};

export default function FitnessBooking() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const membershipType = searchParams.get('type') || 'day';
  const membership = membershipTypes[membershipType as keyof typeof membershipTypes] || membershipTypes.day;

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/fitness/${id}/book` } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' ? membership.labelRu : membership.labelEn}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          total={membership.price}
          currency="THB"
          continuePath="/fitness"
          continueLabel={language === 'ru' ? 'К залам' : 'Browse Gyms'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!contactData.name || !contactData.phone) return;

    const scheduledAt = date || new Date();

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: membership.price,
      currency: 'THB',
      notes: `Fitness Membership: ${membershipType}`,
      items: [{
        item_type: 'fitness_membership',
        item_id: id || membershipType,
        item_name: language === 'ru' ? membership.labelRu : membership.labelEn,
        quantity: 1,
        unit_price: membership.price,
        subtotal: membership.price,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: membership.price,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  return (
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Оформление записи' : 'Book Membership'} 
          showBack 
        />

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            title={language === 'ru' ? membership.labelRu : membership.labelEn}
            date={date}
            price={membership.price}
            currency="THB"
          />
        </div>

        {/* Start Date */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Дата начала' : 'Start Date'}
          </h3>
          <BookingDateTimeSelect
            time=""
            onTimeChange={() => {}}
            date={date}
            onDateChange={setDate}
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
            amount={membership.price}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={membership.price}
          currency="THB"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Подтвердить' : 'Confirm'}
        />
      </PageContainer>
    </AppLayout>
  );
}
