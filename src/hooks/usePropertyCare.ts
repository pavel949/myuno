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


export function useOwnerProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Query unified properties table filtering by owner_id
      const { data, error } = await supabase
        .from('properties')
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
      // Query unified properties table
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id) // Security: verify ownership
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
      
      // Get user profile for owner info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      // Ensure approval_status is 'pending' for moderation workflow
      // Insert into unified properties table with owner_id
      const insertData = { 
        ...data, 
        owner_id: user.id,
        approval_status: data.approval_status || 'pending',
        // Set title_en/title_ru from title for marketplace compatibility
        title_en: data.title || data.address || 'New Property',
        title_ru: data.title_ru || data.title || 'Новый объект',
        listing_type: 'rent',
        listing_modes: data.listing_modes || ['rent'],
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
      toast.success('Объект добавлен!');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

export function useUpdateOwnerProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OwnerProperty> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Update in unified properties table
      const { data: result, error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id)
        .eq('owner_id', user.id) // Security: verify ownership
        .select()
        .single();
      
      if (error) throw error;
      if (!result) throw new Error('Property not found or access denied');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Объект обновлён!');
    },
  });
}

// Publish owner property to marketplace (now just updates listing status)
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

      // With unified table, we just update the property to be active/approved
      const updateData: Record<string, unknown> = {
        is_active: true,
        listing_type: data.listingType,
        price: data.price,
        price_period: data.listingType === 'rent' ? data.pricePeriod : 'total',
      };
      
      // Add to listing_modes array if not already there
      const { data: currentProperty, error: fetchError } = await supabase
        .from('properties')
        .select('listing_modes')
        .eq('id', data.ownerPropertyId)
        .eq('owner_id', user.id)
        .single();
        
      if (fetchError) throw new Error('Property not found or access denied');
      
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
        .eq('owner_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
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
      
      // Note: property_inspections still references owner_properties FK until DB migration updates it
      let query = supabase
        .from('property_inspections')
        .select('*')
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
      
      // Note: property_service_requests still references owner_properties FK until DB migration updates it
      let query = supabase
        .from('property_service_requests')
        .select('*')
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
      
      // Note: property_financials still references owner_properties FK until DB migration updates it
      let query = supabase
        .from('property_financials')
        .select('*')
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
        supabase.from('properties').select('id, status').eq('owner_id', user.id),
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
