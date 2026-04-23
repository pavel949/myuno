/**
 * TransportBooking - Unified booking flow for vehicle rentals
 * 
 * Features:
 * - DateRangePickerCard with blocked dates
 * - Real vehicle data from DB (no demo fallback)
 * - Availability checking via 'transport' vertical
 * - Consistent UX with Property booking
 */

import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useVehicle } from "@/hooks/useVehicles";
import { useAvailabilityCheck } from "@/hooks/useAvailabilityCheck";
import { useConciergeAdvance } from "@/hooks/useConciergeAdvance";
import { useStripeUnifiedCheckout } from "@/hooks/useStripeUnifiedCheckout";
import { supabase } from "@/integrations/supabase/client";
import { ConciergeAdvanceOption } from "@/components/booking/ConciergeAdvanceOption";
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
  DateRangePickerCard,
  type ContactFormData,
  type PaymentMethod 
} from "@/components/booking";
import { format, differenceInDays, addDays } from "date-fns";
import { ru, th } from "date-fns/locale";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TransportBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createOrder, isCreating } = useOrders();
  const { checkAvailability, isChecking: checkingAvailability } = useAvailabilityCheck();
  const { createAdvanceRequest, navigateToAdvanceRequested, calculateFee, isProcessing: advanceProcessing, feePercent } = useConciergeAdvance();
  const { createCheckout, isProcessing: stripeProcessing } = useStripeUnifiedCheckout();

  // Get vehicle from DB
  const { vehicle, isLoading: vehicleLoading } = useVehicle(id || '');
  
  // Also check location.state for pre-passed vehicle data
  const vehicleFromState = location.state?.vehicle;
  
  // Use DB data primarily, fallback to state
  const vehicleData = useMemo(() => {
    if (vehicle) return vehicle;
    if (vehicleFromState) return vehicleFromState;
    return null;
  }, [vehicle, vehicleFromState]);

  // Form state
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [contactData, setContactData] = useState<ContactFormData>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  // Load blocked dates for vehicle - simplified since table doesn't have vehicle_id
  // Blocked dates will be handled via availability check instead
  useEffect(() => {
    // For now, blocked dates are empty - real availability comes from availability check
    setBlockedDates([]);
  }, [id]);

  // Check availability when dates change
  useEffect(() => {
    const checkDates = async () => {
      if (!pickupDate || !returnDate || !id) return;
      
      setAvailabilityError(null);
      const result = await checkAvailability({
        vertical: 'transport',
        entityId: id,
        startDatetime: pickupDate,
        endDatetime: returnDate,
      });

      if (!result.available) {
        setAvailabilityError(
          language === 'ru' 
            ? 'Выбранные даты недоступны. Пожалуйста, выберите другие даты.'
            : 'Selected dates are not available. Please choose different dates.'
        );
      }
    };

    checkDates();
  }, [pickupDate, returnDate, id, checkAvailability, language]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: `/transport/booking/${id}` } });
    }
  }, [authLoading, user, navigate, id]);

  // Loading states
  if (authLoading || vehicleLoading) {
    return (
      <AppLayout>
        <PageContainer className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  // No vehicle found
  if (!vehicleData) {
    return (
      <AppLayout>
        <PageContainer className="flex flex-col items-center justify-center min-h-screen gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Транспорт не найден' : 'Vehicle not found'}
          </p>
          <button 
            onClick={() => navigate('/transport')}
            className="text-primary underline"
          >
            {language === 'ru' ? 'Вернуться к каталогу' : 'Back to catalog'}
          </button>
        </PageContainer>
      </AppLayout>
    );
  }

  const pricePerDay = vehicleData.price_per_day || vehicleData.pricePerDay || 0;
  const days = pickupDate && returnDate
    ? Math.max(1, differenceInDays(returnDate, pickupDate))
    : 1;
  const totalAmount = pricePerDay * days;

  const vehicleName = language === 'ru' 
    ? (vehicleData.name_ru || vehicleData.nameRu) 
    : (vehicleData.name_en || vehicleData.nameEn);

  const vehicleImage = vehicleData.cover_image || vehicleData.images?.[0] || vehicleData.image || '';

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    const dateLocale = language === 'ru' ? ru : language === 'th' ? th : undefined;
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={vehicleName}
          date={pickupDate ? format(pickupDate, 'PPP', { locale: dateLocale }) : undefined}
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
    if (availabilityError) return;

    const scheduledAt = pickupDate.toISOString();
    const endAt = (returnDate || addDays(pickupDate, 1)).toISOString();

    const effectivePaymentMethod = paymentMethod === 'concierge_advance' ? 'cash' : paymentMethod;
    const mappedPayment = effectivePaymentMethod === 'online' ? 'stripe' : effectivePaymentMethod === 'wallet' ? 'wallet' : 'cash';

    const result = await createOrder({
      order_type: 'vehicle',
      start_at: scheduledAt,
      end_at: endAt,
      total_amount: totalAmount,
      currency: 'THB',
      notes: `Rental: ${days} days. Return: ${returnDate ? format(returnDate, 'yyyy-MM-dd') : 'N/A'}`,
      items: [{
        item_name: vehicleName,
        item_type: 'vehicle_rental',
        qty: days,
        unit_price: pricePerDay,
        amount: totalAmount,
        metadata: { source_id: id },
      }],
      participants: [{
        role: 'primary' as const,
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
      }],
      addresses: [{
        address_type: 'pickup' as const,
        address_text: pickupLocation,
      }],
      payment: {
        amount: totalAmount,
        method: mappedPayment as 'cash' | 'wallet' | 'stripe' | 'bank_transfer',
      },
      metadata: {
        vehicle_id: id,
        rental_days: days,
        pickup_date: pickupDate.toISOString(),
        return_date: returnDate?.toISOString(),
        vehicle_type: vehicleData.vehicle_type || 'car',
        payment_method_requested: paymentMethod,
      },
      serviceName: vehicleName,
      openWhatsAppOnCash: paymentMethod === 'cash',
    });

    if (result.success && result.order_id) {
      // Save transport-specific details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', result.order_id)
        .eq('item_type', 'vehicle_rental')
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        const { error: detailsError } = await supabase
          .from('order_item_transport_details')
          .insert({
            order_item_id: orderItems[0].id,
            vehicle_type: vehicleData.vehicle_type || 'car',
            pickup_time: pickupDate.toISOString(),
            passenger_count: 1,
            luggage_count: 0,
            is_round_trip: false,
          });

        if (detailsError) {
          console.error('Failed to save transport details:', detailsError);
        }
      }

      // Handle payment method routing
      if (paymentMethod === 'online') {
        await createCheckout('create-checkout', {
          order_id: result.order_id,
          order_type: 'transport',
          amount: totalAmount,
          currency: 'THB',
          description: vehicleName,
        });
        return; // Redirect happens in createCheckout
      }

      if (paymentMethod === 'concierge_advance') {
        await createAdvanceRequest({
          orderId: result.order_id,
          orderNumber: result.order_id.slice(0, 8).toUpperCase(),
          orderType: 'transport',
          baseAmount: totalAmount,
          currency: 'THB',
          providerName: vehicleName,
          deliveryDetails: {
            pickup_location: pickupLocation,
            pickup_date: pickupDate.toISOString(),
            return_date: returnDate?.toISOString(),
            rental_days: days,
          },
        });
        navigateToAdvanceRequested(
          result.order_id.slice(0, 8).toUpperCase(),
          totalAmount,
          'transport'
        );
        return;
      }

      setBookingResult({ success: true, bookingId: result.order_id });
    }
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setPickupDate(start);
    setReturnDate(end);
    setAvailabilityError(null);
  };

  const isFormValid = pickupDate && pickupLocation && contactData.name && contactData.phone && !availabilityError;

  return (
    <AppLayout>
      <PageContainer className="pb-40">
        <PageHeader 
          title={language === 'ru' ? 'Бронирование' : 'Booking'} 
          showBack 
        />

        {/* Summary Card */}
        <div className="mt-4 mb-6">
          <BookingSummary
            title={vehicleName}
            subtitle={`${days} ${language === 'ru' ? (days === 1 ? 'день' : days < 5 ? 'дня' : 'дней') : 'days'} × ฿${pricePerDay.toLocaleString()}`}
            price={totalAmount}
            sourceCurrency="THB"
            image={vehicleImage}
          />
        </div>

        {/* Date Range Picker */}
        <DateRangePickerCard
          startDate={pickupDate}
          endDate={returnDate}
          onRangeChange={handleDateRangeChange}
          blockedDates={blockedDates}
          startLabel={language === 'ru' ? 'Получение' : 'Pick-up'}
          endLabel={language === 'ru' ? 'Возврат' : 'Return'}
          showDuration
          durationUnit="day"
          minStay={1}
          className="mb-4"
        />

        {/* Availability Error */}
        {availabilityError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{availabilityError}</AlertDescription>
          </Alert>
        )}

        {/* Pickup Location */}
        <div className="bg-card rounded-none border p-5 mb-4">
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
        <div className="bg-card rounded-none border p-5 mb-4">
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
        <div className="bg-card rounded-none border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod === 'concierge_advance' ? 'cash' : paymentMethod}
            onSelect={setPaymentMethod}
            amount={totalAmount}
            currency="THB"
            showWallet
            showCash
            showOnline
          />

          {/* Concierge Advance Option */}
          <div className="mt-4">
            <ConciergeAdvanceOption
              isSelected={paymentMethod === 'concierge_advance'}
              onSelect={() => setPaymentMethod(paymentMethod === 'concierge_advance' ? 'cash' : 'concierge_advance' as PaymentMethod)}
              baseAmount={totalAmount}
              feePercent={feePercent}
              currency="THB"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={paymentMethod === 'concierge_advance' ? calculateFee(totalAmount).totalWithFee : totalAmount}
          onSubmit={handleSubmit}
          isSubmitting={isCreating || checkingAvailability || advanceProcessing || stripeProcessing}
          disabled={!isFormValid}
          submitLabel={
            paymentMethod === 'online'
              ? (language === 'ru' ? 'Перейти к оплате' : 'Proceed to Payment')
              : paymentMethod === 'concierge_advance'
                ? (language === 'ru' ? 'Отправить запрос' : 'Submit Request')
                : (language === 'ru' ? 'Забронировать' : 'Book Now')
          }
          hint={
            paymentMethod === 'online'
              ? (language === 'ru' ? '💳 Безопасная оплата через Stripe' : '💳 Secure payment via Stripe')
              : paymentMethod === 'concierge_advance'
                ? (language === 'ru' ? '✨ myUNO оплатит за вас провайдеру' : '✨ myUNO will pay the provider for you')
                : (language === 'ru' ? '🔒 Безопасное бронирование — никаких списаний до подтверждения' : '🔒 Secure booking — no charges until confirmed')
          }
        />
      </PageContainer>
    </AppLayout>
  );
}
