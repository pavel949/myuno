import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plane, MapPin, Users, Check, ArrowRight, Briefcase, Shield, Star, ChevronLeft, Loader2, User, Calendar, Clock, CreditCard, Handshake, LocateFixed } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrders, PaymentMethod } from '@/hooks/useOrders';
import { useVehicleTypes } from '@/hooks/useTransportConfig';
import { useProfile } from '@/hooks/useProfile';
import { cn, transliterate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGeolocation } from '@/hooks/useGeolocation';

const terminals = [
  { id: 'domestic', nameEn: 'Domestic Terminal', nameRu: 'Внутренний терминал', icon: '🏠' },
  { id: 'international', nameEn: 'International Terminal', nameRu: 'Международный терминал', icon: '🌍' },
];

type TransferDirection = 'from-airport' | 'to-airport';
type TransferPaymentMethod = 'stripe' | 'concierge_advance';

export default function AirportTransferBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { vehicleTypes, isLoading: isLoadingVehicles } = useVehicleTypes('airport_transfer');
  const { createOrder, isCreating } = useOrders();
  const { profile } = useProfile();
  const { latitude, longitude, loading: geoLoading, getPosition, hasLocation, supported: geoSupported } = useGeolocation();

  // Track if user manually edited the meeting sign name
  const meetingSignManuallyEdited = useRef(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    direction: (searchParams.get('direction') as TransferDirection) || 'from-airport',
    terminal: '',
    destinationAddress: '',
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
    meetingSignName: '', // Name for meeting sign (transliterated)
    paymentMethod: 'stripe' as TransferPaymentMethod,
  });

  // State for reverse geocoding
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

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
          setFormData(prev => ({ ...prev, destinationAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
          setIsReverseGeocoding(false);
        });
    }
  }, [hasLocation, latitude, longitude, isReverseGeocoding]);

  const handleUseCurrentLocation = () => {
    setIsReverseGeocoding(true);
    getPosition();
  };

  // Set default vehicle type when loaded
  useEffect(() => {
    if (vehicleTypes.length > 0 && !formData.vehicleType) {
      setFormData(prev => ({ ...prev, vehicleType: vehicleTypes[0].id }));
    }
  }, [vehicleTypes, formData.vehicleType]);

  // Prefill contact info from profile
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

  // Auto-transliterate name for meeting sign (only if not manually edited)
  useEffect(() => {
    if (!meetingSignManuallyEdited.current && formData.name) {
      setFormData(prev => ({
        ...prev,
        meetingSignName: transliterate(formData.name),
      }));
    }
  }, [formData.name]);

  // Base price for transfers (flat rate, can be fetched from config later)
  const basePrice = selectedVehicle?.base_price || 800;
  const totalPrice = basePrice;

  const handleDirectionChange = (dir: TransferDirection) => {
    setFormData({ ...formData, direction: dir });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: language === 'ru' ? 'Требуется авторизация' : 'Login Required',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    const scheduledAt = `${formData.arrivalDate}T${formData.arrivalTime}:00`;
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

      // Handle payment based on method
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
          toast({
            title: language === 'ru' ? 'Ошибка оплаты' : 'Payment Error',
            description: language === 'ru' ? 'Попробуйте другой способ оплаты' : 'Please try another payment method',
            variant: 'destructive',
          });
          setIsProcessingPayment(false);
          return;
        }
      } else {
        // Concierge advance - show success directly
        setIsSuccess(true);
      }
    }
  };

  const canSubmit = formData.direction && formData.terminal && formData.destinationAddress &&
    formData.flightNumber && formData.arrivalDate && formData.arrivalTime && 
    formData.passengers && formData.vehicleType;

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
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
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
          
          {/* Meeting sign name and destination */}
          {formData.direction === 'from-airport' && (
            <div className="w-full max-w-sm p-4 rounded-xl bg-card border border-border/50 mb-4">
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
            <Button variant="outline" onClick={() => navigate('/transport')}>
              {language === 'ru' ? 'К транспорту' : 'Browse More'}
            </Button>
            <Button onClick={() => navigate('/bookings')}>
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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background pb-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative px-4 pt-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/transport')} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold">
                {language === 'ru' ? 'Трансфер в/из аэропорта' : 'Airport Transfer'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Phuket International (HKT)
              </p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gold/10 rounded-full">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="text-sm font-semibold text-gold">4.9</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 pb-32">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Direction Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Направление' : 'Direction'}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectionChange('from-airport')}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-left relative",
                    formData.direction === 'from-airport'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card hover:border-primary/50"
                  )}
                >
                  {formData.direction === 'from-airport' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
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
                    "p-3 rounded-xl border-2 transition-all text-left relative",
                    formData.direction === 'to-airport'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card hover:border-primary/50"
                  )}
                >
                  {formData.direction === 'to-airport' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
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

            {/* Terminal Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Терминал' : 'Terminal'}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {terminals.map((terminal) => (
                  <button
                    key={terminal.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, terminal: terminal.id })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center relative",
                      formData.terminal === terminal.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    {formData.terminal === terminal.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <span className="text-xl mb-1 block">{terminal.icon}</span>
                    <p className="font-medium text-xs">
                      {language === 'ru' ? terminal.nameRu : terminal.nameEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {formData.direction === 'from-airport'
                  ? (language === 'ru' ? 'Куда доставить' : 'Drop-off Address')
                  : (language === 'ru' ? 'Откуда забрать' : 'Pick-up Address')}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  placeholder={language === 'ru' ? 'Название отеля или адрес' : 'Hotel name or address'}
                  className="h-11 flex-1"
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
              {geoSupported && (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading || isReverseGeocoding}
                  className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <LocateFixed className="h-3 w-3" />
                  {language === 'ru' ? 'Использовать моё местоположение' : 'Use my current location'}
                </button>
              )}
            </div>

            {/* Flight Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Plane className="w-4 h-4" />
                {language === 'ru' ? 'Номер рейса' : 'Flight Number'}
              </Label>
              <Input
                value={formData.flightNumber}
                onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                placeholder="TG 925"
                className="h-11"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'ru' ? 'Дата' : 'Date'}
                </Label>
                <Input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Passengers & Luggage */}
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
                  onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, luggage: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Vehicle Type - Compact */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Тип автомобиля' : 'Vehicle Type'}
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-1 touch-pan-y snap-x scrollbar-hide">
                {vehicleTypes
                  .filter(v => v.max_passengers >= parseInt(formData.passengers))
                  .map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicleType: vehicle.id })}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all min-w-[80px]",
                        formData.vehicleType === vehicle.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card"
                      )}
                    >
                      <span className="text-xl">{vehicle.icon || '🚗'}</span>
                      <p className="font-medium text-xs text-center">
                        {language === 'ru' ? vehicle.name_ru : vehicle.name_en}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {language === 'ru' ? `до ${vehicle.max_passengers}` : `up to ${vehicle.max_passengers}`}
                      </p>
                    </button>
                  ))}
              </div>
            </div>

            {/* Contact Info - Compact */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                {language === 'ru' ? 'Контактные данные' : 'Contact Info'}
              </Label>
              <div className="space-y-2">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                  className="h-11"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={language === 'ru' ? 'Телефон' : 'Phone'}
                    className="h-11"
                  />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Meeting Sign Name - only for 'from-airport' direction */}
            {formData.direction === 'from-airport' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Имя на табличке' : 'Name on sign'}
                </Label>
                <Input
                  value={formData.meetingSignName}
                  onChange={(e) => {
                    meetingSignManuallyEdited.current = true;
                    setFormData({ ...formData, meetingSignName: e.target.value });
                  }}
                  placeholder={language === 'ru' ? 'Латиницей, как в паспорте' : 'In Latin letters'}
                  className="h-11"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Примечания' : 'Notes'}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === 'ru' ? 'Детские кресла, особые пожелания...' : 'Child seats, special requests...'}
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'stripe' })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-left relative",
                    formData.paymentMethod === 'stripe'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card hover:border-primary/50"
                  )}
                >
                  {formData.paymentMethod === 'stripe' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-medium text-sm">
                    {language === 'ru' ? 'Картой онлайн' : 'Pay by Card'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Visa, Mastercard
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'concierge_advance' })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-left relative",
                    formData.paymentMethod === 'concierge_advance'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card hover:border-primary/50"
                  )}
                >
                  {formData.paymentMethod === 'concierge_advance' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Handshake className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="font-medium text-sm">
                    {language === 'ru' ? 'Оплата через myUNO' : 'myUNO Pays'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === 'ru' ? '0% комиссия' : '0% fee'}
                  </p>
                </button>
              </div>
              {formData.paymentMethod === 'concierge_advance' && (
                <p className="text-xs text-muted-foreground p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  {language === 'ru' 
                    ? '💡 myUNO оплатит трансфер. Вы вернёте сумму после поездки удобным способом.'
                    : '💡 myUNO will pay for your transfer. Return the amount after your trip.'}
                </p>
              )}
            </div>
          </form>
        </div>
      </ScrollArea>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-inset-bottom">
        <Button
          type="submit"
          className="w-full h-12"
          disabled={isCreating || isProcessingPayment || !canSubmit || !formData.name || !formData.phone}
          onClick={handleSubmit}
        >
          {isCreating || isProcessingPayment
            ? (language === 'ru' ? 'Обработка...' : 'Processing...') 
            : formData.paymentMethod === 'stripe'
              ? (language === 'ru' ? `Оплатить ฿${totalPrice}` : `Pay ฿${totalPrice}`)
              : (language === 'ru' ? `Забронировать • ฿${totalPrice}` : `Book • ฿${totalPrice}`)}
        </Button>
      </div>
    </AppLayout>
  );
}
