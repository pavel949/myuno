/**
 * Hook для управления импортом из Google Drive.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  ai_extracted_units: any[] | null;
  ai_project_patch: Record<string, any> | null;
  review_status: 'pending' | 'approved' | 'partially_applied' | 'discarded';
  reviewed_at: string | null;
  error_log: any;
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
