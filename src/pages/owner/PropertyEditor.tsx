import { propertyCommercialInitial, propertyCommercialValues, propertyCommercialPayload, type PropertyCommercialSource } from '@/lib/propertyCommercialFields';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buildPropertyPayload } from '@/hooks/property-wizard/buildPayload';
import { initialOwnershipData, mapPropertyToFormData } from '@/hooks/property-wizard/initialData';
import { propertyRevisionEditingRow, readPropertyRevision, savePropertyRevision } from '@/lib/propertyRevisions';
import { propertyAuthoringDelta, editablePropertyAuthoringPatch, isIndependentPropertyProvider } from '@/lib/propertyAuthoring';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import { pickLang } from '@/lib/i18n/pickLang';
import { useLanguage } from '@/contexts/LanguageContext';

import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { pickPropertyPaymentFields } from '@/hooks/property-wizard/buildPayload';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyRooms, Room } from '@/components/property/PropertyRooms';
import { PropertyCalendar, AvailabilityEntry } from '@/components/property/PropertyCalendar';
import { SeasonalPrice } from '@/components/property/SeasonalPricing';
import { PropertyTeamTab } from '@/components/owner/PropertyTeamTab';
import { CanonicalPropertyForm, ExtraTab } from '@/components/property/canonical-form/CanonicalPropertyForm';
import { AIIntakePanel } from '@/components/owner/property-wizard/AIIntakePanel';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bed, Calendar, UsersRound, Eye, Loader2, Check, Rocket, EyeOff } from 'lucide-react';
import { createErrorHandler } from '@/lib/errorHandler';
import { normalizeFurnishingLevel, normalizeViewTypes, primaryViewType } from '@/lib/propertyFormNormalizers';

import { toast } from 'sonner';
const errorLog = createErrorHandler('PropertyEditor');

/**
 * Map DB property to CanonicalPropertyFormData-compatible initial data
 */
function mapPropertyToInitialData(property: any) {
  return {
    ...pickPropertyPaymentFields(property),
    title_en: property.title || property.title_en || '',
    title_ru: property.title_ru || '',
    internal_name: property.internal_name || '',
    description_en: property.description_en || property.description || '',
    description_ru: property.description_ru || '',
    address: property.address || '',
    district: property.district || '',
    lat: property.lat,
    lng: property.lng,
    property_type: property.property_type || 'apartment',
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1,
    area_sqm: property.area_sqm?.toString() || '',
    management_type: property.management_type || 'full',
    is_rented: property.is_rented || false,
    cover_image: property.cover_image || '',
    images: property.images || [],
    price_per_night: property.price_per_night?.toString() || '',
    deposit_amount: property.deposit_amount?.toString() || '',
    weekly_discount: property.weekly_discount?.toString() || '0',
    monthly_discount: property.monthly_discount?.toString() || '0',
    min_stay_nights: property.min_stay_nights || 1,
    max_guests: property.max_guests || 2,
    instant_booking: property.instant_booking || false,
    cancellation_policy: property.cancellation_policy || 'flexible',
    check_in_time: property.check_in_time || '14:00',
    check_out_time: property.check_out_time || '12:00',
    highlights: property.highlights || [],
    platform_listed: property.listing_modes?.includes('platform') ?? false,
    project_id: property.project_id,
    floor: property.floor,
    unit_number: property.unit_number || '',
    view_type: normalizeViewTypes(property.view_type),
    furnishing_level: normalizeFurnishingLevel(property.furnishing_level),
    equipment: property.equipment || [],
    // Rules
    pets_allowed: property.pets_allowed || false,
    pet_deposit: property.pet_deposit?.toString() || '',
    smoking_allowed: property.smoking_allowed,
    smoking_penalty: property.smoking_penalty?.toString() || '',
    children_friendly: property.children_friendly ?? true,
    has_crib: property.has_crib || false,
    has_high_chair: property.has_high_chair || false,
    parties_allowed: property.parties_allowed || false,
    quiet_hours_start: property.quiet_hours_start || '22:00',
    quiet_hours_end: property.quiet_hours_end || '08:00',
    house_rules: property.house_rules || '',
    house_rules_ru: property.house_rules_ru || '',
    // Utilities
    electricity_included: property.electricity_included || false,
    electricity_unit_price: property.electricity_unit_price ?? 7,
    electricity_provider: property.electricity_provider,
    electricity_metering: property.electricity_metering,
    water_included: property.water_included ?? true,
    water_unit_price: property.water_unit_price,
    internet_speed: property.internet_speed,
    internet_provider: property.internet_provider,
    // Services
    cleaning_included: property.cleaning_included ?? true,
    cleaning_frequency: property.cleaning_frequency || 'weekly',
    extra_cleaning_price: property.extra_cleaning_price,
    linen_change_price: property.linen_change_price,
    linen_change_frequency: property.linen_change_frequency,
    early_checkin_price: property.early_checkin_price,
    late_checkout_price: property.late_checkout_price,
    transfer_available: property.transfer_available,
    transfer_airport_price: property.transfer_airport_price,
    extra_guest_price: property.extra_guest_price,
    extra_guest_threshold: property.extra_guest_threshold,
    ...propertyCommercialInitial(property),
  };
}

function editorPayload({ formData, rooms, servicesData, utilitiesData }: { formData: PropertyFormData; rooms: Room[]; servicesData: Record<string, any>; utilitiesData: Record<string, any> }, managedEmployee: boolean, original: PropertyCommercialSource = {}) {
    const modes = new Set(original.listing_modes ?? []);
    if (Boolean(formData.platform_listed) !== Boolean(original.listing_modes?.includes('platform'))) {
      if (formData.platform_listed) modes.add('platform'); else modes.delete('platform');
    }
    if (formData.is_for_sale !== (original.is_for_sale ?? false)) {
      if (formData.is_for_sale) modes.add('sale'); else modes.delete('sale');
    }
    return {
      ...(managedEmployee ? { ...buildPropertyPayload({ formData, ownershipData: initialOwnershipData, activeOrgId: null, approvalStatus: 'draft' }), ...utilitiesData, ...servicesData } : {}),
      ...pickPropertyPaymentFields(formData),
      ...propertyCommercialPayload({ ...propertyCommercialValues(original),
        price_per_night: formData.price_per_night,
        price_per_month: formData.price_per_month ?? propertyCommercialValues(original).price_per_month,
        sale_price: formData.sale_price,
        is_for_sale: formData.is_for_sale === (original.is_for_sale ?? false) ? original.is_for_sale : formData.is_for_sale,
        listing_modes: modes.size || original.listing_modes != null ? [...modes] : original.listing_modes,
      }, original),
      title: formData.title,
      title_en: formData.title,
      title_ru: formData.title_ru,
      property_type: formData.property_type,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
      management_type: formData.management_type,
      is_rented: formData.is_rented,
      description_en: formData.description,
      description_ru: formData.description_ru,
      highlights: formData.highlights,
      rooms,
      address: formData.address,
      district: formData.district,
      lat: formData.lat,
      lng: formData.lng,
      cover_image: formData.cover_image,
      images: formData.images,
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
      weekly_discount: Number(formData.weekly_discount) || 0,
      monthly_discount: Number(formData.monthly_discount) || 0,
      seasonal_pricing: formData.seasonal_pricing && formData.seasonal_pricing.length > 0 ? formData.seasonal_pricing : null,
      min_stay_nights: formData.min_stay_nights,
      max_guests: formData.max_guests,
      instant_booking: formData.instant_booking,
      cancellation_policy: formData.cancellation_policy,
      check_in_time: formData.check_in_time,
      check_out_time: formData.check_out_time,
      electricity_included: utilitiesData.electricity_included,
      electricity_unit_price: utilitiesData.electricity_unit_price ? Number(utilitiesData.electricity_unit_price) : null,
      water_included: utilitiesData.water_included,
      water_unit_price: utilitiesData.water_unit_price ? Number(utilitiesData.water_unit_price) : null,
      internet_speed: utilitiesData.internet_speed || null,
      cleaning_included: servicesData.cleaning_included,
      cleaning_frequency: servicesData.cleaning_frequency,
      extra_cleaning_price: servicesData.extra_cleaning_price ? Number(servicesData.extra_cleaning_price) : null,
      early_checkin_price: servicesData.early_checkin_price ? Number(servicesData.early_checkin_price) : null,
      late_checkout_price: servicesData.late_checkout_price ? Number(servicesData.late_checkout_price) : null,
      transfer_available: servicesData.transfer_available,
      transfer_airport_price: servicesData.transfer_airport_price ? Number(servicesData.transfer_airport_price) : null,
      pets_allowed: formData.pets_allowed,
      pet_deposit: formData.pet_deposit ? Number(formData.pet_deposit) : null,
      children_friendly: formData.children_friendly,
      has_crib: formData.has_crib,
      has_high_chair: formData.has_high_chair,
      quiet_hours_start: formData.quiet_hours_start,
      quiet_hours_end: formData.quiet_hours_end,
      parties_allowed: formData.parties_allowed,
      house_rules: formData.house_rules || null,
      house_rules_ru: formData.house_rules_ru || null,
      smoking_penalty: formData.smoking_penalty ? Number(formData.smoking_penalty) : null,
      listing_modes: modes.size || original.listing_modes != null ? [...modes] : original.listing_modes,
    };
}

export default function PropertyEditor() {
  const { id } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { canAccess, isLoading: permissionsLoading } = useTeamPermissions();

  const navigate = useNavigate();
  const isRu = language === 'ru';

  const queryClient = useQueryClient();
  const { data: liveProperty, isLoading, error: propertyError, refetch: refetchProperty } = useOwnerProperty(id, { authoring: true });
  const providerAuthority = useQuery({
    queryKey: ['property-authoring-provider', user?.id, liveProperty?.id, liveProperty?.provider_id],
    enabled: !!user && !!liveProperty?.provider_id && liveProperty.owner_id !== user.id && !isAdmin,
    queryFn: () => isIndependentPropertyProvider(liveProperty?.provider_id, user!.id),
  });
  const independentProvider = liveProperty?.provider_id === user?.id || providerAuthority.data === true;
  const managedEmployee = !!liveProperty?.management_company_id && liveProperty.owner_id !== user?.id && !isAdmin && !independentProvider;
  const publishedRevision = managedEmployee && liveProperty?.approval_status === 'approved' && liveProperty.is_active === true;
  const revisionKey = ['managed-property-revision', user?.id, liveProperty?.management_company_id, id];
  const revisionQuery = useQuery({
    queryKey: revisionKey,
    enabled: !!publishedRevision && !!id && !adminLoading && !providerAuthority.isLoading,
    queryFn: () => readPropertyRevision(id!, liveProperty?.management_company_id || undefined),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const property = useMemo(() => publishedRevision && revisionQuery.data
    ? propertyRevisionEditingRow(revisionQuery.data) : liveProperty, [publishedRevision, revisionQuery.data, liveProperty]);
  const revisionPending = revisionQuery.data?.revision?.status === 'pending';
  const revisionConflict = revisionQuery.data?.conflict === true;
  const [revisionSaving, setRevisionSaving] = useState(false);
  const [revisionSaveBlocked, setRevisionSaveBlocked] = useState(false);
  const revisionVersionRef = useRef<string | null>(null);
  const canEdit = !!property && !!user && !adminLoading && !providerAuthority.isLoading && !providerAuthority.error
    && (!managedEmployee || (!permissionsLoading && canAccess('properties', 'edit')
      && (publishedRevision ? !!revisionQuery.data && !revisionQuery.error && !revisionPending && !revisionConflict
        : ['draft', 'rejected'].includes(property.approval_status || ''))));
  const savingRef = useRef(false);
  const actorScope = `${user?.id || ''}:${id || ''}`;
  const actorScopeRef = useRef(actorScope);
  actorScopeRef.current = actorScope;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  useEffect(() => { savingRef.current = false; setRevisionSaveBlocked(false); setRevisionSaving(false); }, [actorScope]);
  const savedVersionRef = useRef<string>(undefined);
  const updateProperty = useUpdateOwnerProperty();
  const autosaveProperty = useUpdateOwnerProperty();
  const { availability, syncAvailability, isSaving: isSavingAvailability } = usePropertyAvailabilityManagement(property && !managedEmployee ? id : undefined);

  const [showPreview, setShowPreview] = useState(false);

  // Rooms & Calendar local state (not in CanonicalPropertyForm)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [localAvailability, setLocalAvailability] = useState<AvailabilityEntry[]>([]);

  // Controlled form data for CanonicalPropertyForm
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [utilitiesData, setUtilitiesData] = useState<Record<string, any>>({});
  const [servicesData, setServicesData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'unsaved' | 'error'>('idle');
  const lastSavedSnapshotRef = useRef('');
  const hydratedIdRef = useRef<string>(undefined);
  const latestSnapshotRef = useRef('');
  latestSnapshotRef.current = formData ? JSON.stringify({ formData, rooms, utilitiesData, servicesData }) : '';

  // Populate from property data
  useEffect(() => {
    if (!property) return;
    // Background invalidation must not overwrite edits made while a save was
    // in flight. Keep the old expected version if another editor changed it.
    if (hydratedIdRef.current === `${user?.id}:${property.id}` && latestSnapshotRef.current !== lastSavedSnapshotRef.current) return;
    hydratedIdRef.current = `${user?.id}:${property.id}`;
    savedVersionRef.current = property.updated_at;
    revisionVersionRef.current = publishedRevision ? revisionQuery.data?.revision?.version || null : null;
    const mapped = mapPropertyToInitialData(property);
    const nextFormData = {
      ...mapPropertyToFormData(property),
      ...pickPropertyPaymentFields(mapped),
      title: mapped.title_en,
      title_ru: mapped.title_ru,
      internal_name: mapped.internal_name,
      address: mapped.address,
      district: mapped.district,
      lat: mapped.lat,
      lng: mapped.lng,
      property_type: mapped.property_type,
      bedrooms: mapped.bedrooms,
      bathrooms: mapped.bathrooms,
      area_sqm: mapped.area_sqm,
      description: mapped.description_en,
      description_ru: mapped.description_ru,
      cover_image: mapped.cover_image,
      images: mapped.images,
      management_type: mapped.management_type,
      is_rented: mapped.is_rented,
      rental_platforms: [],
      custom_platform: '',
      project_id: mapped.project_id,
      floor: mapped.floor,
      unit_number: mapped.unit_number,
      view_type: mapped.view_type,
      furnishing_level: mapped.furnishing_level,
      equipment: mapped.equipment,
      price_per_night: mapped.price_per_night,
      min_stay_nights: mapped.min_stay_nights,
      max_guests: mapped.max_guests,
      deposit_amount: mapped.deposit_amount,
      check_in_time: mapped.check_in_time,
      check_out_time: mapped.check_out_time,
      instant_booking: mapped.instant_booking,
      is_for_sale: property.is_for_sale ?? false,
      sale_price: property.sale_price != null ? String(property.sale_price) : '',
      pets_allowed: mapped.pets_allowed,
      pet_deposit: mapped.pet_deposit,
      smoking_allowed: mapped.smoking_allowed,
      smoking_penalty: mapped.smoking_penalty,
      children_friendly: mapped.children_friendly,
      has_crib: mapped.has_crib,
      has_high_chair: mapped.has_high_chair,
      parties_allowed: mapped.parties_allowed,
      quiet_hours_start: mapped.quiet_hours_start,
      quiet_hours_end: mapped.quiet_hours_end,
      house_rules: mapped.house_rules,
      house_rules_ru: mapped.house_rules_ru,
      cancellation_policy: mapped.cancellation_policy,
      weekly_discount: mapped.weekly_discount,
      monthly_discount: mapped.monthly_discount,
      seasonal_pricing: (property.seasonal_pricing as unknown as SeasonalPrice[]) || [],
      highlights: mapped.highlights,
    } as PropertyFormData;
    const nextUtilitiesData = {
      electricity_notes: property.electricity_notes, electricity_notes_ru: property.electricity_notes_ru,
      water_notes: property.water_notes, water_notes_ru: property.water_notes_ru,
      electricity_included: mapped.electricity_included,
      electricity_unit_price: mapped.electricity_unit_price,
      electricity_provider: mapped.electricity_provider,
      electricity_metering: mapped.electricity_metering,
      water_included: mapped.water_included,
      water_unit_price: mapped.water_unit_price,
      internet_speed: mapped.internet_speed,
      internet_provider: mapped.internet_provider,
    };
    const nextServicesData = {
      transfer_notes: property.transfer_notes, transfer_notes_ru: property.transfer_notes_ru,
      late_checkout_penalty: property.late_checkout_penalty,
      cleaning_included: mapped.cleaning_included,
      cleaning_frequency: mapped.cleaning_frequency,
      extra_cleaning_price: mapped.extra_cleaning_price,
      linen_change_price: mapped.linen_change_price,
      linen_change_frequency: mapped.linen_change_frequency,
      early_checkin_price: mapped.early_checkin_price,
      late_checkout_price: mapped.late_checkout_price,
      transfer_available: mapped.transfer_available,
      transfer_airport_price: mapped.transfer_airport_price,
      extra_guest_price: mapped.extra_guest_price,
      extra_guest_threshold: mapped.extra_guest_threshold,
    };
    const nextRooms = (property.rooms as unknown as Room[]) || [];

    setFormData(nextFormData);
    lastSavedSnapshotRef.current = JSON.stringify({
      formData: nextFormData,
      rooms: nextRooms,
      utilitiesData: nextUtilitiesData,
      servicesData: nextServicesData,
    });
    setLastSaved(new Date(property.updated_at));
    setSaveState('saved');

    setUtilitiesData(nextUtilitiesData);
    setServicesData(nextServicesData);
    setRooms(nextRooms);
  }, [property, user?.id, publishedRevision, revisionQuery.data, revisionSaveBlocked]);

  // Sync availability
  useEffect(() => {
    if (availability) setLocalAvailability(availability);
  }, [availability]);

  const hasUnsavedChanges = useMemo(() => {
    if (!formData) return false;
    return JSON.stringify({ formData, rooms, utilitiesData, servicesData }) !== lastSavedSnapshotRef.current;
  }, [formData, rooms, utilitiesData, servicesData]);

  // AI Intake merge: only fills empty/missing fields, never overwrites existing data
  const handleAIMerge = useCallback((extracted: Record<string, any>) => {
    if (!formData) return;

    const fieldMap: Record<string, keyof PropertyFormData> = {
      title: 'title',
      title_ru: 'title_ru',
      description: 'description',
      description_ru: 'description_ru',
      address: 'address',
      district: 'district',
      property_type: 'property_type',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      area_sqm: 'area_sqm',
      price_per_night: 'price_per_night',
      max_guests: 'max_guests',
      deposit_amount: 'deposit_amount',
    };

    const updates: Partial<PropertyFormData> = {};
    let filled = 0;

    for (const [extractedKey, formKey] of Object.entries(fieldMap)) {
      const extractedVal = extracted[extractedKey];
      if (extractedVal == null || extractedVal === '') continue;

      const currentVal = formData[formKey];
      // Only fill if current value is empty/falsy (but keep 0 as valid)
      const isEmpty = currentVal === '' || currentVal === null || currentVal === undefined;
      if (isEmpty) {
        (updates as any)[formKey] = typeof extractedVal === 'number' ? String(extractedVal) : extractedVal;
        filled++;
      }
    }

    // Merge images: append new ones
    if (extracted.images?.length && formData.images) {
      const existingSet = new Set(formData.images);
      const newImages = extracted.images.filter((img: string) => !existingSet.has(img));
      if (newImages.length > 0) {
        (updates as any).images = [...formData.images, ...newImages];
        filled += newImages.length;
      }
    }
    if (extracted.cover_image && !formData.cover_image) {
      (updates as any).cover_image = extracted.cover_image;
      filled++;
    }

    if (filled > 0) {
      setFormData(prev => prev ? { ...prev, ...updates } : prev);
    }

    return filled;
  }, [formData]);

  const buildEditorPayload = useCallback(() => {
    if (!formData) return null;
    const payload = editorPayload({ formData, rooms, servicesData, utilitiesData }, managedEmployee, property);
    if (!managedEmployee) return payload;
    const baseline = lastSavedSnapshotRef.current ? editorPayload(JSON.parse(lastSavedSnapshotRef.current), true, property) : {};
    return editablePropertyAuthoringPatch(propertyAuthoringDelta(payload, baseline), { pricing: canAccess('pricing', 'edit'), bookings: canAccess('bookings', 'edit') });
  }, [formData, rooms, servicesData, utilitiesData, managedEmployee, canAccess, property]);

  const persistRevision = useCallback(async (payload: Record<string, unknown>, submit = false) => {
    if (!id || !liveProperty?.management_company_id || !savedVersionRef.current) throw new Error('Reload the property revision before saving');
    setRevisionSaving(true);
    try {
      const saved = await savePropertyRevision({
        propertyId: id, companyId: liveProperty.management_company_id,
        expectedUpdatedAt: savedVersionRef.current, expectedRevision: revisionVersionRef.current,
        patch: payload, submit,
      });
      if (mountedRef.current && actorScopeRef.current === actorScope) {
        revisionVersionRef.current = saved.revision!.version;
        queryClient.setQueryData(['managed-property-revision', user?.id, liveProperty.management_company_id, id], saved);
      }
      return saved.property;
    } catch (error) {
      if (mountedRef.current && actorScopeRef.current === actorScope) setRevisionSaveBlocked(true);
      throw error;
    } finally { if (mountedRef.current && actorScopeRef.current === actorScope) setRevisionSaving(false); }
  }, [id, liveProperty?.management_company_id, actorScope, queryClient, user?.id]);

  const restartRevision = async () => {
    const current = revisionQuery.data;
    if (!current || savingRef.current || revisionSaving || !canAccess('properties', 'edit') || revisionPending) return;
    savingRef.current = true;
    setRevisionSaving(true);
    try {
      const saved = await savePropertyRevision({ propertyId: current.property.id, companyId: current.property.management_company_id!,
        expectedUpdatedAt: current.property.updated_at, expectedRevision: current.revision?.version || null, patch: {}, restart: true });
      if (!mountedRef.current || actorScopeRef.current !== actorScope) return;
      hydratedIdRef.current = undefined;
      queryClient.setQueryData(revisionKey, saved);
    } catch (error) {
      if (!mountedRef.current || actorScopeRef.current !== actorScope) return;
      toast.error(error instanceof Error ? error.message : pickLang(language, { en: 'Could not restart revision', ru: 'Не удалось начать изменения заново', th: 'เริ่มฉบับแก้ไขใหม่ไม่สำเร็จ' }));
    } finally { if (actorScopeRef.current === actorScope) { savingRef.current = false; if (mountedRef.current) setRevisionSaving(false); } }
  };

  const persistEditorDraft = useCallback(async () => {
    if (!id || !formData || !hasUnsavedChanges || !canEdit || (publishedRevision && revisionSaveBlocked) || savingRef.current || hydratedIdRef.current !== actorScope) return;
    const savingScope = actorScope;

    const payload = buildEditorPayload();
    if (!payload) return;

    setSaveState('saving');
    savingRef.current = true;
    try {
      const saved = publishedRevision ? await persistRevision(payload) : await autosaveProperty.mutateAsync({
        id,
        ...payload,
        _authoring: true,
        _expectedUpdatedAt: savedVersionRef.current,
        _silent: true,
      } as any);

      if (!mountedRef.current || actorScopeRef.current !== savingScope) return;
      savedVersionRef.current = saved.updated_at;
      lastSavedSnapshotRef.current = JSON.stringify({ formData, rooms, utilitiesData, servicesData });
      setLastSaved(new Date());
      setSaveState(latestSnapshotRef.current === lastSavedSnapshotRef.current ? 'saved' : 'unsaved');
    } catch (error) {
      if (!mountedRef.current || actorScopeRef.current !== savingScope) return;
      setSaveState('error');
      errorLog.silent(error, 'persist_editor_draft');
    } finally { if (actorScopeRef.current === savingScope) savingRef.current = false; }
  }, [actorScope, autosaveProperty, buildEditorPayload, canEdit, formData, hasUnsavedChanges, id, rooms, servicesData, utilitiesData, publishedRevision, persistRevision, revisionSaveBlocked]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    setSaveState('unsaved');
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges || !formData) return;

    const timer = window.setTimeout(() => {
      void persistEditorDraft();
    }, 30000);

    return () => window.clearTimeout(timer);
  }, [formData, hasUnsavedChanges, persistEditorDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleBlurAutosave = useCallback((event: React.FocusEvent) => {
    // A save/review button must not lose its click to blur-triggered autosave.
    if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('button')) return;
    if (!hasUnsavedChanges) return;
    void persistEditorDraft();
  }, [hasUnsavedChanges, persistEditorDraft]);

  const handleSubmit = async (submitForReview = false) => {
    if (!id || !formData || !canEdit || (publishedRevision && revisionSaveBlocked) || savingRef.current || hydratedIdRef.current !== actorScope) return;
    const savingScope = actorScope;
    savingRef.current = true;
    try {
      const saved = publishedRevision ? await persistRevision(buildEditorPayload() || {}, submitForReview) : await updateProperty.mutateAsync({ id, ...(buildEditorPayload() || {}), _authoring: true, _expectedUpdatedAt: savedVersionRef.current, _submitForReview: submitForReview, ...(submitForReview ? { approval_status: 'pending', is_active: false } : {}) } as never);
      if (!mountedRef.current || actorScopeRef.current !== savingScope) return;
      savedVersionRef.current = saved.updated_at;

      if (!managedEmployee) await syncAvailability(localAvailability);
      if (!mountedRef.current || actorScopeRef.current !== savingScope) return;
      lastSavedSnapshotRef.current = JSON.stringify({ formData, rooms, utilitiesData, servicesData });
      setLastSaved(new Date());
      setSaveState('saved');

      if ((window as any).__swPendingReload) {
        window.location.reload();
        return;
      }

      toast(publishedRevision ? pickLang(language, submitForReview
        ? { en: 'Changes submitted for review', ru: 'Изменения отправлены на проверку', th: 'ส่งการแก้ไขเพื่อตรวจสอบแล้ว' }
        : { en: 'Proposed changes saved', ru: 'Предлагаемые изменения сохранены', th: 'บันทึกข้อเสนอแก้ไขแล้ว' }) : (isRu ? 'Сохранено' : 'Saved'), {
        description: publishedRevision ? pickLang(language, { en: 'The published listing keeps its current content until approval.', ru: 'Опубликованное объявление сохраняет прежние данные до одобрения.', th: 'ประกาศยังคงแสดงข้อมูลเดิมจนกว่าจะอนุมัติ' }) : (isRu ? 'Изменения успешно сохранены' : 'Changes saved successfully'),
      });
      navigate(managedEmployee ? '/mc/properties' : `/mc/properties/${id}`);
    } catch (error) {
      if (!mountedRef.current || actorScopeRef.current !== savingScope) return;
      setSaveState('error');
      toast.error(error instanceof Error ? error.message : pickLang(language, { en: 'Could not save property', ru: 'Не удалось сохранить объект', th: 'บันทึกอสังหาริมทรัพย์ไม่สำเร็จ' }));
      errorLog.error(error, 'save_property');
    } finally { if (actorScopeRef.current === savingScope) savingRef.current = false; }
  };

  // Extra tabs for owner mode
  const extraTabs: ExtraTab[] = useMemo(() => [
    {
      id: 'rooms',
      icon: Bed,
      labelEn: 'Rooms',
      labelRu: 'Комнаты',
      content: <PropertyRooms rooms={rooms} onChange={setRooms} />,
    },
    {
      id: 'calendar',
      icon: Calendar,
      labelEn: 'Calendar',
      labelRu: 'Календарь',
      content: (
        <PropertyCalendar
          availability={localAvailability}
          onChange={setLocalAvailability}
          basePrice={Number(formData?.price_per_night) || 0}
          currency={property?.currency?.trim() || ''}
        />
      ),
    },
    {
      id: 'team',
      icon: UsersRound,
      labelEn: 'Team',
      labelRu: 'Команда',
      content: <PropertyTeamTab propertyId={id || ''} />,
    },
  ], [rooms, localAvailability, formData?.price_per_night, id, property?.currency]);

  // Loading state
  if (isLoading || adminLoading || providerAuthority.isLoading || (managedEmployee && permissionsLoading) || (publishedRevision && revisionQuery.isLoading)) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Редактирование' : 'Edit Property'} showBack fallbackPath="/mc/properties" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-8 w-1/3 mb-4" /><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (propertyError || (publishedRevision && revisionQuery.error)) return <PageContainer>
    <p role="alert">{pickLang(language, { en: 'Could not load this property. Access or the checked workflow may be unavailable.', ru: 'Не удалось загрузить объект. Проверьте доступ и доступность защищённого процесса.', th: 'โหลดอสังหาริมทรัพย์ไม่สำเร็จ อาจไม่มีสิทธิ์หรือขั้นตอนที่ตรวจสอบสิทธิ์ยังไม่พร้อม' })}</p>
    <Button onClick={() => void (publishedRevision ? revisionQuery.refetch() : refetchProperty())}>{pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}</Button>
  </PageContainer>;

  if (!property) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Объект не найден' : 'Property Not Found'} showBack fallbackPath="/mc/properties" />
      </PageContainer>
    );
  }

  if (!canEdit) {
    return <PageContainer>
      <PageHeader title={property.title || property.title_en || ''} showBack fallbackPath="/mc/properties" />
      <Card><CardContent className="p-6 space-y-3">
        <p className="font-medium">{pickLang(language, { en: 'Read-only property', ru: 'Объект доступен для просмотра', th: 'ดูอสังหาริมทรัพย์ได้อย่างเดียว' })}</p>
        <p className="text-sm text-muted-foreground">{pickLang(language, publishedRevision ? (revisionConflict ? {
          en: 'Published content changed after this proposal started. The published listing is unchanged by this proposal. Return pending changes for correction, or start again from the current published version.',
          ru: 'Опубликованный объект изменился после создания предложения. Предложение не меняет объявление. Верните ожидающие изменения на доработку или начните заново с текущей опубликованной версии.',
          th: 'ข้อมูลที่เผยแพร่เปลี่ยนไปหลังเริ่มข้อเสนอนี้ ข้อเสนอยังไม่เปลี่ยนประกาศ โปรดส่งข้อเสนอที่รอตรวจกลับเพื่อแก้ไข หรือเริ่มใหม่จากข้อมูลที่เผยแพร่ล่าสุด',
        } : revisionPending ? {
          en: 'Your proposed changes are locked for review. The approved listing stays published with its current content until an administrator approves this exact revision.',
          ru: 'Предложенные изменения заблокированы на время проверки. Объявление остаётся опубликованным с прежними данными до одобрения этой версии администратором.',
          th: 'ข้อเสนอแก้ไขถูกล็อกระหว่างตรวจสอบ ประกาศยังเผยแพร่ข้อมูลเดิมจนกว่าผู้ดูแลจะอนุมัติฉบับแก้ไขนี้',
        } : {
          en: 'You do not currently have permission to edit this property. Published content remains unchanged.',
          ru: 'Сейчас у вас нет прав на редактирование объекта. Опубликованные данные не изменены.',
          th: 'ขณะนี้คุณไม่มีสิทธิ์แก้ไขที่พักนี้ ข้อมูลที่เผยแพร่ยังไม่เปลี่ยนแปลง',
        }) : {
          en: 'Only authorized draft or returned listings can be edited here. Pending listings are locked for review.',
          ru: 'Здесь редактируются только доступные вам черновики и возвращённые объекты. На проверке редактирование заблокировано.',
          th: 'แก้ไขได้เฉพาะฉบับร่างหรือรายการที่ส่งคืนและได้รับสิทธิ์ รายการที่รอตรวจสอบจะถูกล็อก',
        })}</p>
        {publishedRevision && revisionConflict && !revisionPending && canAccess('properties', 'edit') && <Button disabled={revisionSaving} onClick={() => void restartRevision()}>
          {pickLang(language, { en: 'Discard proposal and restart from published version', ru: 'Отбросить предложение и начать с опубликованной версии', th: 'ละทิ้งข้อเสนอและเริ่มใหม่จากฉบับที่เผยแพร่' })}
        </Button>}
        {publishedRevision && <Button variant="outline" onClick={() => void revisionQuery.refetch()}>{pickLang(language, { en: 'Reload review status', ru: 'Обновить статус проверки', th: 'โหลดสถานะการตรวจสอบใหม่' })}</Button>}
        <Button variant="outline" onClick={() => navigate('/mc/properties')}>{pickLang(language, { en: 'Back to properties', ru: 'К списку объектов', th: 'กลับสู่รายการอสังหาริมทรัพย์' })}</Button>
      </CardContent></Card>
    </PageContainer>;
  }

  const isSubmitting = updateProperty.isPending || autosaveProperty.isPending || isSavingAvailability || revisionSaving || (publishedRevision && revisionSaveBlocked);

  return (
    <PageContainer>
      <PageHeader
        title={publishedRevision ? pickLang(language, { en: 'Edit proposed changes', ru: 'Редактировать предлагаемые изменения', th: 'แก้ไขข้อเสนอการเปลี่ยนแปลง' }) : (isRu ? 'Редактировать объект' : 'Edit Property')}
        showBack
        fallbackPath={`/mc/properties/${id}`}
        subtitle={
          saveState === 'saving'
            ? (isRu ? 'Сохранение...' : 'Saving...')
            : saveState === 'unsaved'
              ? (isRu ? 'Не сохранено' : 'Unsaved changes')
              : saveState === 'saved'
                ? `${isRu ? 'Сохранено' : 'Saved'}${lastSaved ? ` · ${lastSaved.toLocaleTimeString()}` : ''}`
                : property.title
        }
        actions={
          <div className="flex items-center gap-2">
            {property.approval_status === 'approved' && !managedEmployee && (
              <Button
                variant={property.is_active ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  updateProperty.mutate({
                    id: id!,
                    is_active: !property.is_active,
                  } as any);
                }}
                disabled={updateProperty.isPending}
              >
                {property.is_active ? (
                  <><EyeOff className="h-4 w-4 mr-1" />{isRu ? 'Снять' : 'Unpublish'}</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-1" />{isRu ? 'Опубликовать' : 'Publish'}</>
                )}
              </Button>
            )}
            {managedEmployee && <Button size="sm" className="whitespace-normal h-auto min-h-11" disabled={isSubmitting} onClick={() => void handleSubmit(true)}>{pickLang(language, { en: 'Submit for review', ru: 'Отправить на проверку', th: 'ส่งตรวจสอบ' })}</Button>}
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? (isRu ? 'Скрыть' : 'Hide') : (isRu ? 'Превью' : 'Preview')}
            </Button>
          </div>
        }
      />

      {publishedRevision && <div role="status" className="mb-4 space-y-2 border p-3 text-sm">
        <p className="font-medium">{pickLang(language, { en: 'Proposed changes to a published listing', ru: 'Предлагаемые изменения опубликованного объявления', th: 'ข้อเสนอแก้ไขประกาศที่เผยแพร่แล้ว' })}</p>
        <p>{pickLang(language, { en: 'Saving creates a proposal. The published listing keeps its current content until these changes are reviewed and approved.', ru: 'Сохранение создаёт предложение. Опубликованное объявление сохраняет прежние данные, пока изменения не проверят и не одобрят.', th: 'การบันทึกจะสร้างข้อเสนอ ประกาศยังคงแสดงข้อมูลเดิมจนกว่าการแก้ไขจะผ่านการตรวจสอบและอนุมัติ' })}</p>
        {revisionSaveBlocked && <div role="alert" className="space-y-2 text-destructive">
          <p>{pickLang(language, { en: 'Save was not confirmed. Reload the current proposal before trying again.', ru: 'Сохранение не подтверждено. Загрузите текущее предложение перед повторной попыткой.', th: 'ยังยืนยันการบันทึกไม่ได้ โปรดโหลดข้อเสนอปัจจุบันก่อนลองอีกครั้ง' })}</p>
          <Button variant="outline" onClick={async () => {
            const result = await revisionQuery.refetch();
            if (result.error || !mountedRef.current || actorScopeRef.current !== actorScope) return;
            hydratedIdRef.current = undefined;
            lastSavedSnapshotRef.current = latestSnapshotRef.current;
            setRevisionSaveBlocked(false);
          }}>{pickLang(language, { en: 'Reload and discard unsaved changes', ru: 'Обновить и отбросить несохранённые изменения', th: 'โหลดใหม่และละทิ้งการแก้ไขที่ยังไม่บันทึก' })}</Button>
        </div>}
        {revisionQuery.data?.revision?.reason && <p>{pickLang(language, { en: 'Returned for correction:', ru: 'Возвращено на доработку:', th: 'ส่งกลับเพื่อแก้ไข:' })} {revisionQuery.data.revision.reason}</p>}
      </div>}

      {/* Autosave status bar */}
      {saveState !== 'idle' && (
        <div className={`flex items-center gap-2 text-xs px-1 py-1.5 rounded-none mb-2 ${
          saveState === 'saving' ? 'text-muted-foreground' :
          saveState === 'unsaved' ? 'text-warning' :
          saveState === 'saved' ? 'text-success' :
          'text-destructive'
        }`}>
          {saveState === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveState === 'saved' && <Check className="h-3 w-3" />}
          {saveState === 'saving' && (isRu ? 'Автосохранение...' : 'Autosaving...')}
          {saveState === 'unsaved' && (isRu ? '● Есть несохранённые изменения' : '● Unsaved changes')}
          {saveState === 'saved' && lastSaved && (
            isRu
              ? `Сохранено в ${lastSaved.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`
              : `Saved at ${lastSaved.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`
          )}
          {saveState === 'error' && (isRu ? 'Ошибка сохранения' : 'Save error')}
        </div>
      )}

      {/* AI Intake - merge mode for existing property */}
      <AIIntakePanel onDataExtracted={handleAIMerge} />

      <div className={showPreview 
        ? "grid gap-8 lg:grid-cols-[minmax(0,1fr),300px] xl:grid-cols-[minmax(0,1fr),340px]" 
        : ""
      } onBlurCapture={handleBlurAutosave}>
        <div className="min-w-0">
          {formData && (
            <CanonicalPropertyForm
              mode="owner"
              authoringOnly={managedEmployee}
              canEditPricing={!managedEmployee || canAccess('pricing', 'edit')}
              canEditBookingTerms={!managedEmployee || canAccess('bookings', 'edit')}
              initialData={mapPropertyToInitialData(property)}
              onSubmit={() => handleSubmit(false)}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(`/mc/properties/${id}`)}
              propertyId={id}
              extraTabs={managedEmployee ? extraTabs.filter(tab => tab.id === 'rooms') : extraTabs}
              controlledFormData={formData}
              onFormDataChange={setFormData}
              controlledUtilities={utilitiesData}
              onUtilitiesChange={setUtilitiesData}
              controlledServices={servicesData}
              onServicesChange={setServicesData}
            />
          )}
        </div>

        {/* Live Preview Sidebar */}
        {showPreview && formData && (
          <div className="hidden lg:block sticky top-20 h-fit">
            <div className="text-sm font-medium mb-3 text-muted-foreground">
              {isRu ? 'Как будет выглядеть в поиске:' : 'Search result preview:'}
            </div>
            <PropertyListingCard
              property={{
                ...property,
                id: id || 'preview',
                title_en: formData.title || '',
                title_ru: formData.title_ru || '',
                cover_image: formData.cover_image || '',
                images: formData.images || [],
                property_type: formData.property_type || 'apartment',
                district: formData.district || '',
                bedrooms: formData.bedrooms || 1,
                bathrooms: formData.bathrooms || 1,
                max_guests: formData.max_guests || 2,
                price_per_night: formData.price_per_night === '' ? null : Number(formData.price_per_night),
                price_per_month: formData.price_per_month === '' ? null : formData.price_per_month == null ? undefined : Number(formData.price_per_month),
                sale_price: formData.sale_price === '' ? null : Number(formData.sale_price),
                instant_booking: formData.instant_booking || false,
                is_featured: false,
                view_type: primaryViewType(formData.view_type),
                furnishing_level: normalizeFurnishingLevel(formData.furnishing_level),
              } as any}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
