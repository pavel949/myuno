import { useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { CartItem } from '@/contexts/CartContext';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface CartToastOptions {
  /** Item that was added */
  item: Omit<CartItem, 'quantity'>;
  /** Path to navigate to cart */
  cartPath?: string;
  /** Duration in milliseconds */
  duration?: number;
}

export function useCartToast() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const showAddedToast = useCallback(
    ({ item, cartPath = '/cart', duration = 3000 }: CartToastOptions) => {
      const itemName = language === 'ru' && item.nameRu ? item.nameRu : item.name;
      const addedText = language === 'ru' ? 'Добавлено в корзину' : 'Added to cart';
      const viewCartText = language === 'ru' ? 'Перейти в корзину' : 'View cart';
      const continueText = language === 'ru' ? 'Продолжить покупки' : 'Continue shopping';

      toast.success(addedText, {
        description: `${itemName} — ${getCurrencySymbol(item.currency || 'THB')}${item.price.toLocaleString()}`,
        duration,
        action: {
          label: viewCartText,
          onClick: () => navigate(cartPath),
        },
        cancel: {
          label: continueText,
          onClick: () => {},
        },
      });
    },
    [language, navigate]
  );

  const showRemovedToast = useCallback(
    (itemName: string) => {
      const removedText = language === 'ru' ? 'Удалено из корзины' : 'Removed from cart';
      toast.info(removedText, {
        description: itemName,
        duration: 2000,
      });
    },
    [language]
  );

  return { showAddedToast, showRemovedToast };
}

export default useCartToast;
