import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LeadSource, getLeadVerticalById } from '@/lib/leadVerticalConfig';
import type { Json } from '@/integrations/supabase/types';

export interface UniversalLeadInput {
  // Core fields
  vertical_id: string;
  request_type: string;
  lead_source: LeadSource;
  entry_point: string;
  
  // Contact
  name: string;
  phone: string;
  email?: string;
  preferred_language?: string;
  preferred_contact_method?: string;
  
  // Flexible metadata per vertical
  vertical_metadata?: Record<string, unknown>;
  
  // Common optional fields (mapped to consultation_requests columns)
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  property_types?: string[];
  districts?: string[];
  preferred_dates?: { check_in: string; check_out: string } | { date: string; time: string }[];
  guests_count?: number;
  children_count?: number;
  notes?: string;
}

// Verticals that trigger WhatsApp notifications (home_services goes via dedicated function, others via notify-admin-order)
const WHATSAPP_NOTIFICATION_VERTICALS = ['home_services'];

export function useUniversalLead() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const submitLead = useMutation({
    mutationFn: async (input: UniversalLeadInput) => {
      const vertical = getLeadVerticalById(input.vertical_id);
      
      const payload = {
        // Map to consultation_requests columns
        user_id: user?.id || null,
        request_type: input.request_type,
        vertical_id: input.vertical_id,
        vertical_metadata: (input.vertical_metadata || {}) as Json,
        lead_source: input.lead_source,
        entry_point: input.entry_point,
        
        // Contact
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        preferred_language: input.preferred_language || language,
        preferred_contact_method: input.preferred_contact_method || 'whatsapp',
        
        // Optional fields
        budget_min: input.budget_min || null,
        budget_max: input.budget_max || null,
        currency: input.currency || 'THB',
        property_types: input.property_types || null,
        districts: input.districts || null,
        preferred_dates: input.preferred_dates || null,
        guests_count: input.guests_count || null,
        children_count: input.children_count || null,
        notes: input.notes || null,
        
        // Default status
        status: 'pending' as const,
        priority: 'normal',
      };

      const { data, error } = await supabase
        .from('consultation_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      
      // Trigger WhatsApp notification for specific verticals
      if (data && WHATSAPP_NOTIFICATION_VERTICALS.includes(input.vertical_id)) {
        supabase.functions.invoke('notify-lead-whatsapp', {
          body: { leadId: data.id },
        }).catch(() => { /* fire & forget */ });
      }

      // Notify admin about new lead via email (fire & forget)
      if (data) {
        supabase.functions.invoke('notify-admin-order', {
          body: {
            order_id: data.id,
            order_number: `LEAD-${data.id.slice(0, 8).toUpperCase()}`,
            order_type: input.vertical_id,
            total_amount: input.budget_max || input.budget_min || 0,
            currency: input.currency || 'THB',
            customer_name: input.name,
            customer_email: input.email,
            customer_phone: input.phone,
            notes: input.notes || `Lead: ${input.request_type} via ${input.entry_point}`,
          },
        }).catch(() => { /* fire & forget */ });
      }

      // Trigger auto lead scoring (fire & forget)
      if (data) {
        supabase.functions.invoke('auto-lead-scoring', {
          body: { leadId: data.id },
        }).catch(() => { /* fire & forget */ });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      
      const isRu = language === 'ru';
      const vertical = getLeadVerticalById(variables.vertical_id);
      const verticalName = isRu ? vertical?.nameRu : vertical?.nameEn;
      
      toast.success(
        isRu 
          ? `Заявка отправлена! Мы свяжемся с вами в ближайшее время.`
          : `Request sent! We will contact you shortly.`
      );
    },
    onError: () => {
      const isRu = language === 'ru';
      toast.error(
        isRu 
          ? 'Ошибка при отправке заявки. Попробуйте ещё раз.'
          : 'Failed to submit request. Please try again.'
      );
    },
  });

  return {
    submitLead,
    isSubmitting: submitLead.isPending,
  };
}
