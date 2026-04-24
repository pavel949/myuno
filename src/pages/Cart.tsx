import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart, CartItem } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  UtensilsCrossed, 
  Flower2, 
  Wrench,
  Package,
  ArrowRight,
  Map,
  Anchor,
  Waves,
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { getCurrencySymbol } from '@/lib/config/currencies';

const typeIcons: Record<CartItem['type'], React.ElementType> = {
  food: UtensilsCrossed,
  flowers: Flower2,
  service: Wrench,
  product: Package,
  tour: Map,
  yacht: Anchor,
  activity: Waves,
};

const typeLabels: Record<CartItem['type'], { en: string; ru: string }> = {
  food: { en: 'Food & Delivery', ru: 'Еда и Доставка' },
  flowers: { en: 'Flowers', ru: 'Цветы' },
  service: { en: 'Services', ru: 'Услуги' },
  product: { en: 'Products', ru: 'Товары' },
  tour: { en: 'Tours', ru: 'Туры' },
  yacht: { en: 'Yachts', ru: 'Яхты' },
  activity: { en: 'Activities', ru: 'Активности' },
};

const typeColors: Record<CartItem['type'], string> = {
  food: 'from-accent to-red-500',
  flowers: 'from-accent to-accent',
  service: 'from-slate-500 to-zinc-600',
  product: 'from-primary to-primary',
  tour: 'from-success to-success',
  yacht: 'from-primary to-primary',
  activity: 'from-primary to-primary',
};

const Cart = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCart();

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<CartItem['type'], CartItem[]>);

  // Checkout routing per vertical. Each vertical has its own backend flow,
  // so mixed carts are checked out one group at a time instead of silently
  // dropping every item that does not match the first one.
  const checkoutForType = (type: CartItem['type'], items: CartItem[]) => {
    const first = items[0];
    switch (type) {
      case 'food':
        if (first?.providerId) {
          navigate(`/restaurants/${first.providerId}/delivery`);
        } else {
          navigate('/restaurants');
        }
        break;
      case 'flowers':
        navigate('/flowers/order');
        break;
      case 'service':
        if (first?.providerId) {
          navigate(`/services/booking/${first.providerId}`);
        } else {
          navigate('/services');
        }
        break;
      case 'product':
        navigate('/market/checkout');
        break;
      case 'tour':
      case 'activity':
        if (first?.providerId) {
          navigate(`/experiences/${first.providerId}/book`);
        } else {
          navigate('/experiences');
        }
        break;
      case 'yacht':
        if (first?.providerId) {
          navigate(`/yachts/${first.providerId}/booking`);
        } else {
          navigate('/yachts');
        }
        break;
      default:
        navigate('/');
    }
  };

  const groupCount = Object.keys(groupedItems).length;
  const hasMixedVerticals = groupCount > 1;

  const handleCheckout = () => {
    if (items.length === 0) return;
    // For a single-vertical cart we keep the legacy one-tap flow.
    // For mixed carts the per-group "Checkout" button below is the SSOT,
    // so the bottom bar simply scrolls the user to the first group.
    const firstEntry = Object.entries(groupedItems)[0];
    if (!firstEntry) return;
    const [type, typeItems] = firstEntry as [CartItem['type'], CartItem[]];
    checkoutForType(type, typeItems);
  };

  if (items.length === 0) {
    return (
      <AppLayout title={language === 'ru' ? 'Корзина' : 'Cart'}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ru' ? 'Корзина пуста' : 'Cart is empty'}
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            {language === 'ru' 
              ? 'Добавьте товары или услуги из наших мини-приложений' 
              : 'Add items or services from our mini-apps'}
          </p>
          <Button onClick={() => navigate('/')}>
            {language === 'ru' ? 'Перейти к покупкам' : 'Start Shopping'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={language === 'ru' ? 'Корзина' : 'Cart'}>
      <div className="p-4 space-y-6 pb-40">
        {/* Cart Summary */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-none p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Товаров в корзине' : 'Items in cart'}
              </p>
              <p className="text-2xl font-bold">{getItemCount()}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {language === 'ru' ? 'Очистить' : 'Clear'}
            </Button>
          </div>
        </div>

        {/* Mixed-vertical notice — each vertical has its own checkout flow */}
        {hasMixedVerticals && (
          <div className="bg-warning/10 border border-warning/20 rounded-none p-3 text-sm text-foreground">
            {language === 'ru'
              ? `В корзине ${groupCount} разных категории. Их нужно оформить по отдельности — используйте кнопку «Оформить» в каждой группе.`
              : `Your cart contains ${groupCount} different categories. Please check them out one group at a time using the "Checkout" button in each group.`}
          </div>
        )}
        {Object.entries(groupedItems).map(([type, typeItems]) => {
          const Icon = typeIcons[type as CartItem['type']];
          const label = typeLabels[type as CartItem['type']];
          const color = typeColors[type as CartItem['type']];

          return (
            <div key={type} className="space-y-3">
              {/* Type Header */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-none bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">
                  {language === 'ru' ? label.ru : label.en}
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({typeItems.length})
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {typeItems.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-card border border-border rounded-none p-3 flex gap-3"
                  >
                    {/* Image */}
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-16 h-16 rounded-none object-cover flex-shrink-0"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {language === 'ru' && item.nameRu ? item.nameRu : item.name}
                      </h4>
                      {item.providerName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {language === 'ru' && item.providerNameRu 
                            ? item.providerNameRu 
                            : item.providerName}
                        </p>
                      )}
                      
                      {/* Booking details for tours, yachts, activities */}
                      {(item.type === 'tour' || item.type === 'yacht' || item.type === 'activity') && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {item.scheduledDate && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(item.scheduledDate), 'd MMM', { 
                                locale: language === 'ru' ? ru : enUS 
                              })}
                            </span>
                          )}
                          {item.scheduledTime && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              {item.scheduledTime}
                            </span>
                          )}
                          {item.participants && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                              <Users className="w-3 h-3" />
                              {item.participants}
                            </span>
                          )}
                          {item.charterType && (
                            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {item.charterType === 'half_day' 
                                ? (language === 'ru' ? 'Полдня' : 'Half day')
                                : (language === 'ru' ? 'Полный день' : 'Full day')
                              }
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-primary font-semibold mt-1">
                        {getCurrencySymbol(item.currency || 'THB')}{item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={(e) => {
                          removeItem(item.id);
                        }}
                        aria-label={language === 'ru' ? 'Удалить' : 'Remove item'}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 bg-secondary rounded-none p-1" role="group" aria-label={language === 'ru' ? 'Количество' : 'Quantity'}>
                        <button
                          onClick={(e) => {
                            updateQuantity(item.id, item.quantity - 1);
                          }}
                          aria-label={language === 'ru' ? 'Уменьшить количество' : 'Decrease quantity'}
                          className="w-6 h-6 rounded-none flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          aria-label={language === 'ru' ? 'Увеличить количество' : 'Increase quantity'}
                          className="w-6 h-6 rounded-none flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-group checkout — surfaced when the cart spans multiple
                  verticals so each group can be paid via its own backend flow. */}
              {hasMixedVerticals && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => checkoutForType(type as CartItem['type'], typeItems)}
                >
                  {language === 'ru'
                    ? `Оформить «${label.ru}»`
                    : `Checkout ${label.en}`}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Checkout Bar - positioned above BottomNav via --bottom-nav-h token */}
      <div className="fixed bottom-[var(--bottom-nav-h)] left-0 right-0 bg-background/95 border-t border-border p-4 z-40">
        <div className="max-w-[1536px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Итого' : 'Total'}
            </span>
            <span className="text-2xl font-bold">
              {getCurrencySymbol('THB')}{getTotal().toLocaleString()}
            </span>
          </div>
          <Button 
            className="w-full h-14 text-lg font-semibold shadow-lg"
            onClick={handleCheckout}
          >
            {language === 'ru' ? 'Оформить заказ' : 'Checkout'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Cart;
