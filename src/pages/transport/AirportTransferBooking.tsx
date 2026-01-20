import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plane, MapPin, Clock, Users, Check, ArrowRight, Briefcase, Shield, Star, ChevronLeft, Loader2, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useBooking } from '@/hooks/useBooking';
import { useVehicleTypes, useTransportDestinations } from '@/hooks/useTransportConfig';
import { useProfile } from '@/hooks/useProfile';
import { cn, transliterate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const terminals = [
  { id: 'domestic', nameEn: 'Domestic Terminal', nameRu: 'Внутренний терминал', icon: '🏠' },
  { id: 'international', nameEn: 'International Terminal', nameRu: 'Международный терминал', icon: '🌍' },
];

type TransferDirection = 'from-airport' | 'to-airport';

export default function AirportTransferBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { vehicleTypes, isLoading: isLoadingVehicles } = useVehicleTypes('airport_transfer');
  const { destinations, isLoading: isLoadingDestinations } = useTransportDestinations('airport_transfer');
  const { createBooking, isSubmitting } = useBooking();
  const { profile } = useProfile();

  // Track if user manually edited the meeting sign name
  const meetingSignManuallyEdited = useRef(false);

  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    direction: (searchParams.get('direction') as TransferDirection) || 'from-airport',
    terminal: '',
    destination: '',
    customAddress: '',
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
  });

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

  // Auto-transliterate name for meeting sign (only if not manually edited)
  useEffect(() => {
    if (!meetingSignManuallyEdited.current && formData.name) {
      setFormData(prev => ({
        ...prev,
        meetingSignName: transliterate(formData.name),
      }));
    }
  }, [formData.name]);

  const selectedDestination = useMemo(() => 
    destinations.find(d => d.id === formData.destination),
    [destinations, formData.destination]
  );
  
  const selectedVehicle = useMemo(() => 
    vehicleTypes.find(v => v.id === formData.vehicleType),
    [vehicleTypes, formData.vehicleType]
  );
  
  const basePrice = selectedDestination?.base_price || 0;
  const totalPrice = Math.round(basePrice * (selectedVehicle?.price_multiplier || 1));

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

    const destinationAddress = formData.destination === 'custom' 
      ? formData.customAddress 
      : (language === 'ru' ? selectedDestination?.name_ru : selectedDestination?.name_en);

    const result = await createBooking({
      booking_type: 'transport',
      scheduled_at: `${formData.arrivalDate}T${formData.arrivalTime}:00`,
      total_amount: totalPrice,
      currency: 'THB',
      notes: `Airport Transfer\nDirection: ${formData.direction}\nTerminal: ${formData.terminal}\nFlight: ${formData.flightNumber}\nPassengers: ${formData.passengers}\nLuggage: ${formData.luggage}\nVehicle: ${selectedVehicle?.name_en || formData.vehicleType}\n${formData.notes}`,
      participants: [{
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        is_primary: true,
      }],
      addresses: [
        {
          address_type: formData.direction === 'from-airport' ? 'pickup' : 'dropoff',
          address: `Phuket Airport - ${formData.terminal === 'domestic' ? 'Domestic' : 'International'} Terminal`,
        },
        {
          address_type: formData.direction === 'from-airport' ? 'dropoff' : 'pickup',
          address: destinationAddress || '',
        },
      ],
      metadata: {
        transfer_type: 'airport',
        direction: formData.direction,
        terminal: formData.terminal,
        flight_number: formData.flightNumber,
        vehicle_type: formData.vehicleType,
        passengers: parseInt(formData.passengers),
        luggage: parseInt(formData.luggage),
        meeting_sign_name: formData.meetingSignName,
        destination_address: destinationAddress,
      },
    });

    if (result.success) {
      setIsSuccess(true);
    }
  };

  const canProceedStep1 = formData.direction && formData.terminal && formData.destination && 
    (formData.destination !== 'custom' || formData.customAddress);
  
  const canProceedStep2 = formData.flightNumber && formData.arrivalDate && formData.arrivalTime && 
    formData.passengers && formData.vehicleType;

  // Get destination address for display
  const destinationAddressDisplay = useMemo(() => {
    if (formData.destination === 'custom') return formData.customAddress;
    return language === 'ru' ? selectedDestination?.name_ru : selectedDestination?.name_en;
  }, [formData.destination, formData.customAddress, selectedDestination, language]);

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
          <p className="text-muted-foreground text-center max-w-sm mb-2">
            {language === 'ru' 
              ? `Рейс ${formData.flightNumber} • ${formData.arrivalDate}`
              : `Flight ${formData.flightNumber} • ${formData.arrivalDate}`}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-success/10 text-success">
              <Shield className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Подтверждено' : 'Confirmed'}
            </Badge>
          </div>
          
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
                  <p className="font-medium">{destinationAddressDisplay}</p>
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

  if (isLoadingVehicles || isLoadingDestinations) {
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
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background pb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative px-4 pt-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/transport')} 
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

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    s < step ? "bg-primary text-primary-foreground" :
                    s === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    s < step ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span className={cn(step >= 1 && "text-primary font-medium")}>
              {language === 'ru' ? 'Маршрут' : 'Route'}
            </span>
            <span className={cn(step >= 2 && "text-primary font-medium")}>
              {language === 'ru' ? 'Детали' : 'Details'}
            </span>
            <span className={cn(step >= 3 && "text-primary font-medium")}>
              {language === 'ru' ? 'Оплата' : 'Payment'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Route */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Direction Toggle */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Направление' : 'Direction'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('from-airport')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                      formData.direction === 'from-airport'
                        ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    {formData.direction === 'from-airport' && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plane className="w-4 h-4 text-primary" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm">
                      {language === 'ru' ? 'Из аэропорта' : 'From Airport'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === 'ru' ? 'Встретим с табличкой' : 'Meet & greet service'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('to-airport')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                      formData.direction === 'to-airport'
                        ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    {formData.direction === 'to-airport' && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plane className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm">
                      {language === 'ru' ? 'В аэропорт' : 'To Airport'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === 'ru' ? 'Заберём вовремя' : 'Pickup on time'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Terminal Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Терминал' : 'Terminal'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {terminals.map((terminal) => (
                    <button
                      key={terminal.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, terminal: terminal.id })}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-center relative",
                        formData.terminal === terminal.id
                          ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10"
                          : "border-border/50 bg-card hover:border-primary/50"
                      )}
                    >
                      {formData.terminal === terminal.id && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span className="text-2xl mb-2 block">{terminal.icon}</span>
                      <p className="font-medium text-sm">
                        {language === 'ru' ? terminal.nameRu : terminal.nameEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Пункт назначения' : 'Destination'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {destinations.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, destination: dest.id })}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-left",
                        formData.destination === dest.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card hover:border-primary/50"
                      )}
                    >
                      <p className="font-medium text-sm">
                        {language === 'ru' ? dest.name_ru : dest.name_en}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {dest.duration_minutes} min
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          ฿{dest.base_price}
                        </span>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, destination: 'custom' })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left",
                      formData.destination === 'custom'
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    <p className="font-medium text-sm">
                      {language === 'ru' ? 'Другое место' : 'Other Location'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ru' ? 'Укажите адрес' : 'Enter address'}
                    </p>
                  </button>
                </div>

                {formData.destination === 'custom' && (
                  <Input
                    value={formData.customAddress}
                    onChange={(e) => setFormData({ ...formData, customAddress: e.target.value })}
                    placeholder={language === 'ru' ? 'Введите адрес...' : 'Enter address...'}
                    className="mt-2"
                  />
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                {language === 'ru' ? 'Продолжить' : 'Continue'}
              </Button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Flight Number */}
              <div className="space-y-3">
                <Label>{language === 'ru' ? 'Номер рейса' : 'Flight Number'}</Label>
                <Input
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                  placeholder="TG 925"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{language === 'ru' ? 'Дата' : 'Date'}</Label>
                  <Input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ru' ? 'Время' : 'Time'}</Label>
                  <Input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Passengers & Luggage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {language === 'ru' ? 'Пассажиры' : 'Passengers'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.passengers}
                    onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {language === 'ru' ? 'Багаж' : 'Luggage'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.luggage}
                    onChange={(e) => setFormData({ ...formData, luggage: e.target.value })}
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-3">
                <Label>{language === 'ru' ? 'Тип автомобиля' : 'Vehicle Type'}</Label>
                <div className="space-y-2">
                  {vehicleTypes
                    .filter(v => v.max_passengers >= parseInt(formData.passengers))
                    .map((vehicle) => {
                      const price = Math.round(basePrice * vehicle.price_multiplier);
                      return (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, vehicleType: vehicle.id })}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                            formData.vehicleType === vehicle.id
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-card"
                          )}
                        >
                          <span className="text-2xl">{vehicle.icon || '🚗'}</span>
                          <div className="flex-1 text-left">
                            <p className="font-medium">
                              {language === 'ru' ? vehicle.name_ru : vehicle.name_en}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{language === 'ru' ? `до ${vehicle.max_passengers} чел.` : `up to ${vehicle.max_passengers}`}</span>
                              {vehicle.features && (
                                <span>• {vehicle.features.slice(0, 2).join(', ')}</span>
                              )}
                            </div>
                          </div>
                          <p className="font-bold text-primary">฿{price}</p>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  {language === 'ru' ? 'Продолжить' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Payment */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <h3 className="font-semibold mb-3">
                  {language === 'ru' ? 'Детали трансфера' : 'Transfer Details'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ru' ? 'Рейс' : 'Flight'}</span>
                    <span>{formData.flightNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ru' ? 'Дата' : 'Date'}</span>
                    <span>{formData.arrivalDate} {formData.arrivalTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ru' ? 'Автомобиль' : 'Vehicle'}</span>
                    <span>{language === 'ru' ? selectedVehicle?.name_ru : selectedVehicle?.name_en}</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ru' ? 'Адрес назначения' : 'Destination Address'}
                        </p>
                        <p className="font-medium">{destinationAddressDisplay}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/50">
                    <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
                    <span className="text-primary">฿{totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <Label>{language === 'ru' ? 'Контактные данные' : 'Contact Information'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={language === 'ru' ? 'Телефон' : 'Phone'}
                />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                />
              </div>

              {/* Meeting Sign Name - only for 'from-airport' direction */}
              {formData.direction === 'from-airport' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === 'ru' ? 'Имя для таблички встречающего' : 'Name for meeting sign'}
                  </Label>
                  <Input
                    value={formData.meetingSignName}
                    onChange={(e) => {
                      meetingSignManuallyEdited.current = true;
                      setFormData({ ...formData, meetingSignName: e.target.value });
                    }}
                    placeholder={language === 'ru' ? 'Имя латиницей, как в паспорте' : 'Name in Latin letters'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' 
                      ? 'Водитель будет ждать вас с этим именем на табличке'
                      : 'Driver will hold a sign with this name'}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>{language === 'ru' ? 'Примечания' : 'Notes'}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'ru' ? 'Детские кресла, особые пожелания...' : 'Child seats, special requests...'}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || !formData.name || !formData.phone}
                >
                  {isSubmitting 
                    ? (language === 'ru' ? 'Бронирование...' : 'Booking...') 
                    : (language === 'ru' ? `Забронировать за ฿${totalPrice}` : `Book for ฿${totalPrice}`)}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
