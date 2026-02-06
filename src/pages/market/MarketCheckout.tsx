import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Truck, ShoppingBag, Package, Sparkles, Plane, AlertTriangle, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/useBooking';
import { useDeliverySettings } from '@/hooks/useMarketplace';
import { useProfile } from '@/hooks/useProfile';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useConciergeAdvance } from '@/hooks/useConciergeAdvance';
import { useStripeUnifiedCheckout } from '@/hooks/useStripeUnifiedCheckout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BookingPaymentSelect,
  BookingBottomBar,
  BookingConfirmation,
  BookingStepProgress,
  deliveryBookingSteps,
  type PaymentMethod 
} from '@/components/booking';
import { ConciergeAdvanceOption } from '@/components/booking/ConciergeAdvanceOption';
import { EmptyState } from '@/components/uno/EmptyState';
import { 
  DeliveryTypeSelector, 
  type DeliveryType, 
  type InternationalShippingZone,
  useInternationalShippingZones 
} from '@/components/market/DeliveryTypeSelector';
import { InternationalAddressForm } from '@/components/market/InternationalAddressForm';
import { SavedAddressSelector } from '@/components/market/SavedAddressSelector';
import { getCurrencySymbol } from '@/lib/config/currencies';

// Order Item Card Component
interface OrderItemProps {
  item: {
    id: string;
    name: string;
    nameRu?: string;
    price: number;
    quantity: number;
    image?: string;
    isShippableInternational?: boolean;
    weightKg?: number;
  };
  language: string;
  showShippingWarning?: boolean;
}

const OrderItemCard = ({ item, language, showShippingWarning }: OrderItemProps) => (
  <div className={`flex items-center gap-3 py-3 ${showShippingWarning ? 'bg-amber-50 dark:bg-amber-900/10 -mx-2 px-2 rounded-lg' : ''}`}>
    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 relative">
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      {item.isShippableInternational && (
        <div className="absolute -top-1 -right-1 bg-sky-500 rounded-full p-0.5">
          <Plane className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm line-clamp-1">
        {language === 'ru' && item.nameRu ? item.nameRu : item.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {getCurrencySymbol('THB')}{item.price.toLocaleString()} × {item.quantity}
      </p>
      {showShippingWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
          <AlertTriangle className="w-3 h-3" />
          {language === 'ru' ? 'Не для отправки' : 'Not shippable'}
        </p>
      )}
    </div>
    <div className="text-right flex-shrink-0">
      <p className="font-semibold text-sm">{getCurrencySymbol('THB')}{(item.price * item.quantity).toLocaleString()}</p>
      {item.weightKg && (
        <p className="text-xs text-muted-foreground">~{(item.weightKg * item.quantity).toFixed(1)} kg</p>
      )}
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
                ? `Ещё ${getCurrencySymbol('THB')}${remaining.toLocaleString()} до бесплатной доставки`
                : `${getCurrencySymbol('THB')}${remaining.toLocaleString()} more for free delivery`}
            </span>
          </>
        )}
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>{getCurrencySymbol('THB')}0</span>
        <span>{getCurrencySymbol('THB')}{threshold.toLocaleString()}</span>
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
  const { zones: shippingZones, calculateFee: calculateInternationalFee } = useInternationalShippingZones();
  const { profile } = useProfile();
  const { addresses, defaultAddress, createAddressAsync } = useUserAddresses();
  const { createAdvanceRequest, navigateToAdvanceRequested, calculateFee, feePercent } = useConciergeAdvance();
  const { createCheckout, isProcessing: isStripeProcessing } = useStripeUnifiedCheckout();
  
  // Check for Buy Now mode
  const locationState = location.state as { 
    storeId?: string; 
    storeName?: string; 
    storeNameRu?: string; 
    deliveryFee?: number; 
    minOrder?: number;
    buyNowItem?: any;
    isBuyNow?: boolean;
  } | undefined;
  
  const isBuyNow = locationState?.isBuyNow;
  const buyNowItem = locationState?.buyNowItem;
  const storeInfo = locationState;

  // Cart items - either from cart or from Buy Now
  const cartItems = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [buyNowItem];
    }
    return getItemsByType('product').filter(item => storeInfo?.storeId ? item.providerId === storeInfo.storeId : true);
  }, [isBuyNow, buyNowItem, getItemsByType, storeInfo]);

  // Delivery type state
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('local');
  const [selectedZone, setSelectedZone] = useState<InternationalShippingZone | null>(null);

  // Track selected saved address
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Local address form - with auto-fill
  const [localFormData, setLocalFormData] = useState({ name: '', phone: '', address: '', notes: '' });
  
  // International address form
  const [intlFormData, setIntlFormData] = useState({
    name: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    postalCode: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bookingResult, setBookingResult] = useState<{ success: boolean; bookingId?: string } | null>(null);

  // Auto-fill from profile on mount
  useEffect(() => {
    if (profile && !localFormData.name && !localFormData.phone) {
      setLocalFormData(prev => ({
        ...prev,
        name: profile.full_name || '',
        phone: profile.phone || '',
      }));
      setIntlFormData(prev => ({
        ...prev,
        name: profile.full_name || '',
        phone: profile.phone || '',
      }));
    }
  }, [profile]);

  // Auto-select default address
  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
      setLocalFormData(prev => ({
        ...prev,
        name: defaultAddress.recipient_name,
        phone: defaultAddress.phone,
        address: defaultAddress.address_text,
      }));
    }
  }, [defaultAddress, selectedAddressId]);

  // Calculate cart details
  const cartAnalysis = useMemo(() => {
    let totalWeight = 0;
    let hasNonShippable = false;
    
    cartItems.forEach(item => {
      const weight = (item as any).weightKg || 0.3;
      totalWeight += weight * item.quantity;
      if (!(item as any).isShippableInternational) {
        hasNonShippable = true;
      }
    });

    return {
      totalWeight,
      hasNonShippable,
    };
  }, [cartItems]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate delivery fee based on type
  const localDeliveryFee = calculateDeliveryFee(subtotal);
  const internationalDeliveryFee = selectedZone ? calculateInternationalFee(selectedZone, cartAnalysis.totalWeight) : 0;
  const deliveryFee = deliveryType === 'local' ? localDeliveryFee : internationalDeliveryFee;
  
  const remaining = amountToFreeDelivery(subtotal);
  const total = subtotal + deliveryFee;

  // Form validation
  const isLocalFormValid = localFormData.name && localFormData.phone && localFormData.address;
  const isIntlFormValid = intlFormData.name && intlFormData.phone && intlFormData.country && 
    intlFormData.city && intlFormData.address && intlFormData.postalCode && selectedZone;
  const isFormValid = deliveryType === 'local' ? isLocalFormValid : isIntlFormValid;

  // Calculate current step for progress indicator
  const getCurrentStep = (): number => {
    if (paymentMethod) return 2;
    if (deliveryType && (isLocalFormValid || isIntlFormValid)) return 1;
    if (localFormData.name || intlFormData.name) return 1;
    return 0;
  };

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
    if (!isFormValid) return;

    const formData = deliveryType === 'local' ? localFormData : intlFormData;
    const fullAddress = deliveryType === 'local' 
      ? localFormData.address 
      : `${intlFormData.address}, ${intlFormData.city}, ${intlFormData.postalCode}, ${intlFormData.country}`;

    // 1. Card → Stripe Checkout redirect
    if (paymentMethod === 'card') {
      const stripeItems = cartItems.map(item => ({
        id: item.id,
        name: language === 'ru' ? (item.nameRu || item.name) : item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await createCheckout('create-market-checkout', {
        items: stripeItems,
        delivery_fee: deliveryFee,
        total_amount: total,
        currency: 'THB',
        recipient_name: formData.name,
        recipient_phone: formData.phone,
        delivery_address: fullAddress,
        delivery_type: deliveryType,
        shipping_zone: selectedZone?.zone_name_en,
        store_id: storeInfo?.storeId,
        store_name: storeInfo?.storeName,
      });
      return;
    }

    const items = cartItems.map(item => ({
      item_type: 'product',
      item_id: item.id,
      item_name: language === 'ru' ? (item.nameRu || item.name) : item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    // Add delivery fee
    if (deliveryFee > 0) {
      items.push({
        item_type: 'fee',
        item_id: deliveryType === 'local' ? 'delivery_fee' : 'international_shipping',
        item_name: language === 'ru' 
          ? (deliveryType === 'local' ? 'Доставка' : `Международная доставка (${selectedZone?.zone_name_ru})`)
          : (deliveryType === 'local' ? 'Delivery' : `International Shipping (${selectedZone?.zone_name_en})`),
        quantity: 1,
        unit_price: deliveryFee,
        subtotal: deliveryFee,
      });
    }

    // Determine status based on payment method
    const bookingStatus = paymentMethod === 'concierge_advance' ? 'pending' : 'pending';

    const result = await createBooking({
      booking_type: 'product',
      scheduled_at: new Date(),
      total_amount: total,
      currency: 'THB',
      notes: deliveryType === 'international' 
        ? `International: ${selectedZone?.zone_name_en}, Weight: ${cartAnalysis.totalWeight.toFixed(1)}kg`
        : `Store: ${storeInfo?.storeName || 'Market'}`,
      items,
      participants: [{
        name: formData.name,
        phone: formData.phone,
        is_primary: true,
      }],
      addresses: [{
        address_type: 'delivery',
        address: fullAddress,
        notes: deliveryType === 'international' 
          ? `[INTERNATIONAL] ${formData.notes || ''}` 
          : formData.notes,
      }],
      payment: {
        amount: total,
        payment_method: paymentMethod === 'concierge_advance' ? 'cash' : paymentMethod,
      },
    });

    if (result.success && result.booking_id) {
      // 3. Concierge Advance → create advance request and navigate
      if (paymentMethod === 'concierge_advance') {
        const advanceResult = await createAdvanceRequest({
          orderId: result.booking_id,
          orderNumber: result.booking_id.slice(0, 8).toUpperCase(),
          orderType: 'market',
          baseAmount: total,
          currency: 'THB',
          providerName: storeInfo?.storeName || 'Market Store',
          deliveryDetails: {
            address: fullAddress,
            delivery_type: deliveryType,
            recipient: formData.name,
          },
        });

        if (advanceResult.success) {
          // Only clear cart if not Buy Now mode
          if (!isBuyNow) {
            clearByType('product');
          }
          navigateToAdvanceRequested(
            result.booking_id.slice(0, 8).toUpperCase(),
            total,
            'market'
          );
          return;
        }
      }

      // Save address if checkbox is checked and it's a new address
      if (saveNewAddress && !selectedAddressId && localFormData.address) {
        try {
          await createAddressAsync({
            recipient_name: localFormData.name,
            phone: localFormData.phone,
            address_text: localFormData.address,
            is_default: addresses.length === 0,
          });
        } catch (e) {
          // Non-blocking - continue with order success
          console.error('Failed to save address:', e);
        }
      }

      // Only clear cart if not Buy Now mode
      if (!isBuyNow) {
        clearByType('product');
      }
      setBookingResult({ success: true, bookingId: result.booking_id });
    }
  };

  const handleIntlFormChange = (field: string, value: string) => {
    setIntlFormData(prev => ({ ...prev, [field]: value }));
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

        {/* Step Progress Indicator */}
        <BookingStepProgress 
          steps={deliveryBookingSteps} 
          currentStep={getCurrentStep()} 
          className="mb-4"
        />

        {/* Free Delivery Progress - only for local delivery */}
        {!deliveryLoading && deliveryType === 'local' && (
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {cartItems.length} {language === 'ru' ? 'товаров' : 'items'}
              </span>
              {deliveryType === 'international' && (
                <Badge variant="outline" className="text-xs">
                  ~{cartAnalysis.totalWeight.toFixed(1)} kg
                </Badge>
              )}
            </div>
          </div>
          <div className="divide-y divide-border">
            {cartItems.map(item => (
              <OrderItemCard 
                key={item.id} 
                item={{
                  ...item,
                  isShippableInternational: (item as any).isShippableInternational,
                  weightKg: (item as any).weightKg,
                }}
                language={language}
                showShippingWarning={deliveryType === 'international' && !(item as any).isShippableInternational}
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

        {/* Delivery Type Selector */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <DeliveryTypeSelector
            selectedType={deliveryType}
            onTypeChange={setDeliveryType}
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
            totalWeight={cartAnalysis.totalWeight}
            subtotal={subtotal}
            localDeliveryFee={localDeliveryFee}
            hasNonShippableItems={cartAnalysis.hasNonShippable && deliveryType === 'international'}
          />
        </div>

        {/* Address Form */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          {deliveryType === 'local' ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{language === 'ru' ? 'Адрес доставки' : 'Delivery Address'}</h3>
              </div>

              {/* Saved Addresses */}
              {addresses.length > 0 && (
                <div className="mb-4">
                  <SavedAddressSelector
                    selectedId={selectedAddressId}
                    onSelect={(address) => {
                      setSelectedAddressId(address.id);
                      setLocalFormData({
                        name: address.recipient_name,
                        phone: address.phone,
                        address: address.address_text,
                        notes: '',
                      });
                    }}
                  />
                </div>
              )}

              {/* Manual form - always visible for editing */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <User className="w-4 h-4" />
                  {language === 'ru' ? 'Или введите новый адрес:' : 'Or enter a new address:'}
                </div>
                <div>
                  <Label>{language === 'ru' ? 'Имя' : 'Name'} *</Label>
                  <Input 
                    value={localFormData.name} 
                    onChange={(e) => {
                      setLocalFormData({ ...localFormData, name: e.target.value });
                      setSelectedAddressId(null);
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{language === 'ru' ? 'Телефон' : 'Phone'} *</Label>
                  <Input 
                    value={localFormData.phone} 
                    onChange={(e) => {
                      setLocalFormData({ ...localFormData, phone: e.target.value });
                      setSelectedAddressId(null);
                    }}
                    placeholder="+66" 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{language === 'ru' ? 'Адрес' : 'Address'} *</Label>
                  <Input 
                    value={localFormData.address} 
                    onChange={(e) => {
                      setLocalFormData({ ...localFormData, address: e.target.value });
                      setSelectedAddressId(null);
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{language === 'ru' ? 'Комментарий' : 'Notes'}</Label>
                  <Textarea 
                    value={localFormData.notes} 
                    onChange={(e) => setLocalFormData({ ...localFormData, notes: e.target.value })} 
                    rows={2} 
                    className="mt-1"
                  />
                </div>

                {/* Save address checkbox - only if manually editing */}
                {!selectedAddressId && (
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="saveAddress"
                      checked={saveNewAddress}
                      onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                    />
                    <label 
                      htmlFor="saveAddress" 
                      className="text-sm cursor-pointer text-muted-foreground"
                    >
                      {language === 'ru' ? 'Сохранить адрес для следующих заказов' : 'Save address for future orders'}
                    </label>
                  </div>
                )}
              </div>
            </>
          ) : (
            <InternationalAddressForm
              formData={intlFormData}
              onChange={handleIntlFormChange}
            />
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">
            {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
          </h3>
          <BookingPaymentSelect
            selected={paymentMethod === 'concierge_advance' ? 'cash' : paymentMethod}
            onSelect={(method) => {
              if (method !== 'concierge_advance') {
                setPaymentMethod(method);
              }
            }}
            amount={total}
            currency="THB"
            showWallet
            showCash
            showOnline
          />
          
          {/* Concierge Advance Option */}
          <div className="mt-4">
            <ConciergeAdvanceOption
              isSelected={paymentMethod === 'concierge_advance'}
              onSelect={() => setPaymentMethod('concierge_advance')}
              baseAmount={total}
              feePercent={feePercent}
              currency="THB"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl border p-5 mb-4">
          <h3 className="font-semibold mb-4">{language === 'ru' ? 'Итого' : 'Order Summary'}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === 'ru' ? 'Товары' : 'Subtotal'}</span>
              <span>{getCurrencySymbol('THB')}{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                {deliveryType === 'local' ? (
                  <>{language === 'ru' ? 'Доставка' : 'Delivery'}</>
                ) : (
                  <>
                    <Plane className="w-3 h-3" />
                    {language === 'ru' ? 'Международная доставка' : 'Int\'l Shipping'}
                  </>
                )}
              </span>
              {deliveryFee === 0 ? (
                <span className="text-primary font-medium">{language === 'ru' ? 'Бесплатно' : 'Free'}</span>
              ) : (
                <span>{getCurrencySymbol('THB')}{deliveryFee.toLocaleString()}</span>
              )}
            </div>
            {deliveryType === 'international' && selectedZone && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {language === 'ru' ? selectedZone.zone_name_ru : selectedZone.zone_name_en}, ~{cartAnalysis.totalWeight.toFixed(1)} kg
                </span>
                <span>
                  {selectedZone.estimated_days_min}-{selectedZone.estimated_days_max} {language === 'ru' ? 'дней' : 'days'}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-primary">{getCurrencySymbol('THB')}{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <BookingBottomBar
          total={paymentMethod === 'concierge_advance' ? calculateFee(total).totalWithFee : total}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || isStripeProcessing}
          disabled={!isFormValid}
          submitLabel={language === 'ru' ? 'Оформить заказ' : 'Place Order'}
        />
      </PageContainer>
    </AppLayout>
  );
};

export default MarketCheckout;
