/**
 * @module useCrmDocuments
 * @description CRUD hook for CRM documents (contacts, properties, deals)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CrmDocument {
  id: string;
  company_id: string;
  contact_id: string | null;
  property_id: string | null;
  deal_id: string | null;
  uploaded_by: string;
  document_type: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  expires_at: string | null;
  is_archived: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<string, { en: string; ru: string; icon: string }> = {
  passport: { en: 'Passport', ru: 'Паспорт', icon: '🪪' },
  id_card: { en: 'ID Card', ru: 'Удостоверение', icon: '🆔' },
  visa: { en: 'Visa', ru: 'Виза', icon: '✈️' },
  rental_contract: { en: 'Rental Contract', ru: 'Договор аренды', icon: '📋' },
  sale_contract: { en: 'Sale Contract', ru: 'Договор купли-продажи', icon: '📋' },
  agency_contract: { en: 'Agency Contract', ru: 'Агентский договор', icon: '📋' },
  power_of_attorney: { en: 'Power of Attorney', ru: 'Доверенность', icon: '📜' },
  invoice: { en: 'Invoice', ru: 'Счёт', icon: '🧾' },
  receipt: { en: 'Receipt', ru: 'Квитанция', icon: '🧾' },
  act: { en: 'Act', ru: 'Акт', icon: '📄' },
  payment_confirmation: { en: 'Payment Confirmation', ru: 'Подтверждение оплаты', icon: '✅' },
  correspondence: { en: 'Correspondence', ru: 'Переписка', icon: '💬' },
  photo: { en: 'Photo', ru: 'Фото', icon: '📷' },
  screenshot: { en: 'Screenshot', ru: 'Скриншот', icon: '🖼️' },
  other: { en: 'Other', ru: 'Другое', icon: '📎' },
};

interface FetchParams {
  contactId?: string;
  propertyId?: string;
  dealId?: string;
}

export function useCrmDocuments(companyId: string | undefined, params: FetchParams = {}) {
  return useQuery({
    queryKey: ['crm-documents', companyId, params],
    queryFn: async (): Promise<CrmDocument[]> => {
      if (!companyId) return [];
      let query = supabase
        .from('crm_documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (params.contactId) query = query.eq('contact_id', params.contactId);
      if (params.propertyId) query = query.eq('property_id', params.propertyId);
      if (params.dealId) query = query.eq('deal_id', params.dealId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CrmDocument[];
    },
    enabled: !!companyId,
  });
}

export function useUploadCrmDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      file: File;
      companyId: string;
      documentType: string;
      title: string;
      description?: string;
      contactId?: string;
      propertyId?: string;
      dealId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const ext = args.file.name.split('.').pop() || 'bin';
      const path = `${args.companyId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('crm-documents')
        .upload(path, args.file, { contentType: args.file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('crm-documents')
        .getPublicUrl(path);

      // For private buckets we use signed URLs, but store the path
      const fileUrl = path;

      const insertData = {
        company_id: args.companyId,
        uploaded_by: user.id,
        document_type: args.documentType as any,
        title: args.title,
        description: args.description || null,
        file_url: fileUrl,
        file_name: args.file.name,
        file_size: args.file.size,
        mime_type: args.file.type,
        contact_id: args.contactId || null,
        property_id: args.propertyId || null,
        deal_id: args.dealId || null,
      };

      const { data, error } = await supabase
        .from('crm_documents')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-documents'] });
      toast.success('Документ загружен');
    },
    onError: (e: Error) => {
      toast.error('Ошибка загрузки: ' + e.message);
    },
  });
}

export function useDeleteCrmDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: { id: string; file_url: string }) => {
      // Delete file from storage
      await supabase.storage.from('crm-documents').remove([doc.file_url]);
      
      const { error } = await supabase
        .from('crm_documents')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-documents'] });
      toast.success('Документ удалён');
    },
  });
}

/** Get a signed URL for downloading a private document */
export async function getDocumentUrl(fileUrl: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('crm-documents')
    .createSignedUrl(fileUrl, 3600); // 1 hour
  if (error) throw error;
  return data.signedUrl;
}
