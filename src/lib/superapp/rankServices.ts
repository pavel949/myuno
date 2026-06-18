/**
 * Superapp ranker — pure function. Scores FLAT_SERVICES against the active
 * role / personas / situation / recent history and returns a stable sorted
 * list. No DB calls, no hooks.
 *
 * Scoring (per service):
 *   +5 per matching situationCode
 *   +3 per matching personaTag
 *   +2 per matching roleTag (via ROLE_TO_ROLETAGS)
 *   +1 per recentId hit
 *   −2 if status === 'soon'
 *   −5 if status === 'soon' AND role === 'guest'
 *   tie-break: stable by FLAT_SERVICES order (we just keep insertion).
 */
import type { FlatService, RoleTag } from '@/lib/catalog/taxonomy';
import type { LifeOSRole } from '@/hooks/useLifeOS';
import type { UserPersona } from '@/hooks/useUserPersonas';

export interface RankContext {
  role: LifeOSRole;
  personas: readonly UserPersona[];
  activeSituationCode?: string;
  recentIds?: readonly string[];
}

const ROLE_TO_ROLETAGS: Record<LifeOSRole, RoleTag[]> = {
  guest:     ['consumer'],
  resident:  ['consumer', 'resident-user'],
  owner:     ['operator', 'investor-passive'],
  mc:        ['operator', 'provider'],
  investor:  ['investor-active', 'investor-passive'],
  developer: ['operator', 'provider'],
  vendor:    ['provider'],
};

export function scoreService(svc: FlatService, ctx: RankContext): number {
  let score = 0;

  if (ctx.activeSituationCode && svc.situationCodes?.includes(ctx.activeSituationCode)) {
    score += 5;
  }

  if (svc.personaTags?.length && ctx.personas.length) {
    const personaSet = new Set(ctx.personas);
    for (const tag of svc.personaTags) {
      if (personaSet.has(tag as UserPersona)) score += 3;
    }
  }

  if (svc.roleTags?.length) {
    const roleTags = ROLE_TO_ROLETAGS[ctx.role] ?? [];
    const roleSet = new Set<RoleTag>(roleTags);
    for (const tag of svc.roleTags) {
      if (tag === 'all' || roleSet.has(tag)) score += 2;
    }
  }

  if (ctx.recentIds?.length && ctx.recentIds.includes(svc.id)) {
    score += 1;
  }

  if (svc.status === 'soon') {
    score -= ctx.role === 'guest' ? 5 : 2;
  }

  return score;
}

export function rankServices(
  services: readonly FlatService[],
  ctx: RankContext,
): FlatService[] {
  return services
    .map((svc, idx) => ({ svc, idx, score: scoreService(svc, ctx) }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((entry) => entry.svc);
}
