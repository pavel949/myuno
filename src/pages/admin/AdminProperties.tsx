import { propertyCommercialInitial, propertyCommercialPayload, propertyCommercialValues } from '@/lib/propertyCommercialFields';
import { PublishedPropertyRevisionQueue } from '@/components/admin/PublishedPropertyRevisionQueue';
import { pickLang } from '@/lib/i18n/pickLang';
import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { moderationReturnPath } from '@/lib/moderationReviewRoutes';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ACTIVITY_FILTERS, PROPERTY_APPROVAL_FILTERS, matchesPropertyReview, readFilter, updateReviewParams } from '@/lib/admin/reviewFilters';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminProperties } from '@/hooks/useAdminContent';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { VendorProperty } from '@/hooks/useVendorProperties';
import { useCityCurrency } from '@/hooks/useCityCurrency';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { RealEstateDomainHealthPanel } from '@/components/admin/RealEstateDomainHealthPanel';
import { PropertyProjectBulkLinkPanel } from '@/components/admin/PropertyProjectBulkLinkPanel';

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
import { Building2, Plus, Loader2, Search, CalendarClock } from 'lucide-react';
import { PropertyStayRulesPanel } from '@/components/admin/PropertyStayRulesPanel';

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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { code: cityCurrencyCode } = useCityCurrency();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const filterProviderId = searchParams.get('provider') || '';
  const searchQuery = searchParams.get('q') || '';
  const filter = readFilter(searchParams.get('activity'), ACTIVITY_FILTERS);
  const approvalFilter = readFilter(searchParams.get('status'), PROPERTY_APPROVAL_FILTERS);
  const setFilters = (updates: Record<string, string>) => setSearchParams(previous => updateReviewParams(previous, updates), { replace: true });
  const resetFilters = () => setFilters({ provider: '', q: '', activity: 'all', status: 'all' });

  const { properties, isLoading: propertiesLoading, error: propertiesError, refetch, createProperty, updateProperty, deleteProperty } = useAdminProperties(filterProviderId || undefined, undefined, searchParams.get('edit') || undefined);
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
  const [saveUnconfirmed, setSaveUnconfirmed] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const lastUsedProviderRef = React.useRef<string>('');
  const dismissedEditRef = React.useRef<string | null>(null);
  const previousEditRef = React.useRef<string | null>(null);
  const isSelectedMC = useIsManagementCompanyId(selectedProviderId);

  const isRussian = language === 'ru';

  const openEditSheet = useCallback((property: VendorProperty) => {
    dismissedEditRef.current = null;
    setSaveUnconfirmed(false);
    setEditingProperty(property);
    // Prefer management_company_id if set, then provider_id
    const entityId = (property as any).management_company_id || property.provider_id || '';
    setSelectedProviderId(entityId);
    setIsSheetOpen(true);
  }, []);

  // Handle edit query param
  React.useEffect(() => {
    const editId = searchParams.get('edit');
    if (previousEditRef.current !== editId) {
      if (previousEditRef.current) {
        setIsSheetOpen(false);
        setEditingProperty(null);
      }
      previousEditRef.current = editId;
      dismissedEditRef.current = null;
    }
    if (editId && dismissedEditRef.current !== editId && properties.length > 0 && (!isSheetOpen || editingProperty?.id !== editId)) {
      const property = properties.find(p => p.id === editId);
      if (property) {
        openEditSheet(property);
      }
    }
  }, [searchParams, properties, isSheetOpen, editingProperty?.id, openEditSheet]);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate(APP_ROUTES.AUTH);
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate(APP_ROUTES.HOME);
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const openNewSheet = useCallback(() => {
    setSaveUnconfirmed(false);
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
    dismissedEditRef.current = searchParams.get('edit');
    setIsSheetOpen(false);
    setEditingProperty(null);
    // Don't reset selectedProviderId — it'll be set fresh on next open
    const returnPath = moderationReturnPath(searchParams.get('return'));
    if (returnPath) {
      navigate(returnPath, { replace: true });
    } else if (searchParams.has('edit')) {
      setSearchParams(previous => {
        const next = new URLSearchParams(previous);
        next.delete('edit');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, selectedProviderId, navigate]);

  // Convert VendorProperty to CanonicalPropertyFormData for editing
  const getInitialFormData = useCallback((): CanonicalPropertyFormData => {
    if (!editingProperty) {
      return { provider_id: selectedProviderId, ...propertyCommercialInitial({ currency: cityCurrencyCode, sale_currency: cityCurrencyCode, listing_modes: ['rent'], listing_type: 'rent', is_for_sale: false }) };
    }

    const p = editingProperty as any;
    return {
      provider_id: p.management_company_id || p.provider_id || '',
      internal_name: p.internal_name || '',
      project_id: p.project_id ?? undefined,
      unit_number: p.unit_number ?? '',
      floor: p.floor ?? undefined,
      total_floors: p.total_floors ?? undefined,
      title_en: p.title_en,
      title_ru: p.title_ru || '',
      description_en: p.description_en || '',
      description_ru: p.description_ru || '',
      property_type: p.property_type,
      ...propertyCommercialInitial(p),
      bedrooms: p.bedrooms ?? 1,
      bathrooms: p.bathrooms ?? 1,
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
  }, [editingProperty, selectedProviderId, cityCurrencyCode]);

  const handleSubmit = async (data: CanonicalPropertyFormData) => {
    if (!data.title_en && !data.title) {
      toast.error(pickLang(language, { en: "Enter title", ru: "Введите название", th: "กรุณาระบุชื่อ" }));
      return;
    }
    
    const entityId = data.provider_id || selectedProviderId;
    if (!entityId) {
      toast.error(pickLang(language, { en: "Select provider or PM company", ru: "Выберите провайдера или УК", th: "เลือกผู้ให้บริการหรือบริษัทจัดการ" }));
      return;
    }

    setIsSubmitting(true);
    setSaveUnconfirmed(false);
    try {
      const commercial = propertyCommercialPayload(propertyCommercialValues(data), editingProperty ?? {}, true, !editingProperty);

      // Determine if selected entity is MC or provider
      const isMC = isSelectedMC;

      const propertyData: any = {
        ...(isMC 
          ? { management_company_id: entityId, provider_id: null }
          : { provider_id: entityId }
        ),
        internal_name: data.internal_name || undefined,
        project_id: data.project_id || null,
        unit_number: data.unit_number?.trim() || null,
        floor: data.floor ?? null,
        total_floors: data.total_floors ?? null,
        title_en: data.title_en || data.title || '',
        title_ru: data.title_ru || data.title_en || data.title || '',
        description_en: data.description_en || data.description || undefined,
        description_ru: data.description_ru || undefined,
        property_type: data.property_type || 'apartment',
        ...commercial,
        bedrooms: data.bedrooms ?? 1,
        bathrooms: data.bathrooms ?? 1,
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
        rejection_reason: data.approval_status === 'rejected' ? data.rejection_reason?.trim() || null : null,
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
        const { error } = await updateProperty(editingProperty.id, propertyData, editingProperty.updated_at);
        if (error) throw error;
        toast.success(pickLang(language, { en: "Property updated", ru: "Объект обновлён", th: "อัปเดตที่พักแล้ว" }));
      } else {
        const { error } = await createProperty(propertyData);
        if (error) throw error;
        toast.success(pickLang(language, { en: "Property created", ru: "Объект создан", th: "สร้างที่พักแล้ว" }));
      }

      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      closeSheet();
    } catch (error) {
      setSaveUnconfirmed(true);
      errorLog.error(error, 'save_property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await deleteProperty(propertyId);
      if (error) throw error;
      toast.success(pickLang(language, { en: "Property deleted", ru: "Объект удалён", th: "ลบที่พักแล้ว" }));
      setDeleteConfirmId(null);
    } catch (error) {
      errorLog.error(error, 'delete_property');
    }
  };

  const filteredProperties = properties.filter(p => matchesPropertyReview(p, { q: searchQuery, activity: filter, status: approvalFilter }));
  // Counts describe the current search/provider/activity, before the moderation choice.
  const approvalCount = (status: typeof PROPERTY_APPROVAL_FILTERS[number]) => propertiesLoading || propertiesError ? '—'
    : properties.filter(p => matchesPropertyReview(p, { q: searchQuery, activity: filter, status })).length;
  const hasFilters = !!filterProviderId || !!searchQuery || filter !== 'all' || approvalFilter !== 'all';
  const approvalLabels = {
    pending: pickLang(language, { en: "Pending approval", ru: "На модерации", th: "รออนุมัติ" }),
    draft: pickLang(language, { en: "Draft", ru: "Черновик", th: "ฉบับร่าง" }),
    rejected: pickLang(language, { en: "Rejected", ru: "Отклонено", th: "ไม่อนุมัติ" }),
    approved: pickLang(language, { en: "Approved", ru: "Одобрено", th: "อนุมัติแล้ว" }),
  };

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
          title={pickLang(language, { en: "Property Management", ru: "Управление недвижимостью", th: "จัดการที่พัก" })}
          showBack
        />

        {/* Domain structure health: developer -> project -> unit */}
        <div className="mb-4">
          <RealEstateDomainHealthPanel />
          <PropertyProjectBulkLinkPanel />
        </div>

        <PublishedPropertyRevisionQueue />

        {/* Search & Add */}

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={pickLang(language, { en: "Search by title, district...", ru: "Поиск по названию, району...", th: "ค้นหาด้วยชื่อหรือย่าน..." })}
              value={searchQuery}
              onChange={(e) => setFilters({ q: e.target.value })}
              aria-label={pickLang(language, { en: "Search properties", ru: "Поиск объектов", th: "ค้นหาที่พัก" })}
              className="pl-9"
            />
          </div>
          <Button onClick={openNewSheet} aria-label={pickLang(language, { en: "Add property", ru: "Добавить объект", th: "เพิ่มที่พัก" })}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Provider Filter */}
        <div className="mb-3">
          <ProviderSelector
            value={filterProviderId}
            onChange={value => setFilters({ provider: value })}
            label={pickLang(language, { en: "Filter by provider / PM", ru: "Фильтр по провайдеру / УК", th: "กรองตามผู้ให้บริการ / บริษัทจัดการ" })}
          />
        </div>

        <div className="mb-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {pickLang(language, { en: "Approval and activity are separate settings. Open a property to review its details before changing its status.", ru: "Модерация и активность — разные настройки. Откройте объект, чтобы проверить данные перед изменением статуса.", th: "การอนุมัติและการใช้งานเป็นคนละการตั้งค่า เปิดที่พักเพื่อตรวจสอบข้อมูลก่อนเปลี่ยนสถานะ" })}
          </p>
          <fieldset>
            <legend className="text-sm font-medium mb-2">{pickLang(language, { en: "Approval", ru: "Модерация", th: "การอนุมัติ" })}</legend>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_APPROVAL_FILTERS.map(status => (
                <Button key={status} size="sm" className="min-h-11" variant={approvalFilter === status ? 'default' : 'outline'}
                  aria-pressed={approvalFilter === status} onClick={() => setFilters({ status })}>
                  {status === 'all' ? (pickLang(language, { en: "All", ru: "Все", th: "ทั้งหมด" })) : approvalLabels[status]}
                  {' '}<span className="ml-2 font-mono">{approvalCount(status)}</span>
                </Button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium mb-2">{pickLang(language, { en: "Activity", ru: "Активность", th: "การใช้งาน" })}</legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_FILTERS.map(activity => (
                <Button key={activity} size="sm" className="min-h-11" variant={filter === activity ? 'default' : 'outline'}
                  aria-pressed={filter === activity} onClick={() => setFilters({ activity })}>
                  {activity === 'all' ? (pickLang(language, { en: "Any", ru: "Любая", th: "ทั้งหมด" })) : activity === 'active' ? (pickLang(language, { en: "Active", ru: "Активные", th: "ใช้งาน" })) : (pickLang(language, { en: "Inactive", ru: "Неактивные", th: "ไม่ใช้งาน" }))}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <p role="status">{propertiesLoading ? (pickLang(language, { en: "Loading properties…", ru: "Загрузка объектов…", th: "กำลังโหลดที่พัก…" })) : propertiesError ? (pickLang(language, { en: "Count unavailable", ru: "Количество недоступно", th: "ไม่ทราบจำนวน" })) : (pickLang(language, { ru: `Показано: ${filteredProperties.length} из ${properties.length}`, en: `Showing ${filteredProperties.length} of ${properties.length}`, th: `แสดง ${filteredProperties.length} จาก ${properties.length} รายการ` }))}</p>
            {hasFilters && <Button size="sm" variant="ghost" onClick={resetFilters}>{pickLang(language, { en: "Reset filters", ru: "Сбросить фильтры", th: "ล้างตัวกรอง" })}</Button>}
          </div>
        </div>

        {searchParams.has('edit') && !propertiesLoading && !propertiesError && !properties.some(property => property.id === searchParams.get('edit')) && (
          <div role="alert" className="mb-4 rounded-none border p-4 space-y-3">
            <p>{pickLang(language, { en: "This property is unavailable in the loaded list. Refresh the data or return to the queue.", ru: "Объект недоступен в загруженном списке. Обновите данные или вернитесь в очередь.", th: "ไม่พบที่พักนี้ในรายการที่โหลด โปรดรีเฟรชข้อมูลหรือกลับไปยังคิว" })}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void refetch()}>{pickLang(language, { en: "Refresh", ru: "Обновить", th: "รีเฟรช" })}</Button>
              {moderationReturnPath(searchParams.get('return')) && <Button variant="outline" onClick={closeSheet}>{pickLang(language, { en: "Return to queue", ru: "Вернуться в очередь", th: "กลับไปยังคิว" })}</Button>}
            </div>
          </div>
        )}

        {/* Properties List */}
        {propertiesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : propertiesError ? (
          <Card><CardContent className="p-6" role="alert">
            <p className="mb-3">{pickLang(language, { en: "Could not load properties. Statuses and counts are unavailable.", ru: "Не удалось загрузить объекты. Статусы и количество недоступны.", th: "โหลดที่พักไม่ได้ จึงไม่ทราบสถานะและจำนวน" })}</p>
            <Button variant="outline" onClick={() => void refetch()}>{pickLang(language, { en: "Retry", ru: "Повторить", th: "ลองอีกครั้ง" })}</Button>
          </CardContent></Card>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {hasFilters ? (pickLang(language, { en: "No matching properties", ru: "Нет совпадений", th: "ไม่พบที่พักที่ตรงกัน" })) : (pickLang(language, { en: "No properties", ru: "Нет объектов", th: "ไม่มีที่พัก" }))}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasFilters ? (pickLang(language, { en: "Change or reset your filters.", ru: "Измените или сбросьте фильтры.", th: "เปลี่ยนหรือล้างตัวกรอง" })) : (pickLang(language, { en: "Add properties", ru: "Добавьте недвижимость", th: "เพิ่มที่พัก" }))}
              </p>
              <Button onClick={hasFilters ? resetFilters : openNewSheet}>
                <Plus className="h-4 w-4 mr-2" />
                {hasFilters ? (pickLang(language, { en: "Reset filters", ru: "Сбросить фильтры", th: "ล้างตัวกรอง" })) : (pickLang(language, { en: "Add Property", ru: "Добавить", th: "เพิ่มที่พัก" }))}
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
                <div key={property.id} className="space-y-1">
                  <div className="flex flex-wrap gap-2 text-xs" aria-label={pickLang(language, { en: "Property statuses", ru: "Статусы объекта", th: "สถานะที่พัก" })}>
                    <Badge variant="outline">{approvalLabels[property.approval_status as keyof typeof approvalLabels] || (pickLang(language, { en: "Approval: unknown", ru: "Модерация: неизвестно", th: "การอนุมัติ: ไม่ทราบ" }))}</Badge>
                    <Badge variant="secondary">{property.is_active === true ? (pickLang(language, { en: "Active", ru: "Активен", th: "ใช้งาน" })) : property.is_active === false ? (pickLang(language, { en: "Inactive", ru: "Неактивен", th: "ไม่ใช้งาน" })) : (pickLang(language, { en: "Activity: unknown", ru: "Активность: неизвестно", th: "การใช้งาน: ไม่ทราบ" }))}</Badge>
                  </div>
                <PropertyCard
                  property={property}
                  variant="list"
                  mode="admin"
                  companyName={mcName || undefined}
                  onView={() => openEditSheet(property)}
                  onEdit={() => openEditSheet(property)}
                  onDelete={() => setDeleteConfirmId(property.id)}
                  showApprovalStatus={false}
                  showInstantBadge
                />
                </div>
              );
            })}
          </div>
        )}

        {/* Canonical Property Form Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={open => { if (!open) closeSheet(); }}>
          <SheetContent
            className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden p-4 sm:max-w-2xl sm:p-6 [&>button]:z-30"
            closeLabel={pickLang(language, { en: "Close editor", ru: "Закрыть редактор", th: "ปิดหน้าต่างแก้ไข" })}
          >
            <SheetHeader className="relative z-20 shrink-0 bg-background pr-10">
              <SheetTitle>
                {editingProperty 
                  ? (pickLang(language, { en: "Edit Property", ru: "Редактировать объект", th: "แก้ไขที่พัก" }))
                  : (pickLang(language, { en: "New Property", ru: "Новый объект", th: "ที่พักใหม่" }))}
              </SheetTitle>
            </SheetHeader>
            
            {saveUnconfirmed && <p role="alert" className="shrink-0 border border-destructive p-3 text-sm">
              {pickLang(language, { en: "Save was not confirmed. Close the editor, refresh the list and reopen the property before trying again.", ru: "Сохранение не подтверждено. Закройте редактор, обновите список и откройте объект снова перед повторной попыткой.", th: "ยังยืนยันการบันทึกไม่ได้ โปรดปิดหน้าต่างแก้ไข รีเฟรชรายการ แล้วเปิดที่พักอีกครั้งก่อนลองใหม่" })}
            </p>}
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <CanonicalPropertyForm
                key={editingProperty?.id || 'new'}
                initialData={getInitialFormData()}
                onSubmit={handleSubmit}
                onCancel={closeSheet}
                isSubmitting={isSubmitting}
                mode="admin"
                layout="contained"
                mediaModalLayer="above-sheet"
                propertyId={editingProperty?.id}
                extraTabs={editingProperty?.id ? [{
                  id: 'stay-rules',
                  icon: CalendarClock,
                  labelEn: 'Stay rules',
                  labelRu: 'Условия аренды',
                  content: <PropertyStayRulesPanel propertyId={editingProperty.id} />,
                }] : []}
                providerSelector={
                  <ProviderSelector
                    value={selectedProviderId}
                    onChange={setSelectedProviderId}
                    label={pickLang(language, { en: "Assign to Provider", ru: "Привязать к провайдеру", th: "กำหนดผู้ให้บริการ" })}
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
              <DialogTitle>{pickLang(language, { en: "Delete property?", ru: "Удалить объект?", th: "ลบที่พักหรือไม่" })}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {pickLang(language, { en: "This action cannot be undone.", ru: "Это действие нельзя отменить.", th: "การดำเนินการนี้ไม่สามารถย้อนกลับได้" })}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {pickLang(language, { en: "Cancel", ru: "Отмена", th: "ยกเลิก" })}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {pickLang(language, { en: "Delete", ru: "Удалить", th: "ลบ" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
