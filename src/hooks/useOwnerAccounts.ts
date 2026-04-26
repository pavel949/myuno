/**
 * @module useOwnerAccounts
 * Hook for Owner Account Management — aggregates CRM contacts (type='owner')
 * with properties, bookings, financials, terms, and documents.
 * 
 * CRITICAL: All queries are scoped by management_company_id to prevent cross-MC data leaks.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { differenceInDays, parseISO } from 'date-fns';

export interface OwnerAccount {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  birthday: string | null;
  nationality: string | null;
  notes: string | null;
  special_notes: string | null;
  family_info: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  avatar_url: string | null;
  tags: string[] | null;
  created_at: string;
  linked_user_id: string | null;
  properties_count: number;
  properties: OwnerProperty[];
  total_revenue: number;
  total_commission: number;
  avg_occupancy: number;
  documents_count: number;
  has_contract: boolean;
  has_passport: boolean;
  has_power_of_attorney: boolean;
}

export interface OwnerProperty {
  id: string;
  name: string;
  type: string | null;
  district: string | null;
  bedrooms: number | null;
  commission_rate: number | null;
  commission_type: string | null;
  status: string | null;
}

export function useOwnerAccounts() {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['owner-accounts', companyId],
    queryFn: async (): Promise<OwnerAccount[]> => {
      if (!companyId) return [];

      // 1. Fetch owner contacts scoped to this MC
      const { data: contacts, error: cErr } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId)
        .eq('contact_type', 'owner')
        .eq('is_archived', false)
        .order('first_name');

      if (cErr) throw cErr;
      if (!contacts?.length) return [];

      const contactIds = contacts.map(c => c.id);

      // 2. Fetch properties linked to these contacts AND managed by this MC
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, property_type, district, bedrooms, owner_contact_id, is_active')
        .in('owner_contact_id', contactIds)
        .eq('management_company_id', companyId);

      const propertyIds = (properties || []).map(p => p.id);

      // 3. Fetch management terms, documents, and financials in parallel
      const [termsRes, docsRes, financialsRes, bookingsRes] = await Promise.all([
        propertyIds.length > 0
          ? supabase.from('property_management_terms').select('property_id, commission_rate, commission_type, commission_amount').in('property_id', propertyIds)
          : Promise.resolve({ data: [] as { property_id: string; commission_rate: number | null; commission_type: string | null; commission_amount: number | null }[] }),
        supabase.from('crm_documents').select('contact_id, document_type').eq('company_id', companyId).in('contact_id', contactIds),
        propertyIds.length > 0
          ? supabase.from('property_financials').select('property_id, transaction_type, amount').in('property_id', propertyIds)
          : Promise.resolve({ data: [] as { property_id: string; transaction_type: string; amount: number | null }[] }),
        propertyIds.length > 0
          ? supabase.from('property_bookings').select('property_id, check_in, check_out, status').in('property_id', propertyIds).in('status', ['confirmed', 'completed', 'checked_in'])
          : Promise.resolve({ data: [] as { property_id: string; check_in: string | null; check_out: string | null; status: string }[] }),
      ]);

      const terms = termsRes.data || [];
      const docs = docsRes.data || [];
      const allFinancials = financialsRes.data || [];
      const allBookings = bookingsRes.data || [];

      type ContactExt = (typeof contacts)[number] & {
        linked_user_id?: string | null;
        special_notes?: string | null;
        emergency_contact_name?: string | null;
        emergency_contact_phone?: string | null;
        emergency_contact_relation?: string | null;
      };

      return contacts.map(rawC => {
        const c = rawC as ContactExt;
        const ownerProps = (properties || []).filter(p => p.owner_contact_id === c.id);
        const ownerPropIds = ownerProps.map(p => p.id);
        const ownerDocs = docs.filter(d => d.contact_id === c.id);
        const docTypes = ownerDocs.map(d => d.document_type);

        // Financial aggregation
        const ownerFinancials = allFinancials.filter((f) => ownerPropIds.includes(f.property_id));
        const totalRevenue = ownerFinancials
          .filter((f) => f.transaction_type === 'income')
          .reduce((s: number, f) => s + (f.amount || 0), 0);
        const totalExpenses = ownerFinancials
          .filter((f) => f.transaction_type === 'expense')
          .reduce((s: number, f) => s + (f.amount || 0), 0);

        // Commission from terms
        const totalCommission = ownerProps.reduce((sum, p) => {
          const t = terms.find((tm) => tm.property_id === p.id);
          if (!t?.commission_rate) return sum;
          // Rough estimate: commission_rate% of revenue for this property
          const propRevenue = allFinancials
            .filter((f) => f.property_id === p.id && f.transaction_type === 'income')
            .reduce((s: number, f) => s + (f.amount || 0), 0);
          return sum + (propRevenue * (t.commission_rate / 100));
        }, 0);

        // Occupancy calculation (last 90 days)
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const ownerBookings = allBookings.filter((b) => ownerPropIds.includes(b.property_id));
        let totalBookedNights = 0;
        ownerBookings.forEach((b) => {
          if (!b.check_in || !b.check_out) return;
          const ci = parseISO(b.check_in);
          const co = parseISO(b.check_out);
          const start = ci > ninetyDaysAgo ? ci : ninetyDaysAgo;
          const end = co < now ? co : now;
          const nights = Math.max(0, differenceInDays(end, start));
          totalBookedNights += nights;
        });
        const totalAvailableNights = ownerProps.length * 90;
        const avgOccupancy = totalAvailableNights > 0
          ? Math.round((totalBookedNights / totalAvailableNights) * 100)
          : 0;

        const propsWithTerms: OwnerProperty[] = ownerProps.map(p => {
          const t = terms.find((tm) => tm.property_id === p.id);
          return {
            id: p.id,
            name: p.title_en || p.title_ru || 'Unnamed',
            type: p.property_type,
            district: p.district,
            bedrooms: p.bedrooms,
            commission_rate: t?.commission_rate ?? null,
            commission_type: t?.commission_type ?? null,
            status: p.is_active ? 'active' : 'inactive',
          };
        });

        return {
          id: c.id,
          linked_user_id: c.linked_user_id ?? null,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          whatsapp: c.whatsapp,
          telegram: c.telegram,
          birthday: c.birthday,
          nationality: c.nationality,
          notes: c.notes,
          special_notes: c.special_notes ?? null,
          family_info: c.family_info,
          emergency_contact_name: c.emergency_contact_name ?? null,
          emergency_contact_phone: c.emergency_contact_phone ?? null,
          emergency_contact_relation: c.emergency_contact_relation ?? null,
          avatar_url: c.avatar_url,
          tags: c.tags,
          created_at: c.created_at,
          properties_count: ownerProps.length,
          properties: propsWithTerms,
          total_revenue: totalRevenue,
          total_commission: Math.round(totalCommission),
          avg_occupancy: avgOccupancy,
          documents_count: ownerDocs.length,
          has_contract: docTypes.includes('rental_contract') || docTypes.includes('agency_contract'),
          has_passport: docTypes.includes('passport'),
          has_power_of_attorney: docTypes.includes('power_of_attorney'),
        };
      });
    },
    enabled: !!companyId,
  });
}

/** Fetch detailed financial data for a single owner's properties — scoped by MC */
export function useOwnerAccountDetail(contactId: string | null) {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['owner-account-detail', contactId, companyId],
    queryFn: async () => {
      if (!contactId || !companyId) return null;

      // Properties scoped by both owner contact AND management company
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, property_type, district, bedrooms')
        .eq('owner_contact_id', contactId)
        .eq('management_company_id', companyId);

      if (!properties?.length) return { properties: [], financials: [], bookings: [], reports: [], documents: [], tasks: [] };

      const propIds = properties.map(p => p.id);

      const [financials, bookings, reports, documents, tasks] = await Promise.all([
        supabase.from('property_financials').select('*').in('property_id', propIds).order('date', { ascending: false }).limit(100),
        supabase.from('property_bookings').select('id, property_id, check_in, check_out, total_amount, currency, status, guest_name').in('property_id', propIds).order('check_in', { ascending: false }).limit(50),
        supabase.from('property_reports').select('*').in('property_id', propIds).order('created_at', { ascending: false }).limit(20),
        supabase.from('crm_documents').select('*').eq('company_id', companyId).eq('contact_id', contactId).eq('is_archived', false).order('created_at', { ascending: false }),
        supabase.from('crm_tasks').select('*').eq('company_id', companyId).eq('contact_id', contactId).order('due_date', { ascending: false }).limit(30),
      ]);

      return {
        properties: properties || [],
        financials: financials.data || [],
        bookings: bookings.data || [],
        reports: reports.data || [],
        documents: documents.data || [],
        tasks: tasks.data || [],
      };
    },
    enabled: !!contactId && !!companyId,
  });
}
