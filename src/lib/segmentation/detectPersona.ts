/**
 * @module detectPersona
 * @description M5 — local deterministic fallback for canonical persona
 * detection from the 3-question onboarding answers.
 *
 * This is the **rules_v1** generator that runs before any AI call. It
 * always produces a valid `PersonaDetectionProposal` so the UI is never
 * blocked by Edge Function latency or downtime. The AI hook
 * (`useDetectPersona`) is invoked in parallel for authed users — if the
 * AI proposal arrives with `confidence ≥ 0.75`, it overrides this one.
 *
 * Source matrix: `04-implementation-protocol.md §M5` PROMPT and
 * `01-segmentation-framework.md §6` cluster matrix.
 */

import type {
  ClusterId,
  LifecycleStage,
  PersonaCode,
} from '@/types/canonical';
import type {
  PersonaDetectionProposal,
} from '@/hooks/useDetectPersona';

export type CanonicalRoleAnswer =
  | 'consumer'
  | 'resident-user'
  | 'investor-passive'
  | 'investor-active'
  | 'operator'
  | 'provider';

export type CanonicalModifier =
  | 'pet-owner'
  | 'medical'
  | 'halal'
  | 'kosher'
  | 'accessibility'
  | 'lgbtq'
  | 'athlete'
  | 'wedding'
  | 'family-young'
  | 'family-school';

export interface CanonicalOnboardingAnswers {
  lifecycle: LifecycleStage;
  role: CanonicalRoleAnswer;
  modifiers: CanonicalModifier[];
}

/* ------------------------------------------------------------------ */
/*  Lifecycle → default cluster bundle                                */
/* ------------------------------------------------------------------ */

const LIFECYCLE_CLUSTERS: Record<LifecycleStage, ClusterId[]> = {
  scout:    ['arrive', 'invest'],
  tourist:  ['arrive'],
  snowbird: ['arrive', 'live'],
  nomad:    ['live', 'legal'],
  settler:  ['live', 'legal'],
  resident: ['live', 'legal', 'manage'],
  absentee: ['manage', 'invest'],
  returnee: ['arrive', 'live'],
};

/* ------------------------------------------------------------------ */
/*  Role → cluster bias                                               */
/* ------------------------------------------------------------------ */

const ROLE_CLUSTERS: Record<CanonicalRoleAnswer, ClusterId[]> = {
  consumer:           ['arrive'],
  'resident-user':    ['live', 'legal'],
  'investor-passive': ['invest'],
  'investor-active':  ['invest', 'build'],
  operator:           ['manage'],
  provider:           ['build', 'manage'],
};

/* ------------------------------------------------------------------ */
/*  Modifier → cluster + trigger bias                                 */
/* ------------------------------------------------------------------ */

const MODIFIER_CLUSTERS: Record<CanonicalModifier, ClusterId[]> = {
  'pet-owner':     ['live'],
  medical:         ['live', 'legal'],
  halal:           ['arrive'],
  kosher:          ['arrive'],
  accessibility:   ['live'],
  lgbtq:           [],
  athlete:         ['live'],
  wedding:         ['arrive'],
  'family-young':  ['live'],
  'family-school': ['live'],
};

/**
 * Persona matrix — covers the most common (lifecycle × role) intersections
 * and falls back to a coarse default for the long tail. Codes are P1..P25
 * per `01-segmentation-framework.md §0.6`.
 */
const PERSONA_MATRIX: Partial<Record<`${LifecycleStage}:${CanonicalRoleAnswer}`, PersonaCode>> = {
  // Scouts
  'scout:consumer':           'P1',
  'scout:investor-passive':   'P11',
  'scout:investor-active':    'P12',

  // Tourists
  'tourist:consumer':         'P2',
  'tourist:resident-user':    'P3',

  // Snowbirds
  'snowbird:consumer':        'P4',
  'snowbird:resident-user':   'P5',
  'snowbird:operator':        'P15',

  // Nomads
  'nomad:consumer':           'P6',
  'nomad:resident-user':      'P7',

  // Settlers
  'settler:resident-user':    'P8',
  'settler:operator':         'P16',
  'settler:investor-passive': 'P13',

  // Residents
  'resident:resident-user':   'P9',
  'resident:operator':        'P17',
  'resident:investor-active': 'P14',
  'resident:provider':        'P19',

  // Absentees
  'absentee:investor-passive': 'P18',
  'absentee:operator':         'P20',

  // Returnees
  'returnee:resident-user':   'P10',
  'returnee:operator':        'P21',
};

const DEFAULT_PERSONA_BY_ROLE: Record<CanonicalRoleAnswer, PersonaCode> = {
  consumer:           'P2',
  'resident-user':    'P9',
  'investor-passive': 'P11',
  'investor-active':  'P12',
  operator:           'P17',
  provider:           'P19',
};

/* ------------------------------------------------------------------ */
/*  Triggers from modifiers + lifecycle                                */
/* ------------------------------------------------------------------ */

function deriveTriggers(answers: CanonicalOnboardingAnswers): string[] {
  const triggers = new Set<string>();
  if (answers.lifecycle === 'tourist' || answers.lifecycle === 'scout') {
    triggers.add('first_visit');
  }
  if (answers.lifecycle === 'returnee') {
    triggers.add('returning_guest');
  }
  if (answers.modifiers.includes('family-young') || answers.modifiers.includes('family-school')) {
    triggers.add('family_with_kids_arriving');
  }
  if (answers.role === 'investor-passive' || answers.role === 'investor-active') {
    triggers.add('investment_intent_detected');
  }
  if (answers.lifecycle === 'snowbird' || answers.lifecycle === 'settler') {
    triggers.add('long_stay_eligible');
  }
  return Array.from(triggers);
}

/* ------------------------------------------------------------------ */
/*  Confidence scoring                                                 */
/* ------------------------------------------------------------------ */

function confidenceFor(answers: CanonicalOnboardingAnswers, hasMatrixHit: boolean): number {
  // Base 0.55, +0.20 for known matrix entry, +0.05 per modifier (cap +0.15)
  let c = 0.55;
  if (hasMatrixHit) c += 0.2;
  c += Math.min(answers.modifiers.length, 3) * 0.05;
  return Math.min(Math.round(c * 100) / 100, 0.95);
}

/* ------------------------------------------------------------------ */
/*  Reasoning sentence — short, tone-of-voice compliant               */
/* ------------------------------------------------------------------ */

function reasoningFor(answers: CanonicalOnboardingAnswers, persona: PersonaCode): string {
  const mods =
    answers.modifiers.length > 0 ? ` · ${answers.modifiers.join(', ')}` : '';
  return `Lifecycle ${answers.lifecycle} × role ${answers.role}${mods} → ${persona}`;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export function detectPersona(
  answers: CanonicalOnboardingAnswers,
): PersonaDetectionProposal {
  const matrixKey = `${answers.lifecycle}:${answers.role}` as const;
  const matrixHit = PERSONA_MATRIX[matrixKey];
  const persona = matrixHit ?? DEFAULT_PERSONA_BY_ROLE[answers.role];

  const clusterSet = new Set<ClusterId>([
    ...LIFECYCLE_CLUSTERS[answers.lifecycle],
    ...ROLE_CLUSTERS[answers.role],
    ...answers.modifiers.flatMap((m) => MODIFIER_CLUSTERS[m]),
  ]);

  return {
    lifecycle_stage: answers.lifecycle,
    detected_persona: persona,
    active_clusters: Array.from(clusterSet),
    triggers: deriveTriggers(answers),
    confidence: confidenceFor(answers, Boolean(matrixHit)),
    reasoning: reasoningFor(answers, persona),
  };
}

export const LIFECYCLE_OPTIONS: readonly LifecycleStage[] = [
  'scout',
  'tourist',
  'snowbird',
  'nomad',
  'settler',
  'resident',
  'absentee',
  'returnee',
];

export const ROLE_OPTIONS: readonly CanonicalRoleAnswer[] = [
  'consumer',
  'resident-user',
  'investor-passive',
  'investor-active',
  'operator',
  'provider',
];

export const MODIFIER_OPTIONS: readonly CanonicalModifier[] = [
  'pet-owner',
  'medical',
  'halal',
  'kosher',
  'accessibility',
  'lgbtq',
  'athlete',
  'wedding',
  'family-young',
  'family-school',
];
