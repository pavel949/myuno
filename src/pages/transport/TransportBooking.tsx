import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBooking";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { 
  BookingSummary, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin } from "lucide-react";

export default function TransportBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  // Form state
  const [pickupDate, setPickupDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/transport/${id}/book` } });
    return null;
  }

  const pricePerDay = 1500;
  const days = pickupDate && returnDate
    ? Math.max(1, differenceInDays(new Date(returnDate), new Date(pickupDate)))
    : 1;
  const totalAmount = pricePerDay * days;

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' ? 'Аренда транспорта' : 'Vehicle Rental'}
          date={pickupDate ? format(new Date(pickupDate), 'PPP', { locale: language === 'ru' ? ru : undefined }) : undefined}
          location={pickupLocation}
          total={totalAmount}
          currency="THB"
          continuePath="/transport"
          continueLabel={language === 'ru' ? 'К транспорту' : 'Browse Transport'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!pickupDate || !pickupLocation) return;
    if (!contactData.name || !contactData.phone) return;

    const scheduledAt = new Date(pickupDate);

    const result = await createBooking({
      booking_type: 'transport',
      scheduled_at: scheduledAt,
      total_amount: totalAmount,
      currency: 'THB',
      notes: `Rental: ${days} days. Return: ${returnDate}`,
      items: [{
        item_type: 'vehicle_rental',
        item_id: id || 'vehicle',
        item_name: language === 'ru' ? 'Аренда транспорта' : 'Vehicle Rental',
        quantity: days,
        unit_price: pricePerDay,
        subtotal: totalAmount,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      addresses: [{
        address_type: 'pickup',
        address: pickupLocation,
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

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            title={language === 'ru' ? 'Аренда транспорта' : 'Vehicle Rental'}
            subtitle={`${days} ${language === 'ru' ? 'дней' : 'days'} × ฿${pricePerDay.toLocaleString()}`}
            price={totalAmount}
            currency="THB"
          />
        </div>

        {/* Dates */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Даты аренды' : 'Rental Dates'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ru' ? 'Начало' : 'Pick-up'}</Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Конец' : 'Return'}</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {language === 'ru' ? 'Место получения' : 'Pickup Location'}
          </h3>
          <Input
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder={language === 'ru' ? 'Отель, адрес...' : 'Hotel, address...'}
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

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalAmount}
          currency="THB"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!pickupDate || !pickupLocation || !contactData.name || !contactData.phone}
          submitLabel={language === 'ru' ? 'Забронировать' : 'Book Now'}
        />
      </PageContainer>
    </AppLayout>
  );
}
