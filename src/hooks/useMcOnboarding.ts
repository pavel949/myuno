/**
 * MC onboarding wizard progress — tracks the 7 setup steps for a new company.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface McOnboardingProgress {
  id: string;
  company_id: string;
  step_company_profile: boolean;
  step_team_invited: boolean;
  step_first_property: boolean;
  step_pricing_set: boolean;
  step_channel_connected: boolean;
  step_payment_method: boolean;
  step_first_booking: boolean;
  completed_at: string | null;
  dismissed_at: string | null;
}

export const ONBOARDING_STEPS = [
  { key: 'step_company_profile', en: 'Company profile', ru: 'Профиль компании' },
  { key: 'step_team_invited', en: 'Invite team', ru: 'Пригласить команду' },
  { key: 'step_first_property', en: 'Add first property', ru: 'Добавить первый объект' },
  { key: 'step_pricing_set', en: 'Set pricing', ru: 'Настроить тарифы' },
  { key: 'step_channel_connected', en: 'Connect channel', ru: 'Подключить канал' },
  { key: 'step_payment_method', en: 'Payment method', ru: 'Способ оплаты' },
  { key: 'step_first_booking', en: 'First booking', ru: 'Первое бронирование' },
] as const;

export type OnboardingStepKey = typeof ONBOARDING_STEPS[number]['key'];

export function useMcOnboarding() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['mc-onboarding', activeCompany?.company_id],
    queryFn: async (): Promise<McOnboardingProgress | null> => {
      if (!activeCompany) return null;
      const { data, error } = await (supabase as any)
        .from('mc_onboarding_progress')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .maybeSingle();
      if (error) throw error;
      // Auto-create row if missing
      if (!data) {
        const { data: created, error: insErr } = await (supabase as any)
          .from('mc_onboarding_progress')
          .insert({ company_id: activeCompany.company_id })
          .select()
          .single();
        if (insErr) throw insErr;
        return created as McOnboardingProgress;
      }
      return data as McOnboardingProgress;
    },
    enabled: !!activeCompany,
  });
}

export function useUpdateOnboardingStep() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (args: { step: OnboardingStepKey; value: boolean }) => {
      if (!activeCompany) throw new Error('No company');
      const updates: any = { [args.step]: args.value };
      const { error } = await (supabase as any)
        .from('mc_onboarding_progress')
        .update(updates)
        .eq('company_id', activeCompany.company_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mc-onboarding'] }),
  });
}

export function useDismissOnboarding() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async () => {
      if (!activeCompany) throw new Error('No company');
      const { error } = await (supabase as any)
        .from('mc_onboarding_progress')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('company_id', activeCompany.company_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mc-onboarding'] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async () => {
      if (!activeCompany) throw new Error('No company');
      const { error } = await (supabase as any)
        .from('mc_onboarding_progress')
        .update({ completed_at: new Date().toISOString() })
        .eq('company_id', activeCompany.company_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mc-onboarding'] }),
  });
}

/** Compute % progress 0-100 */
export function computeProgress(p: McOnboardingProgress | null | undefined): number {
  if (!p) return 0;
  const flags = ONBOARDING_STEPS.map((s) => (p as any)[s.key] === true);
  const done = flags.filter(Boolean).length;
  return Math.round((done / ONBOARDING_STEPS.length) * 100);
}
