import React, { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { useBulkSelection } from '@/hooks/useBulkSelection';

type CatalogItemType = 'service' | 'product' | 'property';

interface UnifiedCatalogItem {
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
  created_at: string;
  image?: string;
}

interface UnifiedCatalogFilters {
  type?: CatalogItemType | 'all';
  status?: 'all' | 'active' | 'inactive' | 'featured';
  search?: string;
  providerId?: string;
  createdByAdmin?: boolean;
}

function useUnifiedCatalog(filters: UnifiedCatalogFilters = {}) {
  const [items, setItems] = useState<UnifiedCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allItems: UnifiedCatalogItem[] = [];

      // Fetch services if type is 'all' or 'service'
      if (!filters.type || filters.type === 'all' || filters.type === 'service') {
        let servicesQuery = supabase
          .from('services')
          .select('id, name_en, name_ru, price, currency, is_active, provider_id, category_id, created_at, images, created_by_uno_team, providers(name)')
          .order('created_at', { ascending: false })
          .limit(500);

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
        if (servicesError) throw servicesError;

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
            category: s.category_id ?? undefined,
            created_at: s.created_at,
            image: (s.images as string[] | null)?.[0] ?? undefined,
          }))
        );
      }
      // Fetch products if type is 'all' or 'product'
      if (!filters.type || filters.type === 'all' || filters.type === 'product') {
        let productsQuery = supabase
          .from('marketplace_products')
          .select('id, name_en, name_ru, price, currency, is_active, is_popular, vendor_id, category_slug, created_at, cover_image')
          .order('created_at', { ascending: false })
          .limit(100);

        if (filters.status === 'active') productsQuery = productsQuery.eq('is_active', true);
        if (filters.status === 'inactive') productsQuery = productsQuery.eq('is_active', false);
        if (filters.status === 'featured') productsQuery = productsQuery.eq('is_popular', true);
        if (filters.providerId) productsQuery = productsQuery.eq('vendor_id', filters.providerId);
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
            provider_name: p.vendor_name ?? undefined,
            category: p.category_slug ?? undefined,
            created_at: p.created_at,
            image: p.cover_image ?? undefined,
          }))
        );
      }

      // Fetch properties if type is 'all' or 'property'
      if (!filters.type || filters.type === 'all' || filters.type === 'property') {
        let propertiesQuery = supabase
          .from('properties')
          .select('id, title_en, title_ru, price, currency, is_active, is_featured, provider_id, created_at, cover_image, providers(name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(500);

        if (filters.status === 'active') propertiesQuery = propertiesQuery.eq('is_active', true);
        if (filters.status === 'inactive') propertiesQuery = propertiesQuery.eq('is_active', false);
        if (filters.status === 'featured') propertiesQuery = propertiesQuery.eq('is_featured', true);
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
  }, [filters.type, filters.status, filters.search, filters.providerId, filters.createdByAdmin]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Bulk operations
  const bulkUpdateStatus = async (ids: string[], type: CatalogItemType, isActive: boolean) => {
    const table = type === 'service' ? 'services' : type === 'product' ? 'marketplace_products' : 'properties';
    const { error } = await supabase
      .from(table)
      .update({ is_active: isActive })
      .in('id', ids);

    if (!error) await fetchItems();
    return { error };
  };

  const bulkUpdateFeatured = async (ids: string[], type: CatalogItemType, isFeatured: boolean) => {
    // Each table has a different "featured" column (and `services` has none).
    // Branch by type so TS sees a concrete object literal per table — the
    // previous `{ [field]: value } as never` cast tripped the strict
    // RejectExcessProperties check on the discriminated union.
    if (type === 'service') {
      // `services` table has no featured/popular flag — no-op.
      return { error: null };
    }

    const { error } =
      type === 'product'
        ? await supabase
            .from('marketplace_products')
            .update({ is_popular: isFeatured })
            .in('id', ids)
        : await supabase
            .from('properties')
            .update({ is_featured: isFeatured })
            .in('id', ids);

    if (!error) await fetchItems();
    return { error };
  };


  const bulkDelete = async (ids: string[], type: CatalogItemType) => {
    const table = type === 'service' ? 'services' : type === 'product' ? 'marketplace_products' : 'properties';

    // Soft delete for properties, hard delete for others
    if (type === 'property') {
      const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString(), is_active: false } as any)
        .in('id', ids);
      if (!error) await fetchItems();
      return { error };
    }

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
import { BulkActionsBar, useCatalogBulkActions } from '@/components/admin/BulkActionsBar';
import { CatalogExportButton } from '@/components/admin/CatalogExportButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Package, 
  ShoppingCart, 
  Home, 
  Search, 
  Filter,
  ExternalLink,
  Star,
  MoreHorizontal,
  Trash2,
  Power,
  PowerOff,
  Building2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCatalogItemIcon, getNameInitials } from '@/lib/utils/catalogIconMapper';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';

const typeIcons: Record<CatalogItemType, React.ReactNode> = {
  service: <Package className="h-4 w-4 text-info" />,
  product: <ShoppingCart className="h-4 w-4 text-success" />,
  property: <Home className="h-4 w-4 text-accent-amber" />,
};

const typeLabels: Record<CatalogItemType, { en: string; ru: string }> = {
  service: { en: 'Service', ru: 'Услуга' },
  product: { en: 'Product', ru: 'Товар' },
  property: { en: 'Property', ru: 'Недвижимость' },
};

// Smart avatar component that shows relevant icons based on item name
function CatalogItemAvatar({ item }: { item: UnifiedCatalogItem }) {
  const itemName = item.name_ru || item.name_en;
  const { icon: ItemIcon, color } = getCatalogItemIcon(itemName, item.type);
  const initials = getNameInitials(itemName);
  
  return (
    <Avatar className="h-10 w-10 rounded-none">
      <AvatarImage src={item.image} className="object-cover" />
      <AvatarFallback className={cn(
        "rounded-none",
        item.type === 'service' && "bg-info/10",
        item.type === 'product' && "bg-success/10",
        item.type === 'property' && "bg-accent-amber/10"
      )}>
        <ItemIcon className={cn("h-5 w-5", color)} />
      </AvatarFallback>
    </Avatar>
  );
}

export interface UnifiedCatalogTableProps {
  providerId?: string;
}

export function UnifiedCatalogTable({ providerId }: UnifiedCatalogTableProps = {}) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  
  const [typeFilter, setTypeFilter] = useState<CatalogItemType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'admin' | 'vendor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { items, isLoading, error, bulkUpdateStatus, bulkUpdateFeatured, bulkDelete, refetch } = useUnifiedCatalog({
    type: typeFilter,
    status: statusFilter,
    search: searchQuery,
    providerId,
    createdByAdmin: creatorFilter === 'admin' ? true : creatorFilter === 'vendor' ? false : undefined,
  });

  const { 
    selectedIds, 
    selectedCount, 
    isSelected, 
    toggle, 
    selectAll, 
    deselectAll,
    getSelectedItems,
  } = useBulkSelection(items);

  // Get selected items by type for bulk operations
  const getSelectedByType = () => {
    const selected = getSelectedItems();
    const byType: Record<CatalogItemType, string[]> = {
      service: [],
      product: [],
      property: [],
    };
    selected.forEach(item => {
      byType[item.type].push(item.id);
    });
    return byType;
  };

  const handleBulkActivate = async () => {
    const byType = getSelectedByType();
    const promises = Object.entries(byType)
      .filter(([_, ids]) => ids.length > 0)
      .map(([type, ids]) => bulkUpdateStatus(ids, type as CatalogItemType, true));
    
    await Promise.all(promises);
    toast.success(isRussian ? 'Элементы активированы' : 'Items activated');
    deselectAll();
  };

  const handleBulkDeactivate = async () => {
    const byType = getSelectedByType();
    const promises = Object.entries(byType)
      .filter(([_, ids]) => ids.length > 0)
      .map(([type, ids]) => bulkUpdateStatus(ids, type as CatalogItemType, false));
    
    await Promise.all(promises);
    toast.success(isRussian ? 'Элементы деактивированы' : 'Items deactivated');
    deselectAll();
  };

  const handleBulkFeature = async () => {
    const byType = getSelectedByType();
    const promises = Object.entries(byType)
      .filter(([_, ids]) => ids.length > 0)
      .map(([type, ids]) => bulkUpdateFeatured(ids, type as CatalogItemType, true));
    
    await Promise.all(promises);
    toast.success(isRussian ? 'Элементы добавлены в избранное' : 'Items featured');
    deselectAll();
  };

  const handleBulkUnfeature = async () => {
    const byType = getSelectedByType();
    const promises = Object.entries(byType)
      .filter(([_, ids]) => ids.length > 0)
      .map(([type, ids]) => bulkUpdateFeatured(ids, type as CatalogItemType, false));
    
    await Promise.all(promises);
    toast.success(isRussian ? 'Элементы убраны из избранного' : 'Items unfeatured');
    deselectAll();
  };

  const handleBulkDelete = async () => {
    if (!confirm(isRussian ? 'Удалить выбранные элементы?' : 'Delete selected items?')) return;
    
    const byType = getSelectedByType();
    const promises = Object.entries(byType)
      .filter(([_, ids]) => ids.length > 0)
      .map(([type, ids]) => bulkDelete(ids, type as CatalogItemType));
    
    await Promise.all(promises);
    toast.success(isRussian ? 'Элементы удалены' : 'Items deleted');
    deselectAll();
  };

  const bulkActions = useCatalogBulkActions(selectedIds, {
    onActivate: handleBulkActivate,
    onDeactivate: handleBulkDeactivate,
    onFeature: handleBulkFeature,
    onUnfeature: handleBulkUnfeature,
    onDelete: handleBulkDelete,
  });

  const getItemPath = (item: UnifiedCatalogItem) => {
    // Route to list pages with edit parameter - these pages handle editing via modals
    switch (item.type) {
      case 'service':
        return `/admin/services?edit=${item.id}`;
      case 'product':
        return `/admin/catalog?edit=${item.id}`;
      case 'property':
        return `/admin/properties?edit=${item.id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 flex-1 max-w-md" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-none border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">{isRussian ? 'Ошибка загрузки каталога' : 'Failed to load catalog'}</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          {isRussian ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CatalogItemType | 'all')}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все типы' : 'All types'}</SelectItem>
            <SelectItem value="service">{isRussian ? 'Услуги' : 'Services'}</SelectItem>
            <SelectItem value="product">{isRussian ? 'Товары' : 'Products'}</SelectItem>
            <SelectItem value="property">{isRussian ? 'Недвижимость' : 'Properties'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все статусы' : 'All statuses'}</SelectItem>
            <SelectItem value="active">{isRussian ? 'Активные' : 'Active'}</SelectItem>
            <SelectItem value="inactive">{isRussian ? 'Неактивные' : 'Inactive'}</SelectItem>
            <SelectItem value="featured">{isRussian ? 'Избранные' : 'Featured'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={creatorFilter} onValueChange={(v) => setCreatorFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все создатели' : 'All creators'}</SelectItem>
            <SelectItem value="admin">{isRussian ? 'Создано админом' : 'Admin-created'}</SelectItem>
            <SelectItem value="vendor">{isRussian ? 'Создано вендором' : 'Vendor-created'}</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRussian ? 'Поиск по названию...' : 'Search by name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Badge variant="secondary" className="h-10 px-3 flex items-center">
          {items.length} {isRussian ? 'элементов' : 'items'}
        </Badge>

        <CatalogExportButton items={items} filename="catalog" />
      </div>

      {/* Table */}
      <div className="border rounded-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCount > 0 && selectedCount === items.length}
                  onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
                />
              </TableHead>
              <TableHead className="w-14"></TableHead>
              <TableHead className="min-w-[200px]">{isRussian ? 'Название' : 'Name'}</TableHead>
              <TableHead className="w-24">{isRussian ? 'Тип' : 'Type'}</TableHead>
              <TableHead className="hidden md:table-cell w-[180px]">{isRussian ? 'Провайдер' : 'Provider'}</TableHead>
              <TableHead className="hidden lg:table-cell w-[120px]">{isRussian ? 'Категория' : 'Category'}</TableHead>
              <TableHead className="w-28">{isRussian ? 'Цена' : 'Price'}</TableHead>
              <TableHead className="w-24">{isRussian ? 'Статус' : 'Status'}</TableHead>
              <TableHead className="hidden md:table-cell w-[110px]">{isRussian ? 'Создано' : 'Created'}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="font-medium">{isRussian ? 'Нет элементов' : 'No items found'}</p>
                    <p className="text-sm">{(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery || creatorFilter !== 'all') ? (isRussian ? 'Попробуйте ослабить фильтры' : 'Try relaxing filters') : (isRussian ? 'Данные по услугам, товарам и недвижимости загружаются из БД' : 'Data loads from services, products and properties')}</p>
                    {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery || creatorFilter !== 'all') && (
                      <Button variant="outline" size="sm" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearchQuery(''); setCreatorFilter('all'); }}>
                        {isRussian ? 'Сбросить фильтры' : 'Reset filters'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow 
                  key={`${item.type}-${item.id}`}
                  data-state={isSelected(item.id) ? 'selected' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <CatalogItemAvatar item={item} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium line-clamp-1 text-foreground">
                        {isRussian ? item.name_ru : item.name_en}
                      </span>
                      {item.is_featured && (
                        <span className="flex items-center gap-1 text-xs text-accent-amber">
                          <Star className="h-3 w-3 fill-current" />
                          {isRussian ? 'Избранное' : 'Featured'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {typeIcons[item.type]}
                      <span className="hidden sm:inline">
                        {isRussian ? typeLabels[item.type].ru : typeLabels[item.type].en}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.provider_name ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate max-w-[140px]">{item.provider_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {item.category ? (
                      <Badge variant="secondary" className="text-[11px]">
                        {item.category}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {item.price ? formatPrice(item.price) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active 
                        ? (isRussian ? 'Активен' : 'Active')
                        : (isRussian ? 'Неактивен' : 'Inactive')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { 
                      addSuffix: true, 
                      locale: isRussian ? ruLocale : undefined 
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(getItemPath(item))}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {isRussian ? 'Открыть' : 'Open'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async () => {
                            const table = item.type === 'service' ? 'services' : item.type === 'product' ? 'marketplace_products' : 'properties';
                            const { error } = await supabase.from(table).update({ is_active: !item.is_active }).eq('id', item.id);
                            if (!error) { refetch(); toast.success(isRussian ? 'Статус обновлён' : 'Status updated'); }
                            else toast.error(error.message);
                          }}
                        >
                          {item.is_active ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                          {item.is_active ? (isRussian ? 'Деактивировать' : 'Deactivate') : (isRussian ? 'Активировать' : 'Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={async () => {
                            if (!confirm(isRussian ? 'Удалить этот элемент?' : 'Delete this item?')) return;
                            if (item.type === 'property') {
                              // Soft delete for properties
                              const { error } = await (supabase.from('properties') as any).update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', item.id);
                              if (!error) { refetch(); toast.success(isRussian ? 'Перемещено в корзину' : 'Moved to trash'); }
                              else toast.error(error.message);
                            } else {
                              const table = item.type === 'service' ? 'services' : 'marketplace_products';
                              const { error } = await supabase.from(table).delete().eq('id', item.id);
                              if (!error) { refetch(); toast.success(isRussian ? 'Удалено' : 'Deleted'); }
                              else toast.error(error.message);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {item.type === 'property' ? (isRussian ? 'В корзину' : 'Move to trash') : (isRussian ? 'Удалить' : 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        totalCount={items.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        actions={bulkActions}
      />
    </div>
  );
}
