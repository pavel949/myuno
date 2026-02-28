import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestServiceOrders, CreateServiceOrderInput } from '@/hooks/useServiceOrders';
import { useGuestPropertyBookings } from '@/hooks/usePropertyBookings';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Sparkles, Car, ShoppingBag, Wrench, Star } from 'lucide-react';
import {
  GuestStayBlock,
  GuestOrdersBlock,
  GuestServicesBlock,
  GuestMessagesBlock,
} from '@/components/guest/dashboard';

const serviceTypes = [
  { id: 'cleaning', icon: Sparkles, label: { en: 'Cleaning', ru: 'Уборка' } },
  { id: 'transport', icon: Car, label: { en: 'Transport', ru: 'Транспорт' } },
  { id: 'delivery', icon: ShoppingBag, label: { en: 'Delivery', ru: 'Доставка' } },
  { id: 'maintenance', icon: Wrench, label: { en: 'Maintenance', ru: 'Ремонт' } },
];

export default function MyStay() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const { activeBookings, isLoading: bookingsLoading } = useGuestPropertyBookings();
  const {
    activeOrders,
    isLoading: ordersLoading,
    createOrder,
    rateOrder,
  } = useGuestServiceOrders();

  const currentBooking = activeBookings[0];
  const isLoading = bookingsLoading || ordersLoading;

  // Auth gate - now handled by GuestLayout, but keep for safety
  if (!user) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-4 rounded-full bg-muted">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {isRu ? 'Войдите для просмотра' : 'Please login to view'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Login'}
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateOrder = async () => {
    if (!selectedServiceType) return;
    const serviceLabel = serviceTypes.find((s) => s.id === selectedServiceType)?.label;
    const input: CreateServiceOrderInput = {
      booking_id: currentBooking?.id,
      property_id: currentBooking?.property_id,
      service_type: selectedServiceType,
      service_name: serviceLabel?.en || selectedServiceType,
      service_name_ru: serviceLabel?.ru,
      notes: orderNotes,
    };
    await createOrder.mutateAsync(input);
    setOrderDialogOpen(false);
    setSelectedServiceType('');
    setOrderNotes('');
  };

  const handleRateOrder = async () => {
    if (!ratingOrderId) return;
    await rateOrder.mutateAsync({ orderId: ratingOrderId, rating, review: reviewText });
    setRatingDialogOpen(false);
    setRatingOrderId(null);
    setRating(5);
    setReviewText('');
  };

  // Transform booking for StayBlock
  const stayBooking = currentBooking
    ? {
        id: currentBooking.id,
        check_in: currentBooking.check_in,
        check_out: currentBooking.check_out,
        property_id: currentBooking.property_id,
        property: (currentBooking as any).owner_properties
          ? {
              title: (currentBooking as any).owner_properties.title || (currentBooking as any).owner_properties.title_en,
              address: (currentBooking as any).owner_properties.address,
              cover_image: (currentBooking as any).owner_properties.cover_image,
            }
          : undefined,
      }
    : null;

  return (
    <div className="p-4 space-y-3">

      {/* Row 1: Stay + Orders (side by side on larger screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GuestStayBlock booking={stayBooking} loading={bookingsLoading} />
        <GuestOrdersBlock
          activeOrders={activeOrders}
          loading={ordersLoading}
          onViewAll={() => setOrderDialogOpen(true)}
        />
      </div>

      {/* Row 2: Services */}
      <GuestServicesBlock />

      {/* Row 3: Messages */}
      <GuestMessagesBlock unreadCount={0} loading={isLoading} />

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Новый заказ' : 'New Order'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{isRu ? 'Тип услуги' : 'Service Type'}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {serviceTypes.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant={selectedServiceType === service.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setSelectedServiceType(service.id)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{service.label[isRu ? 'ru' : 'en']}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>{isRu ? 'Комментарий' : 'Notes'}</Label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={isRu ? 'Опишите что нужно...' : 'Describe what you need...'}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateOrder} disabled={!selectedServiceType || createOrder.isPending}>
              {isRu ? 'Заказать' : 'Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Оценить услугу' : 'Rate Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1">
                  <Star className={`w-8 h-8 ${star <= rating ? 'text-warning fill-warning' : 'text-muted'}`} />
                </button>
              ))}
            </div>
            <div>
              <Label>{isRu ? 'Отзыв (необязательно)' : 'Review (optional)'}</Label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={isRu ? 'Поделитесь впечатлениями...' : 'Share your experience...'}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleRateOrder} disabled={rateOrder.isPending}>
              {isRu ? 'Отправить' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
