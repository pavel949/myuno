import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DocumentType = 
  | 'ownership_title'
  | 'power_of_attorney'
  | 'lease_agreement'
  | 'insurance_policy'
  | 'building_permit'
  | 'condo_rules'
  | 'access_key_card'
  | 'door_code'
  | 'gate_remote'
  | 'safe_code'
  | 'wifi_password'
  | 'utility_contract'
  | 'cam_agreement'
  | 'other';

export interface PropertyDocument {
  id: string;
  property_id: string;
  uploaded_by: string | null;
  document_type: DocumentType;
  title: string;
  title_ru: string | null;
  description: string | null;
  description_ru: string | null;
  file_url: string | null;
  file_name: string | null;
  access_code: string | null;
  access_instructions: string | null;
  access_instructions_ru: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  is_sensitive: boolean;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  property_id: string;
  document_type: DocumentType;
  title: string;
  title_ru?: string;
  description?: string;
  description_ru?: string;
  file_url?: string;
  file_name?: string;
  access_code?: string;
  access_instructions?: string;
  access_instructions_ru?: string;
  issue_date?: string;
  expiry_date?: string;
  is_sensitive?: boolean;
}

export const documentTypeLabels: Record<DocumentType, { en: string; ru: string; icon: string }> = {
  ownership_title: { en: 'Ownership Title', ru: 'Свидетельство о собственности', icon: 'FileText' },
  power_of_attorney: { en: 'Power of Attorney', ru: 'Доверенность', icon: 'UserCheck' },
  lease_agreement: { en: 'Lease Agreement', ru: 'Договор аренды', icon: 'FileSignature' },
  insurance_policy: { en: 'Insurance Policy', ru: 'Страховой полис', icon: 'Shield' },
  building_permit: { en: 'Building Permit', ru: 'Разрешение на строительство', icon: 'Building' },
  condo_rules: { en: 'Condo Rules', ru: 'Правила кондо', icon: 'BookOpen' },
  access_key_card: { en: 'Access Key Card', ru: 'Ключ-карта', icon: 'CreditCard' },
  door_code: { en: 'Door Code', ru: 'Код двери', icon: 'KeyRound' },
  gate_remote: { en: 'Gate Remote', ru: 'Пульт ворот', icon: 'Radio' },
  safe_code: { en: 'Safe Code', ru: 'Код сейфа', icon: 'Lock' },
  wifi_password: { en: 'WiFi Password', ru: 'Пароль WiFi', icon: 'Wifi' },
  utility_contract: { en: 'Utility Contract', ru: 'Договор на коммуналку', icon: 'Zap' },
  cam_agreement: { en: 'CAM Agreement', ru: 'Договор CAM', icon: 'Building2' },
  other: { en: 'Other', ru: 'Прочее', icon: 'File' },
};

export function usePropertyDocuments(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['property-documents', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('document_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PropertyDocument[];
    },
    enabled: !!propertyId && !!user,
  });

  const createDocument = useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      const { data, error } = await supabase
        .from('property_documents')
        .insert({
          ...input,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from('property_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
    },
  });

  // Group documents by type for easier display
  const documentsByType = documents?.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<DocumentType, PropertyDocument[]>);

  // Access codes (quick access)
  const accessCodes = documents?.filter(d => 
    ['door_code', 'safe_code', 'wifi_password', 'access_key_card', 'gate_remote'].includes(d.document_type)
  );

  // Legal documents
  const legalDocuments = documents?.filter(d =>
    ['ownership_title', 'power_of_attorney', 'lease_agreement', 'insurance_policy', 'cam_agreement'].includes(d.document_type)
  );

  return {
    documents,
    documentsByType,
    accessCodes,
    legalDocuments,
    isLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    isCreating: createDocument.isPending,
    isUpdating: updateDocument.isPending,
    isDeleting: deleteDocument.isPending,
  };
}
