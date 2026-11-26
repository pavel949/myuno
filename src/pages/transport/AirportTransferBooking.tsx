import { configuredTransferBasePrice, configuredTransferTotal, transferFareLabel } from '@/lib/transport/transferFare';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import { ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
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
import { pickClosest } from '@/lib/geo';
import { useGeolocation } from '@/hooks/useGeolocation';
import { AnimatePresence } from 'framer-motion';
import { BookingStepProgress, type BookingStep } from '@/components/booking/BookingStepProgress';
import { AirportBookingLayout } from '@/components/booking/AirportBookingLayout';
import { StepRoute } from '@/components/transport/booking-steps/StepRoute';
import { StepVehicle } from '@/components/transport/booking-steps/StepVehicle';
import { StepDetails } from '@/components/transport/booking-steps/StepDetails';
import { StepPayment } from '@/components/transport/booking-steps/StepPayment';
import { TransferSuccess } from '@/components/transport/booking-steps/TransferSuccess';
import { InlineAuthGate } from '@/components/auth/InlineAuthGate';
import { getTransferDetailIssues, getTransferRouteIssues, parseTransferDirection } from '@/lib/services/airportRequestValidation';
import { useBookingDraft } from '@/hooks/useBookingDraft';
import type {
  TransferFormData,
  TransferPaymentMethod,
} from '@/components/transport/booking-steps/types';

const transferSteps: BookingStep[] = [
  { id: 'route', labelEn: 'Route', labelRu: 'Маршрут', labelTh: 'เส้นทาง' },
  { id: 'vehicle', labelEn: 'Vehicle', labelRu: 'Авто', labelTh: 'รถ' },
  { id: 'details', labelEn: 'Details', labelRu: 'Детали', labelTh: 'รายละเอียด' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата', labelTh: 'ชำระเงิน' },
];

export default function AirportTransferBooking() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const linkedBooking = searchParams.get('booking_id');
  const tripBookingId = linkedBooking && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(linkedBooking)
    ? linkedBooking
    : undefined;
  const tripDraft = tripBookingId ? `${user?.id ?? 'guest'}:${tripBookingId}` : undefined;
  return <AirportTransferForm key={tripDraft ?? 'transfer'} tripBookingId={tripBookingId} tripDraft={tripDraft} />;
}

function AirportTransferForm({ tripBookingId, tripDraft }: { tripBookingId?: string; tripDraft?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const tr = (en: string, ru: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;
  const stepRef = useRef<HTMLDivElement>(null);
  const submitLock = useRef(false);
  const mergeTripLock = useRef(false);
  const { user } = useAuth();

  const { vehicleTypes, isLoading: isLoadingVehicles, error: vehicleError, refetch: refetchVehicles } = useVehicleTypes('airport_transfer');
  const { destinations, isLoading: destinationsLoading, error: destinationsError, refetch: refetchDestinations } = useTransportDestinations('airport_transfer');
  const { createOrder, isCreating } = useOrders();
  const { profile } = useProfile();
  const { latitude, longitude, loading: geoLoading, getPosition, hasLocation, supported: geoSupported } = useGeolocation();

  const meetingSignManuallyEdited = useRef(false);

  const [step, setStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderUnverified, setOrderUnverified] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ actor: string; orderId: string; amount: number; vehicleName: string } | null>(null);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [nightRateStatus, setNightRateStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [nightRateRetry, setNightRateRetry] = useState(0);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number; placeId?: string } | null>(null);
  const [nightSurchargeCfg, setNightSurchargeCfg] = useState<{ start: string; end: string; sedan: number; van: number } | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [tripPrefillState, setTripPrefillState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const pendingSubmitRef = useRef(false);

  const [formData, setFormData] = useState<TransferFormData>({
    direction: parseTransferDirection(searchParams.get('direction')) || 'from-airport',
    terminal: '',
    destinationAddress: '',
    selectedDestinationId: '',
    flightNumber: '',
    // Prefill flight date/time when arriving from the Fast Track upsell
    // (/transport/airport-transfer?from=fast-track&date=…&time=…) so the user
    // doesn't re-enter what they already gave on the Fast Track form.
    arrivalDate: searchParams.get('date') || '',
    arrivalTime: searchParams.get('time') || '',
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

  const invalidLinkedDirection = searchParams.has('direction') && !parseTransferDirection(searchParams.get('direction'));
  const source = searchParams.get('from') === 'fast-track' ? searchParams.toString() : undefined;

  // Persist the draft so a refresh, OAuth callback, or accidental nav doesn't wipe what the user typed.
  const { clear: clearDraft } = useBookingDraft(
    tripDraft ? `transfer_airport:${tripDraft}` : 'transfer_airport',
    { formData, step, source },
    (draft) => {
      if (draft.formData && typeof draft.formData === 'object') {
        const saved = draft.formData as TransferFormData;
        const linkedDirection = parseTransferDirection(searchParams.get('direction'));
        if (linkedDirection && linkedDirection !== saved.direction) return;
        if (source && draft.source !== source) return;
        setFormData(prev => ({ ...prev, ...saved, direction: parseTransferDirection(saved.direction) ?? prev.direction }));
      }
      if (typeof draft.step === 'number') {
        setStep(Math.min(Math.max(draft.step, 0), transferSteps.length - 1));
      }
    },
  );

  const applyStayDetails = async () => {
    if (!tripBookingId || !user?.id || mergeTripLock.current) return;
    mergeTripLock.current = true;
    setTripPrefillState('loading');
    try {
      const { data: stay, error } = await supabase
        .from('property_bookings')
        .select('property_id, guests_count')
        .eq('id', tripBookingId)
        .eq('guest_id', user.id)
        .in('status', ['confirmed', 'pending', 'pending_deposit', 'deposit_paid'])
        .maybeSingle();
      if (error || !stay) {
        setTripPrefillState('unavailable');
        return;
      }

      const { data: publicProperty } = await supabase
        .from('public_property_catalog')
        .select('address')
        .eq('id', stay.property_id)
        .maybeSingle();
      const address = publicProperty?.address?.trim();
      const guests = stay.guests_count;
      const passengers = guests && Number.isSafeInteger(guests) && guests > 0 ? String(guests) : undefined;
      if (!address && !passengers) {
        setTripPrefillState('unavailable');
        return;
      }
      if (address) {
        setDestinationCoords(null);
        setPickupCoords(null);
      }
      setFormData(current => ({
        ...current,
        ...(address ? { destinationAddress: address, selectedDestinationId: '' } : {}),
        ...(passengers ? { passengers } : {}),
      }));
      setTripPrefillState('ready');
    } catch {
      setTripPrefillState('unavailable');
    } finally {
      mergeTripLock.current = false;
    }
  };


  // A missing active rule means the day rate applies. A failed read leaves the price unresolved.
  useEffect(() => {
    let active = true;
    setNightRateStatus('loading');
    supabase
      .from('transfer_night_surcharge_config')
      .select('start_time, end_time, sedan_gross, sedan_net, van_gross, van_net')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          logger.warn('[Transfer] night surcharge config fetch failed', error);
          setNightRateStatus('error');
          return;
        }
        if (data) {
          setNightSurchargeCfg({
            start: data.start_time,
            end: data.end_time,
            sedan: Number(data.sedan_gross) - Number(data.sedan_net),
            van: Number(data.van_gross) - Number(data.van_net),
          });
        } else {
          setNightSurchargeCfg(null);
        }
        setNightRateStatus('ready');
      });
    return () => { active = false; };
  }, [nightRateRetry]);

  // Reverse geocode when location is obtained
  useEffect(() => {
    if (hasLocation && latitude && longitude && isReverseGeocoding) {
      setPickupCoords({ lat: latitude, lng: longitude });
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            const parts = data.display_name.split(',').slice(0, 4).join(',');
            setDestinationCoords({ lat: latitude, lng: longitude });
          setFormData(prev => ({ ...prev, destinationAddress: parts, selectedDestinationId: '' }));
          }
          setIsReverseGeocoding(false);
        })
        .catch(() => {
          setDestinationCoords({ lat: latitude, lng: longitude });
          setFormData(prev => ({ ...prev, destinationAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, selectedDestinationId: '' }));
          setIsReverseGeocoding(false);
        });
    }
  }, [hasLocation, latitude, longitude, isReverseGeocoding]);

  const handleUseCurrentLocation = () => {
    setIsReverseGeocoding(true);
    getPosition();
  };

  // Honor the `vehicle` hint from the Fast Track upsell (sedan|van|suv) by
  // matching it the same way TransferUpsellScreen does (name_en contains the
  // type). Falls back to the first vehicle when there's no hint or no match.
  const vehicleParam = searchParams.get('vehicle');
  useEffect(() => {
    if (vehicleTypes.length > 0 && !formData.vehicleType) {
      const matched = vehicleParam
        ? vehicleTypes.find(v => v.name_en.toLowerCase().includes(vehicleParam.toLowerCase()))
        : undefined;
      setFormData(prev => prev.vehicleType ? prev : ({ ...prev, vehicleType: (matched || vehicleTypes[0]).id }));
    }
  }, [vehicleTypes, formData.vehicleType, vehicleParam]);

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

  // Zone-aware pricing for hotel picks via AddressAutocomplete.
  // When the user types a hotel name and selects a Google Places suggestion,
  // StepRoute clears `selectedDestinationId` (so the manual-address text wins)
  // and forwards `destinationCoords`. Without this effect the price falls back
  // to the vehicle's default base_price (800 ฿). Here we find the nearest
  // pricing zone within 12 km and pre-select it so the configured route rate
  // applies — toast notifies the customer so the change is not silent.
  const lastAutoMatchedCoordsRef = useRef<string | null>(null);
  useEffect(() => {
    if (!destinationCoords) {
      lastAutoMatchedCoordsRef.current = null;
      return;
    }
    if (formData.selectedDestinationId) return;
    const coordsKey = `${destinationCoords.lat.toFixed(5)},${destinationCoords.lng.toFixed(5)}`;
    if (coordsKey === lastAutoMatchedCoordsRef.current) return;
    const match = pickClosest(destinationCoords, destinations, 12);
    if (!match) return;
    lastAutoMatchedCoordsRef.current = coordsKey;
    setFormData(prev => ({ ...prev, selectedDestinationId: match.item.id }));
    const zoneLabel = language === 'ru' ? match.item.name_ru : match.item.name_en;
    const priceLabel = `฿${match.item.base_price.toLocaleString()}`;
    toast.info(
      language === 'ru' ? `Зона: ${zoneLabel}` : `Zone: ${zoneLabel}`,
      {
        description: language === 'ru'
          ? `Стоимость рассчитана по тарифу зоны (${priceLabel}).`
          : `Price computed from the zone rate (${priceLabel}).`,
      },
    );
  }, [destinationCoords, destinations, formData.selectedDestinationId, language]);

  // Pricing
  const routeBasePrice = selectedDestination?.base_price || 0;
  const configuredBasePrice = configuredTransferBasePrice(routeBasePrice, selectedVehicle);
  const basePrice = configuredBasePrice ?? NaN;

  const isNightArrival = useMemo(() => {
    if (!formData.arrivalTime || !nightSurchargeCfg) return false;
    const t = formData.arrivalTime;
    const start = nightSurchargeCfg.start.slice(0, 5);
    const end = nightSurchargeCfg.end.slice(0, 5);
    return start > end ? t >= start || t < end : t >= start && t < end;
  }, [formData.arrivalTime, nightSurchargeCfg]);

  const isVan = (selectedVehicle?.max_passengers || 4) >= 6;
  const nightSurcharge = isNightArrival && nightSurchargeCfg
    ? (isVan ? nightSurchargeCfg.van : nightSurchargeCfg.sedan)
    : 0;
  const totalPrice = configuredTransferTotal(configuredBasePrice, nightSurcharge) ?? NaN;
  const vendorPayout = Math.round(totalPrice / 1.35);
  const platformFee = totalPrice - vendorPayout;

  const maxPassengers = selectedVehicle?.max_passengers ?? 0;
  const detailIssues = getTransferDetailIssues(formData, maxPassengers, Date.now());
  const fieldMessages: Partial<Record<keyof TransferFormData, string>> = {
    flightNumber: tr('Enter a flight number such as TG925.', 'Укажите номер рейса, например TG925.', 'กรอกหมายเลขเที่ยวบิน เช่น TG925'),
    arrivalDate: tr('Enter a future date and time.', 'Укажите будущие дату и время.', 'กรอกวันที่และเวลาในอนาคต'),
    arrivalTime: tr('Enter a valid time.', 'Укажите время.', 'กรอกเวลาที่ถูกต้อง'),
    passengers: tr(`Enter 1–${maxPassengers} passengers for this vehicle.`, `В этой машине может быть от 1 до ${maxPassengers} пассажиров.`, `รถนี้รองรับผู้โดยสาร 1–${maxPassengers} คน`),
    luggage: tr('Enter a whole number between 0 and 10.', 'Укажите целое число от 0 до 10.', 'กรอกจำนวนเต็มตั้งแต่ 0 ถึง 10'),
    name: tr('Enter your name.', 'Укажите имя.', 'กรอกชื่อ'),
    phone: tr('Enter 8–15 digits including your country code.', 'Укажите 8–15 цифр с кодом страны.', 'กรอก 8–15 หลักรวมรหัสประเทศ'),
    email: tr('Enter a valid email.', 'Укажите корректный email.', 'กรอกอีเมลที่ถูกต้อง'),
  };
  const quoteReady = nightRateStatus === 'ready' && !vehicleError && !isLoadingVehicles &&
    !destinationsError && !destinationsLoading && !!selectedVehicle &&
    (!formData.selectedDestinationId || !!selectedDestination) && Number.isFinite(totalPrice) && totalPrice > 0;

  const moveToStep = (next: number) => {
    setAttemptedStep(null);
    setStep(next);
    stepRef.current?.focus();
  };

  const handleNext = () => {
    const issues = step === 0 ? getTransferRouteIssues(formData)
      : step === 1 ? (quoteReady ? [] : ['vehicleType']) : detailIssues;
    if (issues.length) {
      setAttemptedStep(step);
      requestAnimationFrame(() => (document.getElementById(`transfer-${issues[0]}`) || stepRef.current)?.focus());
      return;
    }
    moveToStep(step + 1);
  };

  const openCheckout = async (checkout: NonNullable<typeof pendingCheckout>) => {
    setCheckoutError(false);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          order_id: checkout.orderId,
          order_type: 'transport',
          amount: checkout.amount,
          currency: 'THB',
          description: `Airport Transfer - ${checkout.vehicleName}`,
          success_url: `${window.location.origin}/transport/transfer-success?order_id=${checkout.orderId}`,
          cancel_url: `${window.location.origin}/transport/airport-transfer`,
        },
      });
      if (error || !data?.url) throw error || new Error('Missing checkout URL');
      window.location.href = data.url;
    } catch (err) {
      logger.error('Stripe checkout error:', err);
      setCheckoutError(true);
    }
  };

  const handleSubmit = async () => {
    if (submitLock.current || orderUnverified) return;
    if (!pendingCheckout) {
      const invalidStep = getTransferRouteIssues(formData).length ? 0
        : !selectedVehicle ? 1 : getTransferDetailIssues(formData, maxPassengers, Date.now()).length ? 2 : null;
      if (invalidStep !== null) {
        moveToStep(invalidStep);
        setAttemptedStep(invalidStep);
        return;
      }
      if (!quoteReady) { toast.error(transferFareLabel(null, language)); return; }
    }
    if (!user) {
      setAuthGateOpen(true);
      return;
    }
    if (pendingCheckout && pendingCheckout.actor !== user.id) return;

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      if (pendingCheckout) {
        await openCheckout(pendingCheckout);
      } else {
        await createTransfer(user.id);
      }
    } catch (error) {
      logger.warn('[Transfer] Order creation could not be confirmed', error);
      setOrderUnverified(true);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const createTransfer = async (actor: string) => {
    const scheduledAt = `${formData.arrivalDate}T${formData.arrivalTime}:00+07:00`;
    const vehicleName = (language === 'ru' ? selectedVehicle?.name_ru : selectedVehicle?.name_en) || '';
    const terminalLabel = formData.terminal === 'domestic'
      ? (language === 'ru' ? 'Внутренний терминал' : 'Domestic Terminal')
      : (language === 'ru' ? 'Международный терминал' : 'International Terminal');
    const airportLabel = language === 'ru' ? 'Аэропорт Пхукета' : 'Phuket Airport';
    // International-terminal meeting point — Tourist Police desk at HKT arrivals.
    // For domestic terminal we don't pin a specific spot (curbside pickup).
    const meetingPoint = formData.terminal === 'international' && formData.direction === 'from-airport'
      ? (language === 'ru'
          ? 'Стойка туристической полиции (Tourist Police 1155) в зоне прилёта'
          : 'Tourist Police desk (1155) in the arrivals hall')
      : null;

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
        // Persist the free-text destination so the stripe-webhook can rebuild the
        // operator notification (it reads metadata.destination_address) when it
        // re-fires notify-transfer-booking on payment confirmation.
        destination_address: formData.destinationAddress,
        flight_number: formData.flightNumber.trim(),
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
        meeting_point: meetingPoint,
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
        flight_number: formData.flightNumber.trim(),
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
      // For Stripe we deliberately do NOT notify the operator/customer here:
      // dispatching the operator before the customer has paid produces phantom
      // bookings when checkout is abandoned. The stripe-webhook re-fires
      // notify-transfer-booking (idempotently, guarded by booking_notifications_log)
      // on checkout.session.completed. Cash / concierge advance settle offline,
      // so we notify immediately.
      if (formData.paymentMethod !== 'stripe') {
        await sendNotify();
      }

      if (formData.paymentMethod === 'stripe') {
        const checkout = { actor, orderId: result.order_id, amount: totalPrice, vehicleName };
        setPendingCheckout(checkout);
        await openCheckout(checkout);
      } else {
        // myUNO advance ("concierge_advance") / cash:
        // notification email + WhatsApp to admin/operator already fired via
        // notify-transfer-booking above. Now also open the customer's own
        // WhatsApp so they can confirm the trip and arrange settlement —
        // matches the «выход на WhatsApp с просьбой оплатить» flow.
        if (formData.paymentMethod === 'concierge_advance') {
          const adminWa = COMPANY_CONTACTS.whatsapp.number;
          const orderRef = result.order_number || result.order_id;
          const summaryLines = [
            language === 'ru'
              ? `Здравствуйте! Бронирую трансфер через myUNO. Заказ #${orderRef}.`
              : `Hello! I'm booking an airport transfer via myUNO. Order #${orderRef}.`,
            '',
            `${vehicleName} · ${formData.passengers} pax${formData.luggage ? ` · ${formData.luggage} bags` : ''}`,
            `${airportLabel} — ${terminalLabel}  ${formData.direction === 'from-airport' ? '→' : '←'}  ${formData.destinationAddress}`,
            `${formData.arrivalDate} ${formData.arrivalTime}` + (formData.flightNumber ? ` · ${formData.flightNumber}` : ''),
            `฿${totalPrice.toLocaleString()}`,
            '',
            language === 'ru'
              ? 'Прошу подтвердить и выставить счёт через myUNO. Спасибо!'
              : 'Please confirm and issue the invoice via myUNO. Thanks!',
          ];
          const waUrl = `https://wa.me/${adminWa}?text=${encodeURIComponent(summaryLines.join('\n'))}`;
          // Open in new tab — user keeps the booking-success page in this tab.
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
        clearDraft();
        setIsSuccess(true);
      }
    } else {
      setOrderUnverified(true);
    }
  };

  const latestSubmit = useRef(handleSubmit);
  useEffect(() => { latestSubmit.current = handleSubmit; });

  // Only the sign-in success callback marks the wizard for submission.
  // Dismissing the gate does not create an order after a later sign-in.
  useEffect(() => {
    if (user && pendingSubmitRef.current && !authGateOpen) {
      pendingSubmitRef.current = false;
      const timer = setTimeout(() => { void latestSubmit.current(); }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authGateOpen]);

  if (invalidLinkedDirection) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="ds-frame ds-frame-article space-y-4 p-4">
          <p role="alert">{tr('Choose a route to or from Phuket Airport.', 'Выберите маршрут из аэропорта Пхукета или в аэропорт.', 'เลือกเส้นทางไปหรือกลับจากสนามบินภูเก็ต')}</p>
          <Button onClick={() => navigate(APP_ROUTES.AIRPORT_TRANSFER, { replace: true })}>{tr('Choose route', 'Выбрать маршрут', 'เลือกเส้นทาง')}</Button>
        </div>
      </AppLayout>
    );
  }

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

  const loadingQuote = destinationsLoading || nightRateStatus === 'loading';
  const quoteFailed = !!(vehicleError || destinationsError || nightRateStatus === 'error');
  const isLastStep = step === transferSteps.length - 1;
  const selectedVehicleLabel = selectedVehicle
    ? (language === 'ru' ? selectedVehicle.name_ru : selectedVehicle.name_en)
    : undefined;

  return (
    <AppLayout showBottomNav={false} usePageContainer={false}>
      <AirportBookingLayout
        variant="transfer"
        title={tr('Airport transfer', 'Трансфер из аэропорта и в аэропорт', 'รถรับส่งสนามบิน')}
        airport={tr('Phuket Airport (HKT)', 'Аэропорт Пхукета (HKT)', 'สนามบินภูเก็ต (HKT)')}
        back={
          <button
            type="button"
            aria-label={tr('Back', 'Назад', 'ย้อนกลับ')}
            disabled={isSubmitting || !!pendingCheckout || orderUnverified}
            onClick={() => {
              if (step > 0) moveToStep(step - 1);
              else navigate(tripBookingId && user ? `/trip/${tripBookingId}` : APP_ROUTES.TRANSPORT);
            }}
            className="inline-flex items-center justify-center gap-1 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            {tr('Back', 'Назад', 'ย้อนกลับ')}
          </button>
        }
        progress={<BookingStepProgress steps={transferSteps} currentStep={step} />}
        summary={<>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {formData.destinationAddress ? (
                <p className="text-xs text-muted-foreground break-words">
                  {formData.destinationAddress}
                  {selectedDestination?.duration_minutes && ` · ~${selectedDestination.duration_minutes} ${language === 'ru' ? 'мин' : 'min'}`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Выберите маршрут' : 'Select route'}
                </p>
              )}
              <p className="text-2xl font-semibold tabular-nums whitespace-nowrap">{pendingCheckout ? `฿${pendingCheckout.amount.toLocaleString()}` : quoteReady ? `฿${totalPrice.toLocaleString()}` : loadingQuote
                ? transferFareLabel(null, language)
                : transferFareLabel(null, language)}</p>
            </div>
            {selectedVehicleLabel && (
              <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                {selectedVehicleLabel}
              </Badge>
            )}
          </div>

          {!quoteReady && <p role="status" className="text-sm text-muted-foreground">{tr('The fare is not confirmed. Choose another vehicle or route and check the price.', 'Тариф пока не подтверждён. Выберите другой автомобиль или маршрут и проверьте стоимость.', 'โปรดตรวจสอบราคาโดยเลือกเส้นทางหรือรถคันอื่น')}</p>}
          {!isLastStep ? (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold"
              disabled={step === 1 && !quoteReady}
              onClick={handleNext}
            >
              {tr('Continue', 'Далее', 'ถัดไป')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold"
              disabled={isCreating || isSubmitting || orderUnverified || (pendingCheckout ? pendingCheckout.actor !== user?.id : !quoteReady)}
              onClick={handleSubmit}
            >
              {isCreating || isSubmitting
                ? tr('Processing…', 'Обработка…', 'กำลังดำเนินการ…')
                : pendingCheckout
                  ? tr('Retry card payment', 'Повторить оплату картой', 'ลองชำระด้วยบัตรอีกครั้ง')
                : !quoteReady ? transferFareLabel(null, language) : formData.paymentMethod === 'stripe'
                  ? (language === 'ru' ? `Оплатить ฿${totalPrice.toLocaleString()}` : `Pay ฿${totalPrice.toLocaleString()}`)
                  : formData.paymentMethod === 'cash'
                    ? (language === 'ru' ? `Забронировать • наличные ฿${totalPrice.toLocaleString()}` : `Book • Cash ฿${totalPrice.toLocaleString()}`)
                    : (language === 'ru' ? `Забронировать • ฿${totalPrice.toLocaleString()}` : `Book • ฿${totalPrice.toLocaleString()}`)}
            </Button>
          )}
        </>}
      >
        <div ref={stepRef} tabIndex={-1} className="scroll-mt-24 focus:outline-none">
          {step === 0 && tripBookingId && user && (
            <div className="mb-4 space-y-2 border bg-card p-3">
              {tripPrefillState === 'ready' ? (
                <p role="status" className="text-sm">
                  {tr('Stay details added. Review the route and passenger count.', 'Данные проживания добавлены. Проверьте маршрут и число пассажиров.', 'เพิ่มข้อมูลที่พักแล้ว ตรวจสอบเส้นทางและจำนวนผู้โดยสาร')}
                </p>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={applyStayDetails} disabled={tripPrefillState === 'loading'}>
                    {tripPrefillState === 'loading'
                      ? tr('Loading stay details…', 'Загружаем данные проживания…', 'กำลังโหลดข้อมูลที่พัก…')
                      : tr('Use stay details', 'Использовать данные проживания', 'ใช้ข้อมูลที่พัก')}
                  </Button>
                  {tripPrefillState === 'unavailable' && (
                    <p role="status" className="text-sm text-muted-foreground">
                      {tr('Stay details are unavailable. Enter them below or try again.', 'Данные проживания недоступны. Заполните поля ниже или попробуйте ещё раз.', 'ไม่พบข้อมูลที่พัก กรอกข้อมูลด้านล่างหรือลองอีกครั้ง')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          {quoteFailed && <div className="mb-4 space-y-2">
            <p role="alert" className="text-sm text-destructive">{tr('Could not load transfer rates.', 'Не удалось загрузить тарифы трансфера.', 'โหลดราคาค่ารถรับส่งไม่สำเร็จ')}</p>
            <Button type="button" variant="outline" onClick={() => {
              if (vehicleError) void refetchVehicles();
              if (destinationsError) void refetchDestinations();
              if (nightRateStatus === 'error') setNightRateRetry(retry => retry + 1);
            }}>{tr('Try again', 'Повторить', 'ลองอีกครั้ง')}</Button>
          </div>}
          {attemptedStep === 0 && getTransferRouteIssues(formData).length > 0 && <p role="alert" className="mb-3 text-sm text-destructive">
            {tr('Select a terminal and enter the pickup or drop-off address.', 'Выберите терминал и укажите адрес подачи или назначения.', 'เลือกอาคารผู้โดยสารและกรอกที่อยู่รับหรือส่ง')}
          </p>}
          {step === 1 && !vehicleError && vehicleTypes.length === 0 && <p role="status" className="text-sm text-muted-foreground">
            {tr('No vehicle options are listed.', 'Нет опубликованных вариантов автомобилей.', 'ไม่มีตัวเลือกรถที่แสดง')}
          </p>}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepRoute
                key="step-0"
                formData={formData}
                setFormData={setFormData}
                language={language}
                destinations={destinations}
                geoSupported={geoSupported && formData.direction === 'to-airport'}
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
                showPrice={quoteReady}
              />
            )}
            {step === 2 && (
              <StepDetails
                key="step-2"
                formData={formData}
                setFormData={setFormData}
                language={language}
                meetingSignManuallyEditedRef={meetingSignManuallyEdited}
                maxPassengers={maxPassengers}
                errors={attemptedStep === 2 ? Object.fromEntries(detailIssues.map(key => [key, fieldMessages[key]])) : {}}
              />
            )}
            {step === 3 && quoteReady && !pendingCheckout && !orderUnverified && (
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

        {orderUnverified && <p role="alert" className="px-4 py-2 text-sm text-destructive">{tr('We could not verify receipt. Check My Bookings before sending again.', 'Не удалось подтвердить получение. Проверьте «Мои бронирования» перед повторной отправкой.', 'ยืนยันการรับคำขอไม่ได้ โปรดตรวจสอบการจองของฉันก่อนส่งอีกครั้ง')} <a href="/bookings" className="underline">{tr('My bookings', 'Мои бронирования', 'การจองของฉัน')}</a></p>}
        {checkoutError && <p role="alert" className="px-4 py-2 text-sm text-destructive">{tr('Your order exists. Retry card payment for the same order.', 'Заказ уже создан. Повторите оплату картой для этого заказа.', 'สร้างคำสั่งซื้อแล้ว ลองชำระคำสั่งซื้อเดิมอีกครั้ง')}</p>}
      </AirportBookingLayout>
      <InlineAuthGate
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        language={language === 'ru' ? 'ru' : 'en'}
        defaultEmail={formData.email}
        defaultName={formData.name}
        defaultPhone={formData.phone}
        onAuthenticated={() => { pendingSubmitRef.current = true; }}
        contextLine={`${language === 'ru' ? 'Трансфер' : 'Transfer'} · ${transferFareLabel(quoteReady ? totalPrice : null, language)}`}
      />
    </AppLayout>
  );
}

