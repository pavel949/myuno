import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  AddressPickerInput,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

// Demo vehicle data (fallback)
const demoVehicles: Record<string, { nameEn: string; nameRu: string; pricePerDay: number; image: string }> = {
  'car-1': { nameEn: 'Toyota Camry', nameRu: 'Тойота Камри', pricePerDay: 1500, image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600' },
  'car-2': { nameEn: 'Honda City', nameRu: 'Хонда Сити', pricePerDay: 1200, image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600' },
  'bike-1': { nameEn: 'Honda PCX 160', nameRu: 'Хонда PCX 160', pricePerDay: 300, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  'car-3': { nameEn: 'Toyota Fortuner', nameRu: 'Тойота Фортунер', pricePerDay: 2500, image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600' },
  'bike-2': { nameEn: 'Yamaha NMAX', nameRu: 'Ямаха NMAX', pricePerDay: 350, image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600' },
};

export default function TransportBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  // Get vehicle data from location state or fallback to demo
  const vehicleFromState = location.state?.vehicle;
  const vehicle = useMemo(() => {
    if (vehicleFromState) return vehicleFromState;
    if (id && demoVehicles[id]) return demoVehicles[id];
    return { nameEn: 'Vehicle Rental', nameRu: 'Аренда транспорта', pricePerDay: 1500, image: '' };
  }, [vehicleFromState, id]);

  // Form state
  const [pickupDate, setPickupDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <PageContainer className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </PageContainer>
      </AppLayout>
    );
  }

  // Auth redirect - use useEffect pattern to avoid render-time navigation
  if (!user) {
    navigate('/auth', { state: { from: `/transport/booking/${id}` } });
    return null;
  }

  const pricePerDay = vehicle.pricePerDay;
  const days = pickupDate && returnDate
    ? Math.max(1, differenceInDays(new Date(returnDate), new Date(pickupDate)))
    : 1;
  const totalAmount = pricePerDay * days;

  const vehicleName = language === 'ru' ? vehicle.nameRu : vehicle.nameEn;

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout showBottomNav={false}>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={vehicleName}
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
        item_name: vehicleName,
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
            title={vehicleName}
            subtitle={`${days} ${language === 'ru' ? 'дней' : 'days'} × ฿${pricePerDay.toLocaleString()}`}
            price={totalAmount}
            currency="THB"
            image={vehicle.image}
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
          <AddressPickerInput
            value={pickupLocation}
            onChange={(addr) => setPickupLocation(addr)}
            label={language === 'ru' ? 'Место получения' : 'Pickup Location'}
            placeholder={language === 'ru' ? 'Отель, адрес...' : 'Hotel, address...'}
            type="pickup"
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
