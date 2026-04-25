import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('usePropertyCare');

// Re-export types from centralized location for backward compatibility
export type { 
  OwnerProperty, 
  PropertyInspection, 
  PropertyServiceRequest, 
  PropertyFinancial 
} from '@/types/property';

import type { 
  OwnerProperty, 
  PropertyInspection, 
  PropertyServiceRequest, 
  PropertyFinancial 
} from '@/types/property';

import { getAccessiblePropertyIds } from '@/lib/getAccessiblePropertyIds';
import { useActiveCompany } from '@/hooks/useActiveCompany';

/**
 * Helper: get all property IDs the user can manage.
 * Delegates to the central getAccessiblePropertyIds (owned + delegated + company).
 */
async function getUserPropertyIds(userId: string, activeCompanyId: string | null = null) {
  const result = await getAccessiblePropertyIds({ userId, activeCompanyId });
  return { ownedIds: result.ownedIds, managedIds: [...result.delegatedIds, ...result.companyIds], allIds: result.allIds };
}

/**
 * Check if user has access to a specific property (owner OR assigned manager).
 */
async function canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
  // Check ownership first (fast path)
  const { data: owned } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (owned) return true;

  // Check management assignment
  const { data: assigned } = await supabase
    .from('property_manager_assignments')
    .select('id')
    .eq('property_id', propertyId)
    .eq('manager_user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  return !!assigned;
}

export function useOwnerProperties() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id || null;

  return useQuery({
    queryKey: ['owner-properties', user?.id, activeCompanyId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      // In MC mode, only show owned properties belonging to the active company
      if (activeCompanyId) {
        query = query.eq('management_company_id', activeCompanyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as OwnerProperty[];
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

/**
 * Fetch a single property — accessible by owner OR assigned manager.
 */
export function useOwnerProperty(id: string | undefined) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id || null;

  return useQuery({
    queryKey: ['owner-property', id, activeCompanyId],
    queryFn: async () => {
      if (!id || !user) return null;

      // Fire all access checks in parallel instead of waterfall
      const [ownerRes, assignmentRes, companyRes, membershipsRes] = await Promise.all([
        // 1. Owner check
        supabase.from('properties').select('*').eq('id', id).eq('owner_id', user.id).maybeSingle(),
        // 2. Manager assignment check
        supabase.from('property_manager_assignments').select('property_id').eq('property_id', id).eq('manager_user_id', user.id).eq('is_active', true).maybeSingle(),
        // 3. Active company check
        activeCompanyId
          ? supabase.from('properties').select('*').eq('id', id).eq('management_company_id', activeCompanyId).maybeSingle()
          : Promise.resolve({ data: null }),
        // 4. All user companies fallback
        supabase.from('management_company_members').select('company_id').eq('user_id', user.id).eq('is_active', true),
      ]);

      // Priority: owner > company > manager > fallback
      if (ownerRes.data) return ownerRes.data as unknown as OwnerProperty;
      if (companyRes.data) return companyRes.data as unknown as OwnerProperty;

      if (assignmentRes.data) {
        const { data: managed } = await supabase.from('properties').select('*').eq('id', id).single();
        if (managed) return managed as unknown as OwnerProperty;
      }

      // Fallback: check other companies
      if (membershipsRes.data?.length) {
        const companyIds = membershipsRes.data.map(m => m.company_id);
        // Skip active company (already checked)
        const otherCompanyIds = activeCompanyId ? companyIds.filter(c => c !== activeCompanyId) : companyIds;
        if (otherCompanyIds.length) {
          const { data: companyProp } = await supabase.from('properties').select('*').eq('id', id).in('management_company_id', otherCompanyIds).maybeSingle();
          if (companyProp) return companyProp as unknown as OwnerProperty;
        }
      }

      return null;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateOwnerProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id || null;

  return useMutation({
    mutationFn: async (data: Partial<OwnerProperty> & { _companyId?: string; _silent?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Priority: explicit data > active company context > DB fallback
      const dataExt = data as Partial<OwnerProperty> & {
        _companyId?: string;
        _silent?: boolean;
        management_company_id?: string | null;
        description_en?: string;
      };
      const companyIdFromData = dataExt.management_company_id || data._companyId || activeCompanyId || null;
      const [profileRes, membershipRes] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
        !companyIdFromData
          ? supabase.from('management_company_members').select('company_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      
      const profile = profileRes.data;
      const managementCompanyId = companyIdFromData || membershipRes.data?.company_id || null;

      const { _companyId, _silent, title, title_ru, description, description_ru, ...restData } = dataExt;
      
      // Clean undefined values to prevent potential DB column mismatch
      const cleanRest: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(restData)) {
        if (val !== undefined) cleanRest[key] = val;
      }
      
      const insertData = { 
        ...cleanRest, 
        owner_id: user.id,
        approval_status: data.approval_status || 'pending',
        is_active: data.approval_status === 'draft' ? false : true,
        title_en: title || data.address || 'New Property',
        title_ru: title_ru || title || 'Новый объект',
        description_en: description || dataExt.description_en || '',
        description_ru: description_ru || '',
        listing_type: 'rent',
        listing_modes: data.listing_modes || ['rent'],
        ...(managementCompanyId ? { management_company_id: managementCompanyId } : {}),
      };
      
      const { data: result, error } = await supabase
        .from('properties')
        .insert(insertData as never)
        .select()
        .single();
      
      if (error) {
        errorLog.silent(error, 'create_owner_property');
        throw error;
      }
      
      // Trigger email notification to admins (fire and forget)
      if (!_silent && data.approval_status !== 'draft') {
        supabase.functions.invoke('notify-admin-property-submission', {
          body: {
            property_id: result.id,
            property_title: result.title || result.title_en || result.title_ru || 'Без названия',
            owner_id: user.id,
            owner_name: profile?.full_name || undefined,
            owner_email: profile?.email || user.email || undefined,
          },
        }).catch(err => errorLog.silent(err, 'notify_admin'));
      }
      
      return result as unknown as OwnerProperty;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['company-properties'] });
      if (!(variables as any)?._silent) {
        toast.success('Объект добавлен!');
      }
    },
    onError: (error, variables) => {
      if (!(variables as any)?._silent) {
        toast.error('Ошибка: ' + error.message);
      }
    },
  });
}

/**
 * Update property — works for both owners and assigned managers.
 */
export function useUpdateOwnerProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async ({ id, _silent, ...data }: Partial<OwnerProperty> & { id: string; _silent?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Try update as owner first
      const { data: result } = await supabase
        .from('properties')
        .update(data as any)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .maybeSingle();
      
      if (result) return result;

      // Verify access: must be assigned manager OR member of the property's company
      const activeCompanyId = activeCompany?.company_id || null;
      const [assignmentCheck, propertyCheck] = await Promise.all([
        supabase.from('property_manager_assignments').select('id').eq('property_id', id).eq('manager_user_id', user.id).eq('is_active', true).maybeSingle(),
        activeCompanyId
          ? supabase.from('properties').select('id, management_company_id').eq('id', id).eq('management_company_id', activeCompanyId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const hasAccess = !!assignmentCheck.data || !!propertyCheck.data;
      if (!hasAccess) throw new Error('Property not found or access denied');

      // Scoped update: filter by company if available, otherwise by assignment-verified id
      let query = supabase.from('properties').update(data as any).eq('id', id);
      if (propertyCheck.data?.management_company_id) {
        query = query.eq('management_company_id', propertyCheck.data.management_company_id);
      }
      const { data: managedResult, error: managedError } = await query.select().single();
      
      if (managedError) throw managedError;
      return managedResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
      if (!(variables as any)?._silent) {
        toast.success('Объект обновлён!');
      }
    },
  });
}

// Publish owner property to marketplace
export function usePublishToMarketplace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (data: {
      ownerPropertyId: string;
      listingType: 'rent' | 'sale';
      price: number;
      pricePeriod?: string;
      ownershipForm?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const activeCompanyId = activeCompany?.company_id || null;

      // Verify access: owner OR assigned manager OR company member (parallel)
      const [ownerCheck, assignmentCheck, companyCheck] = await Promise.all([
        supabase.from('properties').select('id').eq('id', data.ownerPropertyId).eq('owner_id', user.id).maybeSingle(),
        supabase.from('property_manager_assignments').select('id').eq('property_id', data.ownerPropertyId).eq('manager_user_id', user.id).eq('is_active', true).maybeSingle(),
        activeCompanyId
          ? supabase.from('properties').select('id').eq('id', data.ownerPropertyId).eq('management_company_id', activeCompanyId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const hasAccess = !!ownerCheck.data || !!assignmentCheck.data || !!companyCheck.data;
      if (!hasAccess) throw new Error('Property not found or access denied');

      const { data: currentProperty, error: fetchError } = await supabase
        .from('properties')
        .select('listing_modes')
        .eq('id', data.ownerPropertyId)
        .single();
        
      if (fetchError) throw new Error('Property not found');

      const updateData: Record<string, unknown> = {
        is_active: true,
        listing_type: data.listingType,
        price_period: data.listingType === 'rent' ? data.pricePeriod : 'total',
      };

      const currentModes = (currentProperty?.listing_modes as string[]) || [];
      if (!currentModes.includes(data.listingType)) {
        updateData.listing_modes = [...currentModes, data.listingType];
      }

      if (data.listingType === 'sale') {
        updateData.sale_price = data.price;
        updateData.ownership_form = data.ownershipForm;
      } else if (data.listingType === 'rent') {
        updateData.price_per_night = data.price;
      }

      const { data: result, error: updateError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', data.ownerPropertyId)
        .select()
        .single();

      if (updateError) throw updateError;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
      toast.success('Объект опубликован на маркетплейсе!');
    },
    onError: (error) => {
      toast.error('Ошибка публикации: ' + error.message);
    },
  });
}

// Inspections — includes managed properties
export function usePropertyInspections(propertyId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  return useQuery({
    queryKey: ['property-inspections', user?.id, activeCompanyId, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      if (propertyId) {
        const hasAccess = await canAccessProperty(user.id, propertyId);
        if (!hasAccess) return [];
        
        const { data, error } = await supabase
          .from('property_inspections')
          .select('*')
          .eq('property_id', propertyId)
          .order('scheduled_at', { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as PropertyInspection[];
      }

      const { allIds } = await getUserPropertyIds(user.id, activeCompanyId);
      if (allIds.length === 0) return [];

      const { data, error } = await supabase
        .from('property_inspections')
        .select('*')
        .in('property_id', allIds)
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PropertyInspection[];
    },
    enabled: !!user,
    staleTime: 30000,
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

// Service Requests — includes managed properties
export function useServiceRequests(propertyId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  return useQuery({
    queryKey: ['property-service-requests', user?.id, activeCompanyId, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      if (propertyId) {
        const hasAccess = await canAccessProperty(user.id, propertyId);
        if (!hasAccess) return [];
        
        const { data, error } = await supabase
          .from('property_service_requests')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as PropertyServiceRequest[];
      }

      const { allIds } = await getUserPropertyIds(user.id, activeCompanyId);
      if (allIds.length === 0) return [];

      const { data, error } = await supabase
        .from('property_service_requests')
        .select('*')
        .in('property_id', allIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PropertyServiceRequest[];
    },
    enabled: !!user,
    staleTime: 30000,
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

// Financials — includes managed properties
export function usePropertyFinancials(propertyId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  return useQuery({
    queryKey: ['property-financials', user?.id, activeCompanyId, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      if (propertyId) {
        const hasAccess = await canAccessProperty(user.id, propertyId);
        if (!hasAccess) return [];
        
        const { data, error } = await supabase
          .from('property_financials')
          .select('*')
          .eq('property_id', propertyId)
          .order('transaction_date', { ascending: false });
        if (error) throw error;
        return data as PropertyFinancial[];
      }

      const { allIds } = await getUserPropertyIds(user.id, activeCompanyId);
      if (allIds.length === 0) return [];

      const { data, error } = await supabase
        .from('property_financials')
        .select('*')
        .in('property_id', allIds)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data as PropertyFinancial[];
    },
    enabled: !!user,
  });
}

// Stats — includes managed properties
export function usePropertyCareStats() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  return useQuery({
    queryKey: ['property-care-stats', user?.id, activeCompanyId],
    queryFn: async () => {
      if (!user) return null;

      const { allIds } = await getUserPropertyIds(user.id, activeCompanyId);
      if (allIds.length === 0) {
        return {
          totalProperties: 0, activeProperties: 0,
          pendingInspections: 0, completedInspections: 0,
          pendingRequests: 0, totalIncome: 0, totalExpenses: 0, netIncome: 0,
        };
      }

      const [properties, inspections, requests, financials] = await Promise.all([
        supabase.from('properties').select('id, status').in('id', allIds),
        supabase.from('property_inspections').select('id, status').in('property_id', allIds),
        supabase.from('property_service_requests').select('id, status').in('property_id', allIds),
        supabase.from('property_financials').select('amount, transaction_type').in('property_id', allIds),
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
    staleTime: 60000,
  });
}
