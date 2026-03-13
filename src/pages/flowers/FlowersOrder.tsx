import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, CreditCard, Truck, Gift, Check, Wallet, Loader2, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useBooking } from '@/hooks/useBooking';
import { useConciergeAdvance } from '@/hooks/useConciergeAdvance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ConciergeAdvanceOption } from '@/components/booking/ConciergeAdvanceOption';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { triggerRipple } from '@/hooks/useRipple';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/uno/BackButton';
import { AddressPickerInput, BookingStepProgress, deliveryBookingSteps } from '@/components/booking';
import { useStripeUnifiedCheckout } from '@/hooks/useStripeUnifiedCheckout';
import { FlowersBuyNowItem } from '@/hooks/useBuyNowFlowers';
import { useGuestCheckout } from '@/hooks/useGuestCheckout';
import { LoginRequiredModal } from '@/components/guest/LoginRequiredModal';
import { GuestModeBadge } from '@/components/guest/GuestModeBadge';

const deliverySlots = [
  { id: 'morning', timeEn: '9:00 - 12:00', timeRu: '9:00 - 12:00', labelEn: 'Morning', labelRu: 'Утро' },
  { id: 'afternoon', timeEn: '12:00 - 17:00', timeRu: '12:00 - 17:00', labelEn: 'Afternoon', labelRu: 'День' },
  { id: 'evening', timeEn: '17:00 - 21:00', timeRu: '17:00 - 21:00', labelEn: 'Evening', labelRu: 'Вечер' },
];

interface BuyNowState {
  buyNowItem?: FlowersBuyNowItem;
  isBuyNow?: boolean;
}

const FlowersOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { balance, payFromWallet, hasEnoughBalance, isLoading: isWalletLoading } = useWallet();
  const { getItemsByType, clearByType } = useCart();
  const { createBooking, isSubmitting } = useBooking();
  const { createCheckout, isProcessing: isStripeProcessing } = useStripeUnifiedCheckout();
  const { createAdvanceRequest, navigateToAdvanceRequested, calculateFee, isProcessing: isAdvanceProcessing, feePercent } = useConciergeAdvance();
  
  // Guest checkout flow
  const { 
    isGuest, 
    showLoginModal, 
    setShowLoginModal, 
    requireLogin, 
    getPreservedState, 
    clearPreservedState,
  } = useGuestCheckout();
  
  // Check for Buy Now item in state
  const buyNowState = location.state as BuyNowState | null;
  const isBuyNow = buyNowState?.isBuyNow || false;
  const buyNowItem = buyNowState?.buyNowItem;
  
  // Get flowers from global cart OR use Buy Now item
  const flowersInCart = getItemsByType('flowers');
  
  const cartItems = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [{
        id: buyNowItem.id,
        name: buyNowItem.name,
        nameRu: buyNowItem.nameRu,
        price: buyNowItem.price,
        quantity: buyNowItem.quantity,
        providerId: buyNowItem.providerId,
        providerName: buyNowItem.providerName,
      }];
    }
    return flowersInCart.map(item => ({
      id: item.id,
      name: item.name,
      nameRu: item.nameRu || item.name,
      price: item.price,
      quantity: item.quantity,
      providerId: item.providerId,
      providerName: item.providerName,
    }));
  }, [isBuyNow, buyNowItem, flowersInCart]);
  
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  // Restore preserved state after login
  useEffect(() => {
    if (user) {
      const preserved = getPreservedState();
      if (preserved?.formData) {
        setFormData(prev => ({
          ...prev,
          ...(preserved.formData as typeof formData),
        }));
        clearPreservedState();
      }
    }
  }, [user, getPreservedState, clearPreservedState]);

  // Dynamic delivery fee from shop, default 100 THB
  const shopDeliveryFee = useMemo(() => {
    const firstProvider = cartItems.find(item => item.providerId);
    // If we have provider info with delivery_fee from cart context, use it
    // Otherwise default to 100 THB
    return 100;
  }, [cartItems]);
  const deliveryFee = shopDeliveryFee;
  const giftWrapFee = formData.giftWrap ? 150 : 0;
  const finalTotal = totalPrice + deliveryFee + giftWrapFee;
  const canPayWithWallet = hasEnoughBalance(finalTotal);

  // Calculate current step based on filled fields
  const getCurrentStep = () => {
    if (formData.paymentMethod) return 2; // Payment step
    if (formData.deliveryDate && formData.deliverySlot) return 2; // Moving to payment
    if (formData.recipientName && formData.recipientPhone && formData.address) return 1; // Delivery step
    return 0; // Recipient step
  };
  const currentStep = getCurrentStep();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientName || !formData.recipientPhone || !formData.address || !formData.deliveryDate) {
      toast.error(language === 'ru' ? 'Заполните все обязательные поля' : 'Please fill all required fields');
      return;
    }

    // Guest checkout: show login modal at commitment boundary
    if (!user) {
      const needsLogin = requireLogin({ formData, selectedItems: cartItems }, 'order');
      if (needsLogin) return;
    }

    // Get first provider from cart items
    const firstProvider = cartItems.find(item => item.providerId);

    try {
      // For card payments, redirect to Stripe Checkout
      if (formData.paymentMethod === 'card') {
        const success = await createCheckout('create-flowers-checkout', {
          items: cartItems.map(item => ({
            id: item.id,
            name: language === 'ru' ? item.nameRu : item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          delivery_fee: deliveryFee,
          gift_wrap_fee: giftWrapFee,
          total_amount: finalTotal,
          currency: 'THB',
          recipient_name: formData.recipientName,
          recipient_phone: formData.recipientPhone,
          delivery_address: formData.address,
          delivery_date: formData.deliveryDate,
          delivery_slot: formData.deliverySlot,
          message: formData.message,
          gift_wrap: formData.giftWrap,
          provider_id: firstProvider?.providerId,
          provider_name: firstProvider?.providerName,
        });
        
        // If redirect is successful, Stripe will handle the rest
        // The page will redirect, so we don't need to do anything else here
        if (!success) {
          toast.error(language === 'ru' ? 'Ошибка при создании платежа' : 'Failed to create payment');
        }
        return;
      }

      // For wallet payments, deduct balance first
      if (formData.paymentMethod === 'wallet') {
        const result = await payFromWallet(
          finalTotal,
          `Flower order`,
          `Заказ цветов`,
          'flower_order'
        );
        
        if (!result.success) {
          toast.error(language === 'ru' ? 'Недостаточно средств на кошельке' : 'Insufficient wallet balance');
          return;
        }
      }

      // For concierge advance payments
      if (formData.paymentMethod === 'concierge_advance') {
        // Create scheduled_at date for concierge advance
        const scheduledAt = new Date(formData.deliveryDate);
        const slot = deliverySlots.find(s => s.id === formData.deliverySlot);
        if (slot) {
          const startTime = slot.timeEn.split(' - ')[0];
          const [hours] = startTime.split(':');
          scheduledAt.setHours(parseInt(hours), 0, 0);
        }

        // Build items array
        const items = cartItems.map(item => ({
          item_type: 'flower',
          item_id: item.id,
          item_name: language === 'ru' ? item.nameRu : item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }));

        items.push({
          item_type: 'delivery',
          item_id: undefined,
          item_name: language === 'ru' ? 'Доставка' : 'Delivery',
          quantity: 1,
          unit_price: deliveryFee,
          subtotal: deliveryFee,
        });

        if (formData.giftWrap) {
          items.push({
            item_type: 'gift_wrap',
            item_id: undefined,
            item_name: language === 'ru' ? 'Праздничная упаковка' : 'Gift Wrap',
            quantity: 1,
            unit_price: giftWrapFee,
            subtotal: giftWrapFee,
          });
        }

        // Create order with pending_advance status
        const bookingResult = await createBooking({
          booking_type: 'product',
          scheduled_at: scheduledAt.toISOString(),
          total_amount: finalTotal,
          currency: 'THB',
          provider_id: firstProvider?.providerId,
          notes: formData.message || undefined,
          items,
          participants: [{
            name: formData.recipientName,
            phone: formData.recipientPhone,
            is_primary: true,
          }],
          addresses: [{
            address_type: 'delivery',
            address: formData.address,
          }],
          payment: {
            amount: finalTotal,
            payment_method: 'cash', // Will be changed after advance
            status: 'pending',
          },
          metadata: {
            delivery_slot: formData.deliverySlot,
            message_card: formData.message,
            gift_wrap: formData.giftWrap,
            recipient_name: formData.recipientName,
            recipient_phone: formData.recipientPhone,
            concierge_advance_requested: true,
          },
          serviceName: language === 'ru' ? 'Доставка цветов' : 'Flower Delivery',
          providerName: firstProvider?.providerName,
          openWhatsAppOnCash: false, // Don't open WhatsApp for concierge advance
        });

        if (bookingResult.success && bookingResult.booking_id) {
          // Fetch the order number from the database
          const { data: orderData } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', bookingResult.booking_id)
            .single();
          
          const orderNumber = orderData?.order_number || `ORD-${bookingResult.booking_id.substring(0, 8).toUpperCase()}`;
          
          // Create concierge advance request
          const advanceResult = await createAdvanceRequest({
            orderId: bookingResult.booking_id,
            orderNumber: orderNumber,
            orderType: 'flowers',
            baseAmount: finalTotal,
            currency: 'THB',
            providerName: firstProvider?.providerName || 'Flower Shop',
            deliveryDetails: {
              address: formData.address,
              date: formData.deliveryDate,
              slot: formData.deliverySlot,
              recipient_name: formData.recipientName,
              recipient_phone: formData.recipientPhone,
            },
          });

          if (advanceResult.success) {
            // Clear cart if not Buy Now
            if (!isBuyNow) {
              clearByType('flowers');
            }
            // Navigate to confirmation page
            navigateToAdvanceRequested(orderNumber, finalTotal, 'flowers');
          }
        }
        return;
      }

      // Create scheduled_at date
      const scheduledAt = new Date(formData.deliveryDate);
      const slot = deliverySlots.find(s => s.id === formData.deliverySlot);
      if (slot) {
        const startTime = slot.timeEn.split(' - ')[0];
        const [hours] = startTime.split(':');
        scheduledAt.setHours(parseInt(hours), 0, 0);
      }

      // Build items array for booking
      const items = cartItems.map(item => ({
        item_type: 'flower',
        item_id: item.id,
        item_name: language === 'ru' ? item.nameRu : item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      // Add delivery fee
      items.push({
        item_type: 'delivery',
        item_id: undefined,
        item_name: language === 'ru' ? 'Доставка' : 'Delivery',
        quantity: 1,
        unit_price: deliveryFee,
        subtotal: deliveryFee,
      });

      // Add gift wrap if selected
      if (formData.giftWrap) {
        items.push({
          item_type: 'gift_wrap',
          item_id: undefined,
          item_name: language === 'ru' ? 'Праздничная упаковка' : 'Gift Wrap',
          quantity: 1,
          unit_price: giftWrapFee,
          subtotal: giftWrapFee,
        });
      }

      // Create booking using the unified system (for wallet/cash)
      const result = await createBooking({
        booking_type: 'product',
        scheduled_at: scheduledAt.toISOString(),
        total_amount: finalTotal,
        currency: 'THB',
        provider_id: firstProvider?.providerId,
        notes: formData.message || undefined,
        items,
        participants: [{
          name: formData.recipientName,
          phone: formData.recipientPhone,
          is_primary: true,
        }],
        addresses: [{
          address_type: 'delivery',
          address: formData.address,
        }],
        payment: {
          amount: finalTotal,
          payment_method: formData.paymentMethod as 'cash' | 'wallet',
          status: formData.paymentMethod === 'wallet' ? 'paid' : 'pending',
        },
        metadata: {
          delivery_slot: formData.deliverySlot,
          message_card: formData.message,
          gift_wrap: formData.giftWrap,
          recipient_name: formData.recipientName,
          recipient_phone: formData.recipientPhone,
        },
        serviceName: language === 'ru' ? 'Доставка цветов' : 'Flower Delivery',
        providerName: firstProvider?.providerName,
        openWhatsAppOnCash: true,
      });

      if (result.success && result.booking_id) {
        // Save flower-specific details to order_item_flower_details
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', result.booking_id)
          .eq('item_type', 'flower')
          .limit(1);

        if (orderItems && orderItems.length > 0) {
          await supabase
            .from('order_item_flower_details')
            .insert({
              order_item_id: orderItems[0].id,
              recipient_name: formData.recipientName,
              recipient_phone: formData.recipientPhone,
              delivery_address: formData.address,
              delivery_slot: formData.deliverySlot,
              message_card: formData.message || null,
              gift_wrap: formData.giftWrap,
            });
        }

        // Clear flowers from cart after successful order (only if NOT Buy Now)
        if (!isBuyNow) {
          clearByType('flowers');
        }
        
        toast.success(
          formData.paymentMethod === 'wallet'
            ? (language === 'ru' ? 'Заказ оплачен из кошелька!' : 'Order paid from wallet!')
            : (language === 'ru' ? 'Заказ успешно оформлен!' : 'Order placed successfully!')
        );
        
        navigate('/bookings');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(language === 'ru' ? 'Ошибка при оформлении заказа' : 'Failed to place order');
    }
  };

  // If cart is empty, show empty state
  // If no items (neither Buy Now nor cart), show empty state
  if (cartItems.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center gap-3 p-4">
              <BackButton fallbackPath="/flowers" />
              <div className="flex-1">
                <h1 className="text-xl font-display font-bold">
                  {language === 'ru' ? 'Оформление заказа' : 'Checkout'}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <Gift className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ru' ? 'Корзина пуста' : 'Cart is empty'}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {language === 'ru' ? 'Добавьте цветы для оформления заказа' : 'Add flowers to place an order'}
            </p>
            <Button onClick={() => navigate('/flowers')}>
              {language === 'ru' ? 'Выбрать цветы' : 'Browse Flowers'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <BackButton fallbackPath="/flowers" />
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

        <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-40">
          {/* Step Progress */}
          <BookingStepProgress steps={deliveryBookingSteps} currentStep={currentStep} />

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
              
              <AddressPickerInput
                value={formData.address}
                onChange={(addr) => setFormData({ ...formData, address: addr })}
                label={language === 'ru' ? 'Адрес доставки *' : 'Delivery Address *'}
                placeholder={language === 'ru' ? 'Полный адрес доставки' : 'Full delivery address'}
                type="delivery"
                required
              />
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
                        {language === 'ru' ? 'Баланс:' : 'Balance:'} ฿{balance.toLocaleString()}
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

              {/* Card Option */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all">
                <RadioGroupItem value="card" id="card" />
                <CreditCard className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'ru' ? 'Банковская карта' : 'Credit/Debit Card'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Visa, Mastercard, JCB
                  </div>
                </div>
              </label>

              {/* Cash Option */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all">
                <RadioGroupItem value="cash" id="cash" />
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-xs">฿</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'ru' ? 'Наличными' : 'Cash on Delivery'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Оплата при получении' : 'Pay when delivered'}
                  </div>
                </div>
              </label>
            </RadioGroup>

            {/* Concierge Advance Option */}
            <div className="mt-4 pt-4 border-t border-dashed">
              <ConciergeAdvanceOption
                isSelected={formData.paymentMethod === 'concierge_advance'}
                onSelect={() => setFormData({ ...formData, paymentMethod: 'concierge_advance' })}
                baseAmount={finalTotal}
                feePercent={feePercent}
                currency="THB"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-2xl border p-4 space-y-3">
            <h3 className="font-semibold">{language === 'ru' ? 'Ваш заказ' : 'Your Order'}</h3>
            
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{language === 'ru' ? item.nameRu : item.name} × {item.quantity}</span>
                <span>฿{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            
            <div className="flex justify-between text-sm">
              <span>{language === 'ru' ? 'Доставка' : 'Delivery'}</span>
              <span>฿{deliveryFee.toLocaleString()}</span>
            </div>
            
            {formData.giftWrap && (
              <div className="flex justify-between text-sm">
                <span>{language === 'ru' ? 'Праздничная упаковка' : 'Gift Wrap'}</span>
                <span>฿{giftWrapFee.toLocaleString()}</span>
              </div>
            )}
            
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary">฿{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-14 text-lg"
            disabled={isSubmitting || isStripeProcessing || isAdvanceProcessing}
          >
            {(isSubmitting || isStripeProcessing || isAdvanceProcessing) ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {formData.paymentMethod === 'card'
              ? (language === 'ru' ? 'Перейти к оплате' : 'Proceed to Payment')
              : formData.paymentMethod === 'concierge_advance'
                ? (language === 'ru' ? 'Отправить запрос' : 'Submit Request')
                : (language === 'ru' ? 'Оформить заказ' : 'Place Order')}
          </Button>
        </form>
      </div>

      {/* Login Required Modal for guest checkout */}
      <LoginRequiredModal 
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        context="order"
        preserveState={{ formData }}
      />
    </AppLayout>
  );
};

export default FlowersOrder;
