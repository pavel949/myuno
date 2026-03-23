/**
 * Partner Report — multi-property P&L for management company.
 * Aggregates gross revenue, MC commission, MC expenses per property.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface PartnerReportRow {
  propertyId: string;
  propertyNameEn: string;
  propertyNameRu: string | null;
  address: string | null;
  ownerName: string;
  feePercent: number;
  grossRevenue: number;
  mgmtCommission: number;
  mgmtExpenses: number;
  mgmtNetProfit: number;
}

export function usePartnerReport(
  propertyIds: string[],
  dateFrom: string,
  dateTo: string
) {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['partner-report', companyId, propertyIds, dateFrom, dateTo],
    queryFn: async (): Promise<PartnerReportRow[]> => {
      if (!companyId || propertyIds.length === 0) return [];

      const [propsRes, financialsRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title_en, title_ru, address, owner_contact_id')
          .in('id', propertyIds)
          .eq('management_company_id', companyId),
        supabase
          .from('property_financials')
          .select('property_id, transaction_type, amount, category')
          .in('property_id', propertyIds)
          .gte('transaction_date', dateFrom)
          .lte('transaction_date', dateTo),
      ]);

      if (propsRes.error) throw propsRes.error;
      if (financialsRes.error) throw financialsRes.error;

      const props = propsRes.data || [];
      const ownerContactIds = [...new Set(props.map((p: any) => p.owner_contact_id).filter(Boolean))];

      let settingsMap = new Map<string, number>();
      let contactsMap = new Map<string, { first_name: string; last_name: string }>();
      if (ownerContactIds.length > 0) {
        const [settingsRes, contactsRes] = await Promise.all([
          supabase
            .from('owner_management_settings')
            .select('contact_id, management_fee_percent')
            .eq('company_id', companyId)
            .in('contact_id', ownerContactIds),
          supabase
            .from('crm_contacts')
            .select('id, first_name, last_name')
            .in('id', ownerContactIds),
        ]);
        if (settingsRes.data) {
          settingsMap = new Map(
            settingsRes.data.map((s: any) => [s.contact_id, Number(s.management_fee_percent ?? 15)])
          );
        }
        if (contactsRes.data) {
          contactsMap = new Map(
            contactsRes.data.map((c: any) => [c.id, { first_name: c.first_name || '', last_name: c.last_name || '' }])
          );
        }
      }

      const financials = financialsRes.data || [];
      const byProperty = new Map<
        string,
        { income: number; commission: number; expenses: number }
      >();

      financials.forEach((f: any) => {
        const pid = f.property_id;
        const rec = byProperty.get(pid) || { income: 0, commission: 0, expenses: 0 };
        const amt = Number(f.amount || 0);
        if (f.transaction_type === 'income') {
          rec.income += amt;
        } else if (f.transaction_type === 'expense') {
          rec.expenses += amt;
          if (f.category === 'management_fee' || f.category === 'commission') {
            rec.commission += amt;
          }
        }
        byProperty.set(pid, rec);
      });

      return props.map((p: any) => {
        const fin = byProperty.get(p.id) || { income: 0, commission: 0, expenses: 0 };
        const contact = p.owner_contact_id ? contactsMap.get(p.owner_contact_id) : null;
        const ownerName = contact
          ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '—'
          : '—';
        const feePercent = p.owner_contact_id
          ? settingsMap.get(p.owner_contact_id) ?? 15
          : 15;

        return {
          propertyId: p.id,
          propertyNameEn: p.title_en || '—',
          propertyNameRu: p.title_ru || null,
          address: p.address,
          ownerName,
          feePercent,
          grossRevenue: fin.income,
          mgmtCommission: fin.commission,
          mgmtExpenses: 0,
          mgmtNetProfit: fin.commission,
        };
      });
    },
    enabled: !!companyId && propertyIds.length > 0 && !!dateFrom && !!dateTo,
  });
}
