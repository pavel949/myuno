import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BabyIcon, Utensils, Banknote, CreditCard } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
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
import { getRestaurantById } from './restaurantsData';
import { BackButton } from '@/components/uno/BackButton';

export default function TableReservation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const restaurant = getRestaurantById(id || '');

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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/restaurants/${id}/reserve`);
    }
  }, [user, authLoading, navigate, id]);

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

  if (authLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Загрузка...' : 'Loading...'}
          </p>
        </div>
      </AppLayout>
    );
  }

  // Check if deposit is required for this restaurant
  const depositRequired = restaurant.depositRequired;
  const depositAmount = restaurant.depositAmount || 0;

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
          restaurant_name: restaurant.nameEn,
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
        restaurantName: restaurant.nameEn,
        restaurantNameRu: restaurant.nameRu,
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
        title={language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
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
      <div className="pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-4 px-4 py-3">
            <BackButton fallbackPath="/restaurants" variant="ghost" />
            <div>
              <h1 className="font-semibold">
                {language === 'ru' ? 'Бронирование столика' : 'Table Reservation'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Restaurant Card */}
          <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50">
            <img 
              src={restaurant.image} 
              alt={restaurant.nameEn}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <h2 className="font-semibold">
                {language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? restaurant.cuisineRu : restaurant.cuisine}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {restaurant.address}
              </p>
            </div>
          </div>

          {/* Date & Time Selection */}
          <BookingDateTimeSelect
            date={selectedDate}
            onDateChange={setSelectedDate}
            time={selectedTime}
            onTimeChange={setSelectedTime}
            availableTimes={restaurant.reservationSlots}
            minDate={new Date()}
            showQuickDates
          />

          {/* Number of Guests */}
          <BookingParticipants
            count={guests}
            onChange={setGuests}
            min={1}
            max={restaurant.maxPartySize}
            label={language === 'ru' ? 'Количество гостей' : 'Number of Guests'}
          />

          {/* Special Options */}
          <div className="space-y-3">
            <Label className="font-semibold">
              {language === 'ru' ? 'Дополнительно' : 'Special Requests'}
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border/50">
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

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border/50">
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

          {/* Reservation Notice - Conditional based on deposit */}
          {depositRequired ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {language === 'ru' ? `Депозит: ${depositAmount}฿` : `Deposit: ${depositAmount}฿`}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                  {language === 'ru' 
                    ? 'Оплата депозита онлайн через Stripe. Будет зачтён в счёт заказа.'
                    : 'Pay deposit online via Stripe. Will be applied to your bill.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs flex-shrink-0">✓</div>
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  {language === 'ru' ? 'Бесплатное бронирование' : 'Free Reservation'}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
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
          currency="฿"
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
