import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateOwnerProperty, useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { useSendOwnershipInvite } from '@/hooks/usePropertyOwnership';
import { useUserContext } from '@/hooks/useUserContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { supabase } from '@/integrations/supabase/client';
import { normalizeFurnishingLevel, normalizeViewTypes, primaryViewType } from '@/lib/propertyFormNormalizers';
import { typedFrom } from '@/lib/untypedTables';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { validateBasicInfo, validateLocation, validatePricing } from '@/components/owner/property-wizard/propertyValidation';

const errorLog = createErrorHandler('usePropertyWizard');

export type OwnershipType = 'own' | 'verbal' | 'management_agreement';

export interface OwnershipData {
  ownership_type: OwnershipType;
  actual_owner_email: string;
  actual_owner_name: string;
  actual_owner_phone: string;
  send_invite_immediately: boolean;
  management_document_url: string;
  management_document_name: string;
  commercial_terms_redacted: boolean;
  ownership_document_url: string;
  ownership_document_name: string;
}

export type AssetClass = 'residential' | 'commercial' | 'land';

export interface PropertyFormData {
  asset_class: AssetClass;
  title: string;
  title_ru: string;
  internal_name: string;
  address: string;
  district: string;
  lat?: number;
  lng?: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: string;
  description: string;
  description_ru: string;
  cover_image: string;
  images: string[];
  management_type: string;
  is_rented: boolean;
  rental_platforms: string[];
  custom_platform: string;
  project_id?: string;
  complex_id?: string;
  video_url?: string;
  floor?: number;
  unit_number: string;
  total_floors?: number;
  plot_size_sqm?: number;
  has_elevator: boolean;
  parking_type: string;
  pool_type: string;
  garden_type: string;
  view_type: string[];
  furnishing_level: string;
  equipment: string[];
  price_per_night: string;
  min_stay_nights: number;
  max_guests: number;
  deposit_amount: string;
  check_in_time: string;
  check_out_time: string;
  instant_booking: boolean;
  ownership_form?: 'freehold' | 'leasehold' | 'company' | 'foreign_company';
  is_for_sale: boolean;
  sale_price: string;
  // House Rules
  pets_allowed?: boolean;
  pet_deposit?: number;
  smoking_allowed?: boolean;
  smoking_penalty?: number;
  parties_allowed?: boolean;
  max_party_guests?: number;
  children_friendly?: boolean;
  has_crib?: boolean;
  has_high_chair?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  house_rules?: string;
  house_rules_ru?: string;
  // Cancellation & Discounts
  cancellation_policy?: string;
  weekly_discount?: number;
  monthly_discount?: number;
  seasonal_pricing?: Array<{
    id: string;
    name: string;
    nameRu?: string;
    type: 'high' | 'low' | 'holiday' | 'custom';
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    priceModifier: number;
    pricePerNight?: number;
    minNights?: number;
  }>;
  highlights: string[];
  // Platform listing
  platform_listed?: boolean;
  // Advanced pricing rules
  early_booking_discount?: number;
  early_booking_days?: number;
  last_minute_discount?: number;
  last_minute_days?: number;
  payment_policy?: string;
  prepay_percent?: number;
  balance_due_days?: number;
  deposit_currency?: string;
  negotiation_enabled?: boolean;
  custom_length_discounts?: Array<{ min_nights: number; discount_percent: number }>;
  /** Host-configurable extra fees the guest pays separately (electricity, water, internet, cleaning, etc).
   *  See src/lib/property/guestExtraFees.ts for the GuestExtraFee shape. */
  guest_extra_fees?: unknown[];
  lock_code?: string;
  // Commercial / Land specifics
  floor_area_sqm?: number;
  cap_rate_pct?: number;
  noi_annual_thb?: number;
  zoning?: string;
  title_deed_type?: string;
  permitted_uses?: string[];
  electricity_load_kw?: number;
  land_size_sqm?: number;
  land_size_rai?: number;
  frontage_m?: number;
  // Hotel-specific (only when property_type ∈ HOTEL_PROPERTY_TYPES)
  hotel_keys?: number;
  hotel_star_rating?: number;
  hotel_brand?: string;
  hotel_license_type?: string;
  hotel_adr_thb?: number;
  hotel_revpar_thb?: number;
  hotel_occupancy_pct?: number;
  hotel_gop_margin_pct?: number;
  hotel_management_status?: string;
  hotel_operator_name?: string;
  hotel_year_renovated?: number;
  // ─── 6-tracks model (rent short / medium / long, sale, assignment, quick-sale) ───
  /** Which tenancy modes this property supports (multi-select). */
  tenancy_modes?: Array<'short' | 'medium' | 'long'>;
  price_per_month?: string; // medium-term THB/mo
  price_per_year?: string;  // long-term THB/yr
  deposit_months_long?: number;  // standard 2
  advance_months_long?: number;  // standard 1
  min_lease_months?: number;     // 1, 6, 12
  utilities_included_long?: string[]; // electricity, water, internet, cleaning, cam
  tm30_registration_supported?: boolean;
  // Sale intent
  sale_intent?: 'standard' | 'assignment' | 'quick_sale';
  is_assignment?: boolean;
  assignment_premium?: string;          // THB premium over original contract
  original_contract_price?: string;     // THB SPA price
  remaining_to_developer?: string;      // THB still owed
  spa_stage?: string;
  transfer_fee_split?: 'buyer' | 'seller' | '50_50';
  // Quick sale
  is_quick_sale?: boolean;
  quick_sale_reason?: string;
  quick_sale_discount_pct?: number;
  urgency_deadline?: string; // YYYY-MM-DD
  // Payment options for sale/assignment
  accepts_installments?: boolean;
  installment_plan?: Array<{
    id: string;
    labelEn: string;
    labelRu: string;
    percent: number;
    dueAt?: string;
    dueAtRu?: string;
  }>;
  escrow_offered?: boolean;
  escrow_provider?: 'platform' | 'lawyer' | 'bank' | 'other';
  // Legal readiness (без SoF на покупателе)
  title_deed_url?: string;
  encumbrances_disclosed?: boolean;
  encumbrances_description?: string;
  foreign_quota_available?: boolean;
  // Video tour
  video_file_url?: string;     // uploaded mp4 in Supabase Storage
  virtual_tour_url?: string;   // Matterport / Kuula / 360
}

const initialFormData: PropertyFormData = {
  asset_class: 'residential',
  title: '',
  title_ru: '',
  internal_name: '',
  address: '',
  district: '',
  lat: undefined,
  lng: undefined,
  property_type: 'apartment',
  bedrooms: 1,
  bathrooms: 1,
  area_sqm: '',
  description: '',
  description_ru: '',
  cover_image: '',
  images: [],
  management_type: 'full',
  is_rented: false,
  rental_platforms: [],
  custom_platform: '',
  project_id: undefined,
  complex_id: undefined,
  video_url: '',
  floor: undefined,
  unit_number: '',
  total_floors: undefined,
  plot_size_sqm: undefined,
  has_elevator: false,
  parking_type: '',
  pool_type: '',
  garden_type: '',
  view_type: [],
  furnishing_level: '',
  equipment: [],
  price_per_night: '',
  min_stay_nights: 1,
  max_guests: 2,
  deposit_amount: '',
  check_in_time: '14:00',
  check_out_time: '12:00',
  instant_booking: false,
  ownership_form: undefined,
  is_for_sale: false,
  sale_price: '',
  // House Rules defaults
  pets_allowed: false,
  smoking_allowed: false,
  parties_allowed: false,
  children_friendly: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  // Cancellation & Discounts defaults
  cancellation_policy: 'flexible',
  seasonal_pricing: [],
  highlights: [],
  platform_listed: true,
  // Advanced pricing defaults
  payment_policy: 'prepay_10',
  deposit_currency: 'USD',
  negotiation_enabled: false,
  lock_code: '',
};

const initialOwnershipData: OwnershipData = {
  ownership_type: 'own',
  actual_owner_email: '',
  actual_owner_name: '',
  actual_owner_phone: '',
  send_invite_immediately: true,
  management_document_url: '',
  management_document_name: '',
  commercial_terms_redacted: false,
  ownership_document_url: '',
  ownership_document_name: '',
};

function mapPropertyToFormData(property: any): PropertyFormData {
  return {
    asset_class: (property.asset_class as AssetClass) || 'residential',
    title: property.title_en || property.title || '',
    title_ru: property.title_ru || '',
    internal_name: property.internal_name || '',
    address: property.address || '',
    district: property.district || '',
    lat: property.lat ?? undefined,
    lng: property.lng ?? undefined,
    property_type: property.property_type || 'apartment',
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1,
    area_sqm: property.area_sqm?.toString() || '',
    description: property.description_en || '',
    description_ru: property.description_ru || '',
    cover_image: property.cover_image || '',
    images: property.images || [],
    management_type: property.management_type || 'full',
    is_rented: property.is_rented || false,
    rental_platforms: property.rental_platform ? [property.rental_platform] : [],
    custom_platform: '',
    project_id: property.project_id ?? undefined,
    complex_id: property.complex_id ?? undefined,
    video_url: property.video_url || '',
    floor: property.floor ?? undefined,
    unit_number: property.unit_number || '',
    total_floors: property.total_floors ?? undefined,
    plot_size_sqm: property.plot_size_sqm ?? undefined,
    has_elevator: property.has_elevator || false,
    parking_type: property.parking_type || '',
    pool_type: property.pool_type || '',
    garden_type: property.garden_type || '',
    view_type: normalizeViewTypes(property.view_type),
    furnishing_level: normalizeFurnishingLevel(property.furnishing_level),
    equipment: property.equipment || [],
    price_per_night: property.price_per_night ? String(property.price_per_night) : '',
    min_stay_nights: property.min_stay_nights || 1,
    max_guests: property.max_guests || 2,
    deposit_amount: property.deposit_amount ? String(property.deposit_amount) : '',
    check_in_time: property.check_in_time || '14:00',
    check_out_time: property.check_out_time || '12:00',
    instant_booking: property.instant_booking || false,
    ownership_form: property.ownership_form || undefined,
    is_for_sale: property.is_for_sale || false,
    sale_price: property.sale_price ? String(property.sale_price) : '',
    pets_allowed: property.pets_allowed || false,
    pet_deposit: property.pet_deposit ?? undefined,
    smoking_allowed: property.smoking_policy === 'allowed' || property.smoking_allowed || false,
    smoking_penalty: property.smoking_penalty ?? undefined,
    parties_allowed: property.parties_allowed || false,
    max_party_guests: property.max_party_guests ?? undefined,
    children_friendly: property.children_friendly ?? true,
    has_crib: property.has_crib || false,
    has_high_chair: property.has_high_chair || false,
    quiet_hours_start: property.quiet_hours_start || '22:00',
    quiet_hours_end: property.quiet_hours_end || '08:00',
    house_rules: property.house_rules || '',
    house_rules_ru: property.house_rules_ru || '',
    cancellation_policy: property.cancellation_policy || 'flexible',
    weekly_discount: property.weekly_discount || 0,
    monthly_discount: property.monthly_discount || 0,
    seasonal_pricing: property.seasonal_pricing || [],
    highlights: property.highlights || [],
    platform_listed: property.listing_modes?.includes('platform') ?? false,
    early_booking_discount: property.early_booking_discount ?? undefined,
    early_booking_days: property.early_booking_days ?? undefined,
    last_minute_discount: property.last_minute_discount ?? undefined,
    last_minute_days: property.last_minute_days ?? undefined,
    payment_policy: property.payment_policy || 'prepay_10',
    prepay_percent: property.prepay_percent ?? undefined,
    balance_due_days: property.balance_due_days ?? undefined,
    deposit_currency: property.deposit_currency || 'USD',
    negotiation_enabled: property.negotiation_enabled || false,
    custom_length_discounts: property.custom_length_discounts || [],
    lock_code: property.lock_code || '',
    // Commercial / Land
    floor_area_sqm: property.floor_area_sqm ?? undefined,
    cap_rate_pct: property.cap_rate_pct ?? undefined,
    noi_annual_thb: property.noi_annual_thb ?? undefined,
    zoning: property.zoning || undefined,
    title_deed_type: property.title_deed_type || undefined,
    permitted_uses: property.permitted_uses || undefined,
    electricity_load_kw: property.electricity_load_kw ?? undefined,
    land_size_sqm: property.land_size_sqm ?? undefined,
    land_size_rai: property.land_size_rai ?? undefined,
    frontage_m: property.frontage_m ?? undefined,
  };
}

export function usePropertyWizard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';
  
  const cloneFromId = searchParams.get('cloneFrom');
  const { data: sourceProperty, isLoading: isLoadingSource } = useOwnerProperty(cloneFromId || undefined);
  
  const createProperty = useCreateOwnerProperty();
  const updateProperty = useUpdateOwnerProperty();
  const draftCreateProperty = useCreateOwnerProperty();
  const draftUpdateProperty = useUpdateOwnerProperty();
  const sendInvite = useSendOwnershipInvite();
  const { activeOrgId } = useUserContext();

  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftPropertyId, setDraftPropertyId] = useState<string>();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'unsaved' | 'error'>('idle');
  const [isLoadingDraft, setIsLoadingDraft] = useState(!cloneFromId);
  const lastSavedSnapshotRef = useRef(JSON.stringify(initialFormData));

  const [ownershipData, setOwnershipData] = useState<OwnershipData>(initialOwnershipData);
  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null);
  const [isCloneDataApplied, setIsCloneDataApplied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string>();
  const [createdPropertyTitle, setCreatedPropertyTitle] = useState<string>();
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== lastSavedSnapshotRef.current,
    [formData]
  );

  const updateFormData = useCallback((updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setSaveState('unsaved');
  }, []);

  const clearDraft = useCallback(() => {
    setHasDraft(false);
    setLastSaved(null);
    setDraftPropertyId(undefined);
    lastSavedSnapshotRef.current = JSON.stringify(initialFormData);
    setSaveState('idle');
  }, []);

  const restoreDraft = useCallback(() => {
    // Latest draft is loaded automatically from Supabase on open.
  }, []);

  useEffect(() => {
    if (!user?.id || cloneFromId) {
      setIsLoadingDraft(false);
      return;
    }

    let cancelled = false;

    const loadLatestDraft = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .eq('approval_status', 'draft')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data || cancelled) return;

        const mappedDraft = mapPropertyToFormData(data);
        setFormData(mappedDraft);
        setDraftPropertyId(data.id);
        setHasDraft(true);
        setLastSaved(new Date(data.updated_at));
        lastSavedSnapshotRef.current = JSON.stringify(mappedDraft);
        setSaveState('saved');
      } catch (error) {
        errorLog.silent(error, 'load_latest_property_draft');
      } finally {
        if (!cancelled) {
          setIsLoadingDraft(false);
        }
      }
    };

    loadLatestDraft();

    return () => {
      cancelled = true;
    };
  }, [user?.id, cloneFromId]);

  // Apply clone data when loaded
  useEffect(() => {
    if (sourceProperty && !isCloneDataApplied && cloneFromId) {
      const mappedSource = {
        ...mapPropertyToFormData(sourceProperty),
        floor: undefined,
        unit_number: '',
        total_floors: undefined,
        plot_size_sqm: undefined,
        has_elevator: false,
        parking_type: '',
        pool_type: '',
        garden_type: '',
        is_for_sale: false,
        sale_price: '',
      };
      setFormData(mappedSource);
      lastSavedSnapshotRef.current = JSON.stringify(mappedSource);
      setIsCloneDataApplied(true);
      setIsLoadingDraft(false);
      toast.success(isRu ? 'Данные объекта загружены' : 'Property data loaded');
    }
  }, [sourceProperty, isCloneDataApplied, cloneFromId, isRu]);

  // Update ownership data
  const updateOwnershipData = useCallback((updates: Partial<OwnershipData>) => {
    setOwnershipData(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply prefill data from AI or OTA — maps all available fields
  const applyPrefillData = useCallback((prefillData: Record<string, any>) => {
    if (!prefillData) return;
    
    setFormData(prev => {
      const updated = { ...prev };
      
      // Basic info
      if (prefillData.name_en || prefillData.title) updated.title = prefillData.name_en || prefillData.title;
      if (prefillData.name_ru || prefillData.title_ru) updated.title_ru = prefillData.name_ru || prefillData.title_ru;
      if (prefillData.description_en || prefillData.description) updated.description = prefillData.description_en || prefillData.description;
      if (prefillData.description_ru) updated.description_ru = prefillData.description_ru;
      if (prefillData.bedrooms) updated.bedrooms = prefillData.bedrooms;
      if (prefillData.bathrooms) updated.bathrooms = prefillData.bathrooms;
      if (prefillData.max_guests) updated.max_guests = prefillData.max_guests;
      if (prefillData.property_type) updated.property_type = prefillData.property_type;
      if (prefillData.area_sqm) updated.area_sqm = String(prefillData.area_sqm);
      
      // Location
      if (prefillData.district) updated.district = prefillData.district;
      if (prefillData.address) updated.address = prefillData.address;
      if (prefillData.lat) updated.lat = prefillData.lat;
      if (prefillData.lng) updated.lng = prefillData.lng;
      
      // Photos — merge, don't replace
      if (prefillData.images?.length > 0) {
        const existingSet = new Set(prev.images);
        const newImages = prefillData.images.filter((img: string) => !existingSet.has(img));
        updated.images = [...prev.images, ...newImages];
      }
      if (prefillData.cover_image) updated.cover_image = prefillData.cover_image;
      else if (prefillData.images?.[0] && !prev.cover_image) updated.cover_image = prefillData.images[0];
      
      // Pricing
      if (prefillData.price_per_night) updated.price_per_night = String(prefillData.price_per_night);
      if (prefillData.deposit_amount) updated.deposit_amount = String(prefillData.deposit_amount);
      if (prefillData.min_stay_nights) updated.min_stay_nights = prefillData.min_stay_nights;
      if (prefillData.weekly_discount) updated.weekly_discount = prefillData.weekly_discount;
      if (prefillData.monthly_discount) updated.monthly_discount = prefillData.monthly_discount;
      
      // Rental conditions
      if (prefillData.cancellation_policy) updated.cancellation_policy = prefillData.cancellation_policy;
      if (prefillData.instant_booking !== undefined) updated.instant_booking = prefillData.instant_booking;
      
      // Equipment / Amenities — merge with existing
      if (prefillData.equipment?.length > 0) {
        const merged = new Set([...prev.equipment, ...prefillData.equipment]);
        updated.equipment = Array.from(merged);
      }
      
      // Highlights — merge with existing
      if (prefillData.highlights?.length > 0) {
        const merged = new Set([...prev.highlights, ...prefillData.highlights]);
        updated.highlights = Array.from(merged).slice(0, 12);
      }
      
      // House rules
      if (prefillData.house_rules) updated.house_rules = prefillData.house_rules;
      if (prefillData.house_rules_ru) updated.house_rules_ru = prefillData.house_rules_ru;
      if (prefillData.pets_allowed !== undefined) updated.pets_allowed = prefillData.pets_allowed;
      if (prefillData.smoking_allowed !== undefined) updated.smoking_allowed = prefillData.smoking_allowed;
      if (prefillData.parties_allowed !== undefined) updated.parties_allowed = prefillData.parties_allowed;
      if (prefillData.children_friendly !== undefined) updated.children_friendly = prefillData.children_friendly;
      if (prefillData.check_in_time) updated.check_in_time = prefillData.check_in_time;
      if (prefillData.check_out_time) updated.check_out_time = prefillData.check_out_time;
      
      // Physical attributes
      if (prefillData.floor) updated.floor = prefillData.floor;
      if (prefillData.view_type) updated.view_type = normalizeViewTypes(prefillData.view_type);
      if (prefillData.furnishing_level) updated.furnishing_level = normalizeFurnishingLevel(prefillData.furnishing_level);
      if (prefillData.pool_type) updated.pool_type = prefillData.pool_type;
      if (prefillData.parking_type) updated.parking_type = prefillData.parking_type;
      
      return updated;
    });
    setIsCloneDataApplied(true);
    toast.success(isRu ? 'Данные загружены в форму' : 'Data loaded into form');
  }, [isCloneDataApplied, isRu]);

  // Validate step
  const validateStep = useCallback((stepId: string): boolean => {
    switch (stepId) {
      case 'basic': {
        const errors = validateBasicInfo({
          title: formData.title,
          title_ru: formData.title_ru,
          property_type: formData.property_type,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          area_sqm: formData.area_sqm,
        });
        if (errors.length > 0) {
          toast.error(isRu ? 'Проверьте данные' : 'Check required fields', {
            description: errors[0],
          });
          return false;
        }
        // Ownership validation (embedded in basic step)
        if (ownershipData.ownership_type === 'verbal') {
          if (!ownershipData.actual_owner_name.trim()) {
            toast.error(isRu ? 'Введите имя собственника' : 'Enter owner name');
            return false;
          }
          if (!ownershipData.actual_owner_phone.trim()) {
            toast.error(isRu ? 'Введите телефон собственника' : 'Enter owner phone');
            return false;
          }
        }
        if (ownershipData.ownership_type === 'management_agreement') {
          if (!ownershipData.management_document_url) {
            toast.error(isRu ? 'Загрузите договор управления' : 'Upload management agreement');
            return false;
          }
        }
        return true;
      }
      case 'location': {
        const errors = validateLocation({ address: formData.address });
        if (errors.length > 0) {
          toast.error(isRu ? 'Введите адрес' : 'Enter address');
          return false;
        }
        return true;
      }
      case 'pricing': {
        const errors = validatePricing({
          price_per_night: formData.price_per_night,
          min_stay_nights: formData.min_stay_nights,
          max_guests: formData.max_guests,
          deposit_amount: formData.deposit_amount,
        });
        if (errors.length > 0) {
          toast.error(isRu ? 'Проверьте данные' : 'Check pricing fields', {
            description: errors[0],
          });
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }, [formData, ownershipData, isRu]);

  const hasMeaningfulDraftData = useMemo(() => {
    return Boolean(
      formData.title.trim() ||
      formData.title_ru.trim() ||
      formData.description.trim() ||
      formData.description_ru.trim() ||
      formData.address.trim() ||
      formData.images.length > 0
    );
  }, [formData]);

  const buildPropertyPayload = useCallback((approvalStatus: 'draft' | 'pending') => {
    const isOnBehalf = ownershipData.ownership_type !== 'own';
    const {
      title, title_ru, description, description_ru,
      rental_platforms, custom_platform, platform_listed,
      is_for_sale, sale_price, area_sqm, price_per_night, deposit_amount,
      smoking_allowed, seasonal_pricing,
      ...cleanData
    } = formData;

    const payload: Record<string, unknown> = {
      ...cleanData,
      area_sqm: area_sqm ? Number(area_sqm) : undefined,
      price_per_night: price_per_night ? Number(price_per_night) : undefined,
      deposit_amount: deposit_amount ? Number(deposit_amount) : undefined,
      sale_price: sale_price ? Number(sale_price) : undefined,
      is_for_sale,
      smoking_policy: smoking_allowed ? 'allowed' : 'not_allowed',
      seasonal_pricing: seasonal_pricing && seasonal_pricing.length > 0 ? seasonal_pricing : null,
      title_en: title,
      title,
      title_ru,
      description_en: description,
      description_ru,
      approval_status: approvalStatus,
      is_active: approvalStatus === 'draft' ? false : undefined,
      rental_platform: rental_platforms?.length ? rental_platforms[0] : undefined,
      listing_modes: [
        ...(platform_listed ? ['platform'] : []),
        ...(is_for_sale ? ['sale'] : []),
        ...(price_per_night ? ['rent'] : []),
      ],
      created_on_behalf: isOnBehalf,
      ownership_type: ownershipData.ownership_type,
      actual_owner_email: isOnBehalf ? ownershipData.actual_owner_email : undefined,
      actual_owner_name: isOnBehalf ? ownershipData.actual_owner_name : undefined,
      actual_owner_phone: isOnBehalf ? ownershipData.actual_owner_phone : undefined,
      managed_by_org_id: ownershipData.ownership_type === 'management_agreement' ? activeOrgId : undefined,
      management_document_url: ownershipData.management_document_url || undefined,
      management_document_name: ownershipData.management_document_name || undefined,
      commercial_terms_redacted: ownershipData.commercial_terms_redacted,
      ownership_verification_status: isOnBehalf ? 'pending' : 'verified',
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    return payload;
  }, [formData, ownershipData, activeOrgId]);

  const persistDraft = useCallback(async (showToast = false) => {
    if (!hasMeaningfulDraftData || !user?.id) return null;

    setIsSavingDraft(true);
    setSaveState('saving');

    try {
      const draftPayload = buildPropertyPayload('draft');
      const property = draftPropertyId
        ? await draftUpdateProperty.mutateAsync({ id: draftPropertyId, ...draftPayload, _silent: true } as any)
        : await draftCreateProperty.mutateAsync({ ...draftPayload, _silent: true } as any);

      if (property?.id) {
        setDraftPropertyId(property.id);
      }

      const savedAt = new Date();
      setHasDraft(true);
      setLastSaved(savedAt);
      lastSavedSnapshotRef.current = JSON.stringify(formData);
      setSaveState('saved');

      if (showToast) {
        toast.success(isRu ? 'Черновик сохранён' : 'Draft saved');
      }

      return property;
    } catch (error) {
      setSaveState('error');
      if (showToast) {
        toast.error(isRu ? 'Ошибка сохранения черновика' : 'Error saving draft');
      }
      errorLog.silent(error, 'persist_property_draft');
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  }, [buildPropertyPayload, draftCreateProperty, draftPropertyId, draftUpdateProperty, formData, hasMeaningfulDraftData, isRu, user?.id]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    setSaveState('unsaved');
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges || !hasMeaningfulDraftData) return;

    const timer = window.setTimeout(() => {
      void persistDraft(false);
    }, 30000);

    return () => window.clearTimeout(timer);
  }, [hasMeaningfulDraftData, hasUnsavedChanges, persistDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Submit property
  const handleSubmit = useCallback(async () => {
    try {
    const isOnBehalf = ownershipData.ownership_type !== 'own';
    const approvalStatus = formData.platform_listed ? 'pending' : 'draft';
    const submitPayload = buildPropertyPayload(approvalStatus);

    const property = draftPropertyId
      ? await updateProperty.mutateAsync({ id: draftPropertyId, ...submitPayload } as any)
      : await createProperty.mutateAsync(submitPayload as any);

    // Save documents
    if (property?.id) {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (ownershipData.management_document_url) {
        await supabase.from('property_documents').insert({
          property_id: property.id,
          document_type: 'power_of_attorney',
          title: 'Management Agreement / POA',
          title_ru: 'Договор управления / Доверенность',
          file_url: ownershipData.management_document_url,
          file_name: ownershipData.management_document_name || 'management-document',
          is_sensitive: true,
          uploaded_by: userId,
        });
      }

      if (ownershipData.ownership_document_url) {
        await supabase.from('property_documents').insert({
          property_id: property.id,
          document_type: 'ownership_title',
          title: 'Ownership Document',
          title_ru: 'Документ о праве собственности',
          file_url: ownershipData.ownership_document_url,
          file_name: ownershipData.ownership_document_name || 'ownership-document',
          is_sensitive: true,
          uploaded_by: userId,
        });
      }
    }

    // Auto-create CRM owner contact when managing on behalf
    if (isOnBehalf && property?.id && ownershipData.actual_owner_name.trim()) {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        // Split name into first/last
        const nameParts = ownershipData.actual_owner_name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newContact } = await typedFrom('crm_contacts').insert({
          company_id: activeOrgId,
          contact_type: 'owner',
          first_name: firstName,
          last_name: lastName,
          email: ownershipData.actual_owner_email || null,
          phone: ownershipData.actual_owner_phone || null,
          source: 'property_wizard',
          lifecycle_stage: 'customer',
          created_by: userId,
        }).select('id').single();

        // Link owner contact to property
        if (newContact?.id) {
          await typedFrom('properties').update({
            owner_contact_id: newContact.id,
          }).eq('id', property.id);
        }
      } catch (error: unknown) {
        // Non-blocking — property is already saved
        errorLog.silent(error, 'auto_create_owner_contact');
      }
    }

    // Send invite if needed
    if (isOnBehalf && ownershipData.send_invite_immediately && property?.id) {
      try {
        await sendInvite.mutateAsync({
          propertyId: property.id,
          inviteeEmail: ownershipData.actual_owner_email,
          inviteeName: ownershipData.actual_owner_name,
          inviteType: 'ownership_transfer',
        });
        toast.success(isRu ? 'Приглашение отправлено' : 'Invitation sent');
      } catch (error) {
        errorLog.silent(error, 'send_invite');
      }
    }

    // Clear draft on successful save
    clearDraft();
    lastSavedSnapshotRef.current = JSON.stringify(formData);
    
    setCreatedPropertyId(property?.id);
    setCreatedPropertyTitle(formData.title || formData.title_ru);
    setShowSuccess(true);
    } catch (error: unknown) {
      errorLog.error(error, 'submit_property');
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(isRu ? `Ошибка сохранения: ${msg}` : `Error saving: ${msg}`);
    }
  }, [formData, ownershipData, buildPropertyPayload, clearDraft, createProperty, draftPropertyId, isRu, sendInvite, updateProperty]);

  // Preview data for live preview
  const previewData = useMemo(() => ({
    title: formData.title,
    titleRu: formData.title_ru,
    coverImage: formData.cover_image,
    images: formData.cover_image 
      ? [formData.cover_image, ...formData.images] 
      : formData.images,
    propertyType: formData.property_type,
    district: formData.district,
    address: formData.address,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    maxGuests: formData.max_guests,
    areaSqm: formData.area_sqm,
    pricePerNight: formData.price_per_night,
    instantBooking: formData.instant_booking,
    floor: formData.floor,
    unitNumber: formData.unit_number,
    totalFloors: formData.total_floors,
    plotSizeSqm: formData.plot_size_sqm,
    poolType: formData.pool_type,
    gardenType: formData.garden_type,
    parkingType: formData.parking_type,
    viewTypes: formData.view_type,
    viewType: primaryViewType(formData.view_type),
    furnishingLevel: normalizeFurnishingLevel(formData.furnishing_level),
    equipment: formData.equipment,
    lat: formData.lat,
    lng: formData.lng,
  }), [formData]);

  // Clear draft on successful submission
  const handleSuccessfulSubmission = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  const saveDraftOnBlur = useCallback(() => {
    if (!hasUnsavedChanges || !hasMeaningfulDraftData) return;
    void persistDraft(false);
  }, [hasMeaningfulDraftData, hasUnsavedChanges, persistDraft]);

  // Save current form as a draft to the database
  const handleSaveDraft = useCallback(async () => {
    await persistDraft(true);
  }, [persistDraft]);

  // Reset form to start a new property from scratch
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setOwnershipData(initialOwnershipData);
    setSelectedProject(null);
    setIsCloneDataApplied(false);
    setShowSuccess(false);
    setCreatedPropertyId(undefined);
    setCreatedPropertyTitle(undefined);
    clearDraft();
  }, [clearDraft]);

  return {
    formData,
    ownershipData,
    selectedProject,
    isCloneDataApplied,
    showSuccess,
    createdPropertyId,
    createdPropertyTitle,
    isLoadingSource,
    isLoadingDraft,
    cloneFromId,
    sourceProperty,
    previewData,
    isSubmitting: createProperty.isPending,
    isSavingDraft,
    saveState,
    hasUnsavedChanges,
    // Draft-related
    hasDraft,
    lastSaved,
    clearDraft,
    restoreDraft,
    // Actions
    updateFormData,
    updateOwnershipData,
    setSelectedProject,
    applyPrefillData,
    validateStep,
    handleSubmit,
    handleSaveDraft,
    saveDraftOnBlur,
    resetForm,
    setShowSuccess,
    handleSuccessfulSubmission,
  };
}
