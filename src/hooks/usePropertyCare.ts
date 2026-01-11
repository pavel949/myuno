import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// Stats
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
  });
}
