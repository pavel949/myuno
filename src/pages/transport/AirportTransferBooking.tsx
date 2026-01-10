import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plane, MapPin, Clock, Users, Check, ArrowRight, ArrowDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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

// Phuket Airport Terminals
const terminals = [
  { id: 'domestic', nameEn: 'Domestic Terminal', nameRu: 'Внутренний терминал' },
  { id: 'international', nameEn: 'International Terminal', nameRu: 'Международный терминал' },
];

// Popular destinations
const popularDestinations = [
  { id: 'patong', nameEn: 'Patong Beach', nameRu: 'Пляж Патонг', price: 800, duration: '45 min' },
  { id: 'kata', nameEn: 'Kata Beach', nameRu: 'Пляж Ката', price: 900, duration: '55 min' },
  { id: 'karon', nameEn: 'Karon Beach', nameRu: 'Пляж Карон', price: 850, duration: '50 min' },
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
  { id: 'sedan', nameEn: 'Sedan', nameRu: 'Седан', maxPassengers: 3, priceMultiplier: 1 },
  { id: 'suv', nameEn: 'SUV', nameRu: 'Внедорожник', maxPassengers: 5, priceMultiplier: 1.3 },
  { id: 'van', nameEn: 'Van', nameRu: 'Минивэн', maxPassengers: 8, priceMultiplier: 1.6 },
  { id: 'vip', nameEn: 'VIP', nameRu: 'VIP', maxPassengers: 3, priceMultiplier: 2 },
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

      // Add pickup address
      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: formData.direction === 'from-airport' ? 'pickup' : 'dropoff',
        address: `Phuket Airport - ${formData.terminal === 'domestic' ? 'Domestic' : 'International'} Terminal`,
      });

      // Add destination address
      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: formData.direction === 'from-airport' ? 'dropoff' : 'pickup',
        address: destinationAddress || '',
      });

      // Add participant
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
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {language === 'ru' ? 'Трансфер забронирован!' : 'Transfer Booked!'}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            {language === 'ru' 
              ? `Рейс ${formData.flightNumber} • ${formData.arrivalDate}`
              : `Flight ${formData.flightNumber} • ${formData.arrivalDate}`}
          </p>
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
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} 
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">
              {language === 'ru' ? 'Трансфер в/из аэропорта' : 'Airport Transfer'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? `Шаг ${step} из 3` : `Step ${step} of 3`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Route */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Direction Toggle */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {language === 'ru' ? 'Направление' : 'Direction'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('from-airport')}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      formData.direction === 'from-airport'
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="w-5 h-5" />
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <p className="font-medium text-sm">
                      {language === 'ru' ? 'Из аэропорта' : 'From Airport'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'Встретим с табличкой' : 'Meet & greet service'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange('to-airport')}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      formData.direction === 'to-airport'
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-4 h-4" />
                      <Plane className="w-5 h-5" />
                    </div>
                    <p className="font-medium text-sm">
                      {language === 'ru' ? 'В аэропорт' : 'To Airport'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'Заберём вовремя' : 'Pickup on time'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Terminal Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {language === 'ru' ? 'Терминал' : 'Terminal'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {terminals.map((terminal) => (
                    <button
                      key={terminal.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, terminal: terminal.id })}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        formData.terminal === terminal.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card"
                      )}
                    >
                      <p className="font-medium text-sm">
                        {language === 'ru' ? terminal.nameRu : terminal.nameEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {formData.direction === 'from-airport'
                    ? (language === 'ru' ? 'Куда едем?' : 'Where to?')
                    : (language === 'ru' ? 'Откуда забрать?' : 'Pickup from?')}
                </Label>
                <Select
                  value={formData.destination}
                  onValueChange={(value) => setFormData({ ...formData, destination: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={language === 'ru' ? 'Выберите место' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    {popularDestinations.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id}>
                        <div className="flex justify-between items-center gap-4">
                          <span>{language === 'ru' ? dest.nameRu : dest.nameEn}</span>
                          {dest.price > 0 && (
                            <span className="text-muted-foreground text-sm">฿{dest.price}</span>
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
                    className="mt-2"
                  />
                )}

                {selectedDestination && selectedDestination.id !== 'custom' && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedDestination.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>~{selectedDestination.price ? `฿${selectedDestination.price}` : ''}</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="button"
                className="w-full h-12"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                {language === 'ru' ? 'Продолжить' : 'Continue'}
              </Button>
            </div>
          )}

          {/* Step 2: Flight & Vehicle */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Flight Details */}
              <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-5 h-5 text-primary" />
                  <span className="font-semibold">
                    {language === 'ru' ? 'Данные рейса' : 'Flight Details'}
                  </span>
                </div>

                <div>
                  <Label>{language === 'ru' ? 'Номер рейса' : 'Flight Number'} *</Label>
                  <Input
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                    placeholder="TG 123"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ru' 
                      ? 'Мы отслеживаем ваш рейс для своевременной встречи'
                      : 'We track your flight for timely pickup'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      {formData.direction === 'from-airport'
                        ? (language === 'ru' ? 'Дата прилёта' : 'Arrival Date')
                        : (language === 'ru' ? 'Дата вылета' : 'Departure Date')} *
                    </Label>
                    <Input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      {formData.direction === 'from-airport'
                        ? (language === 'ru' ? 'Время прилёта' : 'Arrival Time')
                        : (language === 'ru' ? 'Время вылета' : 'Departure Time')} *
                    </Label>
                    <Input
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Passengers & Luggage */}
              <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold">
                    {language === 'ru' ? 'Пассажиры и багаж' : 'Passengers & Luggage'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'ru' ? 'Пассажиров' : 'Passengers'}</Label>
                    <Select
                      value={formData.passengers}
                      onValueChange={(value) => setFormData({ ...formData, passengers: value })}
                    >
                      <SelectTrigger className="mt-1">
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
                    <Label>{language === 'ru' ? 'Чемоданов' : 'Luggage'}</Label>
                    <Select
                      value={formData.luggage}
                      onValueChange={(value) => setFormData({ ...formData, luggage: value })}
                    >
                      <SelectTrigger className="mt-1">
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
                <Label className="text-base font-semibold">
                  {language === 'ru' ? 'Тип автомобиля' : 'Vehicle Type'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
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
                          "p-4 rounded-xl border-2 transition-all text-left",
                          formData.vehicleType === vehicle.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <p className="font-medium">
                          {language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ru' 
                            ? `До ${vehicle.maxPassengers} чел.`
                            : `Up to ${vehicle.maxPassengers} pax`}
                        </p>
                        {basePrice > 0 && (
                          <p className="text-sm font-semibold text-primary mt-1">฿{price}</p>
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
                  className="flex-1 h-12"
                  onClick={() => setStep(1)}
                >
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-12"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  {language === 'ru' ? 'Продолжить' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                <h3 className="font-semibold">
                  {language === 'ru' ? 'Ваш трансфер' : 'Your Transfer'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Маршрут' : 'Route'}
                    </span>
                    <span className="font-medium">
                      {formData.direction === 'from-airport' 
                        ? `Airport → ${language === 'ru' ? selectedDestination?.nameRu : selectedDestination?.nameEn}`
                        : `${language === 'ru' ? selectedDestination?.nameRu : selectedDestination?.nameEn} → Airport`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Терминал' : 'Terminal'}
                    </span>
                    <span>{formData.terminal === 'domestic' ? 'Domestic' : 'International'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Рейс' : 'Flight'}
                    </span>
                    <span>{formData.flightNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Дата/время' : 'Date/Time'}
                    </span>
                    <span>{formData.arrivalDate} {formData.arrivalTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Автомобиль' : 'Vehicle'}
                    </span>
                    <span>{language === 'ru' ? selectedVehicle?.nameRu : selectedVehicle?.nameEn}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-primary/20">
                    <span className="font-semibold">
                      {language === 'ru' ? 'Итого' : 'Total'}
                    </span>
                    <span className="font-bold text-primary text-lg">฿{totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">
                  {language === 'ru' ? 'Контактные данные' : 'Contact Information'}
                </h3>
                <div>
                  <Label>{language === 'ru' ? 'Имя (для таблички)' : 'Name (for sign)'} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={language === 'ru' ? 'Как написать на табличке' : 'Name on the sign'}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+66 xxx xxx xxxx"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{language === 'ru' ? 'Примечания' : 'Notes'}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={language === 'ru' 
                      ? 'Детское кресло, дополнительные остановки...' 
                      : 'Child seat, extra stops...'}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setStep(2)}
                >
                  {language === 'ru' ? 'Назад' : 'Back'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={isSubmitting || !formData.name || !formData.phone}
                >
                  {isSubmitting 
                    ? (language === 'ru' ? 'Бронирование...' : 'Booking...') 
                    : (language === 'ru' ? `Забронировать ฿${totalPrice}` : `Book for ฿${totalPrice}`)}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
