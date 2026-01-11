import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, Banknote, Check, Wallet, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWallet } from '@/hooks/useWallet';
import { useBooking } from '@/hooks/useBooking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/uno/BackButton';

export default function FoodCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { getItemsByProvider, clearByProvider } = useCart();
  const { balance, payFromWallet, hasEnoughBalance, isLoading: isWalletLoading } = useWallet();
  const { createBooking, isSubmitting } = useBooking();

  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    notes: '',
  });

  // Get cart items for this restaurant
  const cartItems = getItemsByProvider(id || '');
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;
  const canPayWithWallet = hasEnoughBalance(total);

  // Redirect if no items in cart
  useEffect(() => {
    if (!authLoading && cartItems.length === 0 && !isSuccess) {
      navigate(`/food/${id}`);
    }
  }, [cartItems.length, authLoading, isSuccess, navigate, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: language === 'ru' ? 'Требуется авторизация' : 'Login Required',
        description: language === 'ru' 
          ? 'Пожалуйста, войдите для оформления заказа' 
          : 'Please login to place an order',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!formData.address || !formData.phone) {
      toast({
        title: language === 'ru' ? 'Заполните поля' : 'Fill Required Fields',
        description: language === 'ru' 
          ? 'Укажите адрес и телефон' 
          : 'Please provide address and phone',
        variant: 'destructive',
      });
      return;
    }

    // If paying with wallet, deduct balance first
    if (paymentMethod === 'wallet') {
      const result = await payFromWallet(
        total,
        `Food order`,
        `Заказ еды`,
        'food_order'
      );
      
      if (!result.success) {
        toast({
          title: language === 'ru' ? 'Ошибка оплаты' : 'Payment Error',
          description: language === 'ru' 
            ? 'Недостаточно средств на кошельке' 
            : 'Insufficient wallet balance',
          variant: 'destructive',
        });
        return;
      }
    }

    const result = await createBooking({
      booking_type: 'food',
      provider_id: id,
      total_amount: total,
      currency: 'THB',
      notes: `Payment: ${paymentMethod}. ${formData.notes || ''}`,
      payment: { 
        amount: total, 
        payment_method: paymentMethod as 'cash' | 'card' | 'wallet' | 'online',
        status: paymentMethod === 'wallet' ? 'paid' : 'pending',
      },
      items: cartItems.map(item => ({
        item_type: 'food',
        item_name: language === 'ru' ? (item.nameRu || item.name) : item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      })),
      participants: [{
        name: user.email?.split('@')[0] || 'Customer',
        phone: formData.phone,
        is_primary: true,
      }],
      addresses: [{
        address_type: 'delivery',
        address: formData.address,
        notes: formData.notes,
      }],
    });

    if (result.success && result.booking_id) {
      setBookingId(result.booking_id);
      clearByProvider(id || '');
      setIsSuccess(true);
      toast({
        title: language === 'ru' ? 'Заказ оформлен!' : 'Order Placed!',
        description: paymentMethod === 'wallet'
          ? (language === 'ru' ? 'Оплачено из кошелька' : 'Paid from wallet')
          : (language === 'ru' ? 'Ваш заказ принят и готовится' : 'Your order has been received'),
      });
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
            {language === 'ru' ? 'Заказ оформлен!' : 'Order Placed!'}
          </h2>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            {language === 'ru' 
              ? 'Ваш заказ принят. Ожидайте доставку через 25-35 минут.'
              : 'Your order has been received. Expected delivery in 25-35 minutes.'}
          </p>
          <div className="flex items-center gap-2 text-primary mb-8">
            <Clock className="w-5 h-5" />
            <span className="font-medium">25-35 min</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/restaurants')}>
              {language === 'ru' ? 'К ресторанам' : 'Browse More'}
            </Button>
            <Button onClick={() => navigate('/bookings')}>
              {language === 'ru' ? 'Мои заказы' : 'My Orders'}
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
          <BackButton fallbackPath="/food" variant="ghost" />
          <h1 className="text-xl font-display font-bold">
            {language === 'ru' ? 'Оформление заказа' : 'Checkout'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={language === 'ru' 
                ? 'Улица, дом, квартира...' 
                : 'Street, building, apartment...'}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <Label htmlFor="phone">
              {language === 'ru' ? 'Телефон' : 'Phone'} *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+66 XX XXX XXXX"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="font-semibold">
              {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
            </Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {/* Wallet Option */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                canPayWithWallet 
                  ? 'bg-card border-border/50' 
                  : 'bg-muted/50 border-border/30 opacity-60'
              }`}>
                <RadioGroupItem value="wallet" id="wallet" disabled={!canPayWithWallet} />
                <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <span>{language === 'ru' ? 'Из кошелька' : 'From Wallet'}</span>
                    <div className="text-xs text-muted-foreground">
                      {isWalletLoading ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                        </span>
                      ) : (
                        <>
                          {language === 'ru' ? 'Баланс:' : 'Balance:'} ₽{balance.toLocaleString()}
                          {!canPayWithWallet && (
                            <span className="text-destructive ml-2">
                              ({language === 'ru' ? 'недостаточно средств' : 'insufficient funds'})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border/50">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                  <Banknote className="w-5 h-5 text-success" />
                  {language === 'ru' ? 'Наличными' : 'Cash on Delivery'}
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border/50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {language === 'ru' ? 'Картой' : 'Card Payment'}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">
              {language === 'ru' ? 'Комментарий к заказу' : 'Order Notes'}
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
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (language === 'ru' ? 'Оформление...' : 'Placing Order...') 
              : (language === 'ru' ? `Заказать за ฿${total}` : `Order for ฿${total}`)}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
