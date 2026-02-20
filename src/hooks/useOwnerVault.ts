import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VaultFile {
  id: string;
  owner_id: string;
  property_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  doc_type: string;
  description: string | null;
  tags: string[] | null;
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DOC_TYPES = [
  { value: 'contract', labelEn: 'Contracts & Agreements', labelRu: 'Договоры и акты' },
  { value: 'dbd', labelEn: 'Due Diligence', labelRu: 'Due Diligence' },
  { value: 'presentation', labelEn: 'Presentations', labelRu: 'Презентации' },
  { value: 'photo', labelEn: 'Photos & Media', labelRu: 'Фото и медиа' },
  { value: 'floor_plan', labelEn: 'Floor Plans', labelRu: 'Планировки' },
  { value: 'financial', labelEn: 'Financial Documents', labelRu: 'Финансовые документы' },
  { value: 'legal', labelEn: 'Legal / Chanote', labelRu: 'Юридические / Чаноте' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
] as const;

export function useVaultFiles(propertyId?: string | null, docType?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vault-files', user?.id, propertyId, docType],
    queryFn: async () => {
      let q = supabase
        .from('owner_vault_files')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (propertyId) q = q.eq('property_id', propertyId);
      if (docType && docType !== 'all') q = q.eq('doc_type', docType);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as VaultFile[];
    },
    enabled: !!user,
  });
}

export function useUploadVaultFile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      propertyId,
      docType,
      description,
    }: {
      file: File;
      propertyId?: string;
      docType: string;
      description?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('owner-vault')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('owner_vault_files')
        .insert({
          owner_id: user.id,
          property_id: propertyId || null,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
          doc_type: docType,
          description: description || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-files'] });
    },
  });
}

export function useDeleteVaultFile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: VaultFile) => {
      await supabase.storage.from('owner-vault').remove([file.file_path]);
      const { error } = await supabase.from('owner_vault_files').delete().eq('id', file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-files'] });
    },
  });
}

export function useShareVaultFile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, expiresInDays = 7 }: { fileId: string; expiresInDays?: number }) => {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { error } = await supabase
        .from('owner_vault_files')
        .update({ share_token: token, share_expires_at: expiresAt.toISOString() } as any)
        .eq('id', fileId);
      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault-files'] });
    },
  });
}

export function useGetSignedUrl() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('owner-vault')
        .createSignedUrl(filePath, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
