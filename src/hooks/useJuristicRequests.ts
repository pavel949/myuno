import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type RequestCategory = 'maintenance' | 'complaint' | 'payment' | 'administrative';

export type RequestType = 
  | 'maintenance_common_area'
  | 'maintenance_unit'
  | 'renovation_request'
  | 'complaint_cleaning'
  | 'complaint_security'
  | 'complaint_noise'
  | 'complaint_facilities'
  | 'complaint_other'
  | 'payment_cam'
  | 'payment_utility'
  | 'payment_sinking_fund'
  | 'payment_other'
  | 'access_card_request'
  | 'parking_sticker'
  | 'move_in_out'
  | 'guest_registration'
  | 'document_request'
  | 'other';

export type RequestStatus = 
  | 'draft'
  | 'pending_payment'
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface JuristicRequest {
  id: string;
  request_number: string;
  property_id: string;
  project_id: string | null;
  owner_id: string;
  submitted_by: string;
  request_category: RequestCategory;
  request_type: RequestType;
  subject: string;
  subject_ru: string | null;
  description: string;
  description_ru: string | null;
  attachments: string[] | null;
  priority: RequestPriority;
  status: RequestStatus;
  requires_payment: boolean;
  payment_amount: number | null;
  service_fee_percent: number;
  service_fee: number | null;
  total_amount: number | null;
  payment_status: string | null;
  payment_id: string | null;
  payment_receipt_url: string | null;
  paid_at: string | null;
  payment_period_start: string | null;
  payment_period_end: string | null;
  submitted_at: string | null;
  juristic_response: string | null;
  juristic_response_at: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  completion_photos: string[] | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title: string;
    address: string | null;
  };
}

export interface CreateJuristicRequestInput {
  property_id: string;
  project_id?: string;
  request_category: RequestCategory;
  request_type: RequestType;
  subject: string;
  subject_ru?: string;
  description: string;
  description_ru?: string;
  attachments?: string[];
  priority?: RequestPriority;
  requires_payment?: boolean;
  payment_amount?: number;
  payment_period_start?: string;
  payment_period_end?: string;
}

export const requestTypeLabels: Record<RequestType, { en: string; ru: string; category: RequestCategory }> = {
  // Maintenance
  maintenance_common_area: { en: 'Common Area Maintenance', ru: 'Ремонт общих территорий', category: 'maintenance' },
  maintenance_unit: { en: 'Unit Maintenance', ru: 'Ремонт в юните', category: 'maintenance' },
  renovation_request: { en: 'Renovation Request', ru: 'Запрос на ремонт', category: 'maintenance' },
  // Complaints
  complaint_cleaning: { en: 'Cleaning Complaint', ru: 'Качество уборки', category: 'complaint' },
  complaint_security: { en: 'Security Complaint', ru: 'Работа охраны', category: 'complaint' },
  complaint_noise: { en: 'Noise Complaint', ru: 'Шум', category: 'complaint' },
  complaint_facilities: { en: 'Facilities Complaint', ru: 'Работа оборудования', category: 'complaint' },
  complaint_other: { en: 'Other Complaint', ru: 'Другая претензия', category: 'complaint' },
  // Payments
  payment_cam: { en: 'CAM Payment', ru: 'Оплата CAM', category: 'payment' },
  payment_utility: { en: 'Utility Payment', ru: 'Оплата коммуналки', category: 'payment' },
  payment_sinking_fund: { en: 'Sinking Fund', ru: 'Резервный фонд', category: 'payment' },
  payment_other: { en: 'Other Payment', ru: 'Другой платёж', category: 'payment' },
  // Administrative
  access_card_request: { en: 'Access Card Request', ru: 'Запрос ключ-карты', category: 'administrative' },
  parking_sticker: { en: 'Parking Sticker', ru: 'Парковочный стикер', category: 'administrative' },
  move_in_out: { en: 'Move In/Out', ru: 'Заезд/выезд', category: 'administrative' },
  guest_registration: { en: 'Guest Registration', ru: 'Регистрация гостей', category: 'administrative' },
  document_request: { en: 'Document Request', ru: 'Запрос документов', category: 'administrative' },
  other: { en: 'Other', ru: 'Прочее', category: 'administrative' },
};

export const requestCategoryLabels: Record<RequestCategory, { en: string; ru: string; icon: string; color: string }> = {
  maintenance: { en: 'Maintenance', ru: 'Ремонт', icon: 'Wrench', color: 'orange' },
  complaint: { en: 'Complaint', ru: 'Претензия', icon: 'AlertTriangle', color: 'red' },
  payment: { en: 'Payment', ru: 'Платёж', icon: 'CreditCard', color: 'green' },
  administrative: { en: 'Administrative', ru: 'Административное', icon: 'FileText', color: 'blue' },
};

export const requestStatusLabels: Record<RequestStatus, { en: string; ru: string; color: string }> = {
  draft: { en: 'Draft', ru: 'Черновик', color: 'gray' },
  pending_payment: { en: 'Pending Payment', ru: 'Ожидает оплаты', color: 'yellow' },
  submitted: { en: 'Submitted', ru: 'Отправлено', color: 'blue' },
  acknowledged: { en: 'Acknowledged', ru: 'Принято', color: 'indigo' },
  in_progress: { en: 'In Progress', ru: 'В работе', color: 'purple' },
  completed: { en: 'Completed', ru: 'Выполнено', color: 'green' },
  rejected: { en: 'Rejected', ru: 'Отклонено', color: 'red' },
  cancelled: { en: 'Cancelled', ru: 'Отменено', color: 'gray' },
};

const SERVICE_FEE_PERCENT = 5;

export function useJuristicRequests(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['juristic-requests', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('juristic_requests')
        .select(`
          *,
          property:owner_properties!property_id (
            id,
            title,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as JuristicRequest[];
    },
    enabled: !!user,
  });

  const createRequest = useMutation({
    mutationFn: async (input: CreateJuristicRequestInput) => {
      // Calculate service fee if payment is required
      let serviceFee = null;
      let totalAmount = null;
      
      if (input.requires_payment && input.payment_amount) {
        serviceFee = Math.round(input.payment_amount * SERVICE_FEE_PERCENT) / 100;
        totalAmount = input.payment_amount + serviceFee;
      }

      // Get property owner
      const { data: property } = await supabase
        .from('owner_properties')
        .select('owner_id, project_id')
        .eq('id', input.property_id)
        .single();

      const { data, error } = await supabase
        .from('juristic_requests')
        .insert({
          ...input,
          owner_id: property?.owner_id || user?.id,
          submitted_by: user?.id,
          project_id: input.project_id || property?.project_id,
          service_fee_percent: SERVICE_FEE_PERCENT,
          service_fee: serviceFee,
          total_amount: totalAmount,
          status: input.requires_payment ? 'pending_payment' : 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juristic-requests'] });
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JuristicRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('juristic_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juristic-requests'] });
    },
  });

  const submitRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('juristic_requests')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juristic-requests'] });
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('juristic_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juristic-requests'] });
    },
  });

  const rateRequest = useMutation({
    mutationFn: async ({ requestId, rating, feedback }: { requestId: string; rating: number; feedback?: string }) => {
      const { data, error } = await supabase
        .from('juristic_requests')
        .update({ rating, feedback })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juristic-requests'] });
    },
  });

  // Stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => ['draft', 'pending_payment', 'submitted'].includes(r.status)).length || 0,
    inProgress: requests?.filter(r => ['acknowledged', 'in_progress'].includes(r.status)).length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0,
  };

  return {
    requests,
    stats,
    isLoading,
    error,
    createRequest,
    updateRequest,
    submitRequest,
    cancelRequest,
    rateRequest,
    isCreating: createRequest.isPending,
    isUpdating: updateRequest.isPending,
    isSubmitting: submitRequest.isPending,
  };
}

// Hook for getting juristic contacts
export function useJuristicContacts(projectId?: string, propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['juristic-contacts', projectId, propertyId],
    queryFn: async () => {
      let query = supabase
        .from('juristic_contacts')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('contact_type', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!(projectId || propertyId),
  });
}
