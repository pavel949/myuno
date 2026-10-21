import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyCompanyId } from './useAgentDeals';
import { toast } from 'sonner';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface OwnerInvoice {
  id: string;
  company_id: string;
  property_id: string | null;
  invoice_number: string;
  invoice_type: 'tenant_billing' | 'owner_report' | 'service_fee';
  recipient_name: string;
  recipient_email: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useOwnerInvoices(status?: string) {
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  return useQuery({
    queryKey: ['owner-invoices', companyId, status],
    queryFn: async () => {
      let q = supabase
        .from('owner_invoices')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        q = q.eq('status', status as any);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as OwnerInvoice[];
    },
    enabled: !!companyId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: {
      company_id: string;
      property_id?: string;
      invoice_type: string;
      recipient_name: string;
      recipient_email?: string;
      items: InvoiceItem[];
      subtotal: number;
      tax_rate: number;
      tax_amount: number;
      total: number;
      currency: string;
      due_date?: string;
      notes?: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('owner_invoices')
        .insert({
          ...invoice,
          invoice_number: '', // trigger will generate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-invoices'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, paid_date }: { id: string; status: string; paid_date?: string }) => {
      const update: Record<string, string> = { status };
      if (paid_date) update.paid_date = paid_date;
      const { error } = await supabase
        .from('owner_invoices')
        .update(update as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('owner_invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-invoices'] });
    },
  });
}
