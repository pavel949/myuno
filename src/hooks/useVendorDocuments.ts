import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type VendorDocType = 'contract' | 'license' | 'insurance' | 'invoice' | 'act' | 'photo' | 'id_card' | 'work_permit' | 'other';

export const VENDOR_DOC_TYPES: { value: VendorDocType; en: string; ru: string }[] = [
  { value: 'contract', en: 'Contract', ru: 'Договор' },
  { value: 'license', en: 'License', ru: 'Лицензия' },
  { value: 'insurance', en: 'Insurance', ru: 'Страховка' },
  { value: 'invoice', en: 'Invoice', ru: 'Счёт' },
  { value: 'act', en: 'Completion Act', ru: 'Акт выполненных работ' },
  { value: 'photo', en: 'Photo', ru: 'Фото' },
  { value: 'id_card', en: 'ID Card', ru: 'Удостоверение' },
  { value: 'work_permit', en: 'Work Permit', ru: 'Разрешение на работу' },
  { value: 'other', en: 'Other', ru: 'Другое' },
];

export interface VendorDocument {
  id: string;
  vendor_id?: string;
  staff_id?: string;
  owner_id: string;
  doc_type: string;
  title: string | null;
  file_url: string | null;
  file_name: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export function useVendorDocuments(vendorId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['vendor-documents', vendorId];

  const { data: documents, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VendorDocument[];
    },
    enabled: !!vendorId && !!user,
  });

  const addDocument = useMutation({
    mutationFn: async (input: { vendor_id: string; doc_type: string; title?: string | null; file_url?: string | null; file_name?: string | null; expiry_date?: string | null; notes?: string | null }) => {
      const { error } = await supabase
        .from('vendor_documents')
        .insert({ vendor_id: input.vendor_id, doc_type: input.doc_type, title: input.title, file_url: input.file_url, file_name: input.file_name, expiry_date: input.expiry_date, notes: input.notes, owner_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendor_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { documents, isLoading, addDocument, deleteDocument };
}

// Reuse the same pattern for staff documents
export function useStaffDocuments(staffId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['staff-documents', staffId];

  const { data: documents, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', staffId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VendorDocument[];
    },
    enabled: !!staffId && !!user,
  });

  const addDocument = useMutation({
    mutationFn: async (input: { staff_id: string; doc_type: string; title?: string; file_url?: string; file_name?: string; expiry_date?: string; notes?: string }) => {
      const { error } = await supabase
        .from('staff_documents')
        .insert({ ...input, owner_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { documents, isLoading, addDocument, deleteDocument };
}
