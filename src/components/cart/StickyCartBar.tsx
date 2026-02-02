import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart, CartItem } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyCartBarProps {
  /** Type of items to count in cart */
  itemType?: CartItem['type'];
  /** Provider ID to filter items */
  providerId?: string;
  /** Custom checkout route */
  checkoutPath?: string;
  /** State to pass to checkout route */
  checkoutState?: Record<string, unknown>;
  /** Custom label for the button */
  buttonLabel?: string;
  /** Whether to show the bar (defaults to true when cart has items) */
  show?: boolean;
  /** Custom className */
  className?: string;
}

export const StickyCartBar = forwardRef<HTMLDivElement, StickyCartBarProps>(
  function StickyCartBar(
    {
      itemType,
      providerId,
      checkoutPath = '/cart',
      checkoutState,
      buttonLabel,
      show,
      className,
    },
    ref
  ) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const { items, getItemsByType, getItemsByProvider } = useCart();

    // Get relevant cart items based on filters
    const getRelevantItems = (): CartItem[] => {
      if (providerId) {
        return getItemsByProvider(providerId);
      }
      if (itemType) {
        return getItemsByType(itemType);
      }
      return items;
    };

    const relevantItems = getRelevantItems();
    const totalItems = relevantItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = relevantItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const shouldShow = show !== undefined ? show : totalItems > 0;

    const handleCheckout = () => {
      navigate(checkoutPath, checkoutState ? { state: checkoutState } : undefined);
    };

    const defaultLabel = t('cart.title');
    const label = buttonLabel || defaultLabel;

    return (
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            ref={ref}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40',
              className
            )}
          >
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleCheckout}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              <span>{label} ({totalItems})</span>
              <span className="ml-auto">{formatPrice(totalPrice)}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default StickyCartBar;
