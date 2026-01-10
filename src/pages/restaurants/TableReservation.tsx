import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, CalendarDays, Utensils, BabyIcon, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { 
  BookingSummary, 
  BookingDateTimeSelect, 
  BookingParticipants,
  BookingContactForm,
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation 
} from '@/components/booking';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getRestaurantById } from './restaurantsData';

export default function TableReservation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const restaurant = getRestaurantById(id || '');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [needHighChair, setNeedHighChair] = useState(false);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet' | 'online'>('card');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

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

  const depositAmount = restaurant.depositRequired ? restaurant.depositAmount : 0;
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

    const result = await createBooking({
      bookingType: 'table_reservation',
      providerId: restaurant.id,
      serviceId: 'table-reservation',
      scheduledAt: scheduledAt.toISOString(),
      totalAmount: depositAmount,
      currency: 'THB',
      notes,
      paymentMethod,
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        isPrimary: true,
      }],
      metadata: {
        restaurantName: restaurant.nameEn,
        restaurantNameRu: restaurant.nameRu,
        guests,
        time: selectedTime,
      },
    });

    if (result.success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <BookingConfirmation
        title={language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
        date={selectedDate}
        time={selectedTime}
        location={restaurant.address}
        totalAmount={depositAmount}
        currency="฿"
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
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </button>
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

          {/* Deposit Notice */}
          {restaurant.depositRequired && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {language === 'ru' ? 'Требуется депозит' : 'Deposit Required'}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                  {language === 'ru' 
                    ? `Депозит ฿${depositAmount} будет учтён в счёте`
                    : `฿${depositAmount} deposit will be applied to your bill`}
                </p>
              </div>
            </div>
          )}

          {/* Payment Method - only if deposit required */}
          {restaurant.depositRequired && (
            <BookingPaymentSelect
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              amount={depositAmount}
              currency="฿"
              showWallet
              showCash={false}
            />
          )}
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={depositAmount}
          currency="฿"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!isFormValid}
          submitLabel={depositAmount > 0 
            ? (language === 'ru' ? `Оплатить депозит ฿${depositAmount}` : `Pay Deposit ฿${depositAmount}`)
            : (language === 'ru' ? 'Забронировать' : 'Reserve Table')
          }
        />
      </div>
    </AppLayout>
  );
}
