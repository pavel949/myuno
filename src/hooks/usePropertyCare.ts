import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Types
export interface OwnerProperty {
  id: string;
  owner_id: string;
  title: string;
  title_ru?: string;
  address: string;
  district?: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  description?: string;
  description_ru?: string;
  cover_image?: string;
  images?: string[];
  management_type: string;
  is_rented?: boolean;
  rental_platform?: string;
  status: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  marketplace_property_id?: string;
  // Project/Unit fields
  project_id?: string;
  floor?: number;
  unit_number?: string;
  view_type?: string;
  furnishing_level?: string;
  equipment?: string[];
  lat?: number;
  lng?: number;
  // Rental terms - Basic
  price_per_night?: number;
  min_stay_nights?: number;
  max_guests?: number;
  deposit_amount?: number;
  deposit_currency?: string;
  deposit_type?: string;
  check_in_time?: string;
  check_out_time?: string;
  house_rules?: string;
  house_rules_ru?: string;
  cancellation_policy?: string;
  instant_booking?: boolean;
  // Extended property details
  rooms?: Json;
  highlights?: string[];
  nearby_places?: Json;
  safety_features?: string[];
  accessibility_features?: string[];
  // Seasonality and discounts
  seasonal_pricing?: Json;
  weekly_discount?: number;
  monthly_discount?: number;
  // Electricity
  electricity_included?: boolean;
  electricity_unit_price?: number;
  electricity_provider?: string;
  electricity_metering?: string;
  electricity_notes?: string;
  electricity_notes_ru?: string;
  // Water
  water_included?: boolean;
  water_unit_price?: number;
  water_notes?: string;
  water_notes_ru?: string;
  // Internet
  internet_speed?: string;
  internet_provider?: string;
  // Included/extra services
  included_services?: Json;
  extra_services?: Json;
  // Cleaning
  cleaning_included?: boolean;
  cleaning_frequency?: string;
  extra_cleaning_price?: number;
  linen_change_price?: number;
  linen_change_frequency?: string;
  // Check-in details
  early_checkin_price?: number;
  late_checkout_price?: number;
  key_handover?: string;
  check_in_instructions?: string;
  check_in_instructions_ru?: string;
  // Transfer
  transfer_available?: boolean;
  transfer_airport_price?: number;
  transfer_notes?: string;
  transfer_notes_ru?: string;
  // Extra guests
  extra_guest_price?: number;
  extra_guest_threshold?: number;
  // Parking
  parking_included?: boolean;
  parking_spaces?: number;
  parking_notes?: string;
  // Pets
  pets_allowed?: boolean;
  pet_deposit?: number;
  pet_notes?: string;
  pet_notes_ru?: string;
  // Quiet hours & parties
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  parties_allowed?: boolean;
  max_party_guests?: number;
  // Children
  children_friendly?: boolean;
  has_crib?: boolean;
  has_high_chair?: boolean;
  // Penalties
  late_checkout_penalty?: number;
  smoking_penalty?: number;
  // Manager contact
  manager_name?: string;
  manager_phone?: string;
  manager_line_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  host_languages?: string[];
}

export interface PropertyInspection {
  id: string;
  property_id: string;
  owner_id: string;
  inspector_id?: string;
  inspection_type: string;
  status: string;
  scheduled_at: string;
  completed_at?: string;
  report_summary?: string;
  report_summary_ru?: string;
  photos?: string[];
  video_url?: string;
  checklist_results?: unknown;
  issues_found?: unknown;
  cost?: number;
  currency?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  property?: OwnerProperty;
}

export interface PropertyServiceRequest {
  id: string;
  property_id: string;
  owner_id: string;
  assigned_to?: string;
  service_type: string;
  status: string;
  priority: string;
  scheduled_at?: string;
  completed_at?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_count?: number;
  description?: string;
  description_ru?: string;
  special_instructions?: string;
  completion_photos?: string[];
  completion_notes?: string;
  deposit_amount?: number;
  deposit_collected?: boolean;
  deposit_returned?: boolean;
  service_cost?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
  property?: OwnerProperty;
}

export interface PropertyFinancial {
  id: string;
  property_id: string;
  owner_id: string;
  transaction_type: string;
  category?: string;
  amount: number;
  currency?: string;
  description?: string;
  description_ru?: string;
  reference_type?: string;
  reference_id?: string;
  receipt_url?: string;
  transaction_date: string;
  created_at: string;
  property?: OwnerProperty;
}

export function useOwnerProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('owner_properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OwnerProperty[];
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useOwnerProperty(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-property', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from('owner_properties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as OwnerProperty;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateOwnerProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<OwnerProperty>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: result, error } = await supabase
        .from('owner_properties')
        .insert({ ...data, owner_id: user.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return result as OwnerProperty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      toast.success('Объект добавлен!');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

export function useUpdateOwnerProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OwnerProperty> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('owner_properties')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      toast.success('Объект обновлён!');
    },
  });
}

// Publish owner property to marketplace
export function usePublishToMarketplace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      ownerPropertyId: string;
      listingType: 'rent' | 'sale';
      price: number;
      pricePeriod?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get owner property data
      const { data: ownerProperty, error: fetchError } = await supabase
        .from('owner_properties')
        .select('*')
        .eq('id', data.ownerPropertyId)
        .single();

      if (fetchError || !ownerProperty) throw new Error('Property not found');

      // Create marketplace listing
      const { data: marketplaceProperty, error: createError } = await supabase
        .from('properties')
        .insert({
          title_en: ownerProperty.title,
          title_ru: ownerProperty.title_ru || ownerProperty.title,
          description_en: ownerProperty.description,
          description_ru: ownerProperty.description_ru,
          address: ownerProperty.address,
          district: ownerProperty.district,
          property_type: ownerProperty.property_type,
          listing_type: data.listingType,
          bedrooms: ownerProperty.bedrooms,
          bathrooms: ownerProperty.bathrooms,
          area_sqm: ownerProperty.area_sqm,
          cover_image: ownerProperty.cover_image,
          images: ownerProperty.images,
          price: data.price,
          price_period: data.listingType === 'rent' ? data.pricePeriod : null,
          currency: 'THB',
          is_active: true,
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      // Link marketplace property to owner property
      const { error: updateError } = await supabase
        .from('owner_properties')
        .update({ marketplace_property_id: marketplaceProperty.id } as any)
        .eq('id', data.ownerPropertyId);

      if (updateError) throw updateError;

      return marketplaceProperty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      toast.success('Объект опубликован на маркетплейсе!');
    },
    onError: (error) => {
      toast.error('Ошибка публикации: ' + error.message);
    },
  });
}

// Inspections
export function usePropertyInspections(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-inspections', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('property_inspections')
        .select('*, property:owner_properties(*)')
        .eq('owner_id', user.id)
        .order('scheduled_at', { ascending: false });
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PropertyInspection[];
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<PropertyInspection>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: result, error } = await supabase
        .from('property_inspections')
        .insert({ ...data, owner_id: user.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return result as PropertyInspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-inspections'] });
      toast.success('Инспекция запланирована!');
    },
  });
}

// Service Requests
export function useServiceRequests(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-service-requests', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('property_service_requests')
        .select('*, property:owner_properties(*)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PropertyServiceRequest[];
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<PropertyServiceRequest>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: result, error } = await supabase
        .from('property_service_requests')
        .insert({ ...data, owner_id: user.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return result as PropertyServiceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-service-requests'] });
      toast.success('Заявка создана!');
    },
  });
}

// Financials
export function usePropertyFinancials(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-financials', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('property_financials')
        .select('*, property:owner_properties(*)')
        .eq('owner_id', user.id)
        .order('transaction_date', { ascending: false });
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PropertyFinancial[];
    },
    enabled: !!user,
  });
}

// Stats - optimized with staleTime to reduce redundant calls
export function usePropertyCareStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-care-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [properties, inspections, requests, financials] = await Promise.all([
        supabase.from('owner_properties').select('id, status').eq('owner_id', user.id),
        supabase.from('property_inspections').select('id, status').eq('owner_id', user.id),
        supabase.from('property_service_requests').select('id, status').eq('owner_id', user.id),
        supabase.from('property_financials').select('amount, transaction_type').eq('owner_id', user.id),
      ]);

      const income = (financials.data || [])
        .filter(f => f.transaction_type === 'income')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      
      const expenses = (financials.data || [])
        .filter(f => f.transaction_type === 'expense')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      return {
        totalProperties: properties.data?.length || 0,
        activeProperties: properties.data?.filter(p => p.status === 'active').length || 0,
        pendingInspections: inspections.data?.filter(i => i.status === 'scheduled').length || 0,
        completedInspections: inspections.data?.filter(i => i.status === 'completed').length || 0,
        pendingRequests: requests.data?.filter(r => ['pending', 'confirmed', 'in_progress'].includes(r.status)).length || 0,
        totalIncome: income,
        totalExpenses: expenses,
        netIncome: income - expenses,
      };
    },
    enabled: !!user,
    staleTime: 60000, // Cache stats for 1 minute
  });
}
