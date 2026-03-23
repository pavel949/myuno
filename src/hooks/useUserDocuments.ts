import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DocumentType = 'passport' | 'driver_license' | 'insurance' | 'visa' | 'other';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  document_number: string | null;
  country: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  document_type: DocumentType;
  document_number?: string;
  country?: string;
  issue_date?: string;
  expiry_date?: string;
  file_url?: string;
  file_name?: string;
  notes?: string;
}

export function useUserDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['user-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserDocument[];
    },
    enabled: !!user?.id,
  });

  const uploadFile = async (file: File, documentType: DocumentType): Promise<string> => {
    if (!user?.id) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('user-documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const createDocument = useMutation({
    mutationFn: async (data: CreateDocumentData & { file?: File }) => {
      if (!user?.id) throw new Error('Not authenticated');

      let file_url = data.file_url;
      let file_name = data.file_name;

      // Upload file if provided
      if (data.file) {
        file_url = await uploadFile(data.file, data.document_type);
        file_name = data.file.name;
      }

      const { data: doc, error } = await supabase
        .from('user_documents')
        .upsert({
          user_id: user.id,
          document_type: data.document_type,
          document_number: data.document_number,
          country: data.country,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          file_url,
          file_name,
          notes: data.notes,
        }, { onConflict: 'user_id,document_type' })
        .select()
        .single();

      if (error) throw error;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', user?.id] });
      toast.success('Документ сохранён');
    },
    onError: (error) => {
      logger.error('Document save error:', error);
      toast.error('Ошибка сохранения документа');
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', user?.id] });
      toast.success('Документ удалён');
    },
    onError: (error) => {
      logger.error('Document delete error:', error);
      toast.error('Ошибка удаления');
    },
  });

  const getDocument = (type: DocumentType) => {
    return documents?.find(d => d.document_type === type);
  };

  return {
    documents,
    isLoading,
    error,
    createDocument,
    deleteDocument,
    getDocument,
    uploadFile,
  };
}
