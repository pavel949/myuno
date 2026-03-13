import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Calendar, Users, Clock, CreditCard, AlertTriangle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useExperience, formatDuration } from '@/hooks/useExperiences';
import { useOrders } from '@/hooks/useOrders';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { 
  BookingStepProgress, 
  BookingContactForm, 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  defaultBookingSteps,
  type ContactFormData,
  type PaymentMethod
} from '@/components/booking';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

export default function ExperienceBooking() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { experience, isLoading } = useExperience(id);
  const { createOrder, isCreating } = useOrders();
  const { checkTourAvailability, isChecking } = useAvailabilityCheck();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [isContactValid, setIsContactValid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    bookingId?: string;
  } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: `/experiences/${id}/book` } });
    }
  }, [authLoading, user, navigate, id]);

  if (isLoading || authLoading) {
    return (
      <MiniAppLayout title="" fallbackPath={`/experiences/${id}`} showHero={false} showFilter={false} showCategories={false}>
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </MiniAppLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (!experience) {
    return (
      <MiniAppLayout title="" fallbackPath="/experiences" showHero={false} showFilter={false} showCategories={false}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p>{isRu ? 'Не найдено' : 'Not Found'}</p>
        </div>
      </MiniAppLayout>
    );
  }

  const totalPrice = (experience.price || 0) * participants;
  const experienceTitle = isRu ? experience.title_ru : experience.title_en;

  // Show confirmation screen after successful booking
  if (bookingResult?.success && bookingResult.bookingId && selectedDate) {
    return (
      <MiniAppLayout
        title={isRu ? 'Подтверждение' : 'Confirmation'}
        fallbackPath="/experiences"
        showHero={false}
        showFilter={false}
        showCategories={false}
      >
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={experienceTitle}
          date={format(selectedDate, 'PPP', { locale: isRu ? ru : undefined })}
          time={selectedTime || undefined}
          location={experience.meeting_point}
          total={totalPrice}
          currency={experience.currency || 'THB'}
          continuePath="/experiences"
          continueLabel={isRu ? 'К активностям' : 'Browse Experiences'}
          paymentMethod={paymentMethod === 'online' ? 'card' : paymentMethod}
        />
      </MiniAppLayout>
    );
  }

  const availableTimes = experience.start_times.length > 0 
    ? experience.start_times 
    : ['09:00', '11:00', '14:00', '16:00'];

  const handleNext = () => {
    if (currentStep === 0 && (!selectedDate || !selectedTime)) {
      toast.error(isRu ? 'Выберите дату и время' : 'Please select date and time');
      return;
    }
    if (currentStep === 1 && !isContactValid) {
      toast.error(isRu ? 'Заполните контактные данные' : 'Please fill in contact details');
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(APP_ROUTES.EXPERIENCES);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !contactData.name || !contactData.phone) {
      return;
    }

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Check availability before booking
    const availability = await checkTourAvailability(
      experience.id,
      scheduledAt,
      participants,
    );

    if (!availability.available) {
      setAvailabilityError(
        isRu
          ? `Недостаточно мест на выбранную дату.${availability.spots_remaining !== undefined ? ` Доступно: ${availability.spots_remaining}` : ''}`
          : `Not enough spots for the selected date.${availability.spots_remaining !== undefined ? ` Available: ${availability.spots_remaining}` : ''}`
      );
      return;
    }

    setAvailabilityError(null);

    const expTitle = isRu ? experience.title_ru : experience.title_en;

    const endAt = new Date(scheduledAt);
    endAt.setMinutes(endAt.getMinutes() + (experience.duration_minutes || 60));

    const result = await createOrder({
      order_type: 'tour',
      start_at: scheduledAt.toISOString(),
      end_at: endAt.toISOString(),
      total_amount: totalPrice,
      currency: experience.currency || 'THB',
      notes: `Experience: ${expTitle}. Participants: ${participants}`,
      serviceName: expTitle,
      items: [{
        item_name: expTitle,
        item_type: 'experience',
        qty: participants,
        unit_price: experience.price || 0,
        amount: totalPrice,
        metadata: { source_id: experience.id },
      }],
      participants: [{
        role: 'primary' as const,
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
      }],
      payment: {
        amount: totalPrice,
        method: paymentMethod === 'online' ? 'stripe' : paymentMethod === 'wallet' ? 'wallet' : 'cash',
      },
      metadata: {
        experience_id: experience.id,
        experience_type: experience.experience_type,
        duration_minutes: experience.duration_minutes,
      },
    });

    if (result.success && result.order_id) {
      setBookingResult({
        success: true,
        bookingId: result.order_id,
      });
    }
  };

  return (
    <MiniAppLayout
      title={isRu ? 'Бронирование' : 'Booking'}
      fallbackPath={`/experiences/${id}`}
      showHero={false}
      showFilter={false}
      showCategories={false}
    >
      <div className="space-y-4 pb-40">
        {/* Experience Summary */}
        <Card>
          <CardContent className="p-4 flex gap-4">
            <img 
              src={experience.cover_image || PLACEHOLDER_IMAGES.experience} 
              alt=""
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2">
                {isRu ? experience.title_ru : experience.title_en}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(experience.duration_minutes, language)}</span>
              </div>
              <p className="text-primary font-bold mt-1">
                {formatPrice(experience.price || 0)} / {isRu ? 'чел' : 'person'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Availability Error */}
        {availabilityError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{availabilityError}</AlertDescription>
          </Alert>
        )}

        {/* Step Progress */}
        <BookingStepProgress steps={defaultBookingSteps} currentStep={currentStep} />

        {/* Step Content */}
        {currentStep === 0 && (
          <div className="space-y-4">
            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {isRu ? 'Выберите дату' : 'Select Date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={isRu ? ru : undefined}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Time Selection */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {isRu ? 'Выберите время' : 'Select Time'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-3 px-4 rounded-lg border text-center font-medium transition-all",
                          selectedTime === time
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {isRu ? 'Количество участников' : 'Participants'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {isRu ? 'Взрослые' : 'Adults'}
                  </span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setParticipants(Math.max(1, participants - 1))}
                      disabled={participants <= (experience.min_participants || 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold">{participants}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setParticipants(participants + 1)}
                      disabled={participants >= (experience.max_participants || 20)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isRu 
                    ? `Минимум ${experience.min_participants || 1}, максимум ${experience.max_participants || 20} чел.`
                    : `Min ${experience.min_participants || 1}, max ${experience.max_participants || 20} people`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isRu ? 'Контактные данные' : 'Contact Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingContactForm
                data={contactData}
                onChange={setContactData}
                onValidationChange={setIsContactValid}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRu ? 'Ваш заказ' : 'Your Order'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{isRu ? 'Дата' : 'Date'}</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, 'PPP', { locale: isRu ? ru : undefined })}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{isRu ? 'Время' : 'Time'}</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{isRu ? 'Участники' : 'Participants'}</span>
                  <span className="font-medium">{participants}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{isRu ? 'Контакт' : 'Contact'}</span>
                  <span className="font-medium">{contactData.name}</span>
                </div>
                <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3">
                  <span className="font-semibold">{isRu ? 'Итого' : 'Total'}</span>
                  <span className="font-bold text-xl text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {isRu ? 'Способ оплаты' : 'Payment Method'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingPaymentSelect
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  amount={totalPrice}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <BookingBottomBar
        total={totalPrice}
        onSubmit={currentStep === 2 ? handleSubmit : handleNext}
        isSubmitting={isCreating || isChecking}
        disabled={currentStep === 0 && (!selectedDate || !selectedTime)}
        step={currentStep}
        totalSteps={3}
        submitLabel={
          currentStep === 2 
            ? (isRu ? 'Подтвердить и оплатить' : 'Confirm & Pay')
            : (isRu ? 'Далее' : 'Next')
        }
      />
    </MiniAppLayout>
  );
}
