import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ConsultationRequestType = 
  | 'property_consultation'
  | 'property_tour'
  | 'full_management'
  | 'investment_advice';

export type ConsultationStatus = 
  | 'pending'
  | 'contacted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ConsultationRequest {
  id: string;
  user_id: string | null;
  request_type: ConsultationRequestType;
  
  // Contact
  name: string;
  email: string | null;
  phone: string;
  preferred_language: string;
  preferred_contact_method: string;
  
  // Property criteria
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  property_types: string[] | null;
  districts: string[] | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  purpose: string | null;
  
  // Tours
  preferred_dates: { date: string; time: string }[] | null;
  property_ids: string[] | null;
  
  // Full management
  owner_property_id: string | null;
  services_requested: string[] | null;
  current_occupancy: string | null;
  
  // Status
  status: ConsultationStatus;
  priority: string;
  assigned_to: string | null;
  notes: string | null;
  admin_notes: string | null;
  outcome: string | null;
  follow_up_date: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CreateConsultationInput {
  request_type: ConsultationRequestType;
  name: string;
  email?: string;
  phone: string;
  preferred_language?: string;
  preferred_contact_method?: string;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  property_types?: string[];
  districts?: string[];
  bedrooms_min?: number;
  bedrooms_max?: number;
  purpose?: string;
  preferred_dates?: { date: string; time: string }[];
  property_ids?: string[];
  owner_property_id?: string;
  services_requested?: string[];
  current_occupancy?: string;
  notes?: string;
}

export function useConsultationRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's consultation requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['consultation-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConsultationRequest[];
    },
    enabled: !!user,
  });

  // Create consultation request (for clients)
  const createConsultation = useMutation({
    mutationFn: async (input: CreateConsultationInput) => {
      const { data, error } = await supabase
        .from('consultation_requests')
        .insert({
          ...input,
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ConsultationRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
    },
  });

  // Request property consultation
  const requestPropertyConsultation = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'property_consultation',
      });
    },
    onSuccess: () => {
      toast.success('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
    },
    onError: () => {
      toast.error('Ошибка при отправке заявки. Попробуйте ещё раз.');
    },
  });

  // Request property tour
  const requestPropertyTour = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'property_tour',
      });
    },
    onSuccess: () => {
      toast.success('Заявка на просмотр отправлена!');
    },
    onError: () => {
      toast.error('Ошибка при отправке заявки.');
    },
  });

  // Request full management (for owners)
  const requestFullManagement = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'full_management',
      });
    },
    onSuccess: () => {
      toast.success('Заявка на управление отправлена! Наш менеджер свяжется с вами.');
    },
    onError: () => {
      toast.error('Ошибка при отправке заявки.');
    },
  });

  // Request investment advice
  const requestInvestmentAdvice = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'investment_advice',
      });
    },
    onSuccess: () => {
      toast.success('Заявка на консультацию по инвестициям отправлена!');
    },
    onError: () => {
      toast.error('Ошибка при отправке заявки.');
    },
  });

  return {
    requests,
    isLoading,
    createConsultation,
    requestPropertyConsultation,
    requestPropertyTour,
    requestFullManagement,
    requestInvestmentAdvice,
  };
}
