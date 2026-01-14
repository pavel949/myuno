import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
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
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Sparkles } from "lucide-react";

const cleaningServices: Record<string, { nameEn: string; nameRu: string; price: number; duration: string }> = {
  'clean-1': { nameEn: 'Regular Home Cleaning', nameRu: 'Регулярная уборка', price: 800, duration: '2-3h' },
  'clean-2': { nameEn: 'Deep Cleaning', nameRu: 'Генеральная уборка', price: 2500, duration: '4-6h' },
  'clean-3': { nameEn: 'Laundry & Ironing', nameRu: 'Стирка и глажка', price: 200, duration: '24h' },
  'clean-4': { nameEn: 'Office Cleaning', nameRu: 'Уборка офиса', price: 1500, duration: '3-4h' },
  'clean-5': { nameEn: 'Move-in/out Cleaning', nameRu: 'Уборка при въезде/выезде', price: 3000, duration: '5-7h' },
  'clean-6': { nameEn: 'Dry Cleaning', nameRu: 'Химчистка', price: 300, duration: '48h' },
};

export default function CleaningBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const service = cleaningServices[id || 'clean-1'] || cleaningServices['clean-1'];
  const serviceFee = 50;
  const totalAmount = service.price + serviceFee;

  // Form state
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/cleaning/${id}/book` } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
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

    const items = [
      {
        item_type: 'service',
        item_id: id || 'clean-1',
        item_name: language === 'ru' ? service.nameRu : service.nameEn,
        quantity: 1,
        unit_price: service.price,
        subtotal: service.price,
      },
      {
        item_type: 'fee',
        item_id: 'service_fee',
        item_name: language === 'ru' ? 'Сервисный сбор' : 'Service fee',
        quantity: 1,
        unit_price: serviceFee,
        subtotal: serviceFee,
      },
    ];

    const result = await createBooking({
      booking_type: 'service',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: 'THB',
      notes: contactData.notes,
      items,
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      addresses: [{
        address_type: 'service',
        address: address,
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
    <AppLayout showBottomNav={false}>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Booking'} 
          showBack 
        />

        {/* Service Info */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border mt-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-500" />
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
          currency="THB"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!date || !time || !contactData.name || !contactData.phone || !address}
          submitLabel={language === 'ru' ? 'Подтвердить заказ' : 'Confirm Order'}
        />
      </PageContainer>
    </AppLayout>
  );
}
