import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bouquet } from '@/hooks/useBouquets';

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
}

export function useBuyNowFlowers() {
  const navigate = useNavigate();

  const buyNow = useCallback((bouquet: Bouquet, quantity = 1) => {
    const buyNowItem: FlowersBuyNowItem = {
      id: `bouquet-${bouquet.id}`,
      type: 'flowers',
      name: bouquet.name_en,
      nameRu: bouquet.name_ru,
      price: bouquet.price,
      currency: '฿',
      image: bouquet.image || undefined,
      providerId: bouquet.shop?.provider_id || 'flowers-shop',
      providerName: bouquet.shop?.name_en || 'Phuket Flowers',
      providerNameRu: bouquet.shop?.name_ru || 'Цветы Пхукета',
      quantity,
      shopId: bouquet.shop_id,
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
