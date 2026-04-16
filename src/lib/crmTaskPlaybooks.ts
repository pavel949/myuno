/**
 * Suggested CRM task_type values per deal_type × deal stage (stage_key from agent_deals / pipeline).
 * Values are slugs aligned with `DEFAULT_TASK_TYPES` in useCrmSettings and `CRM_TASK_TYPES` in config/crmTaskTypes.
 * Use for quick-add UX or coaching; teams can still pick any task_type.
 */
import type { DealStage, DealType } from '@/hooks/useAgentDeals';

export const DEAL_STAGE_TASK_PLAYBOOK: Record<
  DealType,
  Partial<Record<DealStage, readonly string[]>>
> = {
  sale: {
    new: ['call', 'follow_up', 'email'],
    contacted: ['call', 'meeting', 'viewing', 'send'],
    showing: ['viewing', 'follow_up', 'negotiation', 'document'],
    negotiation: ['negotiation', 'contract', 'payment', 'document'],
    contract: ['contract', 'payment', 'document', 'follow_up'],
  },
  rent_short: {
    new: ['call', 'email', 'follow_up'],
    contacted: ['call', 'meeting', 'viewing'],
    showing: ['viewing', 'follow_up'],
    negotiation: ['reservation', 'payment', 'document'],
    contract: ['contract', 'check_in', 'payment'],
  },
  rent_long: {
    new: ['call', 'email', 'follow_up'],
    contacted: ['kyc_docs', 'call', 'meeting'],
    showing: ['viewing', 'follow_up'],
    negotiation: ['reservation', 'payment', 'negotiation', 'document'],
    contract: ['contract', 'key_handover', 'check_in', 'payment'],
  },
  investment: {
    new: ['call', 'research', 'follow_up'],
    contacted: ['meeting', 'presentation', 'send'],
    showing: ['viewing', 'follow_up', 'negotiation'],
    negotiation: ['reservation', 'negotiation', 'payment'],
    contract: ['contract', 'installment_reminder', 'document', 'payment'],
  },
  management: {
    new: ['call', 'meeting', 'onboarding_visit'],
    contacted: ['onboarding_visit', 'document', 'follow_up'],
    showing: ['onboarding', 'document', 'send'],
    negotiation: ['negotiation', 'contract', 'renewal_call'],
    contract: ['renewal_call', 'payment', 'contract'],
  },
  club_deal: {
    new: ['call', 'research', 'follow_up'],
    contacted: ['meeting', 'presentation', 'send'],
    showing: ['viewing', 'follow_up', 'document'],
    negotiation: ['negotiation', 'payment', 'document'],
    contract: ['contract', 'payment', 'installment_reminder'],
  },
  resale: {
    new: ['call', 'follow_up', 'email'],
    contacted: ['call', 'meeting', 'viewing'],
    showing: ['viewing', 'follow_up', 'negotiation'],
    negotiation: ['negotiation', 'contract', 'document'],
    contract: ['contract', 'payment', 'document'],
  },
  offplan: {
    new: ['call', 'research', 'follow_up'],
    contacted: ['meeting', 'presentation', 'viewing'],
    showing: ['viewing', 'follow_up', 'reservation'],
    negotiation: ['reservation', 'negotiation', 'payment', 'document'],
    contract: ['contract', 'installment_reminder', 'payment'],
  },
};

export function getSuggestedTaskTypesForDealStage(dealType: DealType, stage: DealStage): string[] {
  if (stage === 'closed_won' || stage === 'closed_lost') return [];
  const list = DEAL_STAGE_TASK_PLAYBOOK[dealType]?.[stage];
  return list ? [...list] : ['call', 'follow_up', 'other'];
}
