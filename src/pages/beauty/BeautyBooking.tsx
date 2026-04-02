import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { useWellnessCheckout } from "@/hooks/useWellnessCheckout";
import { useSalonStaff } from "@/hooks/useSalonStaff";
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
  BookingStepProgress,
  serviceBookingSteps,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { StaffPickerInline } from "@/components/beauty/StaffPicker";
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

  // Fetch salon staff
  const { staff, isLoading: staffLoading } = useSalonStaff(salon?.id || id);

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (paymentMethod) return 2; // Payment step
    if (contactData.name && contactData.phone) return 2; // Moving to payment
    if (date && time) return 1; // Contact step
    return 0; // DateTime step
  };
  const currentStep = getCurrentStep();

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/beauty/booking/${id}` } });
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

    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    const staffName = selectedStaff 
      ? (language === 'ru' ? selectedStaff.name_ru : selectedStaff.name_en) 
      : undefined;

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: totalPrice,
      currency: 'THB',
      staff_id: selectedStaffId, // Add staff selection
      notes: `Salon: ${salon?.name || 'Beauty Salon'}. Duration: ${totalDuration} min${staffName ? `. Staff: ${staffName}` : ''}`,
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
      <PageContainer className="pb-40">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Book Appointment'} 
          showBack 
          fallbackPath="/beauty"
        />

        {/* Step Progress */}
        <BookingStepProgress steps={serviceBookingSteps} currentStep={currentStep} className="mt-4" />

        {/* Summary Card */}
        <div className="mb-6">
          <BookingSummary
            title={salon?.name || (language === 'ru' ? 'Салон красоты' : 'Beauty Salon')}
            subtitle={selectedServiceDetails.map((s: any) => 
              language === 'ru' ? s.nameRu : s.name
            ).join(', ')}
            duration={totalDuration ? `${totalDuration} min` : undefined}
            date={date}
            time={time}
            price={totalPrice}
            sourceCurrency="THB"
          />
        </div>

        {/* Staff Selection */}
        {staff.length > 0 && (
          <div className="bg-card rounded-xl border p-5 mb-4">
            <h3 className="font-semibold mb-3">
              {language === 'ru' ? 'Выберите мастера' : 'Choose Specialist'}
            </h3>
            <StaffPickerInline
              staff={staff}
              selectedId={selectedStaffId}
              onSelect={setSelectedStaffId}
              isLoading={staffLoading}
            />
          </div>
        )}

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
            showNotes
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
            amount={totalPrice}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalPrice}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Подтвердить бронирование' : 'Confirm Booking'}
          hint={language === 'ru' ? '🔒 Безопасное бронирование — заполните форму' : '🔒 Secure booking — complete the form'}
        />
      </PageContainer>
    </AppLayout>
  );
}
