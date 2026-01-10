import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Clock, CreditCard, Wallet, Banknote, Truck, Tag, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/uno/BackButton';

const paymentMethods = [
  { id: 'card', icon: CreditCard, labelEn: 'Credit Card', labelRu: 'Банковская карта' },
  { id: 'cash', icon: Banknote, labelEn: 'Cash on Delivery', labelRu: 'Наличными курьеру' },
  { id: 'wallet', icon: Wallet, labelEn: 'UNO Wallet', labelRu: 'Кошелёк UNO' },
];

const MarketCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { getItemsByType, clearCart } = useCart();
  const { user } = useAuth();
  
  const storeInfo = location.state as { storeId: string; storeName: string; storeNameRu: string; deliveryFee: number; minOrder: number } | undefined;
  const cartItems = getItemsByType('product').filter(item => storeInfo ? item.providerId === storeInfo.storeId : true);

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', apartment: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = storeInfo?.deliveryFee || 50;
  const total = subtotal + deliveryFee;

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error(language === 'ru' ? 'Заполните все обязательные поля' : 'Please fill all required fields');
      return;
    }
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите для оформления заказа' : 'Please sign in to place order');
      navigate('/auth');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: booking, error } = await supabase.from('bookings').insert([{
        user_id: user.id,
        booking_type: 'product' as const,
        status: 'submitted' as const,
        scheduled_at: new Date().toISOString(),
        total_amount: total,
        currency: 'THB',
        notes: `Store: ${storeInfo?.storeName || 'Market'}\nDelivery: ${formData.address}`,
      }]).select().single();
      if (error) throw error;
      clearCart();
      toast.success(language === 'ru' ? 'Заказ оформлен!' : 'Order placed!');
      navigate('/bookings');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка оформления заказа' : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <AppLayout>
        <div className="p-4 text-center py-12">
          <p className="text-muted-foreground">{language === 'ru' ? 'Корзина пуста' : 'Cart is empty'}</p>
          <Button className="mt-4" onClick={() => navigate('/market')}>{language === 'ru' ? 'Перейти в магазин' : 'Go to market'}</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <BackButton fallbackPath="/market" />
          <h1 className="text-lg font-semibold">{language === 'ru' ? 'Оформление заказа' : 'Checkout'}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-40">
        {storeInfo && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Truck className="w-6 h-6 text-primary" /></div>
              <div>
                <h3 className="font-semibold">{language === 'ru' ? storeInfo.storeNameRu : storeInfo.storeName}</h3>
                <p className="text-sm text-muted-foreground">{cartItems.length} {language === 'ru' ? 'товаров' : 'items'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /><h3 className="font-semibold">{language === 'ru' ? 'Адрес доставки' : 'Delivery Address'}</h3></div>
            <div className="space-y-3">
              <div><Label>{language === 'ru' ? 'Имя' : 'Name'} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div><Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+66" /></div>
              <div><Label>{language === 'ru' ? 'Адрес' : 'Address'} *</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div><Label>{language === 'ru' ? 'Комментарий' : 'Notes'}</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /><h3 className="font-semibold">{language === 'ru' ? 'Способ оплаты' : 'Payment Method'}</h3></div>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border")}>
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">{language === 'ru' ? method.labelRu : method.labelEn}</Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">{language === 'ru' ? 'Итого' : 'Order Summary'}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ru' ? 'Товары' : 'Subtotal'}</span><span>฿{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ru' ? 'Доставка' : 'Delivery'}</span><span>฿{deliveryFee}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold text-base"><span>{language === 'ru' ? 'Итого' : 'Total'}</span><span>฿{total.toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
        <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <span>{language === 'ru' ? 'Оформление...' : 'Processing...'}</span> : <><CheckCircle2 className="w-5 h-5 mr-2" />{language === 'ru' ? 'Оформить заказ' : 'Place Order'}<span className="ml-auto">฿{total.toLocaleString()}</span></>}
        </Button>
      </div>
    </AppLayout>
  );
};

export default MarketCheckout;
