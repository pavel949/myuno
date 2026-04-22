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
import { triggerRipple } from '@/hooks/useRipple';
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
  food: 'from-orange-500 to-red-500',
  flowers: 'from-rose-500 to-pink-500',
  service: 'from-slate-500 to-zinc-600',
  product: 'from-blue-500 to-indigo-500',
  tour: 'from-emerald-500 to-teal-500',
  yacht: 'from-sky-500 to-blue-500',
  activity: 'from-cyan-500 to-blue-500',
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

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    const firstItem = items[0];
    const firstType = firstItem.type;
    
    switch (firstType) {
      case 'food':
        // Food checkout - always use restaurants flow
        if (firstItem.providerId) {
          navigate(`/restaurants/${firstItem.providerId}/delivery`);
        } else {
          navigate('/restaurants');
        }
        break;
      case 'flowers':
        // Flowers order - always go to /flowers/order, cart is read from context
        navigate('/flowers/order');
        break;
      case 'service':
        // Service booking - use provider ID if available
        if (firstItem.providerId) {
          navigate(`/services/booking/${firstItem.providerId}`);
        } else {
          navigate('/services');
        }
        break;
      case 'product':
        // Product/Market checkout
        navigate('/market/checkout');
        break;
      case 'tour':
      case 'activity':
        // Tour/Activity checkout - navigate to experience booking with item ID
        if (firstItem.providerId) {
          navigate(`/experiences/${firstItem.providerId}/book`);
        } else {
          navigate('/experiences');
        }
        break;
      case 'yacht':
        // Yacht checkout - navigate to yacht booking with item ID
        if (firstItem.providerId) {
          navigate(`/yachts/${firstItem.providerId}/booking`);
        } else {
          navigate('/yachts');
        }
        break;
      default:
        navigate('/');
    }
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
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-4 border border-primary/20">
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

        {/* Grouped Items */}
        {Object.entries(groupedItems).map(([type, typeItems]) => {
          const Icon = typeIcons[type as CartItem['type']];
          const label = typeLabels[type as CartItem['type']];
          const color = typeColors[type as CartItem['type']];

          return (
            <div key={type} className="space-y-3">
              {/* Type Header */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
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
                    className="bg-card border border-border rounded-xl p-3 flex gap-3"
                  >
                    {/* Image */}
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
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
                          triggerRipple(e);
                          removeItem(item.id);
                        }}
                        aria-label={language === 'ru' ? 'Удалить' : 'Remove item'}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 bg-secondary rounded-lg p-1" role="group" aria-label={language === 'ru' ? 'Количество' : 'Quantity'}>
                        <button
                          onClick={(e) => {
                            triggerRipple(e);
                            updateQuantity(item.id, item.quantity - 1);
                          }}
                          aria-label={language === 'ru' ? 'Уменьшить количество' : 'Decrease quantity'}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            triggerRipple(e);
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          aria-label={language === 'ru' ? 'Увеличить количество' : 'Increase quantity'}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Checkout Bar - positioned above BottomNav via --bottom-nav-h token */}
      <div className="fixed bottom-[var(--bottom-nav-h)] left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 z-40">
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
