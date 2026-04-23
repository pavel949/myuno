import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { useRestaurant } from '@/hooks/useRestaurants';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookingSummary,
  BookingDateTimeSelect, 
  BookingParticipants,
  BookingContactForm,
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type PaymentMethod 
} from '@/components/booking';
import { type ContactFormData } from '@/components/booking/BookingContactForm';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/uno/BackButton';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';

// Set menu data structure (will come from DB in future)
interface SetMenu {
  id: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  price: number;
  originalPrice?: number;
  image: string;
  includes: string[];
  includesRu: string[];
  duration: string;
  availableTimes: string[];
  maxGuests: number;
}

export default function SetMenuBooking() {
  const { id, setId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();

  const { restaurant, isLoading: restaurantLoading } = useRestaurant(id);

  // Extract set menus from restaurant working_hours metadata (temporary until DB table exists)
  const workingHours = restaurant?.working_hours as Record<string, any> | null;
  const setMenus: SetMenu[] = (workingHours as any)?.set_menus || [];
  const setMenu = setMenus.find(s => s.id === setId);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/restaurants/${id}/experience/${setId}`);
    }
  }, [user, authLoading, navigate, id, setId]);

  if (restaurantLoading || authLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <DetailPageSkeleton />
      </AppLayout>
    );
  }

  if (!restaurant || !setMenu) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Сет-меню не найдено' : 'Set menu not found'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const totalPrice = setMenu.price * guests;
  const isFormValid = selectedDate && selectedTime && contactData.name && contactData.phone && guests <= setMenu.maxGuests;

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime) return;

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    if (paymentMethod === 'online') {
      const response = await supabase.functions.invoke('create-restaurant-checkout', {
        body: {
          booking_type: 'set_menu',
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name_en,
          amount: totalPrice,
          currency: 'thb',
          items: [{
            name: language === 'ru' ? setMenu.nameRu : setMenu.nameEn,
            quantity: guests,
            price: setMenu.price,
          }],
          metadata: {
            set_menu_id: setMenu.id,
            scheduled_at: scheduledAt.toISOString(),
            guests: guests.toString(),
            contact_name: contactData.name,
            contact_phone: contactData.phone,
          },
        },
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
    }

    const result = await createBooking({
      booking_type: 'food',
      provider_id: restaurant.id,
      service_id: setMenu.id,
      scheduled_at: scheduledAt.toISOString(),
      total_amount: totalPrice,
      currency: 'THB',
      notes: specialRequests,
      payment: { amount: totalPrice, payment_method: paymentMethod },
      items: [{
        item_type: 'set_menu',
        item_id: setMenu.id,
        item_name: language === 'ru' ? setMenu.nameRu : setMenu.nameEn,
        quantity: guests,
        unit_price: setMenu.price,
        subtotal: totalPrice,
      }],
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
      }],
      metadata: {
        restaurantName: restaurant.name_en,
        restaurantNameRu: restaurant.name_ru,
        setMenuName: setMenu.nameEn,
        setMenuNameRu: setMenu.nameRu,
        duration: setMenu.duration,
        guests,
        bookingType: 'restaurant_experience',
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
        title={language === 'ru' ? setMenu.nameRu : setMenu.nameEn}
        date={format(selectedDate, 'dd.MM.yyyy')}
        time={selectedTime}
        location={restaurant.address}
        total={totalPrice}
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
        <div className="sticky top-0 z-10 bg-background/95 border-b border-border/50">
          <div className="flex items-center gap-4 px-4 py-3">
            <BackButton fallbackPath="/restaurants" variant="ghost" />
            <div>
              <h1 className="font-semibold">
                {language === 'ru' ? 'Бронирование сета' : 'Book Set Menu'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? restaurant.name_ru : restaurant.name_en}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Set Menu Summary */}
          <BookingSummary
            image={setMenu.image}
            title={language === 'ru' ? setMenu.nameRu : setMenu.nameEn}
            subtitle={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
            price={setMenu.price}
            originalPrice={setMenu.originalPrice}
            sourceCurrency="THB"
            duration={setMenu.duration}
            maxParticipants={setMenu.maxGuests}
            location={restaurant.address}
          />

          {/* What's Included */}
          <div className="p-4 rounded-none bg-card border border-border/50">
            <h3 className="font-semibold mb-3">
              {language === 'ru' ? 'Что включено' : "What's Included"}
            </h3>
            <div className="space-y-2">
              {(language === 'ru' ? setMenu.includesRu : setMenu.includes).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time Selection */}
          <BookingDateTimeSelect
            date={selectedDate}
            onDateChange={setSelectedDate}
            time={selectedTime}
            onTimeChange={setSelectedTime}
            availableTimes={setMenu.availableTimes}
            minDate={new Date()}
            showQuickDates
          />

          {/* Number of Guests */}
          <BookingParticipants
            count={guests}
            onChange={setGuests}
            min={1}
            max={setMenu.maxGuests}
            pricePerPerson={setMenu.price}
            label={language === 'ru' ? 'Количество гостей' : 'Number of Guests'}
          />

          {/* Special Requests */}
          <div className="space-y-3">
            <Label className="font-semibold">
              {language === 'ru' ? 'Особые пожелания' : 'Special Requests'}
            </Label>
            <Textarea
              placeholder={language === 'ru' 
                ? 'Аллергии, диетические ограничения...' 
                : 'Allergies, dietary restrictions...'}
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

          {/* Payment Method */}
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={totalPrice}
            currency="฿"
            showWallet
            showOnline
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={totalPrice}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!isFormValid}
          submitLabel={language === 'ru' ? `Забронировать за ฿${totalPrice}` : `Book for ฿${totalPrice}`}
          showBreakdown={[
            { label: `${language === 'ru' ? setMenu.nameRu : setMenu.nameEn} × ${guests}`, amount: totalPrice },
          ]}
        />
      </div>
    </AppLayout>
  );
}
