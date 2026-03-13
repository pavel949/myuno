import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminProperties } from '@/hooks/useAdminContent';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { VendorProperty } from '@/hooks/useVendorProperties';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { Building2, Plus, Loader2, Search } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CanonicalPropertyForm, CanonicalPropertyFormData } from '@/components/property/canonical-form';

const errorLog = createErrorHandler('AdminProperties');

// Helper to check if an ID belongs to a management company
function useIsManagementCompanyId(id: string) {
  const { data: mcs } = useManagementCompanies();
  return (mcs || []).some(mc => mc.id === id);
}

export default function AdminProperties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>(searchParams.get('provider') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'draft' | 'rejected'>(
    searchParams.get('status') === 'pending' ? 'pending' : 'all'
  );
  
  // Auto-detect if filter ID is an MC to search both provider_id and management_company_id
  const { properties, isLoading: propertiesLoading, createProperty, updateProperty, deleteProperty } = useAdminProperties(filterProviderId || undefined);
  const { data: mcs } = useManagementCompanies();
  
  // Redirect to unified property creation wizard instead of opening dialog
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      navigate('/mc/properties/new?context=admin&return=/admin/properties');
    }
  }, [searchParams, navigate]);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<VendorProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const lastUsedProviderRef = React.useRef<string>('');
  const isSelectedMC = useIsManagementCompanyId(selectedProviderId);

  const isRussian = language === 'ru';

  // Handle edit query param
  React.useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && properties.length > 0) {
      const property = properties.find(p => p.id === editId);
      if (property) {
        openEditSheet(property);
      }
    }
  }, [searchParams, properties]);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate(APP_ROUTES.AUTH);
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const openEditSheet = useCallback((property: VendorProperty) => {
    setEditingProperty(property);
    // Prefer management_company_id if set, then provider_id
    const entityId = (property as any).management_company_id || property.provider_id || '';
    setSelectedProviderId(entityId);
    setIsSheetOpen(true);
  }, []);

  const openNewSheet = useCallback(() => {
    setEditingProperty(null);
    // Use filter provider, or last used provider, or empty
    const defaultProvider = filterProviderId || lastUsedProviderRef.current || '';
    setSelectedProviderId(defaultProvider);
    setIsSheetOpen(true);
  }, [filterProviderId]);

  const closeSheet = useCallback(() => {
    // Remember last used provider for next creation
    if (selectedProviderId) {
      lastUsedProviderRef.current = selectedProviderId;
    }
    setIsSheetOpen(false);
    setEditingProperty(null);
    // Don't reset selectedProviderId — it'll be set fresh on next open
    if (searchParams.has('edit')) {
      navigate('/admin/properties', { replace: true });
    }
  }, [navigate, searchParams, selectedProviderId]);

  // Convert VendorProperty to CanonicalPropertyFormData for editing
  const getInitialFormData = useCallback((): CanonicalPropertyFormData => {
    if (!editingProperty) {
      return { provider_id: selectedProviderId };
    }

    const p = editingProperty as any;
    const modes = p.listing_modes?.length > 0 
      ? p.listing_modes 
      : [p.listing_type || 'rent'];

    return {
      provider_id: p.management_company_id || p.provider_id || '',
      internal_name: p.internal_name || '',
      title_en: p.title_en,
      title_ru: p.title_ru || '',
      description_en: p.description_en || '',
      description_ru: p.description_ru || '',
      property_type: p.property_type,
      listing_modes: modes,
      listing_type: p.listing_type,
      price: p.price ?? undefined,
      price_per_night: p.price?.toString() || p.price_per_night?.toString() || '',
      price_period: p.price_period || 'month',
      sale_price: p.sale_price?.toString() || '',
      is_for_sale: modes.includes('sale'),
      bedrooms: p.bedrooms || 1,
      bathrooms: p.bathrooms || 1,
      area_sqm: p.area_sqm?.toString() || '',
      max_guests: p.max_guests || 2,
      min_stay_nights: p.min_stay_nights || 1,
      address: p.address || '',
      district: p.district || '',
      lat: p.lat ?? undefined,
      lng: p.lng ?? undefined,
      cover_image: p.cover_image || '',
      images: p.images || [],
      amenities: p.amenities || [],
      highlights: p.highlights || [],
      instant_booking: p.instant_booking ?? false,
      is_active: p.is_active ?? true,
      // Admin fields
      is_featured: p.is_featured ?? false,
      is_verified: p.is_verified ?? false,
      approval_status: p.approval_status || 'pending',
      rejection_reason: p.rejection_reason || '',
      commission_rate: p.commission_rate,
      notes: p.notes || '',
      // Utilities
      electricity_included: p.electricity_included,
      electricity_unit_price: p.electricity_unit_price,
      electricity_provider: p.electricity_provider,
      electricity_metering: p.electricity_metering,
      electricity_notes: p.electricity_notes,
      electricity_notes_ru: p.electricity_notes_ru,
      water_included: p.water_included,
      water_unit_price: p.water_unit_price,
      water_notes: p.water_notes,
      water_notes_ru: p.water_notes_ru,
      internet_speed: p.internet_speed,
      internet_provider: p.internet_provider,
      // Services
      cleaning_included: p.cleaning_included,
      cleaning_frequency: p.cleaning_frequency,
      extra_cleaning_price: p.extra_cleaning_price,
      linen_change_price: p.linen_change_price,
      linen_change_frequency: p.linen_change_frequency,
      early_checkin_price: p.early_checkin_price,
      late_checkout_price: p.late_checkout_price,
      transfer_available: p.transfer_available,
      transfer_airport_price: p.transfer_airport_price,
      transfer_notes: p.transfer_notes,
      transfer_notes_ru: p.transfer_notes_ru,
      extra_guest_price: p.extra_guest_price,
      extra_guest_threshold: p.extra_guest_threshold,
      // Investment
      purchase_price: p.purchase_price,
      purchase_date: p.purchase_date,
      purchase_currency: p.purchase_currency,
      acquisition_costs: p.acquisition_costs,
      mortgage_amount: p.mortgage_amount,
      mortgage_bank: p.mortgage_bank,
      mortgage_interest_rate: p.mortgage_interest_rate,
      mortgage_monthly_payment: p.mortgage_monthly_payment,
      chanote_number: p.chanote_number,
      ical_export_enabled: p.ical_export_enabled,
      // House rules
      pets_allowed: p.pets_allowed,
      smoking_allowed: p.smoking_allowed,
      parties_allowed: p.parties_allowed,
      children_friendly: p.children_friendly,
      cancellation_policy: p.cancellation_policy,
      weekly_discount: p.weekly_discount,
      monthly_discount: p.monthly_discount,
      house_rules: p.house_rules,
      house_rules_ru: p.house_rules_ru,
      check_in_time: p.check_in_time,
      check_out_time: p.check_out_time,
      deposit_amount: p.deposit_amount?.toString() || '',
      view_type: p.view_type,
      furnishing_level: p.furnishing_level,
      equipment: p.equipment,
    };
  }, [editingProperty, selectedProviderId]);

  const handleSubmit = async (data: CanonicalPropertyFormData) => {
    if (!data.title_en && !data.title) {
      toast.error(isRussian ? 'Введите название' : 'Enter title');
      return;
    }
    
    const entityId = data.provider_id || selectedProviderId;
    if (!entityId) {
      toast.error(isRussian ? 'Выберите провайдера или УК' : 'Select provider or PM company');
      return;
    }

    setIsSubmitting(true);
    try {
      const listingModes = data.listing_modes || [];
      if (listingModes.length === 0) {
        if (data.is_for_sale) listingModes.push('sale');
        if (data.price_per_night || data.price) listingModes.push('rent');
        if (listingModes.length === 0) listingModes.push('rent');
      }

      const primaryListingType = listingModes.includes('sale') && !listingModes.includes('rent') 
        ? 'sale' 
        : 'rent';

      // Determine if selected entity is MC or provider
      const isMC = isSelectedMC;

      const propertyData: any = {
        ...(isMC 
          ? { management_company_id: entityId, provider_id: null }
          : { provider_id: entityId }
        ),
        internal_name: data.internal_name || undefined,
        title_en: data.title_en || data.title || '',
        title_ru: data.title_ru || data.title_en || data.title || '',
        description_en: data.description_en || data.description || undefined,
        description_ru: data.description_ru || undefined,
        property_type: data.property_type || 'apartment',
        listing_type: primaryListingType,
        listing_modes: listingModes,
        price: data.price || (data.price_per_night ? parseFloat(data.price_per_night) : undefined),
        price_period: data.price_period || 'month',
        sale_price: data.sale_price ? parseFloat(data.sale_price) : undefined,
        currency: 'THB',
        bedrooms: data.bedrooms || 1,
        bathrooms: data.bathrooms || 1,
        area_sqm: data.area_sqm ? parseInt(String(data.area_sqm)) : undefined,
        max_guests: data.max_guests || 2,
        min_stay_nights: data.min_stay_nights || 1,
        address: data.address || undefined,
        district: data.district || undefined,
        lat: data.lat,
        lng: data.lng,
        cover_image: data.cover_image || undefined,
        images: data.images?.length ? data.images : undefined,
        amenities: data.amenities?.length ? data.amenities : undefined,
        highlights: data.highlights?.length ? data.highlights : undefined,
        instant_booking: data.instant_booking,
        is_active: data.is_active ?? true,
        is_featured: data.is_featured,
        is_verified: data.is_verified,
        approval_status: data.approval_status,
        rejection_reason: data.rejection_reason || undefined,
        commission_rate: data.commission_rate,
        notes: data.notes || undefined,
        pets_allowed: data.pets_allowed,
        smoking_allowed: data.smoking_allowed,
        parties_allowed: data.parties_allowed,
        children_friendly: data.children_friendly,
        cancellation_policy: data.cancellation_policy,
        weekly_discount: data.weekly_discount,
        monthly_discount: data.monthly_discount,
        house_rules: data.house_rules,
        house_rules_ru: data.house_rules_ru,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : undefined,
        view_type: data.view_type,
        furnishing_level: data.furnishing_level,
        equipment: data.equipment,
        // Utilities
        electricity_included: data.electricity_included,
        electricity_unit_price: data.electricity_unit_price,
        electricity_provider: data.electricity_provider || undefined,
        electricity_metering: data.electricity_metering || undefined,
        electricity_notes: data.electricity_notes || undefined,
        electricity_notes_ru: data.electricity_notes_ru || undefined,
        water_included: data.water_included,
        water_unit_price: data.water_unit_price,
        water_notes: data.water_notes || undefined,
        water_notes_ru: data.water_notes_ru || undefined,
        internet_speed: data.internet_speed || undefined,
        internet_provider: data.internet_provider || undefined,
        // Services
        cleaning_included: data.cleaning_included,
        cleaning_frequency: data.cleaning_frequency || undefined,
        extra_cleaning_price: data.extra_cleaning_price,
        linen_change_price: data.linen_change_price,
        linen_change_frequency: data.linen_change_frequency || undefined,
        early_checkin_price: data.early_checkin_price,
        late_checkout_price: data.late_checkout_price,
        transfer_available: data.transfer_available,
        transfer_airport_price: data.transfer_airport_price,
        transfer_notes: data.transfer_notes || undefined,
        transfer_notes_ru: data.transfer_notes_ru || undefined,
        extra_guest_price: data.extra_guest_price,
        extra_guest_threshold: data.extra_guest_threshold,
        // Investment
        purchase_price: data.purchase_price,
        purchase_date: data.purchase_date || undefined,
        purchase_currency: data.purchase_currency || undefined,
        acquisition_costs: data.acquisition_costs,
        mortgage_amount: data.mortgage_amount,
        mortgage_bank: data.mortgage_bank || undefined,
        mortgage_interest_rate: data.mortgage_interest_rate,
        mortgage_monthly_payment: data.mortgage_monthly_payment,
        chanote_number: data.chanote_number || undefined,
        ical_export_enabled: data.ical_export_enabled,
      };

      if (editingProperty) {
        const { error } = await updateProperty(editingProperty.id, propertyData);
        if (error) throw error;
        toast.success(isRussian ? 'Объект обновлён' : 'Property updated');
      } else {
        const { error } = await createProperty(propertyData);
        if (error) throw error;
        toast.success(isRussian ? 'Объект создан' : 'Property created');
      }

      closeSheet();
    } catch (error) {
      errorLog.error(error, 'save_property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await deleteProperty(propertyId);
      if (error) throw error;
      toast.success(isRussian ? 'Объект удалён' : 'Property deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      errorLog.error(error, 'delete_property');
    }
  };

  // Filter properties by search query and status
  const filteredProperties = properties.filter(p => {
    const matchesSearch = !searchQuery || 
      p.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title_ru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.internal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'active') return p.is_active;
    if (filter === 'inactive') return !p.is_active;
    // Approval status filter
    const status = (p as any).approval_status || 'pending';
    if (approvalFilter !== 'all' && status !== approvalFilter) return false;
    return true;
  });

  const pendingCount = properties.filter(p => (p as any).approval_status === 'pending').length;
  const approvedCount = properties.filter(p => (p as any).approval_status === 'approved').length;
  const draftCount = properties.filter(p => (p as any).approval_status === 'draft').length;

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Управление недвижимостью' : 'Property Management'}
          showBack
        />

        {/* Search & Add */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRussian ? 'Поиск по названию, району...' : 'Search by title, district...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={openNewSheet}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Provider Filter */}
        <div className="mb-3">
          <ProviderSelector
            value={filterProviderId}
            onChange={setFilterProviderId}
            label={isRussian ? 'Фильтр по провайдеру / УК' : 'Filter by provider / PM'}
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex gap-2 mb-2 flex-wrap">
          {([
            { key: 'all' as const, labelEn: 'All', labelRu: 'Все' },
            { key: 'active' as const, labelEn: 'Active', labelRu: 'Активные' },
            { key: 'inactive' as const, labelEn: 'Inactive', labelRu: 'Неактивные' },
          ]).map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {isRussian ? f.labelRu : f.labelEn}
              {f.key !== 'all' && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {f.key === 'active' 
                    ? properties.filter(p => p.is_active).length 
                    : properties.filter(p => !p.is_active).length}
                </Badge>
              )}
            </Button>
          ))}
          <Badge variant="outline" className="ml-auto self-center">
            {filteredProperties.length} / {properties.length}
          </Badge>
        </div>

        {/* Approval / Moderation Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { key: 'all' as const, labelEn: 'All statuses', labelRu: 'Все статусы', count: properties.length },
            { key: 'pending' as const, labelEn: '⏳ Pending', labelRu: '⏳ На модерации', count: pendingCount },
            { key: 'approved' as const, labelEn: '✅ Approved', labelRu: '✅ Одобрено', count: approvedCount },
            { key: 'draft' as const, labelEn: '📝 Draft', labelRu: '📝 Черновик', count: draftCount },
          ]).map(f => (
            <Button
              key={f.key}
              variant={approvalFilter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setApprovalFilter(f.key)}
              className={f.key === 'pending' && pendingCount > 0 && approvalFilter !== 'pending' ? 'border-amber-500 text-amber-700 dark:text-amber-400' : ''}
            >
              {isRussian ? f.labelRu : f.labelEn}
              {f.key !== 'all' && (
                <Badge 
                  variant={f.key === 'pending' && f.count > 0 ? 'destructive' : 'secondary'} 
                  className="ml-1.5 h-5 px-1.5 text-xs"
                >
                  {f.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Properties List */}
        {propertiesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет объектов' : 'No properties'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRussian ? 'Добавьте недвижимость' : 'Add properties'}
              </p>
              <Button onClick={openNewSheet}>
                <Plus className="h-4 w-4 mr-2" />
                {isRussian ? 'Добавить' : 'Add Property'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProperties.map((property) => {
              const mcId = (property as any).management_company_id;
              const mc = mcId ? (mcs || []).find(c => c.id === mcId) : null;
              const mcName = mc ? (isRussian ? mc.name_ru : mc.name_en) : null;
              return (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant="list"
                  mode="admin"
                  companyName={mcName || undefined}
                  onView={() => openEditSheet(property)}
                  onEdit={() => openEditSheet(property)}
                  onDelete={() => setDeleteConfirmId(property.id)}
                  showApprovalStatus
                  showInstantBadge
                />
              );
            })}
          </div>
        )}

        {/* Canonical Property Form Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto max-h-screen flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {editingProperty 
                  ? (isRussian ? 'Редактировать объект' : 'Edit Property')
                  : (isRussian ? 'Новый объект' : 'New Property')}
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 flex-1 overflow-y-auto min-h-0">
              <CanonicalPropertyForm
                key={editingProperty?.id || 'new'}
                initialData={getInitialFormData()}
                onSubmit={handleSubmit}
                onCancel={closeSheet}
                isSubmitting={isSubmitting}
                mode="admin"
                providerSelector={
                  <ProviderSelector
                    value={selectedProviderId}
                    onChange={setSelectedProviderId}
                    label={isRussian ? 'Привязать к провайдеру' : 'Assign to Provider'}
                    required
                  />
                }
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить объект?' : 'Delete property?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить.'
                : 'This action cannot be undone.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
