import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plane, MapPin, Clock, Users, Check, ArrowRight, Briefcase, Car, Shield, Star, Phone, MessageCircle, ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Phuket Airport Terminals
const terminals = [
  { id: 'domestic', nameEn: 'Domestic Terminal', nameRu: 'Внутренний терминал', icon: '🏠' },
  { id: 'international', nameEn: 'International Terminal', nameRu: 'Международный терминал', icon: '🌍' },
];

// Popular destinations
const popularDestinations = [
  { id: 'patong', nameEn: 'Patong Beach', nameRu: 'Пляж Патонг', price: 800, duration: '45 min', popular: true },
  { id: 'kata', nameEn: 'Kata Beach', nameRu: 'Пляж Ката', price: 900, duration: '55 min', popular: true },
  { id: 'karon', nameEn: 'Karon Beach', nameRu: 'Пляж Карон', price: 850, duration: '50 min', popular: true },
  { id: 'rawai', nameEn: 'Rawai', nameRu: 'Равай', price: 1000, duration: '60 min' },
  { id: 'kamala', nameEn: 'Kamala Beach', nameRu: 'Пляж Камала', price: 750, duration: '40 min' },
  { id: 'surin', nameEn: 'Surin Beach', nameRu: 'Пляж Сурин', price: 700, duration: '35 min' },
  { id: 'bangtao', nameEn: 'Bang Tao', nameRu: 'Банг Тао', price: 650, duration: '30 min' },
  { id: 'phuket-town', nameEn: 'Phuket Town', nameRu: 'Пхукет Таун', price: 500, duration: '25 min' },
  { id: 'chalong', nameEn: 'Chalong', nameRu: 'Чалонг', price: 750, duration: '40 min' },
  { id: 'custom', nameEn: 'Other Location', nameRu: 'Другое место', price: 0, duration: '' },
];

// Vehicle options
const vehicleOptions = [
  { id: 'sedan', nameEn: 'Sedan', nameRu: 'Седан', maxPassengers: 3, priceMultiplier: 1, icon: '🚗', features: ['A/C', 'WiFi'] },
  { id: 'suv', nameEn: 'SUV', nameRu: 'Внедорожник', maxPassengers: 5, priceMultiplier: 1.3, icon: '🚙', features: ['A/C', 'WiFi', 'Spacious'] },
  { id: 'van', nameEn: 'Van', nameRu: 'Минивэн', maxPassengers: 8, priceMultiplier: 1.6, icon: '🚐', features: ['A/C', 'WiFi', 'Large luggage'] },
  { id: 'vip', nameEn: 'VIP', nameRu: 'VIP', maxPassengers: 3, priceMultiplier: 2, icon: '🏎️', features: ['A/C', 'WiFi', 'Premium', 'Drinks'] },
];

type TransferDirection = 'from-airport' | 'to-airport';

export default function AirportTransferBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    vehicleType: 'sedan',
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const selectedDestination = popularDestinations.find(d => d.id === formData.destination);
  const selectedVehicle = vehicleOptions.find(v => v.id === formData.vehicleType);
  
  const basePrice = selectedDestination?.price || 0;
  const totalPrice = Math.round(basePrice * (selectedVehicle?.priceMultiplier || 1));

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

    setIsSubmitting(true);

    try {
      const destinationAddress = formData.destination === 'custom' 
        ? formData.customAddress 
        : (language === 'ru' ? selectedDestination?.nameRu : selectedDestination?.nameEn);

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'transport',
          status: 'submitted',
          scheduled_at: `${formData.arrivalDate}T${formData.arrivalTime}:00`,
          total_amount: totalPrice,
          notes: `Direction: ${formData.direction}\nTerminal: ${formData.terminal}\nFlight: ${formData.flightNumber}\nPassengers: ${formData.passengers}\nLuggage: ${formData.luggage}\nVehicle: ${formData.vehicleType}\n${formData.notes}`,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: formData.direction === 'from-airport' ? 'pickup' : 'dropoff',
        address: `Phuket Airport - ${formData.terminal === 'domestic' ? 'Domestic' : 'International'} Terminal`,
      });

      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: formData.direction === 'from-airport' ? 'dropoff' : 'pickup',
        address: destinationAddress || '',
      });

      await supabase.from('booking_participants').insert({
        booking_id: booking.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        is_primary: true,
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: language === 'ru' ? 'Ошибка при бронировании' : 'Booking Error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = formData.direction && formData.terminal && formData.destination && 
    (formData.destination !== 'custom' || formData.customAddress);
  
  const canProceedStep2 = formData.flightNumber && formData.arrivalDate && formData.arrivalTime && 
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
          <p className="text-muted-foreground text-center max-w-sm mb-2">
            {language === 'ru' 
              ? `Рейс ${formData.flightNumber} • ${formData.arrivalDate}`
              : `Flight ${formData.flightNumber} • ${formData.arrivalDate}`}
          </p>
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-success/10 text-success">
              <Shield className="w-3 h-3 mr-1" />
              {language === 'ru' ? 'Подтверждено' : 'Confirmed'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {language === 'ru' 
              ? 'Водитель встретит вас с табличкой с вашим именем.'
              : 'Driver will meet you with a sign with your name.'}
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

  return (
    <AppLayout showBottomNav={false}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background pb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative px-4 pt-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold">
                {language === 'ru' ? 'Трансфер в/из аэропорта' : 'Airport Transfer'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Phuket International (HKT)' : 'Phuket International (HKT)'}
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

          {/* Step Labels */}
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
                  {formData.direction === 'from-airport'
                    ? (language === 'ru' ? 'Куда едем?' : 'Where to?')
                    : (language === 'ru' ? 'Откуда забрать?' : 'Pickup from?')}
                </Label>
                <Select
                  value={formData.destination}
                  onValueChange={(value) => setFormData({ ...formData, destination: value })}
                >
                  <SelectTrigger className="h-14 rounded-xl bg-card border-border/50">
                    <SelectValue placeholder={language === 'ru' ? 'Выберите место' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    {popularDestinations.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id}>
                        <div className="flex items-center gap-3">
                          <span>{language === 'ru' ? dest.nameRu : dest.nameEn}</span>
                          {dest.popular && (
                            <Badge variant="secondary" className="text-xs bg-gold/10 text-gold">
                              Popular
                            </Badge>
                          )}
                          {dest.price > 0 && (
                            <span className="text-muted-foreground text-sm ml-auto">฿{dest.price}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.destination === 'custom' && (
                  <Input
                    value={formData.customAddress}
                    onChange={(e) => setFormData({ ...formData, customAddress: e.target.value })}
                    placeholder={language === 'ru' ? 'Введите точный адрес' : 'Enter exact address'}
                    className="h-14 rounded-xl"
                  />
                )}

                {selectedDestination && selectedDestination.id !== 'custom' && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{selectedDestination.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-semibold">฿{selectedDestination.price}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-success" />
                  <span>{language === 'ru' ? 'Фикс. цена' : 'Fixed price'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{language === 'ru' ? 'Мониторинг рейса' : 'Flight tracking'}</span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full h-14 rounded-xl text-base font-semibold"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                {language === 'ru' ? 'Продолжить' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Flight & Vehicle */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Flight Details */}
              <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">
                      {language === 'ru' ? 'Данные рейса' : 'Flight Details'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'Мы отслеживаем ваш рейс' : 'We track your flight'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">{language === 'ru' ? 'Номер рейса' : 'Flight Number'} *</Label>
                  <Input
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                    placeholder="TG 123"
                    required
                    className="mt-1.5 h-12 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">
                      {formData.direction === 'from-airport'
                        ? (language === 'ru' ? 'Дата прилёта' : 'Arrival Date')
                        : (language === 'ru' ? 'Дата вылета' : 'Departure Date')} *
                    </Label>
                    <Input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      required
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      {formData.direction === 'from-airport'
                        ? (language === 'ru' ? 'Время прилёта' : 'Arrival Time')
                        : (language === 'ru' ? 'Время вылета' : 'Departure Time')} *
                    </Label>
                    <Input
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      required
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Passengers & Luggage */}
              <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold">
                    {language === 'ru' ? 'Пассажиры и багаж' : 'Passengers & Luggage'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {language === 'ru' ? 'Пассажиров' : 'Passengers'}
                    </Label>
                    <Select
                      value={formData.passengers}
                      onValueChange={(value) => setFormData({ ...formData, passengers: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {language === 'ru' ? 'Чемоданов' : 'Luggage'}
                    </Label>
                    <Select
                      value={formData.luggage}
                      onValueChange={(value) => setFormData({ ...formData, luggage: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  {language === 'ru' ? 'Тип автомобиля' : 'Vehicle Type'}
                </Label>
                <div className="space-y-3">
                  {vehicleOptions.map((vehicle) => {
                    const price = Math.round(basePrice * vehicle.priceMultiplier);
                    const isDisabled = parseInt(formData.passengers) > vehicle.maxPassengers;
                    
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setFormData({ ...formData, vehicleType: vehicle.id })}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 relative",
                          formData.vehicleType === vehicle.id
                            ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10"
                            : "border-border/50 bg-card hover:border-primary/50",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {formData.vehicleType === vehicle.id && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <span className="text-3xl">{vehicle.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'ru' 
                              ? `До ${vehicle.maxPassengers} чел.`
                              : `Up to ${vehicle.maxPassengers} pax`}
                          </p>
                          <div className="flex gap-1 mt-1.5">
                            {vehicle.features.map((f, i) => (
                              <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {basePrice > 0 && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">฿{price}</p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-14 rounded-xl"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-14 rounded-xl"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  {language === 'ru' ? 'Продолжить' : 'Continue'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Confirm */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Summary */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Ваш трансфер' : 'Your Transfer'}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Маршрут' : 'Route'}
                    </span>
                    <span className="font-medium text-right">
                      {formData.direction === 'from-airport' 
                        ? `HKT → ${language === 'ru' ? selectedDestination?.nameRu : selectedDestination?.nameEn}`
                        : `${language === 'ru' ? selectedDestination?.nameRu : selectedDestination?.nameEn} → HKT`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Терминал' : 'Terminal'}
                    </span>
                    <span>{formData.terminal === 'domestic' ? '🏠 Domestic' : '🌍 International'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Рейс' : 'Flight'}
                    </span>
                    <span className="font-mono">{formData.flightNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Дата/время' : 'Date/Time'}
                    </span>
                    <span>{formData.arrivalDate} • {formData.arrivalTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Автомобиль' : 'Vehicle'}
                    </span>
                    <span>{selectedVehicle?.icon} {language === 'ru' ? selectedVehicle?.nameRu : selectedVehicle?.nameEn}</span>
                  </div>
                  <div className="pt-3 border-t border-primary/20 flex justify-between items-center">
                    <span className="font-semibold text-base">
                      {language === 'ru' ? 'Итого' : 'Total'}
                    </span>
                    <span className="font-bold text-primary text-2xl">฿{totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">{language === 'ru' ? 'Имя (для таблички)' : 'Name (for sign)'} *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === 'ru' ? 'Как написать на табличке' : 'Name on the sign'}
                      required
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+66 xxx xxx xxxx"
                      required
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{language === 'ru' ? 'Примечания' : 'Notes'}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={language === 'ru' 
                        ? 'Детское кресло, дополнительные остановки...' 
                        : 'Child seat, extra stops...'}
                      className="mt-1.5 rounded-xl resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Support */}
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {language === 'ru' ? 'Нужна помощь?' : 'Need help?'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Напишите нам в WhatsApp' : 'Chat with us on WhatsApp'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-success hover:text-success hover:bg-success/10"
                  onClick={() => window.open('https://wa.me/66800000000', '_blank')}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-14 rounded-xl"
                  onClick={() => setStep(2)}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base font-semibold"
                  disabled={isSubmitting || !formData.name || !formData.phone}
                >
                  {isSubmitting 
                    ? (language === 'ru' ? 'Бронирование...' : 'Booking...') 
                    : (language === 'ru' ? `Забронировать` : `Book Now`)}
                </Button>
              </div>
              
              {/* Price Footer */}
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'К оплате: ' : 'Total: '}
                </span>
                <span className="text-lg font-bold text-primary">฿{totalPrice}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
