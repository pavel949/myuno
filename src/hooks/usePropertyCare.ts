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

  return useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as OwnerProperty[];
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

  return useQuery({
    queryKey: ['owner-property', id],
    queryFn: async () => {
      if (!id || !user) return null;

      // Try as owner first
      const { data: owned } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (owned) return owned as OwnerProperty;

      // Try as assigned manager
      const { data: assignment } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_id', id)
        .eq('manager_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!assignment) return null;

      const { data: managed, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return managed as OwnerProperty;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateOwnerProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<OwnerProperty> & { _companyId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get user profile for owner info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Auto-detect management company if not explicitly provided
      let managementCompanyId = (data as any).management_company_id || data._companyId || null;
      if (!managementCompanyId) {
        const { data: membership } = await supabase
          .from('management_company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        if (membership) {
          managementCompanyId = membership.company_id;
        }
      }

      const { _companyId, ...restData } = data as any;
      
      const insertData = { 
        ...restData, 
        owner_id: user.id,
        approval_status: data.approval_status || 'pending',
        title_en: data.title || data.address || 'New Property',
        title_ru: data.title_ru || data.title || 'Новый объект',
        listing_type: 'rent',
        listing_modes: data.listing_modes || ['rent'],
        ...(managementCompanyId ? { management_company_id: managementCompanyId } : {}),
      };
      
      const { data: result, error } = await supabase
        .from('properties')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      
      // Trigger email notification to admins (fire and forget)
      supabase.functions.invoke('notify-admin-property-submission', {
        body: {
          property_id: result.id,
          property_title: result.title || result.title_en || result.title_ru || 'Без названия',
          owner_id: user.id,
          owner_name: profile?.full_name || undefined,
          owner_email: profile?.email || user.email || undefined,
        },
      }).catch(err => errorLog.silent(err, 'notify_admin'));
      
      return result as OwnerProperty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['company-properties'] });
      toast.success('Объект добавлен!');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

/**
 * Update property — works for both owners and assigned managers.
 */
export function useUpdateOwnerProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OwnerProperty> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Try update as owner first
      const { data: result, error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .maybeSingle();
      
      if (result) return result;

      // If not owner, check if assigned manager
      const hasAccess = await canAccessProperty(user.id, id);
      if (!hasAccess) throw new Error('Property not found or access denied');

      // Update without owner_id filter (manager has access via assignment)
      const { data: managedResult, error: managedError } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (managedError) throw managedError;
      return managedResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
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
      ownershipForm?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Verify access (owner or manager)
      const hasAccess = await canAccessProperty(user.id, data.ownerPropertyId);
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
        price: data.price,
        price_period: data.listingType === 'rent' ? data.pricePeriod : 'total',
      };
      
      const currentModes = (currentProperty?.listing_modes as string[]) || [];
      if (!currentModes.includes(data.listingType)) {
        updateData.listing_modes = [...currentModes, data.listingType];
      }
      
      if (data.listingType === 'sale') {
        updateData.sale_price = data.price;
        updateData.ownership_form = data.ownershipForm;
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

  return useQuery({
    queryKey: ['property-inspections', user?.id, propertyId],
    queryFn: async () => {
      if (!user) return [];
      
      if (propertyId) {
        // Specific property — verify access
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

      // All properties — owned + managed
      const { allIds } = await getUserPropertyIds(user.id);
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

  return useQuery({
    queryKey: ['property-service-requests', user?.id, propertyId],
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

      const { allIds } = await getUserPropertyIds(user.id);
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

  return useQuery({
    queryKey: ['property-financials', user?.id, propertyId],
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

      const { allIds } = await getUserPropertyIds(user.id);
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

  return useQuery({
    queryKey: ['property-care-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { allIds } = await getUserPropertyIds(user.id);
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
