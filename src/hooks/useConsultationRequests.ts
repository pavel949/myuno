import { useRef } from 'react';
import { createConsultationIntakeAttempt } from '@/lib/consultationIntake';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

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

/** A committed-create receipt is distinct from optional private row readback. */
export type ConsultationSubmissionReceipt = {
  id: string;
  readbackStatus: 'loaded' | 'unavailable' | 'not-requested';
  record: ConsultationRequest | null;
};

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
  const { language } = useLanguage();
  const saved = () => toast.success(pickLang(language, { ru: 'Заявка сохранена. Ответ команды ожидается.', en: 'Request saved. A team reply is pending.', th: 'บันทึกคำขอแล้ว ยังรอการตอบกลับจากทีม' }));
  const unconfirmed = () => toast.error(pickLang(language, { ru: 'Сохранение заявки не подтверждено.', en: 'Request saving was not confirmed.', th: 'ยังยืนยันการบันทึกคำขอไม่ได้' }));
  const queryClient = useQueryClient();
  const intake = useRef<ReturnType<typeof createConsultationIntakeAttempt> | null>(null);
  if (!intake.current) intake.current = createConsultationIntakeAttempt();

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

  // Create consultation request (for clients).
  // Guests have no SELECT access to consultation_requests (PII), so the row is
  // created through the security-definer RPC that returns only the new id.
  const createConsultation = useMutation({
    mutationFn: async (input: CreateConsultationInput): Promise<ConsultationSubmissionReceipt> => {
      const { id: newId } = await intake.current!.submit(supabase, input as unknown as Record<string, unknown>, user?.id);

      // The RPC receipt acknowledges the committed insert. Optional PII readback
      // must never turn an accepted request into a failed/retried creation.
      if (user?.id) {
        try {
          const { data: row, error: readError } = await supabase
            .from('consultation_requests').select('*').eq('id', newId).maybeSingle();
          if (!readError && row?.id === newId) return { id: newId, record: row as unknown as ConsultationRequest, readbackStatus: 'loaded' };
        } catch { /* Keep the durable receipt; details are unavailable. */ }
      }
      return { id: newId, record: null, readbackStatus: user?.id ? 'unavailable' : 'not-requested' };

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
      saved();
    },
    onError: () => {
      unconfirmed();
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
      saved();
    },
    onError: () => {
      unconfirmed();
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
      saved();
    },
    onError: () => {
      unconfirmed();
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
      saved();
    },
    onError: () => {
      unconfirmed();
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
      saved();
    },
    onError: () => {
      unconfirmed();
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
      saved();
    },
    onError: () => {
      unconfirmed();
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
      saved();
    },
    onError: () => {
      unconfirmed();
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
