import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bouquet, SizeVariant } from '@/hooks/useBouquets';

export interface FlowersBuyNowItem {
  id: string;
  type: 'flowers';
  name: string;
  nameRu: string;
  price: number;
  currency: string;
  image?: string;
  providerId: string;
  providerName: string;
  providerNameRu: string;
  quantity: number;
  shopId: string;
  size?: string;
  sizeLabel?: string;
}

interface BuyNowOptions {
  size?: 'S' | 'M' | 'L';
  sizeVariant?: SizeVariant;
}

export function useBuyNowFlowers() {
  const navigate = useNavigate();

  const buyNow = useCallback((bouquet: Bouquet, quantity = 1, options?: BuyNowOptions) => {
    const size = options?.size || 'M';
    const sizeVariant = options?.sizeVariant;
    const sizeLabel = sizeVariant 
      ? `${sizeVariant.label_en} (${size})` 
      : size;

    // Use sizeVariant price if available, fallback to bouquet base price
    const resolvedPrice = sizeVariant?.price ?? bouquet.price;

    const buyNowItem: FlowersBuyNowItem = {
      id: `bouquet-${bouquet.id}-${size}`,
      type: 'flowers',
      name: `${bouquet.name_en} (${size})`,
      nameRu: `${bouquet.name_ru} (${sizeLabel})`,
      price: resolvedPrice,
      currency: bouquet.currency || 'THB',
      image: bouquet.image || undefined,
      providerId: bouquet.shop?.provider_id || 'flowers-shop',
      providerName: bouquet.shop?.name_en || 'Phuket Flowers',
      providerNameRu: bouquet.shop?.name_ru || 'Цветы Пхукета',
      quantity,
      shopId: bouquet.shop_id,
      size,
      sizeLabel,
    };

    navigate('/flowers/order', {
      state: {
        buyNowItem,
        isBuyNow: true,
      },
    });
  }, [navigate]);

  return { buyNow };
}
