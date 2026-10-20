import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { planTurnoverTasks, type TurnoverTaskDraft } from '@/lib/pms/turnover';
import type { HeldBooking } from '@/lib/pms/bookingConflicts';
import type { KeyProperty } from '@/lib/pms/complexHierarchy';

interface Props {
  bookings: readonly HeldBooking[];
  keys: readonly KeyProperty[];
  today: string;
}

const UNIQUE_VIOLATION = '23505';

async function fetchExistingTaskBookingIds(bookingIds: string[]): Promise<Set<string>> {
  if (bookingIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('property_operational_tasks')
    .select('booking_id')
    .eq('notes', 'auto:turnover')
    .in('booking_id', bookingIds);
  if (error) throw error;
  return new Set((data ?? []).map(r => r.booking_id).filter((id): id is string => !!id));
}

async function insertDraft(d: TurnoverTaskDraft): Promise<void> {
  const { error } = await supabase.from('property_operational_tasks').insert({
    property_id: d.propertyId,
    booking_id: d.bookingId,
    task_type: 'cleaning',
    title: d.title,
    title_ru: d.titleRu,
    scheduled_date: d.scheduledDate,
    priority: d.priority,
    status: 'pending',
    notes: d.notes,
  });
  // The partial unique index makes this idempotent: an existing auto task is not an error.
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export function TurnoverBackfillBanner({ bookings, keys, today }: Props) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const bookingIds = bookings.map(b => b.id);
  const { data: existing, error: loadError } = useQuery({
    queryKey: ['pms-turnover-existing', bookingIds],
    queryFn: () => fetchExistingTaskBookingIds(bookingIds),
  });
  if (loadError || !existing) return null;

  const plan = planTurnoverTasks({
    bookings,
    keys: new Map(keys.map(k => [k.id, k] as const)),
    existingTaskBookingIds: existing,
    today,
  });
  if (plan.create.length === 0) return null;

  const backfill = async () => {
    setBusy(true);
    try {
      for (const draft of plan.create) await insertDraft(draft);
      toast.success(t('pms.turnover.done'));
      await queryClient.invalidateQueries({ queryKey: ['pms-turnover-existing'] });
      await queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    } catch {
      toast.error(t('pms.turnover.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border border-border bg-warning/10 p-3 text-sm">
      <span>{t('pms.turnover.missing').replace('{n}', String(plan.create.length))}</span>
      <Button size="sm" onClick={backfill} disabled={busy}>
        {t('pms.turnover.create').replace('{n}', String(plan.create.length))}
      </Button>
    </div>
  );
}
