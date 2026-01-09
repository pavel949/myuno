import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, Truck, Gift, Check, Wallet, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { triggerRipple } from '@/hooks/useRipple';

const deliverySlots = [
  { id: 'morning', timeEn: '9:00 - 12:00', timeRu: '9:00 - 12:00', labelEn: 'Morning', labelRu: 'Утро' },
  { id: 'afternoon', timeEn: '12:00 - 17:00', timeRu: '12:00 - 17:00', labelEn: 'Afternoon', labelRu: 'День' },
  { id: 'evening', timeEn: '17:00 - 21:00', timeRu: '17:00 - 21:00', labelEn: 'Evening', labelRu: 'Вечер' },
];

const FlowersOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { language } = useLanguage();
  const { balance, payFromWallet, hasEnoughBalance, isLoading: isWalletLoading } = useWallet();
  
  const { cart = {}, totalPrice = 0 } = (location.state as { cart: Record<string, number>; totalPrice: number }) || {};

  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    address: '',
    deliveryDate: '',
    deliverySlot: 'afternoon',
    message: '',
    paymentMethod: 'card',
    giftWrap: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = 100;
  const giftWrapFee = formData.giftWrap ? 150 : 0;
  const finalTotal = totalPrice + deliveryFee + giftWrapFee;
  const canPayWithWallet = hasEnoughBalance(finalTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientName || !formData.recipientPhone || !formData.address || !formData.deliveryDate) {
      toast.error(language === 'ru' ? 'Заполните все обязательные поля' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // If paying with wallet, deduct balance first
      if (formData.paymentMethod === 'wallet') {
        const result = await payFromWallet(
          finalTotal,
          `Flower order`,
          `Заказ цветов`,
          'flower_order'
        );
        
        if (!result.success) {
          toast.error(language === 'ru' ? 'Недостаточно средств на кошельке' : 'Insufficient wallet balance');
          setIsSubmitting(false);
          return;
        }
      }

      // Simulate order submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success(
        formData.paymentMethod === 'wallet'
          ? (language === 'ru' ? 'Заказ оплачен из кошелька!' : 'Order paid from wallet!')
          : (language === 'ru' ? 'Заказ успешно оформлен!' : 'Order placed successfully!')
      );
      
      navigate('/bookings');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при оформлении заказа' : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold">
                {language === 'ru' ? 'Оформление заказа' : 'Checkout'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Доставка цветов' : 'Flower Delivery'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-32">
          {/* Recipient Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Информация о получателе' : 'Recipient Information'}
            </h2>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="recipientName">
                  {language === 'ru' ? 'Имя получателя *' : 'Recipient Name *'}
                </Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder={language === 'ru' ? 'Введите имя' : 'Enter name'}
                />
              </div>
              
              <div>
                <Label htmlFor="recipientPhone">
                  {language === 'ru' ? 'Телефон получателя *' : 'Recipient Phone *'}
                </Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="+66 xxx xxx xxxx"
                />
              </div>
              
              <div>
                <Label htmlFor="address">
                  {language === 'ru' ? 'Адрес доставки *' : 'Delivery Address *'}
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={language === 'ru' ? 'Полный адрес доставки' : 'Full delivery address'}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Время доставки' : 'Delivery Time'}
            </h2>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="deliveryDate">
                  {language === 'ru' ? 'Дата доставки *' : 'Delivery Date *'}
                </Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <Label>{language === 'ru' ? 'Время доставки' : 'Delivery Slot'}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {deliverySlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={(e) => {
                        triggerRipple(e);
                        setFormData({ ...formData, deliverySlot: slot.id });
                      }}
                      className={cn(
                        "relative overflow-hidden p-3 rounded-xl border text-center transition-all active:scale-95",
                        formData.deliverySlot === slot.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="text-sm font-medium">
                        {language === 'ru' ? slot.labelRu : slot.labelEn}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {language === 'ru' ? slot.timeRu : slot.timeEn}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Message Card */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Открытка' : 'Message Card'}
            </h2>
            
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={language === 'ru' ? 'Напишите послание для получателя (опционально)' : 'Write a message for the recipient (optional)'}
              rows={3}
            />

            <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all">
              <input
                type="checkbox"
                checked={formData.giftWrap}
                onChange={(e) => setFormData({ ...formData, giftWrap: e.target.checked })}
                className="sr-only"
              />
              <div className={cn(
                "w-5 h-5 rounded border flex items-center justify-center transition-all",
                formData.giftWrap ? "bg-primary border-primary" : "border-border"
              )}>
                {formData.giftWrap && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {language === 'ru' ? 'Праздничная упаковка' : 'Gift Wrap'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Красивая подарочная упаковка' : 'Beautiful gift packaging'}
                </div>
              </div>
              <span className="font-semibold text-primary">+฿150</span>
            </label>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
            </h2>
            
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              className="space-y-2"
            >
              {/* Wallet Option */}
              <label className={cn(
                "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                canPayWithWallet 
                  ? "border-border hover:border-primary/30" 
                  : "border-border/30 opacity-60 cursor-not-allowed"
              )}>
                <RadioGroupItem value="wallet" id="wallet" disabled={!canPayWithWallet} />
                <Wallet className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'ru' ? 'Из кошелька' : 'From Wallet'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isWalletLoading ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                      </span>
                    ) : (
                      <>
                        {language === 'ru' ? 'Баланс:' : 'Balance:'} ₽{balance.toLocaleString()}
                        {!canPayWithWallet && (
                          <span className="text-destructive ml-1">
                            ({language === 'ru' ? 'недостаточно' : 'insufficient'})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all">
                <RadioGroupItem value="card" id="card" />
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'ru' ? 'Банковская карта' : 'Credit Card'}
                  </div>
                  <div className="text-sm text-muted-foreground">Visa, Mastercard, JCB</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all">
                <RadioGroupItem value="cash" id="cash" />
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'ru' ? 'Наличные при доставке' : 'Cash on Delivery'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Оплата курьеру' : 'Pay to courier'}
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all">
                <RadioGroupItem value="promptpay" id="promptpay" />
                <div className="flex-1">
                  <div className="font-medium">PromptPay</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'QR-код оплата' : 'QR code payment'}
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>
        </form>

        {/* Order Summary */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'Товары' : 'Items'}
              </span>
              <span>฿{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'Доставка' : 'Delivery'}
              </span>
              <span>฿{deliveryFee}</span>
            </div>
            {formData.giftWrap && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Упаковка' : 'Gift Wrap'}
                </span>
                <span>฿{giftWrapFee}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t border-border">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary">฿{finalTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 relative overflow-hidden"
          >
            {isSubmitting ? (
              language === 'ru' ? 'Оформление...' : 'Processing...'
            ) : (
              language === 'ru' ? 'Подтвердить заказ' : 'Confirm Order'
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default FlowersOrder;