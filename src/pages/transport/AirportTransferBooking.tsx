import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { ChevronLeft, Loader2, Star, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useOrders, PaymentMethod } from '@/hooks/useOrders';
import { useVehicleTypes, useTransportDestinations } from '@/hooks/useTransportConfig';
import { useProfile } from '@/hooks/useProfile';
import { transliterate } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useGeolocation } from '@/hooks/useGeolocation';
import { AnimatePresence } from 'framer-motion';
import { BookingStepProgress, type BookingStep } from '@/components/booking/BookingStepProgress';
import { StepRoute } from '@/components/transport/booking-steps/StepRoute';
import { StepVehicle } from '@/components/transport/booking-steps/StepVehicle';
import { StepDetails } from '@/components/transport/booking-steps/StepDetails';
import { StepPayment } from '@/components/transport/booking-steps/StepPayment';
import { TransferSuccess } from '@/components/transport/booking-steps/TransferSuccess';
import type {
  TransferDirection,
  TransferFormData,
  TransferPaymentMethod,
} from '@/components/transport/booking-steps/types';

const transferSteps: BookingStep[] = [
  { id: 'route', labelEn: 'Route', labelRu: 'Маршрут' },
  { id: 'vehicle', labelEn: 'Vehicle', labelRu: 'Авто' },
  { id: 'details', labelEn: 'Details', labelRu: 'Детали' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
];

export default function AirportTransferBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();

  const { vehicleTypes, isLoading: isLoadingVehicles } = useVehicleTypes('airport_transfer');
  const { destinations } = useTransportDestinations('airport_transfer');
  const { createOrder, isCreating } = useOrders();
  const { profile } = useProfile();
  const { latitude, longitude, loading: geoLoading, getPosition, hasLocation, supported: geoSupported } = useGeolocation();

  const meetingSignManuallyEdited = useRef(false);

  const [step, setStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number; placeId?: string } | null>(null);
  const [nightSurchargeCfg, setNightSurchargeCfg] = useState<{ start: string; end: string; sedan: number; van: number } | null>(null);

  const [formData, setFormData] = useState<TransferFormData>({
    direction: (searchParams.get('direction') as TransferDirection) || 'from-airport',
    terminal: '',
    destinationAddress: '',
    selectedDestinationId: '',
    flightNumber: '',
    arrivalDate: '',
    arrivalTime: '',
    passengers: '1',
    luggage: '1',
    vehicleType: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
    meetingSignName: '',
    paymentMethod: 'stripe' as TransferPaymentMethod,
  });

  // Load night surcharge config once. If the fetch fails or there's no active
  // row the price falls back to the day rate — never silently overcharge.
  useEffect(() => {
    supabase
      .from('transfer_night_surcharge_config')
      .select('start_time, end_time, sedan_gross, sedan_net, van_gross, van_net')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          logger.warn('[Transfer] night surcharge config fetch failed; using day rate', error);
          return;
        }
        if (data) {
          setNightSurchargeCfg({
            start: data.start_time,
            end: data.end_time,
            sedan: Number(data.sedan_gross) - Number(data.sedan_net),
            van: Number(data.van_gross) - Number(data.van_net),
          });
        }
      });
  }, []);

  // Reverse geocode when location is obtained
  useEffect(() => {
    if (hasLocation && latitude && longitude && isReverseGeocoding) {
      setPickupCoords({ lat: latitude, lng: longitude });
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            const parts = data.display_name.split(',').slice(0, 4).join(',');
            setFormData(prev => ({ ...prev, destinationAddress: parts }));
          }
          setIsReverseGeocoding(false);
        })
        .catch(() => {
          setFormData(prev => ({ ...prev, destinationAddress: `${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}` }));
          setIsReverseGeocoding(false);
        });
    }
  }, [hasLocation, latitude, longitude, isReverseGeocoding]);

  const handleUseCurrentLocation = () => {
    setIsReverseGeocoding(true);
    getPosition();
  };

  useEffect(() => {
    if (vehicleTypes.length > 0 && !formData.vehicleType) {
      setFormData(prev => ({ ...prev, vehicleType: vehicleTypes[0].id }));
    }
  }, [vehicleTypes, formData.vehicleType]);

  useEffect(() => {
    if (profile && !formData.name && !formData.phone && !formData.email) {
      const fullName = profile.full_name || '';
      setFormData(prev => ({
        ...prev,
        name: fullName,
        phone: profile.phone || '',
        email: profile.email || '',
        meetingSignName: transliterate(fullName),
      }));
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedVehicle = useMemo(
    () => vehicleTypes.find(v => v.id === formData.vehicleType),
    [vehicleTypes, formData.vehicleType],
  );

  const selectedDestination = useMemo(
    () => destinations.find(d => d.id === formData.selectedDestinationId),
    [destinations, formData.selectedDestinationId],
  );

  useEffect(() => {
    if (!meetingSignManuallyEdited.current && formData.name) {
      setFormData(prev => ({ ...prev, meetingSignName: transliterate(formData.name) }));
    }
  }, [formData.name]);

  // Pricing
  const routeBasePrice = selectedDestination?.base_price || 0;
  const vehicleMultiplier = selectedVehicle?.price_multiplier || 1;
  const basePrice = routeBasePrice > 0
    ? Math.round(routeBasePrice * vehicleMultiplier)
    : (selectedVehicle?.base_price || 800);

  const isNightArrival = useMemo(() => {
    if (!formData.arrivalTime || !nightSurchargeCfg) return false;
    const t = formData.arrivalTime;
    const { start, end } = nightSurchargeCfg;
    if (start > end) return t >= start.slice(0, 5) || t < end.slice(0, 5);
    return t >= start.slice(0, 5) && t < end.slice(0, 5);
  }, [formData.arrivalTime, nightSurchargeCfg]);

  const isVan = (selectedVehicle?.max_passengers || 4) >= 6;
  const nightSurcharge = isNightArrival && nightSurchargeCfg
    ? (isVan ? nightSurchargeCfg.van : nightSurchargeCfg.sedan)
    : 0;
  const totalPrice = basePrice + nightSurcharge;
  const vendorPayout = Math.round(totalPrice / 1.35);
  const platformFee = totalPrice - vendorPayout;

  // ── Validation (single source of truth, evaluated per step) ─────────────
  const canProceedStep0 = !!(formData.direction && formData.terminal && formData.destinationAddress);
  const canProceedStep1 = !!formData.vehicleType;
  const canProceedStep2 = !!(
    formData.flightNumber &&
    formData.arrivalDate &&
    formData.arrivalTime &&
    formData.name &&
    formData.phone
  );
  const canProceed = step === 0 ? canProceedStep0
    : step === 1 ? canProceedStep1
    : step === 2 ? canProceedStep2
    : true;
  const canSubmit = canProceedStep0 && canProceedStep1 && canProceedStep2;

  const handleNext = () => { if (step < transferSteps.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = async () => {
    if (!user) {
      toast.error(language === 'ru' ? 'Требуется авторизация' : 'Login Required');
      navigate(APP_ROUTES.AUTH);
      return;
    }

    // Contact validation (E.164-ish phone + RFC-lite email)
    const phoneDigits = (formData.phone || '').replace(/[^\d]/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      toast.error(language === 'ru'
        ? 'Введите корректный номер телефона (8–15 цифр, с кодом страны)'
        : 'Enter a valid phone number (8–15 digits incl. country code)');
      return;
    }
    if (formData.email) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim());
      if (!emailOk) {
        toast.error(language === 'ru' ? 'Введите корректный email' : 'Enter a valid email');
        return;
      }
    }

    const scheduledAt = `${formData.arrivalDate}T${formData.arrivalTime}:00+07:00`;
    const vehicleName = language === 'ru' ? selectedVehicle?.name_ru : selectedVehicle?.name_en;
    const terminalLabel = formData.terminal === 'domestic'
      ? (language === 'ru' ? 'Внутренний терминал' : 'Domestic Terminal')
      : (language === 'ru' ? 'Международный терминал' : 'International Terminal');
    const airportLabel = language === 'ru' ? 'Аэропорт Пхукета' : 'Phuket Airport';

    const result = await createOrder({
      order_type: 'vehicle',
      start_at: scheduledAt,
      total_amount: totalPrice,
      currency: 'THB',
      notes: formData.notes || undefined,
      metadata: {
        transfer_type: 'airport',
        direction: formData.direction,
        terminal: formData.terminal,
        flight_number: formData.flightNumber,
        vehicle_type: formData.vehicleType,
        vehicle_name: vehicleName,
        vehicle_class: isVan ? 'van' : 'sedan',
        passengers: parseInt(formData.passengers),
        luggage: parseInt(formData.luggage),
        meeting_sign_name: formData.meetingSignName,
        language,
        base_price: basePrice,
        night_surcharge_applied: nightSurcharge > 0,
        night_surcharge_amount: nightSurcharge,
        vendor_payout_amount: vendorPayout,
        platform_fee_amount: platformFee,
        pickup_lat: formData.direction === 'to-airport' ? pickupCoords?.lat ?? null : null,
        pickup_lng: formData.direction === 'to-airport' ? pickupCoords?.lng ?? null : null,
      },
      items: [{
        item_name: `Airport Transfer - ${vehicleName}`,
        item_type: 'transport',
        unit_price: totalPrice,
        amount: totalPrice,
        qty: 1,
        metadata: { vehicle_type: formData.vehicleType, direction: formData.direction },
      }],
      participants: [{
        role: 'primary',
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      }],
      addresses: [
        {
          address_type: formData.direction === 'from-airport' ? 'pickup' : 'dropoff',
          address_text: `${airportLabel} — ${terminalLabel}`,
          lat: 8.1132,
          lng: 98.3169,
        },
        {
          address_type: formData.direction === 'from-airport' ? 'dropoff' : 'pickup',
          address_text: formData.destinationAddress,
          ...(destinationCoords?.lat != null && destinationCoords?.lng != null
            ? { lat: destinationCoords.lat, lng: destinationCoords.lng }
            : {}),
        },
      ],
      payment: { method: formData.paymentMethod as PaymentMethod, amount: totalPrice },
      serviceName: `Airport Transfer - ${vehicleName}`,
      openWhatsAppOnCash: false,
    });

    if (result.success && result.order_id) {
      setCreatedOrderNumber(result.order_number || null);

      const airportFull = `${airportLabel} — ${terminalLabel}`;
      const pickupAddr = formData.direction === 'from-airport'
        ? airportFull
        : formData.destinationAddress;
      const dropoffAddr = formData.direction === 'from-airport'
        ? formData.destinationAddress
        : airportFull;

      const notifyPayload = {
        order_id: result.order_id,
        order_number: result.order_number || '',
        direction: formData.direction,
        terminal: formData.terminal,
        flight_number: formData.flightNumber,
        vehicle_name: vehicleName,
        meeting_sign_name: formData.meetingSignName || formData.name,
        passengers: parseInt(formData.passengers),
        luggage: parseInt(formData.luggage),
        pickup_address: pickupAddr,
        dropoff_address: dropoffAddr,
        scheduled_at: scheduledAt,
        total_amount: totalPrice,
        currency: 'THB',
        payment_method: formData.paymentMethod,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email,
        customer_language: language,
        notes: formData.notes || undefined,
      };
      const sendNotify = async (attempt = 0): Promise<void> => {
        const { error } = await supabase.functions.invoke('notify-transfer-booking', { body: notifyPayload });
        if (error && attempt < 1) {
          logger.warn('[Notify] retry transfer notification', error);
          await new Promise(r => setTimeout(r, 1200));
          return sendNotify(attempt + 1);
        }
        if (error) logger.error('[Notify] Transfer notification failed (giving up):', error);
      };
      if (formData.paymentMethod === 'stripe') {
        sendNotify().catch(() => {});
      } else {
        await sendNotify();
      }

      if (formData.paymentMethod === 'stripe') {
        setIsProcessingPayment(true);
        try {
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
              order_id: result.order_id,
              order_type: 'transport',
              amount: totalPrice,
              currency: 'THB',
              description: `Airport Transfer - ${vehicleName}`,
              success_url: `${window.location.origin}/transport/transfer-success?order_id=${result.order_id}`,
              cancel_url: `${window.location.origin}/transport/airport-transfer`,
            },
          });
          if (error) throw error;
          if (data?.url) {
            window.location.href = data.url;
            return;
          }
        } catch (err) {
          logger.error('Stripe checkout error:', err);
          toast.error(language === 'ru' ? 'Ошибка оплаты' : 'Payment Error', {
            description: language === 'ru' ? 'Попробуйте другой способ оплаты' : 'Please try another payment method',
          });
          setIsProcessingPayment(false);
          return;
        }
      } else {
        setIsSuccess(true);
      }
    }
  };

  if (isSuccess) {
    return <TransferSuccess language={language} formData={formData} createdOrderNumber={createdOrderNumber} />;
  }

  if (isLoadingVehicles) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isLastStep = step === transferSteps.length - 1;
  const selectedVehicleLabel = selectedVehicle
    ? (language === 'ru' ? selectedVehicle.name_ru : selectedVehicle.name_en)
    : undefined;

  return (
    <AppLayout showBottomNav={false}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-background border-b border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => step > 0 ? handleBack() : navigate(APP_ROUTES.TRANSPORT)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold">
              {language === 'ru' ? 'Трансфер' : 'Airport Transfer'}
            </h1>
            <p className="text-xs text-muted-foreground">Phuket (HKT)</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-full">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-xs font-semibold text-primary">4.9</span>
          </div>
        </div>

        <BookingStepProgress steps={transferSteps} currentStep={step} className="py-2" />
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-44">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepRoute
              key="step-0"
              formData={formData}
              setFormData={setFormData}
              language={language}
              destinations={destinations}
              geoSupported={geoSupported}
              geoLoading={geoLoading}
              isReverseGeocoding={isReverseGeocoding}
              onUseCurrentLocation={handleUseCurrentLocation}
              onDestinationCoords={setDestinationCoords}
              onPickupCoords={setPickupCoords}
            />
          )}
          {step === 1 && (
            <StepVehicle
              key="step-1"
              formData={formData}
              setFormData={setFormData}
              language={language}
              vehicleTypes={vehicleTypes}
              routeBasePrice={routeBasePrice}
            />
          )}
          {step === 2 && (
            <StepDetails
              key="step-2"
              formData={formData}
              setFormData={setFormData}
              language={language}
              meetingSignManuallyEditedRef={meetingSignManuallyEdited}
            />
          )}
          {step === 3 && (
            <StepPayment
              key="step-3"
              formData={formData}
              setFormData={setFormData}
              language={language}
              basePrice={basePrice}
              nightSurcharge={nightSurcharge}
              totalPrice={totalPrice}
              selectedVehicleLabel={selectedVehicleLabel}
              selectedDestinationDuration={selectedDestination?.duration_minutes}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky CTA */}
      <div
        className="sticky bottom-0 left-0 right-0 bg-background/95 border-t border-border/50 z-50"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              {formData.destinationAddress ? (
                <p className="text-xs text-muted-foreground truncate">
                  {formData.destinationAddress}
                  {selectedDestination?.duration_minutes && ` · ~${selectedDestination.duration_minutes} ${language === 'ru' ? 'мин' : 'min'}`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Выберите маршрут' : 'Select route'}
                </p>
              )}
              <p className="text-lg font-bold">฿{totalPrice.toLocaleString()}</p>
            </div>
            {selectedVehicleLabel && (
              <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                {selectedVehicleLabel}
              </Badge>
            )}
          </div>

          {!isLastStep ? (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold"
              disabled={!canProceed}
              onClick={handleNext}
            >
              {language === 'ru' ? 'Далее' : 'Continue'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold"
              disabled={isCreating || isProcessingPayment || !canSubmit}
              onClick={handleSubmit}
            >
              {isCreating || isProcessingPayment
                ? (language === 'ru' ? 'Обработка...' : 'Processing...')
                : formData.paymentMethod === 'stripe'
                  ? (language === 'ru' ? `Оплатить ฿${totalPrice.toLocaleString()}` : `Pay ฿${totalPrice.toLocaleString()}`)
                  : formData.paymentMethod === 'cash'
                    ? (language === 'ru' ? `Забронировать • наличные ฿${totalPrice.toLocaleString()}` : `Book • Cash ฿${totalPrice.toLocaleString()}`)
                    : (language === 'ru' ? `Забронировать • ฿${totalPrice.toLocaleString()}` : `Book • ฿${totalPrice.toLocaleString()}`)}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
