import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildRelocationPlanSteps,
  mergePreservedStepStatus,
  type RelocationPlanStep,
  type RelocationQuizAnswers,
} from '@/lib/relocation/planFromQuiz';

const LOCAL_KEY = 'myuno_relocation_plan_v1';

export interface RelocationPlanLocal {
  quiz_answers: RelocationQuizAnswers;
  steps: RelocationPlanStep[];
  updated_at: string;
}

function readLocal(): RelocationPlanLocal | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RelocationPlanLocal;
    if (!parsed?.quiz_answers || !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(plan: RelocationPlanLocal) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(plan));
}

export function useRelocationPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['relocation_plan', user?.id ?? 'anon'],
    queryFn: async (): Promise<RelocationPlanLocal | null> => {
      if (user?.id) {
        // @ts-expect-error relocation_plans not yet in generated Database type
        const { data, error } = await supabase
          .from('relocation_plans')
          .select('quiz_answers, steps, updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          const row = data as { quiz_answers: RelocationQuizAnswers; steps: RelocationPlanStep[]; updated_at: string };
          return {
            quiz_answers: row.quiz_answers,
            steps: row.steps,
            updated_at: row.updated_at,
          };
        }
      }
      return readLocal();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (next: RelocationPlanLocal) => {
      writeLocal(next);
      if (user?.id) {
        // @ts-expect-error relocation_plans not yet in generated Database type
        const { error } = await supabase.from('relocation_plans').upsert(
          {
            user_id: user.id,
            quiz_answers: next.quiz_answers,
            steps: next.steps,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, next) => {
      queryClient.setQueryData(['relocation_plan', user?.id ?? 'anon'], next);
    },
  });

  const setStepStatus = useCallback(
    (stepId: string, status: RelocationPlanStep['status']) => {
      const current = query.data;
      if (!current) return;
      const steps = current.steps.map((s) => (s.id === stepId ? { ...s, status } : s));
      const next: RelocationPlanLocal = {
        ...current,
        steps,
        updated_at: new Date().toISOString(),
      };
      saveMutation.mutate(next);
    },
    [query.data, saveMutation],
  );

  const saveQuizAndSteps = useCallback(
    (quiz: RelocationQuizAnswers) => {
      const built = buildRelocationPlanSteps(quiz);
      const merged = mergePreservedStepStatus(built, query.data?.steps);
      const next: RelocationPlanLocal = {
        quiz_answers: quiz,
        steps: merged,
        updated_at: new Date().toISOString(),
      };
      saveMutation.mutate(next);
    },
    [query.data?.steps, saveMutation],
  );

  const saveQuizAndStepsAsync = useCallback(
    async (quiz: RelocationQuizAnswers) => {
      const built = buildRelocationPlanSteps(quiz);
      const cached = queryClient.getQueryData<RelocationPlanLocal | null>(['relocation_plan', user?.id ?? 'anon']);
      const merged = mergePreservedStepStatus(built, cached?.steps);
      const next: RelocationPlanLocal = {
        quiz_answers: quiz,
        steps: merged,
        updated_at: new Date().toISOString(),
      };
      await saveMutation.mutateAsync(next);
    },
    [queryClient, saveMutation, user?.id],
  );

  const progress = useMemo(() => {
    const steps = query.data?.steps ?? [];
    if (!steps.length) return 0;
    const done = steps.filter((s) => s.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  }, [query.data?.steps]);

  return {
    plan: query.data,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    setStepStatus,
    saveQuizAndSteps,
    saveQuizAndStepsAsync,
    progress,
    refetch: query.refetch,
  };
}

export type { RelocationPlanLocal };
