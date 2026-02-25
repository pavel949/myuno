import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useCleaningService } from "@/hooks/useCleaningServices";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { 
  BookingDateTimeSelect, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  AddressPickerInput,
  BookingStepProgress,
  serviceBookingSteps,
  type ContactFormData,
  type PaymentMethod as UIPaymentMethod,
} from "@/components/booking";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CleaningBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createOrder, isCreating } = useOrders();
  
  // P0 FIX: Fetch service from database instead of hardcoded object
  const { service, isLoading: serviceLoading } = useCleaningService(id);

  const serviceFee = 50;
  const totalAmount = (service?.price || 0) + serviceFee;

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<UIPaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (paymentMethod) return 2; // Payment step
    if (contactData.name && contactData.phone) return 2; // Moving to payment
    if (date && time && address) return 1; // Contact step
    return 0; // DateTime step
  };
  const currentStep = getCurrentStep();

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/cleaning/${id}/book` } });
    return null;
  }
  
  // Loading state
  if (serviceLoading || !service) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={language === 'ru' ? 'Загрузка...' : 'Loading...'} showBack />
          <div className="space-y-4 mt-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' ? service.nameRu : service.nameEn}
          date={date ? format(date, 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          time={time}
          location={address}
          total={totalAmount}
          currency="THB"
          continuePath="/cleaning"
          continueLabel={language === 'ru' ? 'К услугам уборки' : 'Browse Cleaning Services'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!date || !time) return;
    if (!contactData.name || !contactData.phone || !address) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Map UI payment method to useOrders payment method
    const orderPaymentMethod = paymentMethod === 'card' || paymentMethod === 'online' ? 'stripe' : 
                               paymentMethod === 'promptpay' ? 'stripe' :
                               paymentMethod === 'concierge_advance' ? 'wallet' : 
                               paymentMethod as 'cash' | 'wallet';

    // P0 FIX: Use createOrder (orders table) instead of deprecated createBooking
    const result = await createOrder({
      order_type: 'cleaning',
      provider_org_id: service.providerId,
      start_at: scheduledAt,
      total_amount: totalAmount,
      currency: 'THB',
      notes: contactData.notes,
      items: [
        {
          product_id: service.id,
          item_name: language === 'ru' ? service.nameRu : service.nameEn,
          item_type: 'cleaning_service',
          qty: 1,
          unit_price: service.price,
          amount: service.price,
        },
        {
          item_name: language === 'ru' ? 'Сервисный сбор' : 'Service fee',
          item_type: 'platform_fee',
          qty: 1,
          unit_price: serviceFee,
          amount: serviceFee,
        },
      ],
      participants: [{
        role: 'primary',
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
      }],
      addresses: [{
        address_type: 'service',
        address_text: address,
      }],
      payment: {
        method: orderPaymentMethod,
        amount: totalAmount,
      },
      serviceName: language === 'ru' ? service.nameRu : service.nameEn,
    });

    if (result.success) {
      setBookingResult({ success: true, bookingId: result.order_id });
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-40">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Booking'} 
          showBack 
        />

        {/* Step Progress */}
        <BookingStepProgress steps={serviceBookingSteps} currentStep={currentStep} className="mt-4" />

        {/* Service Info */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border mb-6">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">
              {language === 'ru' ? service.nameRu : service.nameEn}
            </h3>
            <p className="text-sm text-muted-foreground">
              {service.duration} • ฿{service.price}
            </p>
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
            availableTimes={availableTimes}
            showQuickDates
          />
        </div>

        {/* Address */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <AddressPickerInput
            value={address}
            onChange={(addr) => setAddress(addr)}
            label={language === 'ru' ? 'Адрес' : 'Address'}
            placeholder={language === 'ru' ? 'Адрес для уборки' : 'Cleaning address'}
            type="service"
            required
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
            amount={totalAmount}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Price Summary */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'ru' ? service.nameRu : service.nameEn}
              </span>
              <span>฿{service.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'Сервисный сбор' : 'Service fee'}
              </span>
              <span>฿{serviceFee}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary">฿{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          disabled={!date || !time || !contactData.name || !contactData.phone || !address}
          submitLabel={language === 'ru' ? 'Подтвердить заказ' : 'Confirm Order'}
          hint={language === 'ru' ? '🔒 Безопасное бронирование — заполните форму' : '🔒 Secure booking — complete the form'}
        />
      </PageContainer>
    </AppLayout>
  );
}
