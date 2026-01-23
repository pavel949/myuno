import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Clock, Users, Check, Minus, Plus, Loader2, Crosshair } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useBooking } from '@/hooks/useBooking';
import { useVehicleTypes, VehicleType } from '@/hooks/useTransportConfig';
import { cn } from '@/lib/utils';
import LocationPickerMap from '@/components/transport/LocationPickerMap';
import { BackButton } from '@/components/uno/BackButton';
import { supabase } from '@/integrations/supabase/client';

// Time options generator
const getTimeOptions = (language: string) => {
  const now = new Date();
  const options = [
    { id: 'now', label: language === 'ru' ? 'Сейчас' : 'Now', value: '' },
  ];
  
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

// Distance calculation
const getEstimatedDistance = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
  const R = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
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
  const { vehicleTypes, isLoading: isLoadingVehicles } = useVehicleTypes('taxi');
  const { createBooking, isSubmitting } = useBooking();

  const [isSuccess, setIsSuccess] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState<'pickup' | 'destination' | null>(null);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  
  const [formData, setFormData] = useState({
    vehicleType: '',
    passengers: 1,
    scheduledTime: '',
    phone: '',
    notes: '',
  });

  // Get current location and reverse geocode
  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: language === 'ru' ? 'Геолокация недоступна' : 'Geolocation unavailable',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingCurrentLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get mapbox token and reverse geocode
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      if (tokenData?.token) {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${tokenData.token}&language=${language}`
        );
        const data = await response.json();
        
        const address = data.features?.[0]?.place_name || 
          (language === 'ru' ? 'Текущее местоположение' : 'Current location');
        
        setPickupLocation({
          address,
          lat: latitude,
          lng: longitude,
        });
        
        toast({
          title: language === 'ru' ? 'Местоположение определено' : 'Location detected',
          description: address,
        });
      }
    } catch (error: any) {
      let message = language === 'ru' ? 'Не удалось определить местоположение' : 'Could not get location';
      
      if (error.code === 1) {
        message = language === 'ru' 
          ? 'Доступ к геолокации запрещён. Разрешите в настройках браузера.' 
          : 'Location access denied. Enable in browser settings.';
      } else if (error.code === 2) {
        message = language === 'ru' ? 'Местоположение недоступно' : 'Location unavailable';
      } else if (error.code === 3) {
        message = language === 'ru' ? 'Превышено время ожидания' : 'Request timed out';
      }
      
      toast({
        title: message,
        variant: 'destructive',
      });
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  // Set default vehicle type when loaded
  useEffect(() => {
    if (vehicleTypes.length > 0 && !formData.vehicleType) {
      setFormData(prev => ({ ...prev, vehicleType: vehicleTypes[0].id }));
    }
  }, [vehicleTypes, formData.vehicleType]);

  const selectedVehicle = useMemo(() => 
    vehicleTypes.find(v => v.id === formData.vehicleType),
    [vehicleTypes, formData.vehicleType]
  );

  const estimatedDistance = useMemo(() => 
    pickupLocation && destinationLocation 
      ? getEstimatedDistance(pickupLocation, destinationLocation)
      : 0,
    [pickupLocation, destinationLocation]
  );

  const estimatedPrice = useMemo(() => 
    selectedVehicle 
      ? selectedVehicle.base_price + (estimatedDistance * selectedVehicle.price_per_km)
      : 0,
    [selectedVehicle, estimatedDistance]
  );

  const timeOptions = useMemo(() => getTimeOptions(language), [language]);

  const handleLocationSelect = (location: LocationData) => {
    if (locationPickerType === 'pickup') {
      setPickupLocation(location);
    } else if (locationPickerType === 'destination') {
      setDestinationLocation(location);
    }
    setLocationPickerType(null);
  };

  const handlePassengerChange = (delta: number) => {
    const maxPassengers = selectedVehicle?.max_passengers || 4;
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

    const result = await createBooking({
      booking_type: 'transport',
      scheduled_at: formData.scheduledTime || new Date().toISOString(),
      total_amount: Math.round(estimatedPrice),
      currency: 'THB',
      notes: `Taxi booking\nVehicle: ${selectedVehicle?.name_en || formData.vehicleType}\nPassengers: ${formData.passengers}\nScheduled: ${formData.scheduledTime ? new Date(formData.scheduledTime).toLocaleString() : 'Now'}\n${formData.notes}`,
      participants: [{
        name: user.email?.split('@')[0] || 'Guest',
        phone: formData.phone,
        is_primary: true,
      }],
      addresses: [
        {
          address_type: 'pickup',
          address: pickupLocation.address,
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
        },
        {
          address_type: 'dropoff',
          address: destinationLocation.address,
          lat: destinationLocation.lat,
          lng: destinationLocation.lng,
        },
      ],
      metadata: {
        vehicle_type: formData.vehicleType,
        passengers: formData.passengers,
        distance_km: estimatedDistance,
      },
    });

    if (result.success && result.booking_id) {
      // Save transport-specific details to order_item_transport_details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', result.booking_id)
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        await supabase
          .from('order_item_transport_details')
          .insert({
            order_item_id: orderItems[0].id,
            vehicle_type: formData.vehicleType,
            passenger_count: formData.passengers,
            is_round_trip: false,
          });
      }

      setIsSuccess(true);
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
              ? `${selectedVehicle?.name_ru} • ~${selectedVehicle?.eta_minutes || 5} мин`
              : `${selectedVehicle?.name_en} • ~${selectedVehicle?.eta_minutes || 5} min`}
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
            {/* Current Location Quick Button */}
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isGettingCurrentLocation}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                {isGettingCurrentLocation ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Crosshair className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">
                  {language === 'ru' ? 'Моё местоположение' : 'My location'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Определить автоматически' : 'Detect automatically'}
                </p>
              </div>
              <Navigation className="w-5 h-5 text-primary" />
            </button>

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

            {/* Divider */}
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
                    ? `макс. ${selectedVehicle?.max_passengers || 4}` 
                    : `max ${selectedVehicle?.max_passengers || 4}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePassengerChange(1)}
                disabled={formData.passengers >= (selectedVehicle?.max_passengers || 4)}
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
              {vehicleTypes
                .filter(v => v.max_passengers >= formData.passengers)
                .map((vehicle) => {
                  const price = vehicle.base_price + (estimatedDistance * vehicle.price_per_km);
                  
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
                      <span className="text-3xl">{vehicle.icon || '🚗'}</span>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {language === 'ru' ? vehicle.name_ru : vehicle.name_en}
                          </p>
                          {vehicle.eta_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {vehicle.eta_minutes} min
                            </span>
                          )}
                        </div>
                        {vehicle.description_en && (
                          <p className="text-xs text-muted-foreground">
                            {language === 'ru' ? vehicle.description_ru : vehicle.description_en}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Users className="w-3 h-3" />
                          <span>{language === 'ru' ? `до ${vehicle.max_passengers} чел.` : `up to ${vehicle.max_passengers}`}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {estimatedDistance > 0 ? (
                          <p className="font-bold text-primary">฿{Math.round(price)}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {language === 'ru' ? `от ฿${vehicle.base_price}` : `from ฿${vehicle.base_price}`}
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
                <span className="font-medium">{estimatedDistance} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Примерная стоимость' : 'Estimated price'}
                </span>
                <span className="font-bold text-lg text-primary">฿{Math.round(estimatedPrice)}</span>
              </div>
            </div>
          )}

          {/* Phone */}
          <div className="space-y-3">
            <Label htmlFor="phone">
              {language === 'ru' ? 'Телефон' : 'Phone'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+66 XX XXX XXXX"
            />
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">
              {language === 'ru' ? 'Комментарий' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'ru' 
                ? 'Особые пожелания...' 
                : 'Special requests...'}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg"
            disabled={isSubmitting || !pickupLocation || !destinationLocation}
          >
            {isSubmitting 
              ? (language === 'ru' ? 'Оформление...' : 'Booking...') 
              : estimatedDistance > 0 
                ? (language === 'ru' ? `Вызвать такси за ฿${Math.round(estimatedPrice)}` : `Order Taxi for ฿${Math.round(estimatedPrice)}`)
                : (language === 'ru' ? 'Вызвать такси' : 'Order Taxi')}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
