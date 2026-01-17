import { useSupabaseCRUD } from './useSupabaseCRUD';
import { Yacht } from './useYachts';

export function useVendorYachts(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<Yacht>({
    table: 'yachts',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
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
