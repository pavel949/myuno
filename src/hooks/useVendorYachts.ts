import { useSupabaseCRUD } from './useSupabaseCRUD';
import { Yacht } from './useYachts';

export function useVendorYachts(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<Yacht>({
    table: 'yachts',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    select: 'id,name_en,name_ru,description_en,description_ru,yacht_type,cover_image,images,capacity,cabins,length_ft,year_built,price_per_day,price_per_hour,currency,is_active,is_featured,rating,review_count,created_at,updated_at,approval_status',
  });

  return {
    yachts: items,
    isLoading,
    createYacht: async (yachtData: Partial<Yacht> & { provider_id?: string }) => create(yachtData),
    updateYacht: async (id: string, yachtData: Partial<Yacht>) => update(id, yachtData),
    deleteYacht: async (id: string) => remove(id),
    refetch,
  };
}
