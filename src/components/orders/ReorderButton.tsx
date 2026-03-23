import React from 'react';
import { logger } from '@/lib/logger';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/hooks/useOrders';

interface ReorderButtonProps {
  order: Order;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export function ReorderButton({
  order,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  className,
}: ReorderButtonProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const isRu = language === 'ru';

  // Determine where to redirect based on order type
  const getRedirectPath = (orderType: string) => {
    const paths: Record<string, string> = {
      food: '/restaurants',
      flowers: '/flowers',
      beauty: '/beauty',
      tour: '/experiences',
      yacht: '/yachts',
      service: '/services',
      cleaning: '/cleaning',
      babysitter: '/babysitters',
    };
    return paths[orderType] || '/market';
  };

  const handleReorder = async () => {
    if (!user) {
      toast({
        title: isRu ? 'Войдите в аккаунт' : 'Please login',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // For marketplace orders, add items to cart
      if (order.order_type === 'food' || order.order_type === 'mixed') {
        // Add items to cart
        if (order.order_items && order.order_items.length > 0) {
          const cartItems = order.order_items.map(item => ({
            user_id: user.id,
            item_id: item.product_id || item.resource_id || item.id,
            item_type: item.item_type,
            name: item.item_name,
            name_ru: item.item_name,
            price: item.unit_price,
            currency: order.currency || 'THB',
            quantity: item.qty || 1,
            provider_id: item.provider_org_id,
            image: (item.metadata as any)?.image || null,
          }));

          // Clear existing cart items from same provider
          if (cartItems[0]?.provider_id) {
            await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', user.id)
              .eq('provider_id', cartItems[0].provider_id);
          }

          // Insert new cart items
          const { error } = await supabase
            .from('cart_items')
            .insert(cartItems);

          if (error) throw error;

          toast({
            title: isRu ? 'Добавлено в корзину' : 'Added to cart',
            description: isRu 
              ? `${cartItems.length} товаров добавлено` 
              : `${cartItems.length} items added`,
          });

          // Navigate to checkout or cart
          navigate('/cart');
        }
      } else {
        // For service orders, navigate to the service page with pre-filled data
        const path = getRedirectPath(order.order_type);
        
        toast({
          title: isRu ? 'Перенаправление' : 'Redirecting',
          description: isRu ? 'Выберите дату и время' : 'Please select date and time',
        });

        // Pass order data as state for pre-filling
        navigate(path, {
          state: {
            reorder: true,
            previousOrder: {
              provider_org_id: order.provider_org_id,
              items: order.order_items,
              notes: order.notes,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Reorder error:', error);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось повторить заказ' : 'Failed to reorder',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for completed orders
  if (!['completed', 'cancelled'].includes(order.status)) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleReorder}
      disabled={isLoading}
      className={className}
    >
      {showIcon && (
        isLoading ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )
      )}
      {isRu ? 'Повторить' : 'Reorder'}
    </Button>
  );
}

// Quick reorder card for order history
interface QuickReorderCardProps {
  order: Order;
  className?: string;
}

export function QuickReorderCard({ order, className }: QuickReorderCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const firstItem = order.order_items?.[0];
  const itemCount = order.order_items?.length || 0;

  return (
    <div className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {firstItem?.item_name || order.order_type}
        </p>
        <p className="text-sm text-muted-foreground">
          {itemCount > 1 && `+${itemCount - 1} ${isRu ? 'ещё' : 'more'} • `}
          {order.currency} {order.total_amount?.toLocaleString()}
        </p>
      </div>
      <ReorderButton order={order} size="sm" />
    </div>
  );
}
