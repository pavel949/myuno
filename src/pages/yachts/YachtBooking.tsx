import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Anchor, Users, Clock, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBooking } from '@/hooks/useBooking';
import { BookingDateTimeSelect } from '@/components/booking/BookingDateTimeSelect';
import { BookingParticipants } from '@/components/booking/BookingParticipants';
import { BookingContactForm, ContactFormData } from '@/components/booking/BookingContactForm';
import { BookingPaymentSelect, PaymentMethod } from '@/components/booking/BookingPaymentSelect';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingBottomBar } from '@/components/booking/BookingBottomBar';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BackButton } from '@/components/uno/BackButton';
import { YachtExperienceSelect, YACHT_EXPERIENCES } from '@/components/yachts/YachtExperienceSelect';

// Demo yacht data
const getYacht = (id: string) => ({
  id,
  nameEn: 'Luxury Ocean Dream',
  nameRu: 'Люкс Океан Дрим',
  image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400',
  priceFullDay: 45000,
  priceHalfDay: 28000,
  capacity: 12,
  location: 'Chalong Bay',
  locationRu: 'Бухта Чалонг',
});

export default function YachtBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { createBooking, isSubmitting } = useBooking();

  const isHalfDay = searchParams.get('type') === 'half';
  const yacht = getYacht(id || 'yacht-1');

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>('');
  const [guests, setGuests] = useState(2);
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null);

  // Calculate experiences total
  const experiencesTotal = selectedExperiences.reduce((sum, id) => {
    const exp = YACHT_EXPERIENCES.find(e => e.id === id);
    return sum + (exp?.price || 0);
  }, 0);

  const basePrice = isHalfDay ? yacht.priceHalfDay : yacht.priceFullDay;
  const serviceFee = Math.round((basePrice + experiencesTotal) * 0.05);
  const total = basePrice + experiencesTotal + serviceFee;

  const availableTimes = isHalfDay 
    ? ['09:00', '14:00']
    : ['08:00', '09:00', '10:00'];

  const handleSubmit = async () => {
    if (!date || !time || !contactData.name || !contactData.phone) return;

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes);

    // Build experiences list for notes
    const experienceNames = selectedExperiences.map(id => {
      const exp = YACHT_EXPERIENCES.find(e => e.id === id);
      return exp ? (language === 'ru' ? exp.labelRu : exp.labelEn) : '';
    }).filter(Boolean).join(', ');

    const result = await createBooking({
      booking_type: 'transport', // Use transport as closest type for yacht
      scheduled_at: scheduledAt.toISOString(),
      total_amount: total,
      currency: 'THB',
      notes: `Yacht: ${yacht.nameEn}. ${isHalfDay ? 'Half day' : 'Full day'} charter. ${guests} guests.${experienceNames ? ` Experiences: ${experienceNames}.` : ''} ${contactData.notes || ''}`,
      items: [
        {
          item_type: 'yacht-rental',
          item_name: language === 'ru' ? yacht.nameRu : yacht.nameEn,
          quantity: 1,
          unit_price: basePrice,
          subtotal: basePrice,
        },
        ...selectedExperiences.map(id => {
          const exp = YACHT_EXPERIENCES.find(e => e.id === id)!;
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
        status: paymentMethod === 'cash' ? 'pending' : 'pending',
      },
      addresses: [],
    });

    if (result.booking_id) {
      setBookingResult({ bookingId: result.booking_id });
    }
  };

  if (bookingResult) {
    return (
      <BookingConfirmation
        bookingId={bookingResult.bookingId}
        title={language === 'ru' ? yacht.nameRu : yacht.nameEn}
        date={date ? format(date, 'PPP') : undefined}
        time={time}
        location={language === 'ru' ? yacht.locationRu : yacht.location}
        total={total}
        currency="THB"
        onViewBookings={() => navigate('/bookings')}
        continuePath="/yachts"
        continueLabel={language === 'ru' ? 'К яхтам' : 'Browse Yachts'}
      />
    );
  }

  const canSubmit = date && time && contactData.name && contactData.phone;

  return (
    <AppLayout>
      <PageContainer className="pb-32">
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
            src={yacht.image}
            alt=""
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold">
              {language === 'ru' ? yacht.nameRu : yacht.nameEn}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Anchor className="w-4 h-4" />
              <span>{language === 'ru' ? yacht.locationRu : yacht.location}</span>
            </div>
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
            max={yacht.capacity}
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
            title={language === 'ru' ? yacht.nameRu : yacht.nameEn}
            subtitle={isHalfDay 
              ? (language === 'ru' ? 'Полдня (4 часа)' : 'Half Day (4 hours)')
              : (language === 'ru' ? 'Полный день (8 часов)' : 'Full Day (8 hours)')
            }
            image={yacht.image}
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
              ...selectedExperiences.map(id => {
                const exp = YACHT_EXPERIENCES.find(e => e.id === id)!;
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
            currency="THB"
          />
        </div>
      </PageContainer>

      <BookingBottomBar
        total={total}
        currency="THB"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        disabled={!canSubmit}
        submitLabel={language === 'ru' ? 'Забронировать' : 'Confirm Booking'}
      />
    </AppLayout>
  );
}
