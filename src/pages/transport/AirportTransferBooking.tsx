import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Plane, MapPin, Users, Check, ArrowRight, Briefcase, Shield, Star, ChevronLeft, Loader2, User, Calendar, Clock, CreditCard, Handshake, LocateFixed, Banknote, ArrowLeft } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useOrders, PaymentMethod } from '@/hooks/useOrders';
import { useVehicleTypes, useTransportDestinations } from '@/hooks/useTransportConfig';
import { useProfile } from '@/hooks/useProfile';
import { cn, transliterate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { AddressAutocomplete } from '@/components/transport/AddressAutocomplete';
import { AnimatePresence, motion } from 'framer-motion';
import { BookingStepProgress, type BookingStep } from '@/components/booking/BookingStepProgress';
import { PriceDisplay } from '@/components/uno/PriceDisplay';

const terminals = [
  { id: 'domestic', nameEn: 'Domestic Terminal', nameRu: 'Внутренний терминал' },
  { id: 'international', nameEn: 'International Terminal', nameRu: 'Международный терминал' },
];

const transferSteps: BookingStep[] = [
  { id: 'route', labelEn: 'Route', labelRu: 'Маршрут' },
  { id: 'vehicle', labelEn: 'Vehicle', labelRu: 'Авто' },
  { id: 'details', labelEn: 'Details', labelRu: 'Детали' },
];

type TransferDirection = 'from-airport' | 'to-airport';
type TransferPaymentMethod = 'stripe' | 'cash' | 'concierge_advance';

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

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
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  
  const [formData, setFormData] = useState({
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

  // Reverse geocode when location is obtained
  useEffect(() => {
    if (hasLocation && latitude && longitude && isReverseGeocoding) {
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
  }, [profile]);

  const selectedVehicle = useMemo(() => 
    vehicleTypes.find(v => v.id === formData.vehicleType),
    [vehicleTypes, formData.vehicleType]
  );

  const selectedDestination = useMemo(() =>
    destinations.find(d => d.id === formData.selectedDestinationId),
    [destinations, formData.selectedDestinationId]
  );

  useEffect(() => {
    if (!meetingSignManuallyEdited.current && formData.name) {
      setFormData(prev => ({ ...prev, meetingSignName: transliterate(formData.name) }));
    }
  }, [formData.name]);

  const routeBasePrice = selectedDestination?.base_price || 0;
  const vehicleMultiplier = selectedVehicle?.price_multiplier || 1;
  const totalPrice = routeBasePrice > 0 
    ? Math.round(routeBasePrice * vehicleMultiplier) 
    : (selectedVehicle?.base_price || 800);

  const handleDirectionChange = (dir: TransferDirection) => {
    setFormData(prev => ({ ...prev, direction: dir }));
  };

  // Step validation
  const canProceedStep0 = !!(formData.direction && formData.terminal && formData.destinationAddress);
  const canProceedStep1 = !!formData.vehicleType;
  const canSubmit = canProceedStep0 && canProceedStep1 &&
    formData.flightNumber && formData.arrivalDate && formData.arrivalTime && 
    formData.name && formData.phone;

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(language === 'ru' ? 'Требуется авторизация' : 'Login Required');
      navigate(APP_ROUTES.AUTH);
      return;
    }

    // Treat input as local Phuket time (Asia/Bangkok = UTC+7) and emit
    // a timezone-aware ISO 8601 string so Postgres stores correct UTC.
    const scheduledAt = `${formData.arrivalDate}T${formData.arrivalTime}:00+07:00`;
    const vehicleName = language === 'ru' ? selectedVehicle?.name_ru : selectedVehicle?.name_en;

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
        passengers: parseInt(formData.passengers),
        luggage: parseInt(formData.luggage),
        meeting_sign_name: formData.meetingSignName,
        language,
      },
      items: [{
        item_name: `Airport Transfer - ${vehicleName}`,
        item_type: 'transport',
        unit_price: totalPrice,
        amount: totalPrice,
        qty: 1,
        metadata: {
          vehicle_type: formData.vehicleType,
          direction: formData.direction,
        },
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
          address_text: `Phuket Airport - ${formData.terminal === 'domestic' ? 'Domestic' : 'International'} Terminal`,
        },
        {
          address_type: formData.direction === 'from-airport' ? 'dropoff' : 'pickup',
          address_text: formData.destinationAddress,
        },
      ],
      payment: {
        method: formData.paymentMethod as PaymentMethod,
        amount: totalPrice,
      },
      serviceName: `Airport Transfer - ${vehicleName}`,
      openWhatsAppOnCash: false,
    });

    if (result.success && result.order_id) {
      setCreatedOrderId(result.order_id);
      setCreatedOrderNumber(result.order_number || null);

      const pickupAddr = formData.direction === 'from-airport'
        ? `Phuket Airport - ${formData.terminal === 'domestic' ? 'Domestic' : 'International'} Terminal`
        : formData.destinationAddress;
      const dropoffAddr = formData.direction === 'from-airport'
        ? formData.destinationAddress
        : `Phuket Airport - ${formData.terminal === 'domestic' ? 'Domestic' : 'International'} Terminal`;

      supabase.functions.invoke('notify-transfer-booking', {
        body: {
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
        },
      }).catch(err => console.error('[Notify] Transfer notification error:', err));

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
          console.error('Stripe checkout error:', err);
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
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/40 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
            <Check className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {language === 'ru' ? 'Трансфер забронирован!' : 'Transfer Booked!'}
          </h2>
          {createdOrderNumber && (
            <p className="text-lg font-semibold text-primary mb-2">#{createdOrderNumber}</p>
          )}
          <p className="text-muted-foreground text-center max-w-sm mb-2">
            {language === 'ru' 
              ? `Рейс ${formData.flightNumber} • ${formData.arrivalDate}`
              : `Flight ${formData.flightNumber} • ${formData.arrivalDate}`}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-success/10 text-success">
              <Shield className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Подтверждено' : 'Confirmed'}
            </Badge>
            {formData.paymentMethod === 'concierge_advance' && (
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                <Handshake className="w-3 h-3 mr-1" />
                myUNO
              </Badge>
            )}
          </div>
          
          {formData.paymentMethod === 'concierge_advance' && (
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              {language === 'ru' 
                ? 'Мы оплатим за вас. После трансфера вы вернёте сумму удобным способом.'
                : 'We\'ll pay for you. Return the amount after the transfer.'}
            </p>
          )}
          
          {formData.direction === 'from-airport' && (
            <div className="w-full max-w-sm p-4 rounded-none bg-card border border-border/50 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Имя на табличке' : 'Name on sign'}
                  </p>
                  <p className="font-semibold text-lg">{formData.meetingSignName || formData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Адрес назначения' : 'Destination'}
                  </p>
                  <p className="font-medium">{formData.destinationAddress}</p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {language === 'ru' 
              ? 'Водитель встретит вас с табличкой у выхода из терминала.'
              : 'Driver will meet you with a sign at the terminal exit.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.TRANSPORT)}>
              {language === 'ru' ? 'К транспорту' : 'Browse More'}
            </Button>
            <Button onClick={() => navigate(APP_ROUTES.BOOKINGS)}>
              {language === 'ru' ? 'Мои брони' : 'My Bookings'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
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

  return (
    <AppLayout showBottomNav={false}>
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

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-44">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-route"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Направление' : 'Direction'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('from-airport')}
                    className={cn(
                      "p-3.5 rounded-none border-2 transition-all text-left relative",
                      formData.direction === 'from-airport'
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    {formData.direction === 'from-airport' && (
                      <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Plane className="w-4 h-4 text-primary" />
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm">
                      {language === 'ru' ? 'Из аэропорта' : 'From Airport'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('to-airport')}
                    className={cn(
                      "p-3.5 rounded-none border-2 transition-all text-left relative",
                      formData.direction === 'to-airport'
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    {formData.direction === 'to-airport' && (
                      <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <Plane className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-medium text-sm">
                      {language === 'ru' ? 'В аэропорт' : 'To Airport'}
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Терминал' : 'Terminal'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {terminals.map((terminal) => (
                    <button
                      key={terminal.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, terminal: terminal.id }))}
                      className={cn(
                        "p-3.5 rounded-none border-2 transition-all text-center relative",
                        formData.terminal === terminal.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card hover:border-primary/50"
                      )}
                    >
                      {formData.terminal === terminal.id && (
                        <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
                      )}
                      <Plane className="w-5 h-5 mb-1 text-primary mx-auto" />
                      <p className="font-medium text-xs">
                        {language === 'ru' ? terminal.nameRu : terminal.nameEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {formData.direction === 'from-airport'
                    ? (language === 'ru' ? 'Куда доставить' : 'Drop-off Address')
                    : (language === 'ru' ? 'Откуда забрать' : 'Pick-up Address')}
                </Label>

                {destinations.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'Популярные направления' : 'Popular destinations'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {destinations
                        .sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0))
                        .map((dest) => (
                          <button
                            key={dest.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              selectedDestinationId: dest.id,
                              destinationAddress: language === 'ru' ? dest.name_ru : dest.name_en,
                            }))}
                            className={cn(
                              "p-3 rounded-none border-2 transition-all text-left relative",
                              formData.selectedDestinationId === dest.id
                                ? "border-primary bg-primary/10"
                                : "border-border/50 bg-card hover:border-primary/30"
                            )}
                          >
                            {formData.selectedDestinationId === dest.id && (
                              <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-primary" /></div>
                            )}
                            <p className="font-medium text-sm mb-1">
                              {language === 'ru' ? dest.name_ru : dest.name_en}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">฿{dest.base_price.toLocaleString()}</span>
                              {dest.duration_minutes && (
                                <span className="text-[10px] text-muted-foreground">~{dest.duration_minutes} {language === 'ru' ? 'мин' : 'min'}</span>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <AddressAutocomplete
                    value={formData.destinationAddress}
                    onChange={(val) => setFormData(prev => ({ ...prev, destinationAddress: val, selectedDestinationId: '' }))}
                    placeholder={language === 'ru' ? 'Или введите свой адрес' : 'Or enter your address'}
                    className="flex-1"
                  />
                  {geoSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={handleUseCurrentLocation}
                      disabled={geoLoading || isReverseGeocoding}
                    >
                      {(geoLoading || isReverseGeocoding) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LocateFixed className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-vehicle"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите автомобиль' : 'Choose your vehicle'}
              </p>

              <div className="space-y-2">
                {vehicleTypes.map((vehicle) => {
                  const price = routeBasePrice > 0
                    ? Math.round(routeBasePrice * vehicle.price_multiplier)
                    : vehicle.base_price;
                  const Icon = resolveIcon(vehicle.icon || '🚗');
                  const isSelected = formData.vehicleType === vehicle.id;

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.id }))}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-none border-2 transition-all text-left",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-none flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          {language === 'ru' ? vehicle.name_ru : vehicle.name_en}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ru' ? `до ${vehicle.max_passengers} пасс.` : `up to ${vehicle.max_passengers} pax`}
                          {vehicle.eta_minutes ? ` · ~${vehicle.eta_minutes} ${language === 'ru' ? 'мин' : 'min'}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base text-foreground">฿{price.toLocaleString()}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-details"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="p-3 rounded-none bg-muted/50 border border-border/50 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    {formData.direction === 'from-airport' ? (
                      <><Plane className="w-3 h-3" /><ArrowRight className="w-2.5 h-2.5" /><MapPin className="w-3 h-3" /></>
                    ) : (
                      <><MapPin className="w-3 h-3" /><ArrowRight className="w-2.5 h-2.5" /><Plane className="w-3 h-3" /></>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{formData.destinationAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedVehicle && (language === 'ru' ? selectedVehicle.name_ru : selectedVehicle.name_en)}
                    {selectedDestination?.duration_minutes && ` · ~${selectedDestination.duration_minutes} ${language === 'ru' ? 'мин' : 'min'}`}
                  </p>
                </div>
                <p className="font-bold text-lg shrink-0">฿{totalPrice.toLocaleString()}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/transport/fast-track')}
                className="w-full p-3 rounded-none border border-primary/20 bg-primary/5 flex items-center gap-3 text-left hover:bg-primary/10 transition-colors"
              >
                <Shield className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {language === 'ru' ? 'Fast Track — без очередей' : 'Fast Track — skip queues'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'от ฿2,500' : 'from ฿2,500'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              </button>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  {language === 'ru' ? 'Номер рейса' : 'Flight Number'}
                </Label>
                <Input
                  value={formData.flightNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value.toUpperCase() }))}
                  placeholder="TG 925"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {language === 'ru' ? 'Дата' : 'Date'}
                  </Label>
                  <Input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {language === 'ru' ? 'Время' : 'Time'}
                  </Label>
                  <Input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {language === 'ru' ? 'Пассажиры' : 'Passengers'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.passengers}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengers: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {language === 'ru' ? 'Багаж' : 'Luggage'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.luggage}
                    onChange={(e) => setFormData(prev => ({ ...prev, luggage: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {language === 'ru' ? 'Контакты' : 'Contact Info'}
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                  className="h-11"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={language === 'ru' ? 'Телефон' : 'Phone'}
                    className="h-11"
                  />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email"
                    className="h-11"
                  />
                </div>
              </div>

              {formData.direction === 'from-airport' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    {language === 'ru' ? 'Имя на табличке' : 'Name on sign'}
                  </Label>
                  <Input
                    value={formData.meetingSignName}
                    onChange={(e) => {
                      meetingSignManuallyEdited.current = true;
                      setFormData(prev => ({ ...prev, meetingSignName: e.target.value }));
                    }}
                    placeholder={language === 'ru' ? 'Латиницей, как в паспорте' : 'In Latin letters'}
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Примечания' : 'Notes'}
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={language === 'ru' ? 'Детские кресла, особые пожелания...' : 'Child seats, special requests...'}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'stripe' as const, icon: CreditCard, iconClass: 'text-primary', label: language === 'ru' ? 'Картой' : 'Card', sub: 'Visa, MC' },
                    { key: 'cash' as const, icon: Banknote, iconClass: 'text-success', label: language === 'ru' ? 'Наличные' : 'Cash', sub: language === 'ru' ? 'Водителю' : 'To driver' },
                    { key: 'concierge_advance' as const, icon: Handshake, iconClass: 'text-warning', label: 'myUNO', sub: language === 'ru' ? '0% ком.' : '0% fee' },
                  ]).map(pm => (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: pm.key }))}
                      className={cn(
                        "p-3 rounded-none border-2 transition-all text-left relative",
                        formData.paymentMethod === pm.key
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card hover:border-primary/50"
                      )}
                    >
                      {formData.paymentMethod === pm.key && (
                        <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-primary" /></div>
                      )}
                      <pm.icon className={cn("w-4 h-4 mb-1", pm.iconClass)} />
                      <p className="font-medium text-xs">{pm.label}</p>
                      <p className="text-[10px] text-muted-foreground">{pm.sub}</p>
                    </button>
                  ))}
                </div>
                {formData.paymentMethod === 'cash' && (
                  <p className="text-xs text-muted-foreground p-2 bg-success/10 rounded-none">
                    {language === 'ru' 
                      ? 'Оплата наличными водителю при встрече. THB или USD.'
                      : 'Pay cash to the driver upon meeting. THB or USD.'}
                  </p>
                )}
                {formData.paymentMethod === 'concierge_advance' && (
                  <p className="text-xs text-muted-foreground p-2 bg-warning/10 rounded-none">
                    {language === 'ru' 
                      ? 'myUNO оплатит трансфер. Вы вернёте сумму после поездки удобным способом.'
                      : 'myUNO will pay for your transfer. Return the amount after your trip.'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            {selectedVehicle && (
              <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                {language === 'ru' ? selectedVehicle.name_ru : selectedVehicle.name_en}
              </Badge>
            )}
          </div>

          {step < 2 ? (
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold"
              disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
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
