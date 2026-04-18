/**
 * Hook for project_documents — admin & developer document vault.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DocumentCategory =
  | 'land_title'
  | 'permits'
  | 'corporate'
  | 'financial'
  | 'construction'
  | 'marketing'
  | 'floor_plans'
  | 'contracts'
  | 'other';

export type DocumentVisibility = 'public' | 'kyc' | 'buyer_only' | 'admin_only';

export interface ProjectDocument {
  id: string;
  project_id: string;
  category: DocumentCategory;
  title: string;
  description: string | null;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  visibility: DocumentVisibility;
  version: number;
  parent_document_id: string | null;
  is_current: boolean;
  uploaded_by: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label_en: string; label_ru: string }[] = [
  { value: 'land_title', label_en: 'Land Title', label_ru: 'Документы на землю' },
  { value: 'permits', label_en: 'Permits & Approvals', label_ru: 'Разрешения' },
  { value: 'corporate', label_en: 'Corporate', label_ru: 'Корпоративные' },
  { value: 'financial', label_en: 'Financial', label_ru: 'Финансовые' },
  { value: 'construction', label_en: 'Construction', label_ru: 'Строительство' },
  { value: 'floor_plans', label_en: 'Floor Plans', label_ru: 'Планировки' },
  { value: 'contracts', label_en: 'Contracts', label_ru: 'Договоры' },
  { value: 'marketing', label_en: 'Marketing', label_ru: 'Маркетинг' },
  { value: 'other', label_en: 'Other', label_ru: 'Прочее' },
];

export function useProjectDocuments(projectId?: string, opts?: { onlyCurrent?: boolean }) {
  return useQuery({
    queryKey: ['project-documents', projectId, opts?.onlyCurrent ?? true],
    queryFn: async (): Promise<ProjectDocument[]> => {
      if (!projectId) return [];
      let q = supabase
        .from('project_documents' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true })
        .order('uploaded_at', { ascending: false });
      if (opts?.onlyCurrent !== false) q = q.eq('is_current', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as ProjectDocument[];
    },
    enabled: !!projectId,
  });
}

export function useUploadProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      category: DocumentCategory;
      title: string;
      description?: string;
      visibility?: DocumentVisibility;
      file: File;
      replacesDocumentId?: string;
    }) => {
      const { projectId, category, title, description, visibility, file, replacesDocumentId } = input;
      const ext = file.name.split('.').pop() || 'bin';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${projectId}/${category}/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('project-documents')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const fileUrl = signed?.signedUrl || path;

      // Determine version
      let version = 1;
      if (replacesDocumentId) {
        const { data: prev } = await supabase
          .from('project_documents' as any)
          .select('version')
          .eq('id', replacesDocumentId)
          .maybeSingle();
        version = ((prev as any)?.version || 1) + 1;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error: insErr } = await supabase.from('project_documents' as any).insert({
        project_id: projectId,
        category,
        title,
        description: description || null,
        file_url: fileUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        visibility: visibility || 'kyc',
        version,
        parent_document_id: replacesDocumentId || null,
        uploaded_by: user?.id || null,
      });
      if (insErr) throw insErr;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Документ загружен');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка загрузки'),
  });
}

export function useUpdateProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; projectId: string; updates: Partial<Pick<ProjectDocument, 'title' | 'description' | 'visibility' | 'category'>> }) => {
      const { error } = await supabase
        .from('project_documents' as any)
        .update(input.updates)
        .eq('id', input.id);
      if (error) throw error;
      return input.projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Обновлено');
    },
    onError: () => toast.error('Не удалось обновить'),
  });
}

export function useDeleteProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_documents' as any)
        .delete()
        .eq('id', input.id);
      if (error) throw error;
      return input.projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Удалён');
    },
    onError: () => toast.error('Не удалось удалить'),
  });
}
