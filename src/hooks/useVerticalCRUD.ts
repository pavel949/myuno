import { useSupabaseCRUD } from './useSupabaseCRUD';
import { getVerticalById } from '@/lib/verticals';

interface UseVerticalCRUDOptions {
  orderBy?: string;
  ascending?: boolean;
  select?: string;
  enabled?: boolean;
  showToasts?: boolean;
}

/**
 * Generic CRUD hook for any vertical.
 * Replaces per-vertical wrapper hooks (useVendorFlowers, useVendorRestaurants, etc.)
 * by looking up the table name from the VERTICALS registry.
 *
 * @example
 * const { items, create, update, remove } = useVerticalCRUD<Restaurant>('restaurant', providerId);
 */
export function useVerticalCRUD<T extends { id: string }>(
  verticalId: string,
  providerId?: string,
  options: UseVerticalCRUDOptions = {},
) {
  const vertical = getVerticalById(verticalId);
  const table = vertical?.table ?? verticalId;

  return useSupabaseCRUD<T>({
    table,
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: options.orderBy ?? 'created_at',
    orderAscending: options.ascending ?? false,
    select: options.select ?? '*',
    enabled: options.enabled,
    showToasts: options.showToasts ?? true,
  });
}
