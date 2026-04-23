import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BabyIcon, Utensils, CreditCard } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { useRestaurant } from '@/hooks/useRestaurants';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { 
  BookingDateTimeSelect, 
  BookingParticipants,
  BookingContactForm,
  BookingBottomBar,
  BookingConfirmation 
} from '@/components/booking';
import { type ContactFormData } from '@/components/booking/BookingContactForm';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BackButton } from '@/components/uno/BackButton';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';

const DEFAULT_RESERVATION_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

export default function TableReservation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const { restaurant, isLoading: restaurantLoading } = useRestaurant(id);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [needHighChair, setNeedHighChair] = useState(false);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: `/restaurants/${id}/reserve` } });
    }
  }, [authLoading, user, navigate, id]);

  if (!user) {
    return null;
  }

  if (restaurantLoading || authLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <DetailPageSkeleton />
      </AppLayout>
    );
  }

  if (!restaurant) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Ресторан не найден' : 'Restaurant not found'}
          </p>
        </div>
      </AppLayout>
    );
  }

  // Extract reservation config from working_hours or features, with defaults
  const workingHours = restaurant.working_hours as Record<string, any> | null;
  const reservationSlots = (workingHours as any)?.reservation_slots || DEFAULT_RESERVATION_SLOTS;
  const depositRequired = (workingHours as any)?.deposit_required || false;
  const depositAmount = (workingHours as any)?.deposit_amount || 0;
  const maxPartySize = (workingHours as any)?.max_party_size || 12;

  const isFormValid = selectedDate && selectedTime && contactData.name && contactData.phone;

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime) return;

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    const notes = [
      `Guests: ${guests}`,
      needHighChair ? 'Need high chair' : '',
      isOutdoor ? 'Outdoor seating preferred' : '',
      specialRequests,
    ].filter(Boolean).join('. ');

    // If deposit required, redirect to Stripe for payment
    if (depositRequired && depositAmount > 0) {
      const response = await supabase.functions.invoke('create-restaurant-checkout', {
        body: {
          booking_type: 'table_reservation',
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name_en,
          amount: depositAmount,
          currency: 'thb',
          metadata: {
            scheduled_at: scheduledAt.toISOString(),
            guests: guests.toString(),
            contact_name: contactData.name,
            contact_phone: contactData.phone,
            notes: notes,
          },
        },
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
    }

    const result = await createBooking({
      booking_type: 'service',
      provider_id: restaurant.id,
      service_id: 'table-reservation',
      scheduled_at: scheduledAt.toISOString(),
      total_amount: depositRequired ? depositAmount : 0,
      currency: 'THB',
      notes,
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      metadata: {
        restaurantName: restaurant.name_en,
        restaurantNameRu: restaurant.name_ru,
        guests,
        time: selectedTime,
        bookingType: 'table_reservation',
        depositRequired,
        depositAmount: depositRequired ? depositAmount : 0,
      },
    });

    if (result.success && result.booking_id) {
      setBookingId(result.booking_id);
      setIsSuccess(true);
    }
  };

  if (isSuccess && selectedDate) {
    return (
      <BookingConfirmation
        bookingId={bookingId}
        title={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
        date={format(selectedDate, 'dd.MM.yyyy')}
        time={selectedTime}
        location={restaurant.address}
        total={depositRequired ? depositAmount : 0}
        currency="THB"
        onViewBookings={() => navigate('/bookings')}
        onContinue={() => navigate('/restaurants')}
      />
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-40">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-4 px-4 py-3">
            <BackButton fallbackPath="/restaurants" variant="ghost" />
            <div>
              <h1 className="font-semibold">
                {language === 'ru' ? 'Бронирование столика' : 'Table Reservation'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? restaurant.name_ru : restaurant.name_en}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Restaurant Card */}
          <div className="flex gap-4 p-4 rounded-none bg-card border border-border/50">
            <img 
              src={restaurant.cover_image || PLACEHOLDER_IMAGES.restaurant} 
              alt={restaurant.name_en}
              className="w-20 h-20 rounded-none object-cover"
            />
            <div>
              <h2 className="font-semibold">
                {language === 'ru' ? restaurant.name_ru : restaurant.name_en}
              </h2>
              <p className="text-sm text-muted-foreground">
                {restaurant.cuisine}
              </p>
              {restaurant.address && (
                <p className="text-xs text-muted-foreground mt-1">
                  {restaurant.address}
                </p>
              )}
            </div>
          </div>

          {/* Date & Time Selection */}
          <BookingDateTimeSelect
            date={selectedDate}
            onDateChange={setSelectedDate}
            time={selectedTime}
            onTimeChange={setSelectedTime}
            availableTimes={reservationSlots}
            minDate={new Date()}
            showQuickDates
          />

          {/* Number of Guests */}
          <BookingParticipants
            count={guests}
            onChange={setGuests}
            min={1}
            max={maxPartySize}
            label={language === 'ru' ? 'Количество гостей' : 'Number of Guests'}
          />

          {/* Special Options */}
          <div className="space-y-3">
            <Label className="font-semibold">
              {language === 'ru' ? 'Дополнительно' : 'Special Requests'}
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-none bg-card border border-border/50">
                <Checkbox 
                  id="highchair" 
                  checked={needHighChair}
                  onCheckedChange={(checked) => setNeedHighChair(checked as boolean)}
                />
                <label htmlFor="highchair" className="flex items-center gap-2 cursor-pointer flex-1">
                  <BabyIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === 'ru' ? 'Детское кресло' : 'High chair needed'}
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-none bg-card border border-border/50">
                <Checkbox 
                  id="outdoor" 
                  checked={isOutdoor}
                  onCheckedChange={(checked) => setIsOutdoor(checked as boolean)}
                />
                <label htmlFor="outdoor" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Utensils className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === 'ru' ? 'Место на террасе' : 'Outdoor seating'}
                  </span>
                </label>
              </div>
            </div>

            <Textarea
              placeholder={language === 'ru' 
                ? 'Аллергии, особые пожелания...' 
                : 'Allergies, special requests...'}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Contact Form */}
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showEmail
          />

          {/* Reservation Notice */}
          {depositRequired ? (
            <div className="flex items-start gap-3 p-4 rounded-none bg-warning/10 border border-warning/30">
              <CreditCard className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-warning">
                  {language === 'ru' ? `Депозит: ${depositAmount}฿` : `Deposit: ${depositAmount}฿`}
                </p>
                <p className="text-sm text-warning/80 mt-1">
                  {language === 'ru' 
                    ? 'Оплата депозита онлайн через Stripe. Будет зачтён в счёт заказа.'
                    : 'Pay deposit online via Stripe. Will be applied to your bill.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-none bg-success/10 border border-success/30">
              <div className="w-5 h-5 rounded-full bg-success text-success-foreground flex items-center justify-center text-xs flex-shrink-0">✓</div>
              <div>
                <p className="font-medium text-success">
                  {language === 'ru' ? 'Бесплатное бронирование' : 'Free Reservation'}
                </p>
                <p className="text-sm text-success/80 mt-1">
                  {language === 'ru' 
                    ? 'Оплата не требуется. Просто приходите в назначенное время.'
                    : 'No payment required. Just show up at your reserved time.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={depositRequired ? depositAmount : 0}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!isFormValid}
          submitLabel={depositRequired 
            ? (language === 'ru' ? `Забронировать (${depositAmount}฿)` : `Reserve (${depositAmount}฿)`)
            : (language === 'ru' ? 'Забронировать столик' : 'Reserve Table')
          }
        />
      </div>
    </AppLayout>
  );
}
