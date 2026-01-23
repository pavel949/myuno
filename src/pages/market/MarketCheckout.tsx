import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Truck, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { useDeliverySettings } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  type PaymentMethod 
} from '@/components/booking';
import { EmptyState } from '@/components/uno/EmptyState';

// Order Item Card Component
interface OrderItemProps {
  item: {
    id: string;
    name: string;
    nameRu?: string;
    price: number;
    quantity: number;
    image?: string;
  };
  language: string;
}

const OrderItemCard = ({ item, language }: OrderItemProps) => (
  <div className="flex items-center gap-3 py-3">
    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm line-clamp-1">
        {language === 'ru' && item.nameRu ? item.nameRu : item.name}
      </p>
      <p className="text-xs text-muted-foreground">
        ฿{item.price.toLocaleString()} × {item.quantity}
      </p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="font-semibold text-sm">฿{(item.price * item.quantity).toLocaleString()}</p>
    </div>
  </div>
);

// Free Delivery Progress Component
interface FreeDeliveryProgressProps {
  subtotal: number;
  threshold: number;
  remaining: number;
  language: string;
}

const FreeDeliveryProgress = ({ subtotal, threshold, remaining, language }: FreeDeliveryProgressProps) => {
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const isFree = remaining <= 0;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        {isFree ? (
          <>
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">
              {language === 'ru' ? 'Бесплатная доставка!' : 'Free Delivery!'}
            </span>
          </>
        ) : (
          <>
            <Truck className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? `Ещё ฿${remaining.toLocaleString()} до бесплатной доставки`
                : `฿${remaining.toLocaleString()} more for free delivery`}
            </span>
          </>
        )}
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>฿0</span>
        <span>฿{threshold.toLocaleString()}</span>
      </div>
    </div>
  );
};

const MarketCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { getItemsByType, clearByType } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { createBooking, isSubmitting } = useBooking();
  const { calculateDeliveryFee, freeDeliveryThreshold, amountToFreeDelivery, isLoading: deliveryLoading } = useDeliverySettings();
  
  const storeInfo = location.state as { storeId: string; storeName: string; storeNameRu: string; deliveryFee: number; minOrder: number } | undefined;
  const cartItems = getItemsByType('product').filter(item => storeInfo ? item.providerId === storeInfo.storeId : true);

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Use dynamic delivery fee from database
  const deliveryFee = calculateDeliveryFee(subtotal);
  const remaining = amountToFreeDelivery(subtotal);
  const total = subtotal + deliveryFee;

  // Auth redirect
  if (!authLoading && !user) {
    navigate('/auth', { state: { from: '/market/checkout' } });
    return null;
  }

  // Success state
  if (bookingResult?.success && bookingResult.bookingId) {
    return (
      <AppLayout>
        <BookingConfirmation
          bookingId={bookingResult.bookingId}
          title={language === 'ru' 
            ? (storeInfo?.storeNameRu || 'Заказ из маркета') 
            : (storeInfo?.storeName || 'Market Order')}
          total={total}
          currency="THB"
          continuePath="/market"
          continueLabel={language === 'ru' ? 'К магазинам' : 'Browse Stores'}
        />
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address) return;

    const items = cartItems.map(item => ({
      item_type: 'product',
      item_id: item.id,
      item_name: language === 'ru' ? (item.nameRu || item.name) : item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    // Add delivery fee if not free
    if (deliveryFee > 0) {
      items.push({
        item_type: 'fee',
        item_id: 'delivery_fee',
        item_name: language === 'ru' ? 'Доставка' : 'Delivery',
        quantity: 1,
        unit_price: deliveryFee,
        subtotal: deliveryFee,
      });
    }

    const result = await createBooking({
      booking_type: 'product',
      scheduled_at: new Date(),
      total_amount: total,
      currency: 'THB',
      notes: `Store: ${storeInfo?.storeName || 'Market'}`,
      items,
      participants: [{
        name: formData.name,
        phone: formData.phone,
        is_primary: true,
      }],
      addresses: [{
        address_type: 'delivery',
        address: formData.address,
        notes: formData.notes,
      }],
      payment: {
        amount: total,
        payment_method: paymentMethod,
      },
    });

    if (result.success) {
      clearByType('product');
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  if (cartItems.length === 0) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={language === 'ru' ? 'Оформление заказа' : 'Checkout'} showBack />
          <EmptyState
            icon={ShoppingBag}
            title={language === 'ru' ? 'Корзина пуста' : 'Cart is empty'}
            description={language === 'ru' ? 'Добавьте товары в корзину' : 'Add items to your cart'}
            action={
              <Button onClick={() => navigate('/market')}>
                {language === 'ru' ? 'Перейти в магазин' : 'Go to market'}
              </Button>
            }
          />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer className="pb-32">
        <PageHeader 
          title={language === 'ru' ? 'Оформление заказа' : 'Checkout'} 
          showBack 
          fallbackPath="/market"
        />

        {/* Free Delivery Progress */}
        {!deliveryLoading && (
          <FreeDeliveryProgress
            subtotal={subtotal}
            threshold={freeDeliveryThreshold}
            remaining={remaining}
            language={language}
          />
        )}

        {/* Order Items */}
        <div className="bg-card rounded-2xl border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Ваш заказ' : 'Your Order'}
            </h3>
            <span className="text-sm text-muted-foreground">
              {cartItems.length} {language === 'ru' ? 'товаров' : 'items'}
            </span>
          </div>
          <div className="divide-y divide-border">
            {cartItems.map(item => (
              <OrderItemCard 
                key={item.id} 
                item={item} 
                language={language} 
              />
            ))}
          </div>
        </div>

        {/* Store Info */}
        {storeInfo && (
          <Card className="mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{language === 'ru' ? storeInfo.storeNameRu : storeInfo.storeName}</h3>
                <p className="text-sm text-muted-foreground">{cartItems.length} {language === 'ru' ? 'товаров' : 'items'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{language === 'ru' ? 'Адрес доставки' : 'Delivery Address'}</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label>{language === 'ru' ? 'Имя' : 'Name'} *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="+66" 
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Адрес' : 'Address'} *</Label>
              <Input 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ru' ? 'Комментарий' : 'Notes'}</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                rows={2} 
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            amount={total}
            currency="THB"
            showWallet
            showCash
          />
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">{language === 'ru' ? 'Итого' : 'Order Summary'}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'ru' ? 'Товары' : 'Subtotal'}</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'ru' ? 'Доставка' : 'Delivery'}</span>
              {deliveryFee === 0 ? (
                <span className="text-primary font-medium">{language === 'ru' ? 'Бесплатно' : 'Free'}</span>
              ) : (
                <span>฿{deliveryFee.toLocaleString()}</span>
              )}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary">฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={total}
          currency="THB"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!formData.name || !formData.phone || !formData.address}
          submitLabel={language === 'ru' ? 'Оформить заказ' : 'Place Order'}
        />
      </PageContainer>
    </AppLayout>
  );
};

export default MarketCheckout;
