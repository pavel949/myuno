import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketplaceProduct } from '@/types/marketplace';

interface BuyNowItem {
  id: string;
  type: 'product';
  name: string;
  nameRu?: string;
  price: number;
  currency: string;
  image?: string;
  providerId: string;
  providerName: string;
  providerNameRu?: string;
  quantity: number;
  isShippableInternational?: boolean;
  weightKg?: number;
}

export function useBuyNow() {
  const navigate = useNavigate();

  const buyNow = useCallback((product: MarketplaceProduct, quantity = 1) => {
    const buyNowItem: BuyNowItem = {
      id: product.id,
      type: 'product',
      name: product.name_en,
      nameRu: product.name_ru,
      price: product.price,
      currency: product.currency || 'THB',
      image: product.cover_image || undefined,
      providerId: 'marketplace',
      providerName: product.vendor_name || 'myUNO Market',
      providerNameRu: product.vendor_name_ru || 'myUNO Маркет',
      quantity,
      isShippableInternational: product.is_shippable_international,
      weightKg: product.weight_kg,
    };

    // Navigate to checkout with the item in state (bypassing cart)
    navigate('/market/checkout', {
      state: {
        buyNowItem,
        isBuyNow: true,
      },
    });
  }, [navigate]);

  return { buyNow };
}
