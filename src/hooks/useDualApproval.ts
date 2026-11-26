/**
 * useDualApproval — read and record two-person approvals
 * (`public.hq_dual_approvals`, RPC `hq_record_approval`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { typedFrom, untypedRpc } from '@/lib/untypedTables';
import type { DualApprovalEntity } from '@/lib/access/hqAccessPolicy';

export interface DualApprovalRow {
  id: string;
  approver_id: string;
  note: string | null;
  created_at: string;
}

interface RecordResult {
  success: boolean;
  approvals?: number;
  error?: string;
}

export const dualApprovalKey = (entity: DualApprovalEntity, id: string) => ['hq-dual-approvals', entity, id] as const;

export function useDualApproval(entity: DualApprovalEntity, entityId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: dualApprovalKey(entity, entityId ?? ''),
    enabled: Boolean(entityId),
    queryFn: async (): Promise<DualApprovalRow[]> => {
      const { data, error } = await typedFrom('hq_dual_approvals')
        .select('id, approver_id, note, created_at')
        .eq('entity_type', entity)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as DualApprovalRow[];
    },
  });

  const approve = useMutation({
    mutationFn: async (note?: string): Promise<number> => {
      if (!entityId) throw new Error('Missing entity id');
      const { data, error } = await untypedRpc('hq_record_approval', {
        _entity_type: entity,
        _entity_id: entityId,
        _note: note ?? null,
      });
      if (error) throw new Error(error.message);
      const result = data as RecordResult | null;
      if (!result?.success) throw new Error(result?.error ?? 'Approval failed');
      return result.approvals ?? 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dualApprovalKey(entity, entityId ?? '') }),
  });

  const approvals = query.data ?? [];
  const approverIds = new Set(approvals.map((a) => a.approver_id));
  return { ...query, approvals, approvalCount: approverIds.size, hasApproved: (uid?: string) => Boolean(uid && approverIds.has(uid)), approve };
}
