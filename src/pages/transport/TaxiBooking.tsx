import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, Users, Check, Car, Zap } from 'lucide-react';
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

// Popular locations for quick selection
const popularLocations = [
  { id: 'patong', nameEn: 'Patong Beach', nameRu: 'Пляж Патонг' },
  { id: 'kata', nameEn: 'Kata Beach', nameRu: 'Пляж Ката' },
  { id: 'karon', nameEn: 'Karon Beach', nameRu: 'Пляж Карон' },
  { id: 'rawai', nameEn: 'Rawai', nameRu: 'Равай' },
  { id: 'phuket-town', nameEn: 'Phuket Town', nameRu: 'Пхукет Таун' },
  { id: 'airport', nameEn: 'Phuket Airport', nameRu: 'Аэропорт Пхукета' },
  { id: 'central', nameEn: 'Central Festival', nameRu: 'Централ Фестиваль' },
  { id: 'jungceylon', nameEn: 'Jungceylon', nameRu: 'Джангцейлон' },
];

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

// Simulated distance calculation (in a real app, this would use a maps API)
const getEstimatedDistance = (from: string, to: string): number => {
  // Simple mock - returns random distance between 5-25km
  const hash = (from + to).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return 5 + (hash % 20);
};

export default function TaxiBooking() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState<'pickup' | 'destination' | null>(null);
  
  const [formData, setFormData] = useState({
    pickupLocation: '',
    destination: '',
    vehicleType: 'standard',
    passengers: '1',
    scheduledTime: '', // Empty for "now", or a datetime
    name: '',
    phone: '',
    notes: '',
  });

  const selectedVehicle = vehicleOptions.find(v => v.id === formData.vehicleType);
  const estimatedDistance = formData.pickupLocation && formData.destination 
    ? getEstimatedDistance(formData.pickupLocation, formData.destination)
    : 0;
  const estimatedPrice = selectedVehicle 
    ? selectedVehicle.basePrice + (estimatedDistance * selectedVehicle.pricePerKm)
    : 0;

  const handleLocationSelect = (location: typeof popularLocations[0]) => {
    if (showLocationPicker === 'pickup') {
      setFormData({ ...formData, pickupLocation: language === 'ru' ? location.nameRu : location.nameEn });
    } else if (showLocationPicker === 'destination') {
      setFormData({ ...formData, destination: language === 'ru' ? location.nameRu : location.nameEn });
    }
    setShowLocationPicker(null);
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

    if (!formData.pickupLocation || !formData.destination) {
      toast({
        title: language === 'ru' ? 'Укажите маршрут' : 'Enter route',
        description: language === 'ru' ? 'Выберите точку отправления и назначения' : 'Select pickup and destination',
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
          total_amount: estimatedPrice,
          notes: `Taxi booking\nVehicle: ${formData.vehicleType}\nPassengers: ${formData.passengers}\n${formData.notes}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Add pickup address
      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: 'pickup',
        address: formData.pickupLocation,
      });

      // Add destination address
      await supabase.from('booking_addresses').insert({
        booking_id: booking.id,
        address_type: 'dropoff',
        address: formData.destination,
      });

      // Add participant
      await supabase.from('booking_participants').insert({
        booking_id: booking.id,
        name: formData.name || user.email?.split('@')[0] || 'Guest',
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
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">
              {language === 'ru' ? 'Вызов такси' : 'Order Taxi'}
            </h1>
          </div>
        </div>

        {/* Location Picker Modal */}
        {showLocationPicker && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-6">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setShowLocationPicker(null)} className="text-muted-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold">
                  {showLocationPicker === 'pickup' 
                    ? (language === 'ru' ? 'Откуда забрать?' : 'Pickup location')
                    : (language === 'ru' ? 'Куда едем?' : 'Where to?')}
                </h2>
              </div>
              
              <Input
                placeholder={language === 'ru' ? 'Введите адрес...' : 'Enter address...'}
                className="mb-4"
                autoFocus
                onChange={(e) => {
                  if (showLocationPicker === 'pickup') {
                    setFormData({ ...formData, pickupLocation: e.target.value });
                  } else {
                    setFormData({ ...formData, destination: e.target.value });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowLocationPicker(null);
                  }
                }}
              />
              
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'ru' ? 'Популярные места' : 'Popular locations'}
              </p>
              
              <div className="space-y-2">
                {popularLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all text-left"
                  >
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>{language === 'ru' ? location.nameRu : location.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Selection */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
            {/* Pickup */}
            <button
              type="button"
              onClick={() => setShowLocationPicker('pickup')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Откуда' : 'From'}
                </p>
                <p className={cn(
                  "truncate",
                  formData.pickupLocation ? "text-foreground" : "text-muted-foreground"
                )}>
                  {formData.pickupLocation || (language === 'ru' ? 'Выберите адрес' : 'Select location')}
                </p>
              </div>
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
              onClick={() => setShowLocationPicker('destination')}
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
                  "truncate",
                  formData.destination ? "text-foreground" : "text-muted-foreground"
                )}>
                  {formData.destination || (language === 'ru' ? 'Выберите адрес' : 'Select destination')}
                </p>
              </div>
            </button>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {language === 'ru' ? 'Тип автомобиля' : 'Vehicle Type'}
            </Label>
            <div className="space-y-2">
              {vehicleOptions.map((vehicle) => {
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
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Примерная стоимость' : 'Estimated price'}
                </span>
                <span className="font-bold text-primary text-lg">฿{Math.round(estimatedPrice)}</span>
              </div>
            </div>
          )}

          {/* Contact (optional for quick booking) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {language === 'ru' ? 'Контакт (опционально)' : 'Contact (optional)'}
              </h3>
            </div>
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
                placeholder={language === 'ru' 
                  ? 'Подъезд, особые пожелания...' 
                  : 'Building entrance, special requests...'}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base"
            disabled={isSubmitting || !formData.pickupLocation || !formData.destination}
          >
            <Zap className="w-5 h-5 mr-2" />
            {isSubmitting 
              ? (language === 'ru' ? 'Вызываем...' : 'Ordering...') 
              : estimatedPrice > 0
                ? (language === 'ru' ? `Вызвать такси ~฿${Math.round(estimatedPrice)}` : `Order Taxi ~฿${Math.round(estimatedPrice)}`)
                : (language === 'ru' ? 'Вызвать такси' : 'Order Taxi')}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
