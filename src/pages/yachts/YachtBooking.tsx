import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Anchor, Users, Clock, Loader2, AlertCircle, Info, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useStripeUnifiedCheckout } from '@/hooks/useStripeUnifiedCheckout';
import { useYacht } from '@/hooks/useYachts';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { BookingDateTimeSelect } from '@/components/booking/BookingDateTimeSelect';
import { BookingParticipants } from '@/components/booking/BookingParticipants';
import { BookingContactForm, ContactFormData } from '@/components/booking/BookingContactForm';
import { BookingPaymentSelect, PaymentMethod } from '@/components/booking/BookingPaymentSelect';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingBottomBar } from '@/components/booking/BookingBottomBar';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BackButton } from '@/components/uno/BackButton';
import { YachtExperienceSelect } from '@/components/yachts/YachtExperienceSelect';
import { useYachtExperiences } from '@/hooks/useYachtExperiences';
import { Alert, AlertDescription } from '@/components/ui/alert';

type CharterType = 'half_day' | 'full_day' | 'sunset' | 'overnight';

interface BookNowData {
  date?: string;
  time?: string;
  guests?: number;
  charterType?: CharterType;
}

const CHARTER_DURATIONS: Record<CharterType, number> = {
  half_day: 4,
  full_day: 8,
  sunset: 3,
  overnight: 24,
};

const CHARTER_LABELS: Record<CharterType, { en: string; ru: string }> = {
  half_day: { en: 'Half Day (4 hours)', ru: 'Полдня (4 часа)' },
  full_day: { en: 'Full Day (8 hours)', ru: 'Полный день (8 часов)' },
  sunset: { en: 'Sunset Cruise (3 hours)', ru: 'Закатный круиз (3 часа)' },
  overnight: { en: 'Overnight (24 hours)', ru: 'С ночёвкой (24 часа)' },
};

export default function YachtBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createOrder, isCreating } = useOrders();
  const { createCheckout, isProcessing: isStripeProcessing } = useStripeUnifiedCheckout();
  const { yacht, isLoading } = useYacht(id || '');
  const { checkYachtAvailability, isChecking, lastResult } = useAvailabilityCheck();
  const { data: yachtExperiences = [] } = useYachtExperiences();
  const { platformFeePercent } = useSystemSettings();

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Get pre-filled data from location state (Book Now flow)
  const bookNowData = (location.state as { bookNowData?: BookNowData })?.bookNowData;

  // Determine charter type from URL params or bookNowData
  const charterTypeParam = (searchParams.get('type') as CharterType) || bookNowData?.charterType || 'full_day';
  const charterType: CharterType = ['half_day', 'full_day', 'sunset', 'overnight'].includes(charterTypeParam) 
    ? charterTypeParam as CharterType 
    : 'full_day';

  // Initialize state with bookNowData if available
  const [date, setDate] = useState<Date | undefined>(() => {
    if (bookNowData?.date) {
      return new Date(bookNowData.date);
    }
    return undefined;
  });
  const [time, setTime] = useState<string>(() => bookNowData?.time || '');
  const [guests, setGuests] = useState(() => bookNowData?.guests || 2);
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null);

  // Auth redirect - must be after all hooks
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: `/yachts/${id}/booking` } });
    }
  }, [authLoading, user, navigate, id]);

  // Loading state
  if (isLoading || authLoading) {
    return (
      <AppLayout>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </PageContainer>
      </AppLayout>
    );
  }
  
  // Auth check after loading
  if (!user) {
    return null;
  }

  // Not found state
  if (!yacht) {
    return (
      <AppLayout>
        <PageContainer className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Anchor className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {language === 'ru' ? 'Яхта не найдена' : 'Yacht not found'}
          </h1>
          <BackButton fallbackPath="/yachts" />
        </PageContainer>
      </AppLayout>
    );
  }

  // Booking mode & deposit calculation
  const isInstant = yacht.booking_flow === 'instant';
  const depositPercent = yacht.deposit_percent ?? 50;

  // Calculate experiences total
  const experiencesTotal = selectedExperiences.reduce((sum, expId) => {
    const exp = yachtExperiences.find(e => e.id === expId);
    return sum + (exp?.price || 0);
  }, 0);

  const priceMap: Record<CharterType, number> = {
    half_day: yacht.price_half_day || 0,
    full_day: yacht.price_full_day || 0,
    sunset: yacht.price_sunset || 0,
    overnight: yacht.price_overnight || 0,
  };
  const basePrice = priceMap[charterType];
  const serviceFee = Math.round((basePrice + experiencesTotal) * (platformFeePercent / 100));
  const total = basePrice + experiencesTotal + serviceFee;
  const depositAmount = Math.round(total * depositPercent / 100);
  const balanceAmount = total - depositAmount;

  const defaultTimesMap: Record<CharterType, string[]> = {
    half_day: ['09:00', '14:00'],
    full_day: ['08:00', '09:00', '10:00'],
    sunset: ['16:00', '16:30', '17:00'],
    overnight: ['10:00', '12:00'],
  };
  const availableTimes = yacht.departure_times?.length 
    ? yacht.departure_times 
    : (defaultTimesMap[charterType] || defaultTimesMap.full_day);

  const yachtName = language === 'ru' ? yacht.name_ru : yacht.name_en;
  const yachtLocation = language === 'ru' 
    ? (yacht.location_ru || yacht.location_name || '') 
    : (yacht.location_name || '');
  const charterLabel = CHARTER_LABELS[charterType];
  const charterDuration = CHARTER_DURATIONS[charterType];

  const handleSubmit = async () => {
    if (!date || !time || !contactData.name || !contactData.phone || !yacht) return;

    // Check availability before booking
    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes);
    
    const endAt = new Date(scheduledAt);
    endAt.setHours(endAt.getHours() + charterDuration);

    const availability = await checkYachtAvailability(yacht.id, scheduledAt, endAt);
    
    if (!availability.available) {
      setAvailabilityError(
        language === 'ru' 
          ? 'Яхта недоступна на выбранную дату. Пожалуйста, выберите другое время.'
          : 'Yacht is not available for the selected date. Please choose another time.'
      );
      return;
    }
    
    setAvailabilityError(null);

    // Build experiences list for notes
    const experienceNames = selectedExperiences.map(expId => {
      const exp = yachtExperiences.find(e => e.id === expId);
      return exp ? (language === 'ru' ? exp.labelRu : exp.labelEn) : '';
    }).filter(Boolean).join(', ');

    const bookingCharterType = charterType;

    // Stripe checkout for online payments — ORDER-FIRST: create order BEFORE Stripe redirect.
    // This guarantees a DB record exists even if Stripe checkout is abandoned, so payments
    // can always be reconciled via webhook → order_id lookup. See ARCHITECTURE_V2 §13.
    if (isInstant && paymentMethod === 'online') {
      const experiences = selectedExperiences.map(expId => {
        const exp = yachtExperiences.find(e => e.id === expId)!;
        return {
          id: expId,
          name: language === 'ru' ? exp.labelRu : exp.labelEn,
          price: exp.price,
        };
      });

      await createCheckout('create-yacht-checkout', {
        yacht_id: yacht.id,
        yacht_name: yachtName,
        charter_type: bookingCharterType,
        base_price: basePrice,
        guests,
        experiences,
        service_fee: serviceFee,
        deposit_amount: depositAmount,
        total_amount: total,
        currency: yacht.currency || 'THB',
        scheduled_at: scheduledAt.toISOString(),
        end_at: endAt.toISOString(),
        contact_name: contactData.name,
        contact_phone: contactData.phone,
        contact_email: contactData.email,
        notes: contactData.notes,
        provider_id: yacht.provider_id,
      });
      return;
    }

    // Cash/wallet/request flow — create order locally
    const result = await createOrder({
      order_type: 'yacht',
      start_at: scheduledAt.toISOString(),
      end_at: endAt.toISOString(),
      total_amount: total,
      currency: yacht.currency || 'THB',
      notes: `Yacht: ${yacht.name_en}. ${charterLabel.en} charter. ${guests} guests.${experienceNames ? ` Experiences: ${experienceNames}.` : ''} ${contactData.notes || ''}`,
      items: [
        {
          item_name: yachtName,
          item_type: 'yacht-rental',
          qty: 1,
          unit_price: basePrice,
          amount: basePrice,
          metadata: { source_id: yacht.id },
        },
        ...selectedExperiences.map(expId => {
          const exp = yachtExperiences.find(e => e.id === expId)!;
          return {
            item_name: language === 'ru' ? exp.labelRu : exp.labelEn,
            item_type: 'yacht-experience',
            qty: 1,
            unit_price: exp.price,
            amount: exp.price,
            metadata: { source_id: expId },
          };
        }),
      ],
      participants: [{
        role: 'primary' as const,
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
      }],
      payment: {
        amount: isInstant ? depositAmount : total,
        method: isInstant ? (paymentMethod === 'online' ? 'stripe' : paymentMethod === 'wallet' ? 'wallet' : 'cash') : 'cash',
      },
      metadata: {
        yacht_id: yacht.id,
        charter_type: bookingCharterType,
        guests_count: guests,
        crew_included: yacht.has_crew || false,
        catering_included: yacht.has_catering || false,
        experiences: selectedExperiences,
        booking_flow: yacht.booking_flow || 'in_app_request',
        deposit_percent: depositPercent,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        balance_due_hours: yacht.balance_due_hours ?? 48,
      },
      serviceName: yachtName,
      providerName: yacht.provider_id ? undefined : 'UNO Yachts',
      openWhatsAppOnCash: !isInstant,
    });

    if (result.success && result.order_id) {
      // Save yacht-specific details to order_item_yacht_details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', result.order_id)
        .eq('item_type', 'yacht-rental')
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        await supabase
          .from('order_item_yacht_details')
          .insert({
            order_item_id: orderItems[0].id,
            charter_type: bookingCharterType,
            guests_count: guests,
            crew_included: yacht.has_crew || false,
            catering_included: yacht.has_catering || false,
          });
      }

      setBookingResult({ bookingId: result.order_id });
    }
  };

  if (bookingResult) {
    return (
      <BookingConfirmation
        bookingId={bookingResult.bookingId}
        title={yachtName}
        date={date ? format(date, 'PPP') : undefined}
        time={time}
        location={yachtLocation}
        total={total}
        currency={yacht.currency || 'THB'}
        onViewBookings={() => navigate('/bookings')}
        continuePath="/yachts"
        continueLabel={language === 'ru' ? 'К яхтам' : 'Browse Yachts'}
        bookingMode={isInstant ? 'instant' : 'request'}
        depositAmount={depositAmount}
        balanceAmount={balanceAmount}
      />
    );
  }

  const canSubmit = date && time && contactData.name && contactData.phone;

  return (
    <AppLayout>
      <PageContainer className="pb-40">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-4"
        >
          <BackButton fallbackPath="/yachts" variant="ghost" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === 'ru' ? 'Бронирование яхты' : 'Book Yacht'}
            </h1>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
              isInstant
                ? 'bg-primary/10 text-primary'
                : 'bg-accent text-accent-foreground'
            }`}>
              {isInstant
                ? (language === 'ru' ? '⚡ Мгновенное бронирование' : '⚡ Instant Booking')
                : (language === 'ru' ? '📋 Бронирование по заявке' : '📋 Request to Book')}
            </span>
          </div>
        </motion.div>

        {/* Yacht Summary */}
        <div className="flex gap-4 p-4 bg-card rounded-none border mb-6">
          <img
            src={yacht.cover_image || '/placeholder.svg'}
            alt={yachtName}
            className="w-24 h-24 rounded-none object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{yachtName}</h3>
            {yachtLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Anchor className="w-4 h-4" />
                <span>{yachtLocation}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {language === 'ru' ? `до ${yacht.capacity} гостей` : `up to ${yacht.capacity} guests`}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {language === 'ru' ? charterLabel.ru : charterLabel.en}
              </span>
            </div>
          </div>
        </div>

        {/* Availability Warning */}
        {availabilityError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{availabilityError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Date & Time */}
          <BookingDateTimeSelect
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            availableTimes={availableTimes}
            minDate={new Date()}
          />

          {/* Guests */}
          <BookingParticipants
            count={guests}
            onChange={setGuests}
            min={1}
            max={yacht.capacity || 12}
            label={language === 'ru' ? 'Количество гостей' : 'Number of Guests'}
          />

          {/* Experiences */}
          <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/10 rounded-none border border-primary/15">
            <YachtExperienceSelect
              selected={selectedExperiences}
              onChange={setSelectedExperiences}
            />
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">
              {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
            </h3>
            <BookingContactForm
              data={contactData}
              onChange={setContactData}
              showEmail
              showNotes
            />
          </div>

          {/* Payment — only for instant booking */}
          {isInstant ? (
            <div>
              <h3 className="font-semibold mb-3">
                {language === 'ru' ? 'Способ оплаты депозита' : 'Deposit Payment Method'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'ru'
                  ? `Сейчас оплачивается депозит ${depositPercent}% — ${(yacht.currency === 'THB' ? '฿' : yacht.currency)}${depositAmount.toLocaleString()}`
                  : `You pay a ${depositPercent}% deposit now — ${(yacht.currency === 'THB' ? '฿' : yacht.currency)}${depositAmount.toLocaleString()}`}
              </p>
              <BookingPaymentSelect
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                amount={depositAmount}
                currency="THB"
                showWallet
                showCash
              />
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-accent/50 border border-border rounded-none">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {language === 'ru' ? 'Депозит будет выставлен отдельно' : 'Deposit will be invoiced separately'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'ru'
                    ? `После подтверждения заявки менеджер myUNO выставит счёт на депозит (${depositPercent}% от стоимости).`
                    : `After the request is confirmed, a myUNO manager will send a deposit invoice (${depositPercent}% of total).`}
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <BookingSummary
            title={yachtName}
            subtitle={language === 'ru' ? charterLabel.ru : charterLabel.en}
            price={total}
            sourceCurrency={yacht.currency || 'THB'}
            image={yacht.cover_image || undefined}
            items={[
              {
                name: language === 'ru' ? 'Чартер' : 'Charter',
                quantity: 1,
                price: basePrice,
              },
              ...selectedExperiences.map(expId => {
                const exp = yachtExperiences.find(e => e.id === expId);
                return {
                  name: language === 'ru' ? (exp?.labelRu || '') : (exp?.labelEn || ''),
                  quantity: 1,
                  price: exp?.price || 0,
                };
              }),
            ]}
            serviceFee={serviceFee > 0 ? serviceFee : undefined}
          />

          {/* Deposit Info for Instant Booking */}
          {isInstant && (
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-none">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">
                  {language === 'ru'
                    ? `Депозит ${depositPercent}%: ฿${depositAmount.toLocaleString()}`
                    : `${depositPercent}% Deposit: ฿${depositAmount.toLocaleString()}`}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {language === 'ru'
                    ? `Остаток ฿${balanceAmount.toLocaleString()} оплачивается за ${yacht.balance_due_hours ?? 48}ч до чартера`
                    : `Balance ฿${balanceAmount.toLocaleString()} is due ${yacht.balance_due_hours ?? 48}h before charter`}
                </p>
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      {/* Bottom Submit Bar */}
      <BookingBottomBar
        total={isInstant ? depositAmount : total}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isChecking || isStripeProcessing}
        disabled={!canSubmit}
        submitLabel={
          isInstant
            ? (language === 'ru' ? `Оплатить депозит ฿${depositAmount.toLocaleString()}` : `Pay Deposit ฿${depositAmount.toLocaleString()}`)
            : (language === 'ru' ? 'Отправить заявку' : 'Submit Request')
        }
        hint={
          isInstant
            ? (language === 'ru' ? '⚡ Мгновенное подтверждение' : '⚡ Instant confirmation')
            : (language === 'ru' ? '📋 Менеджер myUNO свяжется с вами' : '📋 A myUNO manager will contact you')
        }
      />
    </AppLayout>
  );
}
