import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedCatalog, CatalogItemType, UnifiedCatalogItem, getVerticalLabel } from '@/hooks/useUnifiedCatalog';
import { useBulkSelection } from '@/hooks/useBulkSelection';
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
  Building2,
  Layers,
  CheckCircle,
  Clock,
  XCircle
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
  listing: <Layers className="h-4 w-4 text-primary" />,
  service: <Package className="h-4 w-4 text-info" />,
  product: <ShoppingCart className="h-4 w-4 text-success" />,
  property: <Home className="h-4 w-4 text-accent-amber" />,
};

const typeLabels: Record<CatalogItemType, { en: string; ru: string }> = {
  listing: { en: 'Listing', ru: 'Листинг' },
  service: { en: 'Service', ru: 'Услуга' },
  product: { en: 'Product', ru: 'Товар' },
  property: { en: 'Property', ru: 'Недвижимость' },
};

function CatalogItemAvatar({ item }: { item: UnifiedCatalogItem }) {
  const itemName = item.name_ru || item.name_en;
  const { icon: ItemIcon, color } = getCatalogItemIcon(itemName, item.type === 'listing' ? 'service' : item.type);
  
  return (
    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg">
      <AvatarImage src={item.image} className="object-cover" />
      <AvatarFallback className={cn(
        "rounded-lg",
        item.type === 'listing' && "bg-primary/10",
        item.type === 'service' && "bg-info/10",
        item.type === 'product' && "bg-success/10",
        item.type === 'property' && "bg-accent-amber/10"
      )}>
        <ItemIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
      </AvatarFallback>
    </Avatar>
  );
}

function ApprovalBadge({ status, isRussian }: { status?: string; isRussian: boolean }) {
  if (!status || status === 'approved') return null;
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="text-warning border-warning/30 gap-1 text-[10px]">
        <Clock className="h-3 w-3" />
        {isRussian ? 'На модерации' : 'Pending'}
      </Badge>
    );
  }
  if (status === 'rejected') {
    return (
      <Badge variant="outline" className="text-destructive border-destructive/30 gap-1 text-[10px]">
        <XCircle className="h-3 w-3" />
        {isRussian ? 'Отклонён' : 'Rejected'}
      </Badge>
    );
  }
  return null;
}

export function UnifiedCatalogTable() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  
  const [typeFilter, setTypeFilter] = useState<CatalogItemType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured' | 'pending'>('all');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'admin' | 'vendor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { items, isLoading, bulkUpdateStatus, bulkUpdateFeatured, bulkDelete, refetch } = useUnifiedCatalog({
    type: typeFilter,
    status: statusFilter,
    search: searchQuery,
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

  const getSelectedByType = () => {
    const selected = getSelectedItems();
    const byType: Record<CatalogItemType, string[]> = {
      listing: [],
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
    switch (item.type) {
      case 'listing':
        return `/admin/quick-listings?edit=${item.id}`;
      case 'service':
        return `/admin/services?edit=${item.id}`;
      case 'product':
        return `/admin/catalog?edit=${item.id}`;
      case 'property':
        return `/admin/properties?edit=${item.id}`;
    }
  };

  const handleApprove = async (item: UnifiedCatalogItem) => {
    const table = item.type === 'listing' ? 'listings' : 'properties';
    const { error } = await supabase.from(table).update({ approval_status: 'approved', is_active: true }).eq('id', item.id);
    if (!error) { refetch(); toast.success(isRussian ? 'Одобрено' : 'Approved'); }
    else toast.error(error.message);
  };

  const handleReject = async (item: UnifiedCatalogItem) => {
    const table = item.type === 'listing' ? 'listings' : 'properties';
    const { error } = await supabase.from(table).update({ approval_status: 'rejected', is_active: false }).eq('id', item.id);
    if (!error) { refetch(); toast.success(isRussian ? 'Отклонено' : 'Rejected'); }
    else toast.error(error.message);
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
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CatalogItemType | 'all')}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs sm:text-sm">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все типы' : 'All types'}</SelectItem>
            <SelectItem value="listing">{isRussian ? 'Листинги' : 'Listings'}</SelectItem>
            <SelectItem value="service">{isRussian ? 'Услуги' : 'Services'}</SelectItem>
            <SelectItem value="product">{isRussian ? 'Товары' : 'Products'}</SelectItem>
            <SelectItem value="property">{isRussian ? 'Недвижимость' : 'Properties'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все статусы' : 'All statuses'}</SelectItem>
            <SelectItem value="active">{isRussian ? 'Активные' : 'Active'}</SelectItem>
            <SelectItem value="inactive">{isRussian ? 'Неактивные' : 'Inactive'}</SelectItem>
            <SelectItem value="pending">{isRussian ? 'На модерации' : 'Pending'}</SelectItem>
            <SelectItem value="featured">{isRussian ? 'Избранные' : 'Featured'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={creatorFilter} onValueChange={(v) => setCreatorFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm">
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
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <Badge variant="secondary" className="h-9 px-3 flex items-center text-xs">
          {items.length} {isRussian ? 'элементов' : 'items'}
        </Badge>

        <CatalogExportButton items={items} filename="catalog" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto text-xs sm:text-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 sm:w-12 px-1 sm:px-4">
                <Checkbox
                  checked={selectedCount > 0 && selectedCount === items.length}
                  onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
                />
              </TableHead>
              <TableHead className="w-10 sm:w-14 px-1 sm:px-4"></TableHead>
              <TableHead className="min-w-[120px] sm:min-w-[200px]">{isRussian ? 'Название' : 'Name'}</TableHead>
              <TableHead className="hidden sm:table-cell w-24">{isRussian ? 'Тип' : 'Type'}</TableHead>
              <TableHead className="hidden lg:table-cell w-[120px]">{isRussian ? 'Вертикаль' : 'Vertical'}</TableHead>
              <TableHead className="hidden md:table-cell w-[180px]">{isRussian ? 'Провайдер' : 'Provider'}</TableHead>
              <TableHead className="w-20 sm:w-28">{isRussian ? 'Цена' : 'Price'}</TableHead>
              <TableHead className="w-16 sm:w-24">{isRussian ? 'Статус' : 'Status'}</TableHead>
              <TableHead className="hidden md:table-cell w-[110px]">{isRussian ? 'Создано' : 'Created'}</TableHead>
              <TableHead className="w-8 sm:w-12 px-1 sm:px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  {isRussian ? 'Нет элементов' : 'No items found'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow 
                  key={`${item.type}-${item.id}`}
                  data-state={isSelected(item.id) ? 'selected' : undefined}
                >
                  <TableCell className="px-1 sm:px-4">
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                    />
                  </TableCell>
                  <TableCell className="px-1 sm:px-4">
                    <CatalogItemAvatar item={item} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium line-clamp-1 text-foreground text-xs sm:text-sm">
                        {isRussian ? (item.name_ru || item.name_en) : item.name_en}
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.is_featured && (
                          <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-accent-amber">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                          </span>
                        )}
                        <ApprovalBadge status={item.approval_status} isRussian={isRussian} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="gap-1">
                      {typeIcons[item.type]}
                      <span className="hidden sm:inline text-[11px]">
                        {isRussian ? typeLabels[item.type].ru : typeLabels[item.type].en}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {item.vertical ? (
                      <Badge variant="secondary" className="text-[11px]">
                        {getVerticalLabel(item.vertical, isRussian)}
                      </Badge>
                    ) : item.category ? (
                      <Badge variant="secondary" className="text-[11px]">
                        {item.category}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
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
                        {/* Approve/Reject for pending items */}
                        {item.approval_status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(item)}>
                              <CheckCircle className="h-4 w-4 mr-2 text-success" />
                              {isRussian ? 'Одобрить' : 'Approve'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(item)}>
                              <XCircle className="h-4 w-4 mr-2 text-destructive" />
                              {isRussian ? 'Отклонить' : 'Reject'}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={async () => {
                            const table = item.type === 'listing' ? 'listings' : item.type === 'service' ? 'services' : item.type === 'product' ? 'marketplace_products' : 'properties';
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
                              const { error } = await (supabase.from('properties') as any).update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', item.id);
                              if (!error) { refetch(); toast.success(isRussian ? 'Перемещено в корзину' : 'Moved to trash'); }
                              else toast.error(error.message);
                            } else {
                              const table = item.type === 'listing' ? 'listings' : item.type === 'service' ? 'services' : 'marketplace_products';
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
