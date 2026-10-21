import { supabase } from '@/integrations/supabase/client';

export const TEAM_MODERATION_PAGE_SIZE = 50;
export type TeamReviewStatus = 'pending' | 'approved' | 'rejected';

export async function fetchTeamModerationPage(status: TeamReviewStatus, page: number) {
  const offset = Math.max(0, Math.floor(page)) * TEAM_MODERATION_PAGE_SIZE;
  const { data, count, error } = await supabase.from('moderation_queue')
    .select('id,item_type,title,content,rating,photo_count,category,submitted_by_name,status,created_at,updated_at', { count: 'exact' })
    .eq('status', status).order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(offset, offset + TEAM_MODERATION_PAGE_SIZE - 1);
  if (error) throw error;
  if (count === null) throw new Error('Review count unavailable');
  return { items: data ?? [], total: count };
}

export async function fetchTeamModerationCounts() {
  const statuses = ['pending', 'approved', 'rejected'] as const;
  const results = await Promise.all(statuses.map(status => supabase.from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', status)));
  return Object.fromEntries(statuses.map((status, index) => [status, results[index].error ? null : results[index].count])) as Record<TeamReviewStatus, number | null>;
}

/** Existing RLS still authorizes the actor. A stale revision or zero-row update is never success. */
export async function reviewTeamModerationItem({ id, status, expectedUpdatedAt }: { id: string; status: 'approved' | 'rejected'; expectedUpdatedAt: string }) {
  if (!expectedUpdatedAt) throw new Error('Reload the item before review');
  const { data, error } = await supabase.from('moderation_queue')
    .update({ status, reviewed_at: new Date().toISOString() }).eq('id', id).eq('status', 'pending').eq('updated_at', expectedUpdatedAt)
    .select('id,status').single();
  if (error) throw error;
  if (data?.id !== id || data.status !== status) throw new Error('Review was not confirmed');
  return data;
}
