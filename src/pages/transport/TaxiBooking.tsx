import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Clock, Users, Check, Minus, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import LocationPickerMap from '@/components/transport/LocationPickerMap';
import { BackButton } from '@/components/uno/BackButton';

// Vehicle options with pricing
const vehicleOptions = [
  { 
    id: 'standard', 
    nameEn: 'Standard', 
    nameRu: 'Стандарт',
    descEn: 'Toyota Vios or similar',
    descRu: 'Toyota Vios или аналог',
    maxPassengers: 4,
    basePrice: 100,
    pricePerKm: 15,
    icon: '🚕',
    eta: '3-5 min'
  },
  { 
    id: 'comfort', 
    nameEn: 'Comfort', 
    nameRu: 'Комфорт',
    descEn: 'Toyota Camry or similar',
    descRu: 'Toyota Camry или аналог',
    maxPassengers: 4,
    basePrice: 150,
    pricePerKm: 20,
    icon: '🚙',
    eta: '5-8 min'
  },
  { 
    id: 'minivan', 
    nameEn: 'Minivan', 
    nameRu: 'Минивэн',
    descEn: 'Toyota Innova or similar',
    descRu: 'Toyota Innova или аналог',
    maxPassengers: 6,
    basePrice: 200,
    pricePerKm: 25,
    icon: '🚐',
    eta: '8-12 min'
  },
  { 
    id: 'premium', 
    nameEn: 'Premium', 
    nameRu: 'Премиум',
    descEn: 'Mercedes or BMW',
    descRu: 'Mercedes или BMW',
    maxPassengers: 4,
    basePrice: 300,
    pricePerKm: 40,
    icon: '🚘',
    eta: '10-15 min'
  },
];

// Time options
const getTimeOptions = (language: string) => {
  const now = new Date();
  const options = [
    { id: 'now', label: language === 'ru' ? 'Сейчас' : 'Now', value: '' },
  ];
  
  // Add time slots for next 4 hours
  for (let i = 0; i < 8; i++) {
    const time = new Date(now.getTime() + (15 + i * 30) * 60 * 1000);
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = Math.round(time.getMinutes() / 15) * 15;
    const formattedMinutes = (minutes % 60).toString().padStart(2, '0');
    const adjustedHours = minutes >= 60 ? (parseInt(hours) + 1).toString().padStart(2, '0') : hours;
    const timeStr = `${adjustedHours}:${formattedMinutes}`;
    
    options.push({
      id: `time-${i}`,
      label: timeStr,
      value: time.toISOString(),
    });
  }
  
  return options;
};

// Simulated distance calculation
const getEstimatedDistance = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  // Add 20% for road distance vs straight line
  return Math.round(distance * 1.2 * 10) / 10;
};

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export default function TaxiBooking() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState<'pickup' | 'destination' | null>(null);
  
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  
  const [formData, setFormData] = useState({
    vehicleType: 'standard',
    passengers: 1,
    scheduledTime: '', // Empty for "now"
    phone: '',
    notes: '',
  });

  const selectedVehicle = vehicleOptions.find(v => v.id === formData.vehicleType);
  const estimatedDistance = pickupLocation && destinationLocation 
    ? getEstimatedDistance(pickupLocation, destinationLocation)
    : 0;
  const estimatedPrice = selectedVehicle 
    ? selectedVehicle.basePrice + (estimatedDistance * selectedVehicle.pricePerKm)
    : 0;

  const timeOptions = getTimeOptions(language);

  const handleLocationSelect = (location: LocationData) => {
    if (locationPickerType === 'pickup') {
      setPickupLocation(location);
    } else if (locationPickerType === 'destination') {
      setDestinationLocation(location);
    }
    setLocationPickerType(null);
  };

  const handlePassengerChange = (delta: number) => {
    const maxPassengers = selectedVehicle?.maxPassengers || 4;
    const newValue = Math.max(1, Math.min(maxPassengers, formData.passengers + delta));
    setFormData({ ...formData, passengers: newValue });
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

    if (!pickupLocation || !destinationLocation) {
      toast({
        title: language === 'ru' ? 'Укажите маршрут' : 'Enter route',
        description: language === 'ru' ? 'Выберите точку подачи и назначения' : 'Select pickup and destination',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'transport',
          status: 'submitted',
          scheduled_at: formData.scheduledTime || new Date().toISOString(),
          total_amount: Math.round(estimatedPrice),
          notes: `Taxi booking\nVehicle: ${formData.vehicleType}\nPassengers: ${formData.passengers}\nScheduled: ${formData.scheduledTime ? new Date(formData.scheduledTime).toLocaleString() : 'Now'}\n${formData.notes}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Add pickup address
      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: 'pickup',
        address: pickupLocation.address,
        lat: pickupLocation.lat,
        lng: pickupLocation.lng,
      });

      // Add destination address
      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: 'dropoff',
        address: destinationLocation.address,
        lat: destinationLocation.lat,
        lng: destinationLocation.lng,
      });

      // Add participant
      await supabase.from('booking_participants').insert({
        booking_id: booking.id,
        name: user.email?.split('@')[0] || 'Guest',
        phone: formData.phone,
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

  if (isSuccess) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {language === 'ru' ? 'Такси вызвано!' : 'Taxi Ordered!'}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            {language === 'ru' 
              ? `${selectedVehicle?.nameRu} • ~${selectedVehicle?.eta}`
              : `${selectedVehicle?.nameEn} • ~${selectedVehicle?.eta}`}
          </p>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {language === 'ru' 
              ? 'Водитель свяжется с вами в ближайшее время.'
              : 'Driver will contact you shortly.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/transport')}>
              {language === 'ru' ? 'К транспорту' : 'Back'}
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
          <BackButton fallbackPath="/transport" variant="ghost" />
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">
              {language === 'ru' ? 'Вызов такси' : 'Order Taxi'}
            </h1>
          </div>
        </div>

        {/* Location Picker Map Modal */}
        <LocationPickerMap
          isOpen={locationPickerType !== null}
          onClose={() => setLocationPickerType(null)}
          onLocationSelect={handleLocationSelect}
          type={locationPickerType || 'pickup'}
          initialLocation={
            locationPickerType === 'pickup' 
              ? pickupLocation 
              : destinationLocation
          }
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Selection */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
            {/* Pickup */}
            <button
              type="button"
              onClick={() => setLocationPickerType('pickup')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Откуда' : 'From'}
                </p>
                <p className={cn(
                  "truncate text-sm",
                  pickupLocation ? "text-foreground" : "text-muted-foreground"
                )}>
                  {pickupLocation?.address || (language === 'ru' ? 'Выберите на карте' : 'Select on map')}
                </p>
              </div>
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Divider with dots */}
            <div className="flex items-center gap-3 px-3">
              <div className="w-8 flex justify-center">
                <div className="w-0.5 h-6 bg-border rounded-full" />
              </div>
            </div>

            {/* Destination */}
            <button
              type="button"
              onClick={() => setLocationPickerType('destination')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Куда' : 'To'}
                </p>
                <p className={cn(
                  "truncate text-sm",
                  destinationLocation ? "text-foreground" : "text-muted-foreground"
                )}>
                  {destinationLocation?.address || (language === 'ru' ? 'Выберите на карте' : 'Select on map')}
                </p>
              </div>
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {language === 'ru' ? 'Время подачи' : 'Pickup Time'}
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {timeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduledTime: option.value })}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                    formData.scheduledTime === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              {language === 'ru' ? 'Пассажиры' : 'Passengers'}
            </Label>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50">
              <button
                type="button"
                onClick={() => handlePassengerChange(-1)}
                disabled={formData.passengers <= 1}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-50 hover:bg-muted/80 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold">{formData.passengers}</span>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' 
                    ? `макс. ${selectedVehicle?.maxPassengers || 4}` 
                    : `max ${selectedVehicle?.maxPassengers || 4}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePassengerChange(1)}
                disabled={formData.passengers >= (selectedVehicle?.maxPassengers || 4)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-50 hover:bg-muted/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {language === 'ru' ? 'Тип автомобиля' : 'Vehicle Type'}
            </Label>
            <div className="space-y-2">
              {vehicleOptions.filter(v => v.maxPassengers >= formData.passengers).map((vehicle) => {
                const price = vehicle.basePrice + (estimatedDistance * vehicle.pricePerKm);
                
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
                    <span className="text-3xl">{vehicle.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {language === 'ru' ? vehicle.nameRu : vehicle.nameEn}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {vehicle.eta}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' ? vehicle.descRu : vehicle.descEn}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Users className="w-3 h-3" />
                        <span>{language === 'ru' ? `до ${vehicle.maxPassengers} чел.` : `up to ${vehicle.maxPassengers}`}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {estimatedDistance > 0 ? (
                        <p className="font-bold text-primary">฿{Math.round(price)}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {language === 'ru' ? `от ฿${vehicle.basePrice}` : `from ฿${vehicle.basePrice}`}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estimated Trip Info */}
          {estimatedDistance > 0 && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Расстояние' : 'Distance'}
                </span>
                <span className="font-medium">~{estimatedDistance} km</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Пассажиры' : 'Passengers'}
                </span>
                <span className="font-medium">{formData.passengers}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Время подачи' : 'Pickup time'}
                </span>
                <span className="font-medium">
                  {formData.scheduledTime 
                    ? new Date(formData.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : (language === 'ru' ? 'Сейчас' : 'Now')}
                </span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Примерная стоимость' : 'Estimated price'}
                </span>
                <span className="font-bold text-primary text-lg">฿{Math.round(estimatedPrice)}</span>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {language === 'ru' ? 'Контакт (опционально)' : 'Contact (optional)'}
            </h3>
            <div>
              <Label>{language === 'ru' ? 'Телефон' : 'Phone'}</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+66 xxx xxx xxxx"
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Примечания' : 'Notes'}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === 'ru' ? 'Детские кресла, багаж и т.д.' : 'Child seats, luggage, etc.'}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !pickupLocation || !destinationLocation}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {isSubmitting ? (
                language === 'ru' ? 'Оформление...' : 'Processing...'
              ) : estimatedDistance > 0 ? (
                language === 'ru' 
                  ? `Вызвать за ฿${Math.round(estimatedPrice)}` 
                  : `Order for ฿${Math.round(estimatedPrice)}`
              ) : (
                language === 'ru' ? 'Выберите маршрут' : 'Select route'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
