/** Read-only operator history. Legacy Drive processing must not be started from this client. */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export const DRIVE_RECEIPT_COLUMNS =
  'id, created_at, status, review_status, files_processed, files_total, files_failed, files_skipped' as const;

export type DriveReceipt = Pick<Tables<'drive_import_jobs'>,
  'id' | 'created_at' | 'status' | 'review_status' |
  'files_processed' | 'files_total' | 'files_failed' | 'files_skipped'>;

export function useDriveReceipts(projectId: string) {
  const actorId = useAuth().user?.id;
  return useQuery({
    queryKey: ['drive-import-receipts', actorId, projectId],
    queryFn: async (): Promise<DriveReceipt[]> => {
      const { data, error } = await supabase
        .from('drive_import_jobs')
        .select(DRIVE_RECEIPT_COLUMNS)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId && !!actorId,
  });
}

export function useConfiguredDriveWatch(projectId: string) {
  const actorId = useAuth().user?.id;
  return useQuery({
    queryKey: ['drive-import-watch-configured', actorId, projectId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('project_drive_sources')
        .select('watch_enabled')
        .eq('project_id', projectId)
        .eq('watch_enabled', true)
        .limit(1);
      if (error) throw error;
      return data?.some(row => row.watch_enabled === true) ?? false;
    },
    enabled: !!projectId && !!actorId,
  });
}
