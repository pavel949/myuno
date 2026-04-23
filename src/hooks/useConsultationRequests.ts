import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ConsultationRequestType =
  | 'vacation_rental'
  | 'property_consultation'
  | 'property_tour'
  | 'full_management'
  | 'investment_advice'
  | 'channel_management'
  | 'developer_partnership'
  // Universal lead types
  | 'long_term_rental'
  | 'property_purchase'
  | 'yacht_charter'
  | 'yacht_multiday'
  | 'yacht_party'
  | 'yacht_purchase'
  | 'island_tour'
  | 'city_tour'
  | 'adventure_tour'
  | 'custom_tour'
  | 'car_rental'
  | 'bike_rental'
  | 'driver_service'
  | 'airport_transfer'
  | 'visa_consultation'
  | 'property_legal'
  | 'business_legal'
  | 'general_legal'
  | 'doctor_appointment'
  | 'dental'
  | 'health_checkup'
  | 'emergency'
  | 'babysitter_hourly'
  | 'babysitter_daily'
  | 'nanny_longterm'
  | 'spa_booking'
  | 'hair_salon'
  | 'nail_salon'
  | 'beauty_service'
  | 'gym_daypass'
  | 'gym_membership'
  | 'personal_trainer'
  | 'yoga_class'
  | 'diving'
  | 'snorkeling'
  | 'jet_ski'
  | 'surfing'
  | 'table_booking'
  | 'private_event'
  | 'restaurant_recommendation'
  | 'general_inquiry'
  | string; // Allow dynamic types

export type ConsultationStatus = 
  | 'pending'
  | 'contacted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Flexible type for preferred_dates - can be tour dates or rental dates
export type PreferredDates = 
  | { date: string; time: string }[] 
  | { check_in: string; check_out: string }
  | null;

export interface ConsultationRequest {
  id: string;
  user_id: string | null;
  request_type: ConsultationRequestType;
  
  // Universal lead fields
  vertical_id: string | null;
  vertical_metadata: Record<string, unknown> | null;
  entry_point: string | null;
  lead_source: string | null;
  
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
  
  // Tours / Vacation rental dates
  preferred_dates: PreferredDates;
  property_ids: string[] | null;
  
  // Vacation rental specific
  guests_count: number | null;
  children_count: number | null;
  
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
  preferred_dates?: { date: string; time: string }[] | { check_in: string; check_out: string };
  property_ids?: string[];
  owner_property_id?: string;
  services_requested?: string[];
  current_occupancy?: string;
  notes?: string;
  guests_count?: number;
  children_count?: number;
  vertical_metadata?: Record<string, unknown>;
  entry_point?: string;
  lead_source?: string;
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
      return (data || []) as unknown as ConsultationRequest[];
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
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ConsultationRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
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

  // Request vacation rental
  const requestVacationRental = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'vacation_rental',
      });
    },
    onSuccess: () => {
      toast.success('Заявка на аренду отправлена. Подберём подходящие варианты.');
    },
    onError: () => {
      toast.error('Ошибка при отправке заявки.');
    },
  });

  // B2B: Phuket developer / project partnership (newbuilds, leads, co-marketing)
  const requestDeveloperPartnership = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'developer_partnership',
      });
    },
    onSuccess: () => {
      toast.success(
        'Заявка отправлена! Команда myUNO свяжется с вами для обсуждения партнёрства.'
      );
    },
    onError: () => {
      toast.error('Ошибка при отправке заявки. Попробуйте ещё раз.');
    },
  });

  // Request channel management
  const requestChannelManagement = useMutation({
    mutationFn: async (input: Omit<CreateConsultationInput, 'request_type'>) => {
      return createConsultation.mutateAsync({
        ...input,
        request_type: 'channel_management',
      });
    },
    onSuccess: () => {
      toast.success('Заявка на управление каналами отправлена! Мы свяжемся с вами.');
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
    requestVacationRental,
    requestDeveloperPartnership,
    requestChannelManagement,
  };
}
