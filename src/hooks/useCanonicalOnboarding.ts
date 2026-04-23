/**
 * @module useCanonicalOnboarding
 * @description M5 — drives `/start/v2`, the canonical 3-question
 * onboarding (lifecycle / role / modifiers).
 *
 * Behaviour
 *  - Computes a deterministic `detectPersona()` proposal immediately
 *    after Q3 (zero-latency UX).
 *  - For authed users: invokes `useDetectPersona({ apply: true })` so
 *    `profiles` gets the canonical columns merged. If AI confidence is
 *    higher, AI proposal supersedes the local one in the result view.
 *  - For anon users: writes a session into `concierge_sessions` with
 *    canonical keys, and an entry into `persona_detection_log` with
 *    the local proposal (anon_session_id only).
 *  - Always writes to `persona_detection_log` (audit trail).
 *  - Service recommendations are computed from the final proposal.
 */
import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDetectPersona, isHighConfidence, type PersonaDetectionProposal } from '@/hooks/useDetectPersona';
import {
  detectPersona,
  type CanonicalModifier,
  type CanonicalOnboardingAnswers,
  type CanonicalRoleAnswer,
} from '@/lib/segmentation/detectPersona';
import { recommendServices, type ServiceRecommendation } from '@/lib/segmentation/recommendServices';
import { createErrorHandler } from '@/lib/errorHandler';
import type { LifecycleStage } from '@/types/canonical';

export interface CanonicalOnboardingResult {
  proposal: PersonaDetectionProposal;
  source: 'ai_v1' | 'rules_v1';
  recommendations: ServiceRecommendation[];
}

const ANON_KEY = 'myuno-anon-session-id';

function getOrCreateAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function useCanonicalOnboarding() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const detect = useDetectPersona();
  const errorLog = createErrorHandler('useCanonicalOnboarding');

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [lifecycle, setLifecycle] = useState<LifecycleStage | null>(null);
  const [role, setRole] = useState<CanonicalRoleAnswer | null>(null);
  const [modifiers, setModifiers] = useState<CanonicalModifier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CanonicalOnboardingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleModifier = useCallback((m: CanonicalModifier) => {
    setModifiers((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }, []);

  const next = useCallback(() => setStep((s) => (s >= 3 ? 3 : ((s + 1) as 0 | 1 | 2 | 3))), []);
  const back = useCallback(() => setStep((s) => (s <= 0 ? 0 : ((s - 1) as 0 | 1 | 2 | 3))), []);
  const reset = useCallback(() => {
    setStep(0);
    setLifecycle(null);
    setRole(null);
    setModifiers([]);
    setResult(null);
    setError(null);
  }, []);

  const canSubmit = useMemo(() => Boolean(lifecycle && role), [lifecycle, role]);

  const submit = useCallback(async () => {
    if (!canSubmit || !lifecycle || !role) return;
    setIsSubmitting(true);
    setError(null);

    const answers: CanonicalOnboardingAnswers = { lifecycle, role, modifiers };
    const localProposal = detectPersona(answers);

    let finalProposal: PersonaDetectionProposal = localProposal;
    let source: 'ai_v1' | 'rules_v1' = 'rules_v1';
    const anonId = user?.id ? null : getOrCreateAnonId();

    try {
      // 1. Authed → ask the AI orchestrator and let it merge into profiles
      if (user?.id) {
        try {
          const aiResp = await detect.mutateAsync({
            signals: {
              preferred_language: language,
              current_roles: [role],
              intent_notes: `lifecycle=${lifecycle}; modifiers=${modifiers.join(',') || 'none'}`,
              recent_surfaces: ['/start/v2'],
            },
            apply: true,
          });
          if (aiResp?.proposal && isHighConfidence(aiResp.proposal)) {
            finalProposal = aiResp.proposal;
            source = 'ai_v1';
          }
        } catch (aiErr) {
          errorLog.silent(aiErr, 'ai_detect_unavailable');
        }
      }

      // 2. Always write a canonical concierge_sessions row (anon or authed)
      const sessionPayload: Record<string, unknown> = {
        channel: 'web_start_v2',
        language,
        raw_answers: { lifecycle, role, modifiers, generator: source },
        status: 'completed',
        completed_at: new Date().toISOString(),
      };
      if (user?.id) sessionPayload.user_id = user.id;
      else sessionPayload.anon_session_id = anonId;

      await supabase.from('concierge_sessions' as any).insert(sessionPayload as any);

      // 3. Always append to persona_detection_log (audit trail)
      const logPayload: Record<string, unknown> = {
        source: user?.id ? 'start_v2' : 'start_v2',
        signals: {
          lifecycle,
          role,
          modifiers,
          language,
        },
        proposal: finalProposal as unknown as Record<string, unknown>,
        confidence: finalProposal.confidence,
        applied: Boolean(user?.id),
      };
      if (user?.id) logPayload.user_id = user.id;
      else logPayload.anon_session_id = anonId;

      await supabase.from('persona_detection_log' as any).insert(logPayload as any);

      const recommendations = recommendServices({
        activeClusters: finalProposal.active_clusters,
        modifiers,
        limit: 6,
      });

      setResult({ proposal: finalProposal, source, recommendations });
      setStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save your answers';
      setError(msg);
      errorLog.silent(e, 'submit_canonical_onboarding');
      // Still surface a degraded result so the user is not stuck
      const recommendations = recommendServices({
        activeClusters: localProposal.active_clusters,
        modifiers,
        limit: 6,
      });
      setResult({ proposal: localProposal, source: 'rules_v1', recommendations });
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, lifecycle, role, modifiers, user?.id, language, detect, errorLog]);

  return {
    step,
    lifecycle,
    role,
    modifiers,
    setLifecycle,
    setRole,
    toggleModifier,
    next,
    back,
    reset,
    canSubmit,
    submit,
    isSubmitting,
    result,
    error,
  };
}
