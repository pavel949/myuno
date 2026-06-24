/**
 * @module useConvertLeadToDeal
 * Bridges the platform acquisition CRM (consultation_requests / inbound leads) to
 * the MC sales CRM (agent_deals). Wraps the `convert_lead_to_deal` RPC, which is
 * atomic and idempotent — calling it twice on the same lead returns the same deal.
 *
 * The caller passes the target company (default: the user's active company) so an
 * admin can route a lead into the house MC or any company they operate.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { untypedRpc } from '@/lib/untypedTables';
import { toast } from 'sonner';

export interface ConvertLeadToDealInput {
  leadId: string;
  companyId: string;
  /** Defaults server-side to auth.uid(); pass to assign another agent. */
  agentId?: string;
  /** One of DEAL_TYPES (useAgentDeals.ts). Defaults to 'sale'. */
  dealType?: string;
}

export function useConvertLeadToDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, companyId, agentId, dealType }: ConvertLeadToDealInput): Promise<string> => {
      const { data, error } = await untypedRpc('convert_lead_to_deal', {
        p_lead_id: leadId,
        p_company_id: companyId,
        ...(agentId ? { p_agent_id: agentId } : {}),
        p_deal_type: dealType || 'sale',
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-consultations'] });
      qc.invalidateQueries({ queryKey: ['consultation-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-inbox'] });
      qc.invalidateQueries({ queryKey: ['agent-deals'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to convert lead to deal');
    },
  });
}
