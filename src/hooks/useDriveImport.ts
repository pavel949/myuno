/**
 * Hook для управления импортом из Google Drive.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { PriceListItem } from '@/lib/offplan/priceListVersions';

export type PriceListVersion = Database['public']['Tables']['project_price_list_versions']['Row'];
export type ProjectFactAssertion = Database['public']['Tables']['project_fact_assertions']['Row'];

export interface DriveSource {
  id: string;
  project_id: string;
  drive_url: string;
  folder_id: string;
  access_mode: 'public' | 'connector';
  watch_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  file_count: number;
}

export interface DriveJob {
  id: string;
  source_id: string;
  project_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'partial';
  trigger_mode: 'manual' | 'watch';
  files_total: number;
  files_processed: number;
  files_failed: number;
  files_skipped: number;
  ai_extracted_units: Array<Record<string, unknown>> | null;
  ai_project_patch: Record<string, unknown> | null;
  review_status: 'pending' | 'approved' | 'partially_applied' | 'discarded';
  reviewed_at: string | null;
  error_log: unknown;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useDriveSources(projectId?: string) {
  return useQuery({
    queryKey: ['drive-sources', projectId],
    queryFn: async (): Promise<DriveSource[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_drive_sources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DriveSource[];
    },
    enabled: !!projectId,
  });
}

export function useDriveJobs(projectId?: string, limit = 10) {
  const qc = useQueryClient();

  // Realtime: обновляем jobs при изменениях
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`drive-jobs-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drive_import_jobs',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['drive-jobs', projectId] });
        qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, qc]);

  return useQuery({
    queryKey: ['drive-jobs', projectId, limit],
    queryFn: async (): Promise<DriveJob[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('drive_import_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as DriveJob[];
    },
    enabled: !!projectId,
  });
}

const PRICE_LIST_ITEM_FIELDS = `id, version_id, item_key, source_item_index, unit_id,
  unit_code, unit_type, bedrooms, bathrooms, area_sqm, floor, price, currency,
  view_type, status, needs_review, review_reasons, source_file_id,
  source_file_name, source_file_url, source_modified_at`;

export function usePriceListVersions(projectId?: string) {
  return useQuery({
    queryKey: ['price-list-versions', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<PriceListVersion[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('project_price_list_versions')
        .select('id,project_id,source_id,import_job_id,previous_version_id,version_number,status,content_sha256,parser_version,coverage,rows_total,rows_needing_review,captured_at,reviewed_by,reviewed_at')
        .eq('project_id', projectId).order('captured_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePriceListItems(versionId?: string | null) {
  return useQuery({
    queryKey: ['price-list-items', versionId],
    enabled: Boolean(versionId),
    queryFn: async (): Promise<PriceListItem[]> => {
      if (!versionId) return [];
      const { data, error } = await supabase.from('project_price_list_items')
        .select(PRICE_LIST_ITEM_FIELDS).eq('version_id', versionId).order('source_item_index');
      if (error) throw error;
      return (data ?? []) as PriceListItem[];
    },
  });
}

export function useDriveImportFacts(jobId?: string) {
  return useQuery({
    queryKey: ['project-fact-assertions', 'job', jobId],
    enabled: Boolean(jobId),
    queryFn: async (): Promise<ProjectFactAssertion[]> => {
      if (!jobId) return [];
      const { data, error } = await supabase.from('project_fact_assertions')
        .select('id,project_id,import_job_id,price_list_version_id,unit_id,entity_type,source_item_index,source_unit_key,field_key,value_jsonb,source_value_jsonb,extraction_method,source_file_id,source_file_name,source_file_url,source_modified_at,source_files,review_status,reviewed_by,reviewed_at,applied_at,created_at')
        .eq('import_job_id', jobId).order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectFactAssertions(projectId?: string) {
  return useQuery({
    queryKey: ['project-fact-assertions', 'project', projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<ProjectFactAssertion[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('project_fact_assertions')
        .select('id,project_id,import_job_id,price_list_version_id,unit_id,entity_type,source_item_index,source_unit_key,field_key,value_jsonb,source_value_jsonb,extraction_method,source_file_id,source_file_name,source_file_url,source_modified_at,source_files,review_status,reviewed_by,reviewed_at,applied_at,created_at')
        .eq('project_id', projectId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStartDriveImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      driveUrl: string;
      accessMode: 'public' | 'connector';
      sourceId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('drive-import-folder', {
        body: {
          projectId: input.projectId,
          driveUrl: input.driveUrl,
          accessMode: input.accessMode,
          sourceId: input.sourceId,
          triggerMode: 'manual',
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { jobId: string; sourceId: string };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['drive-sources', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['drive-jobs', vars.projectId] });
      toast.success('Импорт запущен');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка запуска импорта'),
  });
}

export function useToggleDriveWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sourceId: string; projectId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('project_drive_sources')
        .update({ watch_enabled: input.enabled })
        .eq('id', input.sourceId);
      if (error) throw error;
      return input;
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: ['drive-sources', vars.projectId] });
      toast.success(vars.enabled ? 'Авто-синк включён' : 'Авто-синк выключен');
    },
    onError: () => toast.error('Не удалось обновить'),
  });
}

export function useDeleteDriveSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sourceId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_drive_sources')
        .delete()
        .eq('id', input.sourceId);
      if (error) throw error;
      return input;
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: ['drive-sources', vars.projectId] });
      toast.success('Источник удалён');
    },
  });
}
