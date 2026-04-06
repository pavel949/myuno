/**
 * Lead to Deal conversion
 * Converts consultation_requests or mcc_leads into agent_deals with crm_contacts.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { fireCrmWorkflowTrigger } from '@/lib/crmWorkflowTrigger';
import { CHECKLIST_TEMPLATES } from '@/hooks/useDealChecklist';
import { toast } from 'sonner';

export type LeadSource = 'consultation_requests' | 'mcc_leads';

export interface ConvertLeadToDealResult {
  dealId: string;
  contactId: string;
  wasContactCreated: boolean;
}

function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '').replace(/^0/, '');
}

function mapRequestTypeToDealType(requestType: string): 'sale' | 'rent' | 'investment' | 'management' {
  const m: Record<string, 'sale' | 'rent' | 'investment' | 'management'> = {
    vacation_rental: 'rent',
    property_consultation: 'sale',
    property_tour: 'sale',
    investment_advice: 'investment',
    full_management: 'management',
    channel_management: 'management',
    long_term_rental: 'rent',
    property_purchase: 'sale',
  };
  return m[requestType] || 'sale';
}

function mapLeadSourceToClientSource(leadSource: string | null, entryPoint: string | null): string {
  if (leadSource === 'whatsapp_incoming') return 'whatsapp';
  if (leadSource === 'telegram') return 'telegram';
  if (entryPoint?.includes('whatsapp')) return 'whatsapp';
  if (entryPoint?.includes('telegram')) return 'telegram';
  if (leadSource === 'fab' || leadSource === 'cta' || leadSource === 'chat') return 'website';
  if (leadSource === 'external') return 'other';
  return leadSource || 'website';
}

export function useConvertLeadToDeal() {
  const { user } = useAuth();
  const { data: membership } = useMyCompanyId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      source,
    }: {
      leadId: string;
      source: LeadSource;
    }): Promise<ConvertLeadToDealResult> => {
      if (!user || !membership?.company_id) {
        throw new Error('User must be logged in and belong to a management company');
      }

      const companyId = membership.company_id;
      const agentId = user.id;

      let name = '';
      let phone: string | null = null;
      let email: string | null = null;
      let leadSource: string | null = null;
      let entryPoint: string | null = null;
      let requestType = '';
      let budgetMin: number | null = null;
      let budgetMax: number | null = null;
      let currency = 'THB';
      let districts: string[] | null = null;
      let propertyTypes: string[] | null = null;
      let bedroomsMin: number | null = null;
      let notes: string | null = null;

      if (source === 'consultation_requests') {
        const { data: lead, error } = await supabase
          .from('consultation_requests')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();
        if (error) throw error;
        if (!lead) throw new Error('Lead not found');
        if ((lead as { status?: string }).status === 'converted') {
          throw new Error('Lead already converted');
        }
        const r = lead as {
          name: string;
          phone: string;
          email: string | null;
          lead_source: string | null;
          entry_point: string | null;
          request_type: string;
          budget_min: number | null;
          budget_max: number | null;
          currency: string | null;
          districts: string[] | null;
          property_types: string[] | null;
          bedrooms_min: number | null;
          notes: string | null;
        };
        name = r.name;
        phone = r.phone;
        email = r.email;
        leadSource = r.lead_source;
        entryPoint = r.entry_point;
        requestType = r.request_type;
        budgetMin = r.budget_min;
        budgetMax = r.budget_max;
        currency = r.currency || 'THB';
        districts = r.districts;
        propertyTypes = r.property_types;
        bedroomsMin = r.bedrooms_min;
        notes = r.notes;
      } else {
        const { data: lead, error } = await supabase
          .from('mcc_leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();
        if (error) throw error;
        if (!lead) throw new Error('Lead not found');
        if ((lead as { status?: string }).status === 'converted') {
          throw new Error('Lead already converted');
        }
        const r = lead as {
          name: string | null;
          phone: string | null;
          email: string | null;
          source: string;
          content: string | null;
        };
        name = r.name || r.email || r.phone || 'Unknown';
        phone = r.phone;
        email = r.email;
        leadSource = r.source;
        notes = r.content;
      }

      if (!phone && !email) {
        throw new Error('Lead must have phone or email');
      }

      const phoneNorm = normalizePhone(phone);
      const clientSource = mapLeadSourceToClientSource(leadSource, entryPoint);

      // 2. Check if crm_contact exists with same phone/email (use normalized phone for matching)
      let contactId: string | null = null;
      if (phoneNorm || email) {
        const orParts: string[] = [];
        if (phoneNorm) {
          // Match both raw and normalized phone across all phone fields
          orParts.push(`phone.eq.${phoneNorm}`, `mobile.eq.${phoneNorm}`, `whatsapp.eq.${phoneNorm}`);
          if (phone && phone !== phoneNorm) {
            orParts.push(`phone.eq.${phone}`, `mobile.eq.${phone}`, `whatsapp.eq.${phone}`);
          }
        }
        if (email) orParts.push(`email.ilike.${email.trim()}`);
        if (orParts.length > 0) {
          const { data: existing } = await supabase
            .from('crm_contacts')
            .select('id')
            .eq('company_id', companyId)
            .or(orParts.join(','))
            .limit(1)
            .maybeSingle();
          contactId = existing?.id ?? null;
        }
      }

      let wasContactCreated = false;
      if (!contactId) {
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] || name;
        const lastName = parts.slice(1).join(' ') || '';
        const { data: newContact, error: contactErr } = await supabase
          .from('crm_contacts')
          .insert({
            company_id: companyId,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            email: email || null,
            source: clientSource,
            created_by: user.id,
            notes: notes,
            preferred_districts: districts,
            preferred_types: propertyTypes,
            bedrooms_min: bedroomsMin,
            budget_min: budgetMin,
            budget_max: budgetMax,
            currency: currency,
          })
          .select('id')
          .single();
        if (contactErr) throw contactErr;
        contactId = newContact.id;
        wasContactCreated = true;
      }

      // 4. Create agent_deal
      const dealType = mapRequestTypeToDealType(requestType);
      const { data: deal, error: dealErr } = await supabase
        .from('agent_deals')
        .insert({
          company_id: companyId,
          agent_id: agentId,
          contact_id: contactId,
          client_name: name,
          client_phone: phone,
          client_email: email,
          client_source: clientSource,
          stage: 'new',
          deal_type: dealType,
          deal_status: 'active',
          budget_min: budgetMin,
          budget_max: budgetMax,
          currency: currency,
          preferred_districts: districts,
          preferred_types: propertyTypes,
          bedrooms_min: bedroomsMin,
          notes: notes,
          priority: 1,
          is_vip: false,
          tags: [],
        })
        .select('id')
        .single();
      if (dealErr) throw dealErr;
      const dealId = deal.id;

      // 5. Mark original lead as converted
      const now = new Date().toISOString();
      if (source === 'consultation_requests') {
        const { error: updateErr } = await supabase
          .from('consultation_requests')
          .update({
            status: 'converted',
            converted_at: now,
            converted_deal_id: dealId,
          })
          .eq('id', leadId);
        if (updateErr) throw updateErr;
      } else {
        const { error: updateErr } = await supabase
          .from('mcc_leads')
          .update({
            status: 'converted',
            converted_at: now,
            converted_to: dealId,
          })
          .eq('id', leadId);
        if (updateErr) throw updateErr;
      }

      // 6. Log to crm_activities (non-blocking — don't fail the conversion)
      try {
        let loggedBy = user.id;
        const { data: admin } = await supabase
          .from('management_company_members')
          .select('user_id')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .in('role', ['director', 'manager', 'admin'])
          .limit(1)
          .maybeSingle();
        if (admin?.user_id) loggedBy = admin.user_id;

        const { error: actErr } = await supabase.from('crm_activities').insert({
          company_id: companyId,
          contact_id: contactId,
          deal_id: dealId,
          activity_type: 'lead_converted',
          subject: `Lead converted to deal (${source})`,
          description: `Lead ${leadId} from ${source} converted to deal ${dealId}`,
          logged_by: loggedBy,
        });
        if (actErr) console.error('Activity logging failed:', actErr.message);
      } catch (e) {
        console.error('Activity logging failed:', e);
      }

      // 7. Auto-create closing checklist (non-blocking)
      try {
        const template = CHECKLIST_TEMPLATES[dealType] || CHECKLIST_TEMPLATES.sale;
        const checklistItems = template.map((item) => ({
          deal_id: dealId,
          company_id: companyId,
          title: item.title_en,
          task_type: 'checklist',
          priority: item.priority,
          status: 'pending',
          created_by: user.id,
        }));
        await supabase.from('crm_tasks').insert(checklistItems as any[]);
      } catch (e) {
        console.error('Checklist creation failed:', e);
      }

      // 8. Fire workflow trigger (non-blocking)
      fireCrmWorkflowTrigger({
        trigger_type: 'deal_created',
        company_id: companyId,
        entity_id: dealId,
        entity_type: 'deal',
        metadata: { deal_type: dealType, source: source, from_lead: leadId },
      });

      return { dealId, contactId, wasContactCreated };
    },
    onSuccess: (_, vars) => {
      toast.success('Lead converted to deal');
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
      qc.invalidateQueries({ queryKey: ['admin-consultations'] });
      qc.invalidateQueries({ queryKey: ['lead-hub'] });
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to convert lead');
    },
  });
}
