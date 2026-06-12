/**
 * useWorldCheckGate — compliance pre-flight for Russian-passport clients
 * on capital deals (Investor segment, $2M+).
 *
 * Sprint D rule: every Russian client must clear WorldCheck before payment
 * rails can engage. This hook returns the gate state so money-moving
 * screens can disable the "Pay" CTA until clearance is recorded.
 *
 * Current implementation: reads compliance status from `crm_contacts`
 * (`special_status` jsonb array contains 'worldcheck_cleared' or
 * 'worldcheck_pending'). Edge function `compliance-worldcheck` populates it.
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

export function useWorldCheckGate({ contactId, isRussianPassport }: Args): WorldCheckGate {
  const { data, isLoading } = useQuery({
    enabled: Boolean(contactId),
    queryKey: ['worldcheck-gate', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('special_status, nationality, passport_country')
        .eq('id', contactId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const russianFromDb =
    data?.nationality === 'RU' ||
    data?.nationality === 'Russia' ||
    data?.passport_country === 'RU' ||
    data?.passport_country === 'Russia';
  const isRequired = Boolean(isRussianPassport ?? russianFromDb);

  const statuses: string[] = Array.isArray(data?.special_status)
    ? (data!.special_status as unknown as string[])
    : [];

  let state: WorldCheckState = 'unknown';
  if (statuses.includes('worldcheck_cleared')) state = 'cleared';
  else if (statuses.includes('worldcheck_flagged')) state = 'flagged';
  else if (statuses.includes('worldcheck_pending')) state = 'pending';
  else if (!isRequired) state = 'not_required';

  const allowed = state === 'cleared' || state === 'not_required';

  return { state, allowed, isRequired, isLoading };
}
