import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface AdminStore {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  phone: string | null;
  delivery_available: boolean;
  delivery_fee: number;
  min_order_amount: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  working_hours: Record<string, string>;
  approval_status: string;
  created_at?: string;
  updated_at?: string;
}

export const useAdminStores = (providerId?: string) => {
  const { items, isLoading, error, create, update, remove, refetch } = useSupabaseCRUD<AdminStore>({
    table: 'stores',
    providerId,
    orderByColumn: 'name_en',
    orderAscending: true,
    showToasts: true,
  });

  return {
    stores: items,
    isLoading,
    error,
    createStore: create,
    updateStore: update,
    deleteStore: remove,
    refetch,
  };
};
