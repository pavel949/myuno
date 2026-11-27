import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OperationalTask } from '@/hooks/useOperationalTasks';
import {
  PMS_PHOTO_BUCKET, pmsPhotoExtension, readPendingPmsPhoto, removePendingPmsPhoto, writePendingPmsPhoto,
} from '@/lib/tasks/pmsPendingPhoto';

type CompletionRecord = {
  taskId: string;
  propertyId: string;
  revision: string;
  capturedAt: string;
  photoPath?: string;
  conflict?: boolean;
};

const prefixFor = (actorId: string, companyId: string) => `myuno:pms-completion:v1:${actorId}:${companyId}:`;
const instant = (value: string) => Number.isFinite(Date.parse(value));

function readCompletions(prefix: string, properties: ReadonlySet<string>) {
  try {
    const records: CompletionRecord[] = [];
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(prefix)) continue;
      try {
        const value = JSON.parse(localStorage.getItem(key) ?? 'null') as CompletionRecord | null;
        if (value && key === prefix + value.taskId && properties.has(value.propertyId)
          && instant(value.revision) && instant(value.capturedAt)) records.push(value);
      } catch {
        // One unreadable record must not prevent the other tasks from syncing.
      }
    }
    return records;
  } catch {
    return [];
  }
}

export function usePmsQueuedCompletion(
  actorId: string | undefined,
  companyId: string | undefined,
  properties: ReadonlySet<string>,
) {
  const queryClient = useQueryClient();
  const prefix = actorId && companyId ? prefixFor(actorId, companyId) : null;
  const context = useRef({ prefix, properties });
  context.current = { prefix, properties };
  const running = useRef(new Set<string>());
  const repeat = useRef(new Set<string>());
  const propertyScope = [...properties].sort().join(',');
  const [view, setView] = useState<{ prefix: string; pending: number; conflicts: number } | null>(null);

  const refresh = useCallback(() => {
    if (!prefix || context.current.prefix !== prefix) return;
    const records = readCompletions(prefix, context.current.properties);
    const pending = records.filter(record => !record.conflict).length;
    const conflicts = records.filter(record => record.conflict).length;
    setView(previous => previous?.prefix === prefix && previous.pending === pending && previous.conflicts === conflicts
      ? previous : { prefix, pending, conflicts });
  }, [prefix]);

  const sync = useCallback(async function flush() {
    if (!actorId || !prefix || context.current.prefix !== prefix || !navigator.onLine) return;
    if (running.current.has(prefix)) {
      repeat.current.add(prefix);
      return;
    }
    const records = readCompletions(prefix, context.current.properties).filter(record => !record.conflict);
    if (!records.length) return;
    running.current.add(prefix);
    try {
      const { data, error } = await supabase.auth.getSession();
      const session = data.session;
      if (error || session?.user.id !== actorId) return;

      let changed = false;
      for (const record of records) {
        if (context.current.prefix !== prefix || !context.current.properties.has(record.propertyId) || !navigator.onLine) break;
        const key = prefix + record.taskId;
        const raw = localStorage.getItem(key);
        if (!raw || (JSON.parse(raw) as CompletionRecord).capturedAt !== record.capturedAt) continue;
        const authorization = `Bearer ${session.access_token}`;
        const updates: {
          status: 'completed'; completed_by: string; completed_at: string; photo_proof?: string[];
        } = { status: 'completed', completed_by: actorId, completed_at: record.capturedAt };
        let eligible = true;
        const photoPath = record.photoPath;
        if (photoPath) {
          if (!photoPath.startsWith(record.taskId + '/' + actorId + '/')) continue;
          const { data: current, error: checkError } = await supabase.from('property_operational_tasks')
            .select('assigned_to,status,updated_at,photo_proof')
            .eq('id', record.taskId).eq('property_id', record.propertyId)
            .setHeader('Authorization', authorization).maybeSingle();
          if (checkError) continue;
          eligible = current?.assigned_to === actorId
            && Date.parse(current.updated_at ?? '') === Date.parse(record.revision)
            && ['pending', 'in_progress'].includes(current.status ?? '');
          if (eligible && current) {
            const photo = await readPendingPmsPhoto(prefix + photoPath);
            if (!photo || !pmsPhotoExtension(photo) || context.current.prefix !== prefix
                || !context.current.properties.has(record.propertyId)) continue;
            const { error: uploadError } = await supabase.storage.from(PMS_PHOTO_BUCKET).upload(photoPath, photo, {
              contentType: photo.type, upsert: false, headers: { Authorization: authorization },
            });
            // The UUID path belongs to this task and assignee. A duplicate means the first
            // upload reached storage before its response arrived or the tab was closed.
            if (uploadError && !('statusCode' in uploadError && String(uploadError.statusCode) === '409')) continue;
            updates.photo_proof = [...new Set([...(current.photo_proof ?? []), photoPath])];
          }
        }
        if (context.current.prefix !== prefix || !context.current.properties.has(record.propertyId)) break;
        const { data: completed, error: updateError } = eligible
          ? await supabase.from('property_operational_tasks')
            .update(updates)
            .eq('id', record.taskId).eq('property_id', record.propertyId)
            .eq('updated_at', record.revision).in('status', ['pending', 'in_progress'])
            .select('id').setHeader('Authorization', authorization).maybeSingle()
          : { data: null, error: null };
        if (updateError) continue;

        let saved = !!completed;
        if (!saved) {
          const { data: server, error: readError } = await supabase.from('property_operational_tasks')
            .select('status,completed_by,completed_at,photo_proof').eq('id', record.taskId).eq('property_id', record.propertyId)
            .setHeader('Authorization', authorization).maybeSingle();
          if (readError) continue;
          saved = server?.status === 'completed' && server.completed_by === actorId
            && Date.parse(server.completed_at ?? '') === Date.parse(record.capturedAt)
            && (!photoPath || server.photo_proof?.includes(photoPath) === true);
        }
        if (localStorage.getItem(key) !== raw) continue;
        if (saved) {
          localStorage.removeItem(key);
          if (photoPath) void removePendingPmsPhoto(prefix + photoPath).catch(() => {});
          changed = true;
        } else {
          localStorage.setItem(key, JSON.stringify({ ...record, conflict: true }));
        }
      }
      if (changed) {
        void queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
        void queryClient.invalidateQueries({ queryKey: ['day-briefing'] });
        void queryClient.invalidateQueries({ queryKey: ['pms-today'] });
      }
    } catch {
      // A network or storage failure leaves the persisted commands available for a retry.
    } finally {
      running.current.delete(prefix);
      refresh();
      if (repeat.current.delete(prefix)) void flush();
    }
  }, [actorId, prefix, queryClient, refresh]);

  useEffect(() => {
    if (!prefix) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith(prefix)) refresh();
    };
    refresh();
    void sync();
    window.addEventListener('online', sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('storage', onStorage);
    };
  }, [prefix, propertyScope, refresh, sync]);

  const save = (task: OperationalTask) => {
    if (!prefix || !properties.has(task.property_id) || !instant(task.updated_at) || !['pending', 'in_progress'].includes(task.status)) return false;
    const record: CompletionRecord = {
      taskId: task.id,
      propertyId: task.property_id,
      revision: task.updated_at,
      capturedAt: new Date().toISOString(),
    };
    const key = prefix + record.taskId;
    try {
      const existing = readCompletions(prefix, properties).find(item => item.taskId === record.taskId);
      if (existing?.conflict) return false;
      if (!existing) localStorage.setItem(key, JSON.stringify(record));
    } catch {
      return false;
    }
    refresh();
    void sync();
    return true;
  };

  const saveWithPhoto = async (task: OperationalTask, photo: File) => {
    const extension = pmsPhotoExtension(photo);
    if (!actorId || !prefix || !extension || task.assigned_to !== actorId
      || !properties.has(task.property_id) || !instant(task.updated_at) || !['pending', 'in_progress'].includes(task.status)) return false;
    const photoPath = task.id + '/' + actorId + '/' + crypto.randomUUID() + '.' + extension;
    const key = prefix + task.id;
    try {
      if (localStorage.getItem(key)) return false;
      await writePendingPmsPhoto(prefix + photoPath, photo);
      if (context.current.prefix !== prefix || !context.current.properties.has(task.property_id) || localStorage.getItem(key)) {
        await removePendingPmsPhoto(prefix + photoPath);
        return false;
      }
      const record: CompletionRecord = {
        taskId: task.id, propertyId: task.property_id, revision: task.updated_at,
        capturedAt: new Date().toISOString(), photoPath,
      };
      localStorage.setItem(key, JSON.stringify(record));
    } catch {
      void removePendingPmsPhoto(prefix + photoPath).catch(() => {});
      return false;
    }
    refresh();
    void sync();
    return true;
  };

  const discardConflicts = () => {
    if (!prefix) return;
    for (const record of readCompletions(prefix, properties).filter(item => item.conflict)) {
      const key = prefix + record.taskId;
      try {
        if (localStorage.getItem(key) === JSON.stringify(record)) {
          localStorage.removeItem(key);
          if (record.photoPath) void removePendingPmsPhoto(prefix + record.photoPath).catch(() => {});
        }
      } catch {
        // A failed local deletion stays visible for another attempt.
      }
    }
    refresh();
  };

  return {
    pending: view?.prefix === prefix ? view?.pending ?? 0 : 0,
    conflicts: view?.prefix === prefix ? view?.conflicts ?? 0 : 0,
    save,
    saveWithPhoto,
    sync,
    discardConflicts,
  };
}
