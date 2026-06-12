/**
 * useWorldCheckGate — compliance pre-flight for Russian-passport clients
 * on capital deals (Investor segment, $2M+).
 *
 * Sprint D rule: every Russian client must clear WorldCheck before payment
 * rails can engage. This hook returns the gate state so money-moving
 * screens can disable the "Pay" CTA until clearance is recorded.
 *
 * Current implementation: reads compliance status from `crm_contacts`
 * (`aml_kyc_status` enum + `tags` array for 'worldcheck_*' markers).
 * Edge function `compliance-worldcheck` populates these fields.
 *
 * @returns gate.allowed === true → cleared; false → blocked; null → unknown
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WorldCheckState =
  | 'cleared'
  | 'pending'
  | 'flagged'
  | 'not_required'
  | 'unknown';

export interface WorldCheckGate {
  state: WorldCheckState;
  /** True when payment rails can engage. */
  allowed: boolean;
  /** True for Russian passport holders — gate is mandatory. */
  isRequired: boolean;
  isLoading: boolean;
}

interface Args {
  contactId?: string | null;
  /** Override when nationality is known from another source. */
  isRussianPassport?: boolean;
}

function isRussian(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === 'ru' || v === 'russia' || v === 'russian' || v === 'российская федерация' || v === 'россия';
}

export function useWorldCheckGate({ contactId, isRussianPassport }: Args): WorldCheckGate {
  const { data, isLoading } = useQuery({
    enabled: Boolean(contactId),
    queryKey: ['worldcheck-gate', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('aml_kyc_status, nationality, passport_country, tags')
        .eq('id', contactId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const russianFromDb = isRussian(data?.nationality) || isRussian(data?.passport_country);
  const isRequired = Boolean(isRussianPassport ?? russianFromDb);

  const tags: string[] = Array.isArray(data?.tags) ? (data!.tags as unknown as string[]) : [];
  const kyc = (data?.aml_kyc_status ?? '').toString().toLowerCase();

  let state: WorldCheckState = 'unknown';
  if (kyc === 'cleared' || kyc === 'approved' || tags.includes('worldcheck_cleared')) state = 'cleared';
  else if (kyc === 'flagged' || kyc === 'rejected' || tags.includes('worldcheck_flagged')) state = 'flagged';
  else if (kyc === 'pending' || kyc === 'in_review' || tags.includes('worldcheck_pending')) state = 'pending';
  else if (!isRequired) state = 'not_required';

  const allowed = state === 'cleared' || state === 'not_required';

  return { state, allowed, isRequired, isLoading };
}
