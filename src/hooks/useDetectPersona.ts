/**
 * @module useDetectPersona
 * @description M4 — invoke `canonical-persona-detect` Edge Function
 * to get an AI-powered segmentation proposal (lifecycle / persona /
 * clusters / triggers) for a user.
 *
 * Two modes:
 *  - dryRun (default): returns proposal only.
 *  - apply: server-side merges the proposal into `profiles` and the
 *    `useCanonicalProfile` cache is invalidated.
 *
 * UI gating: the AI is **advisory**. Always show the proposal + reasoning
 * to the user (or admin) before applying. Auto-apply is allowed only
 * when `confidence ≥ 0.75` AND user is acting on themselves.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createErrorHandler } from '@/lib/errorHandler';
import type {
  ClusterId,
  LifecycleStage,
  PersonaCode,
} from '@/types/canonical';

export interface PersonaDetectionSignals {
  origin_country?: string | null;
  preferred_language?: string | null;
  visits_count?: number | null;
  total_days_in_thailand?: number | null;
  household_type?: string | null;
  kids_ages?: number[] | null;
  intent_notes?: string | null;
  recent_surfaces?: string[] | null;
  current_roles?: string[] | null;
  recent_events?: string[] | null;
}

export interface PersonaDetectionProposal {
  lifecycle_stage: LifecycleStage;
  detected_persona: PersonaCode;
  active_clusters: ClusterId[];
  triggers: string[];
  confidence: number;
  reasoning: string;
}

export interface PersonaDetectionResponse {
  proposal: PersonaDetectionProposal;
  applied: boolean;
}

interface DetectInput {
  /** Defaults to current authenticated user. */
  userId?: string;
  signals: PersonaDetectionSignals;
  /** If true, server-merges the proposal into `profiles`. */
  apply?: boolean;
  /** Override default Lovable AI model. */
  model?: string;
}

const HIGH_CONFIDENCE_THRESHOLD = 0.75;

export function useDetectPersona() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const errorLog = createErrorHandler('useDetectPersona');

  return useMutation<PersonaDetectionResponse, Error, DetectInput>({
    mutationFn: async (input) => {
      const targetUserId = input.userId ?? user?.id;
      if (!targetUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke<PersonaDetectionResponse>(
        'canonical-persona-detect',
        {
          body: {
            user_id: targetUserId,
            signals: input.signals,
            apply: input.apply === true,
            model: input.model,
          },
        },
      );

      if (error) {
        errorLog.silent(error, 'invoke_persona_detect');
        throw error;
      }
      if (!data?.proposal) {
        throw new Error('Empty AI proposal');
      }
      return data;
    },
    onSuccess: (data, vars) => {
      if (data.applied) {
        const targetUserId = vars.userId ?? user?.id;
        queryClient.invalidateQueries({ queryKey: ['canonical-profile', targetUserId] });
      }
    },
    onError: (err) => errorLog.silent(err, 'detect_persona_mutation'),
  });
}

/**
 * Helper: should this proposal be auto-applied? See module docstring.
 */
export function isHighConfidence(proposal: PersonaDetectionProposal): boolean {
  return proposal.confidence >= HIGH_CONFIDENCE_THRESHOLD;
}
