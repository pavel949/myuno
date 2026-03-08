import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';

export type CatalogItemType = 'service' | 'product' | 'property' | 'listing';

export interface UnifiedCatalogItem {
  id: string;
  type: CatalogItemType;
  name_en: string;
  name_ru: string;
  price?: number;
  currency?: string;
  is_active: boolean;
  is_featured?: boolean;
  provider_id?: string;
  provider_name?: string;
  category?: string;
  vertical?: string;
  approval_status?: string;
  created_at: string;
  image?: string;
}

export interface UnifiedCatalogFilters {
  type?: CatalogItemType | 'all';
  status?: 'all' | 'active' | 'inactive' | 'featured' | 'pending';
  search?: string;
  providerId?: string;
  createdByAdmin?: boolean;
  vertical?: string;
}

// Map vertical codes to human-readable labels
const VERTICAL_LABELS: Record<string, { en: string; ru: string }> = {
  yacht: { en: 'Yacht', ru: 'Яхта' },
  experience: { en: 'Tour', ru: 'Тур' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  clinic: { en: 'Clinic', ru: 'Клиника' },
  vehicle: { en: 'Vehicle', ru: 'Транспорт' },
  education: { en: 'Education', ru: 'Образование' },
  pet_service: { en: 'Pet Service', ru: 'Питомцы' },
  cleaning: { en: 'Cleaning', ru: 'Уборка' },
  babysitter: { en: 'Babysitter', ru: 'Няня' },
  bouquet: { en: 'Flowers', ru: 'Цветы' },
};

export function getVerticalLabel(vertical: string, isRussian: boolean): string {
  const labels = VERTICAL_LABELS[vertical];
  if (labels) return isRussian ? labels.ru : labels.en;
  return vertical;
}

export function useUnifiedCatalog(filters: UnifiedCatalogFilters = {}) {
  const [items, setItems] = useState<UnifiedCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allItems: UnifiedCatalogItem[] = [];
      const showListings = !filters.type || filters.type === 'all' || filters.type === 'listing';
      const showServices = !filters.type || filters.type === 'all' || filters.type === 'service';
      const showProducts = !filters.type || filters.type === 'all' || filters.type === 'product';
      const showProperties = !filters.type || filters.type === 'all' || filters.type === 'property';

      // Fetch from unified listings table (yachts, restaurants, tours, clinics, etc.)
      if (showListings) {
        let listingsQuery = supabase
          .from('listings')
          .select('id, name_en, name_ru, price, currency, is_active, is_featured, provider_id, category, vertical, cover_image, created_at, created_by_uno_team, approval_status')
          .order('created_at', { ascending: false })
          .limit(500);

        if (filters.status === 'active') listingsQuery = listingsQuery.eq('is_active', true);
        if (filters.status === 'inactive') listingsQuery = listingsQuery.eq('is_active', false);
        if (filters.status === 'featured') listingsQuery = listingsQuery.eq('is_featured', true);
        if (filters.status === 'pending') listingsQuery = listingsQuery.eq('approval_status', 'pending');
        if (filters.providerId) listingsQuery = listingsQuery.eq('provider_id', filters.providerId);
        if (filters.vertical) listingsQuery = listingsQuery.eq('vertical', filters.vertical);
        if (filters.createdByAdmin !== undefined) {
          listingsQuery = listingsQuery.eq('created_by_uno_team', filters.createdByAdmin);
        }
        if (filters.search) {
          const ss = sanitizeSearchTerm(filters.search);
          if (ss) listingsQuery = listingsQuery.or(`name_en.ilike.%${ss}%,name_ru.ilike.%${ss}%`);
        }

        const { data: listings, error: listingsError } = await listingsQuery;
        if (listingsError) throw listingsError;

        allItems.push(
          ...(listings || []).map((l: any) => ({
            id: l.id,
            type: 'listing' as CatalogItemType,
            name_en: l.name_en,
            name_ru: l.name_ru || l.name_en,
            price: l.price ?? undefined,
            currency: l.currency ?? 'THB',
            is_active: l.is_active ?? false,
            is_featured: l.is_featured ?? false,
            provider_id: l.provider_id ?? undefined,
            category: l.category ?? l.vertical ?? undefined,
            vertical: l.vertical,
            approval_status: l.approval_status ?? undefined,
            created_at: l.created_at,
            image: l.cover_image ?? undefined,
          }))
        );
      }

      // Fetch services
      if (showServices) {
        let servicesQuery = supabase
          .from('services')
          .select('id, name_en, name_ru, price, currency, is_active, provider_id, category:category_id, created_at, images, created_by_uno_team, providers(name)')
          .order('created_at', { ascending: false })
          .limit(200);

        if (filters.status === 'active') servicesQuery = servicesQuery.eq('is_active', true);
        if (filters.status === 'inactive') servicesQuery = servicesQuery.eq('is_active', false);
        if (filters.providerId) servicesQuery = servicesQuery.eq('provider_id', filters.providerId);
        if (filters.createdByAdmin !== undefined) {
          servicesQuery = servicesQuery.eq('created_by_uno_team', filters.createdByAdmin);
        }
        if (filters.search) {
          const ss = sanitizeSearchTerm(filters.search);
          if (ss) servicesQuery = servicesQuery.or(`name_en.ilike.%${ss}%,name_ru.ilike.%${ss}%`);
        }

        const { data: services, error: servicesError } = await servicesQuery;

        if (servicesError) {
          console.error('Failed to fetch services in unified catalog:', servicesError);
        } else {
          allItems.push(
            ...(services || []).map((s: any) => ({
              id: s.id,
              type: 'service' as CatalogItemType,
              name_en: s.name_en,
              name_ru: s.name_ru,
              price: s.price ?? undefined,
              currency: s.currency ?? 'THB',
              is_active: s.is_active ?? false,
              is_featured: false,
              provider_id: s.provider_id ?? undefined,
              provider_name: s.providers?.name ?? undefined,
              category: s.category ?? undefined,
              created_at: s.created_at,
              image: (s.images as string[] | null)?.[0] ?? undefined,
            }))
          );
        }
      }

      // Fetch products
      if (showProducts) {
        let productsQuery = supabase
          .from('marketplace_products')
          .select('id, name_en, name_ru, price, currency, is_active, is_popular, vendor_id, category_slug, created_at, cover_image')
          .order('created_at', { ascending: false })
          .limit(200);

        if (filters.status === 'active') productsQuery = productsQuery.eq('is_active', true);
        if (filters.status === 'inactive') productsQuery = productsQuery.eq('is_active', false);
        if (filters.status === 'featured') productsQuery = productsQuery.eq('is_popular', true);
        if (filters.search) {
          const sp = sanitizeSearchTerm(filters.search);
          if (sp) productsQuery = productsQuery.or(`name_en.ilike.%${sp}%,name_ru.ilike.%${sp}%`);
        }

        const { data: products, error: productsError } = await productsQuery;
        if (productsError) throw productsError;

        allItems.push(
          ...(products || []).map((p: any) => ({
            id: p.id,
            type: 'product' as CatalogItemType,
            name_en: p.name_en,
            name_ru: p.name_ru,
            price: p.price ?? undefined,
            currency: p.currency ?? 'THB',
            is_active: p.is_active ?? false,
            is_featured: p.is_popular ?? false,
            provider_id: p.vendor_id ?? undefined,
            category: p.category_slug ?? undefined,
            created_at: p.created_at,
            image: p.cover_image ?? undefined,
          }))
        );
      }

      // Fetch properties
      if (showProperties) {
        let propertiesQuery = supabase
          .from('properties')
          .select('id, title_en, title_ru, price, currency, is_active, is_featured, provider_id, created_at, cover_image, approval_status, providers(name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(200);

        if (filters.status === 'active') propertiesQuery = propertiesQuery.eq('is_active', true);
        if (filters.status === 'inactive') propertiesQuery = propertiesQuery.eq('is_active', false);
        if (filters.status === 'featured') propertiesQuery = propertiesQuery.eq('is_featured', true);
        if (filters.status === 'pending') propertiesQuery = propertiesQuery.eq('approval_status', 'pending');
        if (filters.providerId) propertiesQuery = propertiesQuery.eq('provider_id', filters.providerId);
        if (filters.search) {
          const sprp = sanitizeSearchTerm(filters.search);
          if (sprp) propertiesQuery = propertiesQuery.or(`title_en.ilike.%${sprp}%,title_ru.ilike.%${sprp}%`);
        }

        const { data: properties, error: propertiesError } = await propertiesQuery;
        if (propertiesError) throw propertiesError;

        allItems.push(
          ...(properties || []).map((p: any) => ({
            id: p.id,
            type: 'property' as CatalogItemType,
            name_en: p.title_en,
            name_ru: p.title_ru,
            price: p.price ?? undefined,
            currency: p.currency ?? 'THB',
            is_active: p.is_active ?? false,
            is_featured: p.is_featured ?? false,
            provider_id: p.provider_id ?? undefined,
            provider_name: p.providers?.name ?? undefined,
            category: 'property',
            approval_status: p.approval_status ?? undefined,
            created_at: p.created_at,
            image: p.cover_image ?? undefined,
          }))
        );
      }

      // Sort all items by created_at
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(allItems);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalog items');
    } finally {
      setIsLoading(false);
    }
  }, [filters.type, filters.status, filters.search, filters.providerId, filters.createdByAdmin, filters.vertical]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Bulk operations
  const bulkUpdateStatus = async (ids: string[], type: CatalogItemType, isActive: boolean) => {
    const table = type === 'listing' ? 'listings' : type === 'service' ? 'services' : type === 'product' ? 'marketplace_products' : 'properties';
    const { error } = await supabase
      .from(table)
      .update({ is_active: isActive })
      .in('id', ids);
    
    if (!error) await fetchItems();
    return { error };
  };

  const bulkUpdateFeatured = async (ids: string[], type: CatalogItemType, isFeatured: boolean) => {
    const table = type === 'listing' ? 'listings' : type === 'service' ? 'services' : type === 'product' ? 'marketplace_products' : 'properties';
    const fieldName = type === 'product' ? 'is_popular' : 'is_featured';
    
    const { error } = await supabase
      .from(table)
      .update({ [fieldName]: isFeatured })
      .in('id', ids);
    
    if (!error) await fetchItems();
    return { error };
  };

  const bulkDelete = async (ids: string[], type: CatalogItemType) => {
    if (type === 'property') {
      const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString(), is_active: false } as any)
        .in('id', ids);
      if (!error) await fetchItems();
      return { error };
    }

    const table = type === 'listing' ? 'listings' : type === 'service' ? 'services' : 'marketplace_products';
    const { error } = await supabase
      .from(table)
      .delete()
      .in('id', ids);
    
    if (!error) await fetchItems();
    return { error };
  };

  return {
    items,
    isLoading,
    error,
    refetch: fetchItems,
    bulkUpdateStatus,
    bulkUpdateFeatured,
    bulkDelete,
  };
}
