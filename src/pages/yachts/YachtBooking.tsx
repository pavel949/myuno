import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Anchor, Users, Clock, Loader2, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { useYacht } from '@/hooks/useYachts';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { supabase } from '@/integrations/supabase/client';
import { BookingDateTimeSelect } from '@/components/booking/BookingDateTimeSelect';
import { BookingParticipants } from '@/components/booking/BookingParticipants';
import { BookingContactForm, ContactFormData } from '@/components/booking/BookingContactForm';
import { BookingPaymentSelect, PaymentMethod } from '@/components/booking/BookingPaymentSelect';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingBottomBar } from '@/components/booking/BookingBottomBar';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BackButton } from '@/components/uno/BackButton';
import { YachtExperienceSelect, YACHT_EXPERIENCES } from '@/components/yachts/YachtExperienceSelect';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookNowData {
  date?: string;
  time?: string;
  guests?: number;
  charterType?: 'half_day' | 'full_day';
}

export default function YachtBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();
  const { yacht, isLoading } = useYacht(id || '');
  const { checkYachtAvailability, isChecking, lastResult } = useAvailabilityCheck();

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Get pre-filled data from location state (Book Now flow)
  const bookNowData = (location.state as { bookNowData?: BookNowData })?.bookNowData;

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: `/yachts/${id}/booking` } });
    return null;
  }

  // Determine if half day from URL params or bookNowData
  const isHalfDay = bookNowData?.charterType === 'half_day' || searchParams.get('type') === 'half';

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

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </PageContainer>
      </AppLayout>
    );
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

  // Calculate experiences total
  const experiencesTotal = selectedExperiences.reduce((sum, expId) => {
    const exp = YACHT_EXPERIENCES.find(e => e.id === expId);
    return sum + (exp?.price || 0);
  }, 0);

  const basePrice = isHalfDay 
    ? (yacht.price_half_day || 0) 
    : (yacht.price_full_day || 0);
  const serviceFee = Math.round((basePrice + experiencesTotal) * 0.05);
  const total = basePrice + experiencesTotal + serviceFee;

  const availableTimes = isHalfDay 
    ? ['09:00', '14:00']
    : ['08:00', '09:00', '10:00'];
  
  const yachtName = language === 'ru' ? yacht.name_ru : yacht.name_en;
  const yachtLocation = language === 'ru' 
    ? (yacht.location_ru || yacht.location_name || '') 
    : (yacht.location_name || '');

  const handleSubmit = async () => {
    if (!date || !time || !contactData.name || !contactData.phone || !yacht) return;

    // Check availability before booking
    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes);
    
    const endAt = new Date(scheduledAt);
    endAt.setHours(endAt.getHours() + (isHalfDay ? 4 : 8));

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
    scheduledAt.setHours(hours, minutes);

    // Build experiences list for notes
    const experienceNames = selectedExperiences.map(expId => {
      const exp = YACHT_EXPERIENCES.find(e => e.id === expId);
      return exp ? (language === 'ru' ? exp.labelRu : exp.labelEn) : '';
    }).filter(Boolean).join(', ');

    const charterType = isHalfDay ? 'half_day' : 'full_day';

    const result = await createBooking({
      booking_type: 'transport', // Maps to 'yacht' order_type via metadata
      scheduled_at: scheduledAt.toISOString(),
      total_amount: total,
      currency: yacht.currency || 'THB',
      provider_id: yacht.provider_id || undefined,
      notes: `Yacht: ${yacht.name_en}. ${isHalfDay ? 'Half day' : 'Full day'} charter. ${guests} guests.${experienceNames ? ` Experiences: ${experienceNames}.` : ''} ${contactData.notes || ''}`,
      items: [
        {
          item_type: 'yacht-rental',
          item_name: yachtName,
          quantity: 1,
          unit_price: basePrice,
          subtotal: basePrice,
        },
        ...selectedExperiences.map(expId => {
          const exp = YACHT_EXPERIENCES.find(e => e.id === expId)!;
          return {
            item_type: 'yacht-experience',
            item_name: language === 'ru' ? exp.labelRu : exp.labelEn,
            quantity: 1,
            unit_price: exp.price,
            subtotal: exp.price,
          };
        }),
      ],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      payment: {
        amount: total,
        payment_method: paymentMethod,
        status: 'pending',
      },
      addresses: [],
      metadata: {
        yacht_id: yacht.id,
        charter_type: charterType,
        guests_count: guests,
        crew_included: yacht.has_crew || false,
        catering_included: yacht.has_catering || false,
        experiences: selectedExperiences,
      },
      serviceName: yachtName,
      providerName: yacht.provider_id ? undefined : 'UNO Yachts',
      openWhatsAppOnCash: true,
    });

    if (result.booking_id) {
      // Save yacht-specific details to order_item_yacht_details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', result.booking_id)
        .eq('item_type', 'yacht-rental')
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        await supabase
          .from('order_item_yacht_details')
          .insert({
            order_item_id: orderItems[0].id,
            charter_type: charterType,
            guests_count: guests,
            crew_included: yacht.has_crew || false,
            catering_included: yacht.has_catering || false,
          });
      }

      setBookingResult({ bookingId: result.booking_id });
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
      />
    );
  }

  const canSubmit = date && time && contactData.name && contactData.phone;

  return (
    <AppLayout>
      <PageContainer className="pb-40">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath="/yachts" variant="ghost" />
          <h1 className="text-2xl font-bold tracking-tight">
            {language === 'ru' ? 'Бронирование яхты' : 'Book Yacht'}
          </h1>
        </div>

        {/* Yacht Summary */}
        <div className="flex gap-4 p-4 bg-card rounded-xl border mb-6">
          <img
            src={yacht.cover_image || '/placeholder.svg'}
            alt={yachtName}
            className="w-24 h-24 rounded-lg object-cover"
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
                {isHalfDay 
                  ? (language === 'ru' ? '4 часа' : '4 hours')
                  : (language === 'ru' ? '8 часов' : '8 hours')
                }
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
          <div className="p-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl border border-amber-500/20">
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

          {/* Payment */}
          <div>
            <h3 className="font-semibold mb-3">
              {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
            </h3>
            <BookingPaymentSelect
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              amount={total}
              currency="THB"
              showWallet
              showCash
            />
          </div>

          {/* Summary */}
          <BookingSummary
            title={yachtName}
            subtitle={isHalfDay 
              ? (language === 'ru' ? 'Полдня (4 часа)' : 'Half Day (4 hours)')
              : (language === 'ru' ? 'Полный день (8 часов)' : 'Full Day (8 hours)')
            }
            image={yacht.cover_image || '/placeholder.svg'}
            date={date}
            time={time}
            participants={guests}
            price={total}
            items={[
              {
                name: isHalfDay 
                  ? (language === 'ru' ? 'Аренда (полдня)' : 'Charter (half day)')
                  : (language === 'ru' ? 'Аренда (полный день)' : 'Charter (full day)'),
                quantity: 1,
                price: basePrice,
              },
              ...selectedExperiences.map(expId => {
                const exp = YACHT_EXPERIENCES.find(e => e.id === expId)!;
                return {
                  name: language === 'ru' ? exp.labelRu : exp.labelEn,
                  quantity: 1,
                  price: exp.price,
                };
              }),
              {
                name: language === 'ru' ? 'Сервисный сбор' : 'Service fee',
                quantity: 1,
                price: serviceFee,
              },
            ]}
            sourceCurrency={yacht.currency || 'THB'}
          />
        </div>
      </PageContainer>

      <BookingBottomBar
        total={total}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
        submitLabel={language === 'ru' ? 'Забронировать' : 'Confirm Booking'}
      />
    </AppLayout>
  );
}
