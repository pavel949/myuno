import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useBooking } from '@/hooks/useBooking';
import { 
  BookingContactForm,
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation 
} from '@/components/booking';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getRestaurantById } from './restaurantsData';

export default function DeliveryCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { items, getItemsByProvider, clearCart } = useCart();
  const { createBooking, isSubmitting } = useBooking();

  const restaurant = getRestaurantById(id || '');
  const cartItems = getItemsByProvider(id || '');

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet' | 'online'>('cash');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    notes: '',
  });

  if (!restaurant) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Ресторан не найден' : 'Restaurant not found'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = restaurant.deliveryFee;
  const total = subtotal + deliveryFee;

  const isFormValid = address && contactData.name && contactData.phone && cartItems.length > 0;

  const handleSubmit = async () => {
    if (!user || !isFormValid) return;

    const result = await createBooking({
      bookingType: 'food_delivery',
      providerId: restaurant.id,
      serviceId: 'food-delivery',
      totalAmount: total,
      currency: 'THB',
      notes: `Payment: ${paymentMethod}. ${contactData.notes}`,
      paymentMethod,
      items: cartItems.map(item => ({
        itemType: 'food',
        itemName: language === 'ru' ? (item.nameRu || item.name) : item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      })),
      participants: [{
        name: contactData.name,
        phone: contactData.phone,
        isPrimary: true,
      }],
      addresses: [{
        addressType: 'delivery',
        address: address,
        notes: contactData.notes,
      }],
      metadata: {
        restaurantName: restaurant.nameEn,
        restaurantNameRu: restaurant.nameRu,
        deliveryTime: restaurant.deliveryTime,
      },
    });

    if (result.success) {
      clearCart();
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <BookingConfirmation
        title={language === 'ru' ? `Заказ из ${restaurant.nameRu}` : `Order from ${restaurant.nameEn}`}
        location={address}
        totalAmount={total}
        currency="฿"
        onViewBookings={() => navigate('/bookings')}
        onContinue={() => navigate('/restaurants')}
      />
    );
  }

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-4 px-4 py-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold">
                {language === 'ru' ? 'Оформление заказа' : 'Checkout'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? restaurant.nameRu : restaurant.nameEn}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Order Summary */}
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <h2 className="font-semibold mb-3">
              {language === 'ru' ? 'Ваш заказ' : 'Your Order'}
            </h2>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {language === 'ru' ? (item.nameRu || item.name) : item.name}</span>
                  <span>฿{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-2 mt-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{language === 'ru' ? 'Доставка' : 'Delivery'}</span>
                  <span>฿{deliveryFee}</span>
                </div>
                <div className="flex justify-between font-bold mt-1">
                  <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
                  <span className="text-primary">฿{total}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{language === 'ru' ? 'Доставка' : 'Delivery'}: {restaurant.deliveryTime} min</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <Label className="font-semibold">
                {language === 'ru' ? 'Адрес доставки' : 'Delivery Address'}
              </Label>
            </div>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={language === 'ru' 
                ? 'Улица, дом, квартира...' 
                : 'Street, building, apartment...'}
              required
            />
          </div>

          {/* Contact Form */}
          <BookingContactForm
            data={contactData}
            onChange={setContactData}
            showNotes
          />

          {/* Payment Method */}
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={total}
            currency="฿"
            showWallet
            showCash
          />
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={total}
          currency="฿"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!isFormValid}
          submitLabel={language === 'ru' ? `Заказать за ฿${total}` : `Order for ฿${total}`}
          showBreakdown={[
            { label: language === 'ru' ? 'Блюда' : 'Items', amount: subtotal },
            { label: language === 'ru' ? 'Доставка' : 'Delivery', amount: deliveryFee },
          ]}
        />
      </div>
    </AppLayout>
  );
}
