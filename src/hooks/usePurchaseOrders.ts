/**
 * Procurement — purchase orders, line items, goods receipts (3-way match).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type POStatus =
  | 'draft' | 'sent' | 'partially_received' | 'received' | 'invoiced' | 'closed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  company_id: string;
  po_number: string;
  vendor_contact_id: string | null;
  vendor_name: string | null;
  property_id: string | null;
  status: POStatus;
  expected_date: string | null;
  received_date: string | null;
  invoice_id: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  received_quantity: number;
  sort_order: number;
}

export interface GoodsReceipt {
  id: string;
  po_id: string;
  company_id: string;
  received_at: string;
  received_by: string | null;
  receipt_number: string | null;
  items: any[];
  photos: string[];
  notes: string | null;
}

export function usePurchaseOrders(filter?: { status?: POStatus }) {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['purchase-orders', activeCompany?.company_id, filter?.status],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      if (!activeCompany) return [];
      let q = (supabase as any)
        .from('purchase_orders')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('created_at', { ascending: false });
      if (filter?.status) q = q.eq('status', filter.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PurchaseOrder[];
    },
    enabled: !!activeCompany,
  });
}

export function usePurchaseOrderDetail(poId: string | undefined) {
  return useQuery({
    queryKey: ['po-detail', poId],
    queryFn: async () => {
      if (!poId) return null;
      const [poRes, itemsRes, receiptsRes] = await Promise.all([
        (supabase as any).from('purchase_orders').select('*').eq('id', poId).maybeSingle(),
        (supabase as any).from('purchase_order_items').select('*').eq('po_id', poId).order('sort_order'),
        (supabase as any).from('goods_receipts').select('*').eq('po_id', poId).order('received_at', { ascending: false }),
      ]);
      if (poRes.error) throw poRes.error;
      return {
        po: poRes.data as PurchaseOrder,
        items: (itemsRes.data || []) as PurchaseOrderItem[],
        receipts: (receiptsRes.data || []) as GoodsReceipt[],
      };
    },
    enabled: !!poId,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: {
      vendor_name: string;
      property_id?: string;
      expected_date?: string;
      currency?: string;
      notes?: string;
      items: { description: string; quantity: number; unit_price: number }[];
    }) => {
      if (!activeCompany || !user) throw new Error('Missing context');
      const subtotal = args.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const po_number = `PO-${Date.now().toString().slice(-8)}`;
      const { data: po, error } = await (supabase as any)
        .from('purchase_orders')
        .insert({
          company_id: activeCompany.company_id,
          po_number,
          vendor_name: args.vendor_name,
          property_id: args.property_id ?? null,
          expected_date: args.expected_date ?? null,
          currency: args.currency ?? 'THB',
          notes: args.notes ?? null,
          subtotal,
          total_amount: subtotal,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      if (args.items.length) {
        const itemsRows = args.items.map((it, i) => ({
          po_id: po.id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          sort_order: i,
        }));
        const { error: iErr } = await (supabase as any).from('purchase_order_items').insert(itemsRows);
        if (iErr) throw iErr;
      }
      return po;
    },
    onSuccess: () => {
      toast.success('Purchase order created');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; status: POStatus }) => {
      const { error } = await (supabase as any)
        .from('purchase_orders')
        .update({ status: args.status })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['po-detail'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}

export function useReceiveGoods() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: {
      po_id: string;
      items: { item_id: string; received_quantity: number }[];
      receipt_number?: string;
      notes?: string;
      photos?: string[];
    }) => {
      if (!activeCompany || !user) throw new Error('Missing context');
      const { error } = await (supabase as any).from('goods_receipts').insert({
        po_id: args.po_id,
        company_id: activeCompany.company_id,
        received_by: user.id,
        receipt_number: args.receipt_number ?? null,
        items: args.items,
        photos: args.photos ?? [],
        notes: args.notes ?? null,
      });
      if (error) throw error;
      // Update each item's received_quantity (incremental)
      for (const it of args.items) {
        const { data: cur } = await (supabase as any)
          .from('purchase_order_items')
          .select('received_quantity, quantity')
          .eq('id', it.item_id)
          .single();
        if (cur) {
          await (supabase as any)
            .from('purchase_order_items')
            .update({ received_quantity: (cur.received_quantity || 0) + it.received_quantity })
            .eq('id', it.item_id);
        }
      }
      // Recompute PO status
      const { data: items } = await (supabase as any)
        .from('purchase_order_items')
        .select('quantity, received_quantity')
        .eq('po_id', args.po_id);
      if (items) {
        const allReceived = items.every((i: any) => (i.received_quantity || 0) >= i.quantity);
        const someReceived = items.some((i: any) => (i.received_quantity || 0) > 0);
        const status = allReceived ? 'received' : someReceived ? 'partially_received' : 'sent';
        await (supabase as any)
          .from('purchase_orders')
          .update({ status, received_date: allReceived ? new Date().toISOString().slice(0, 10) : null })
          .eq('id', args.po_id);
      }
    },
    onSuccess: () => {
      toast.success('Goods received');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['po-detail'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });
}
