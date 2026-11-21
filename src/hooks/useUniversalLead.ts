import { observeLeadNotification } from '@/lib/leadNotification';
import { useRef } from 'react';
import { createConsultationIntakeAttempt, consultationIntakeErrorCopy, OFFPLAN_BUYER_ENTRY, OFFPLAN_CONSULTATION_RPC, offplanScopedWriterEnabled } from '@/lib/consultationIntake';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { untypedRpc } from '@/lib/untypedTables';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { LeadSource, getLeadVerticalById } from '@/lib/leadVerticalConfig';
import { logger } from '@/lib/logger';
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
  const intake = useRef<ReturnType<typeof createConsultationIntakeAttempt> | null>(null);
  if (!intake.current) intake.current = createConsultationIntakeAttempt();

  const offplanIntake = useRef<ReturnType<typeof createConsultationIntakeAttempt> | null>(null);
  const scopedOffplan = offplanScopedWriterEnabled();
  if (!offplanIntake.current) offplanIntake.current = scopedOffplan
    ? createConsultationIntakeAttempt({ writer: OFFPLAN_CONSULTATION_RPC })
    : createConsultationIntakeAttempt({ allowUncertainRetry: false });

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

      // Guests cannot read consultation_requests (PII), so insert through the
      // security-definer RPC which returns only the new lead id.
      const attempt = input.entry_point === OFFPLAN_BUYER_ENTRY ? offplanIntake.current : intake.current;
      if (!attempt) throw new Error('Intake recovery is unavailable.');
      const receipt = await attempt.submit(supabase, payload, user?.id, body => untypedRpc(OFFPLAN_CONSULTATION_RPC, { payload: body }));
      const data = { id: receipt.id };
      const sendFromBrowser = receipt.shouldDispatch && input.entry_point !== OFFPLAN_BUYER_ENTRY;

      // Trigger WhatsApp notification for specific verticals. Non-blocking, but a
      // silent failure means Pavel never hears about a new lead — log it (with the
      // lead id) so the failure is detectable instead of vanishing.
      if (sendFromBrowser && WHATSAPP_NOTIFICATION_VERTICALS.includes(input.vertical_id)) {
        supabase.functions.invoke('notify-lead-whatsapp', {
          body: { leadId: data.id },
        }).catch((e) => logger.error(`[useUniversalLead] notify-lead-whatsapp failed for lead ${data.id}:`, e));
      }

      // Observe a bounded notification attempt after the durable save. Provider acceptance
      // is not delivery; failure must never turn a saved enquiry into an intake error.
      if (sendFromBrowser) {
        const notificationStatus = await observeLeadNotification(() => supabase.functions.invoke('notify-admin-order', {
          body: {
            order_id: data.id,
            order_number: `LEAD-${data.id.slice(0, 8).toUpperCase()}`,
            order_type: input.vertical_id,
            total_amount: input.budget_max || input.budget_min || 0,
            currency: input.currency || 'THB',
            customer_name: input.name,
            customer_email: input.email,
            customer_phone: input.phone,
            notes: [`Lead: ${input.request_type} via ${input.entry_point}`, input.notes].filter(Boolean).join('\n'),
          },
        }));
        if (notificationStatus !== 'accepted') {
          // The receipt remains successful. Do not invite a duplicate enquiry.
          logger.error(`[useUniversalLead] admin notification unconfirmed for lead ${data.id}`);
        }
      }

      // The legacy scorer may send a bulk alert. Do not run any browser
      // follow-up after a scoped receipt; its two channels belong to the outbox.
      if (receipt.shouldDispatch && !(scopedOffplan && input.entry_point === OFFPLAN_BUYER_ENTRY)) {
        supabase.functions.invoke('auto-lead-scoring', {
          body: { leadId: data.id },
        }).catch((e) => logger.error(`[useUniversalLead] auto-lead-scoring failed for lead ${data.id}:`, e));
      }

      return data;

    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      
      toast.success(pickLang(language, { ru: 'Заявка сохранена. Ответ команды ожидается.', en: 'Request saved. A team reply is pending.', th: 'บันทึกคำขอแล้ว ยังรอการตอบกลับจากทีม' }));
    },
    onError: (error) => {
      toast.error(pickLang(language, consultationIntakeErrorCopy(error)));
    },
  });

  return {
    submitLead,
    isSubmitting: submitLead.isPending,
  };
}
