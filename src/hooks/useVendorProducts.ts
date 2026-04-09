import { useVerticalCRUD } from './useVerticalCRUD';
import { MarketplaceProduct } from '@/types/marketplace';

export interface VendorProduct extends MarketplaceProduct {
  vendor_id: string | null;
  approval_status?: string;
  rejection_reason?: string | null;
}

export function useVendorProducts(marketplaceVendorId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorProduct>('marketplace_products', marketplaceVendorId, {
    select: 'id,name_en,name_ru,description_en,description_ru,category_id,price,original_price,currency,cover_image,images,stock_quantity,is_active,is_featured,rating,review_count,vendor_id,approval_status,rejection_reason,created_at,updated_at',
  });

  return {
    products: items,
    isLoading,
    createProduct: async (productData: Partial<VendorProduct> & { vendor_id?: string }) => create(productData),
    updateProduct: async (id: string, productData: Partial<VendorProduct>) => update(id, productData),
    deleteProduct: async (id: string) => remove(id),
    refetch,
  };
}
