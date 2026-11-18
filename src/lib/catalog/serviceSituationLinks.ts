import type { ServiceEntry } from './taxonomy';
import { CATALOG_SERVICE_SLUG_BY_LIFE_ID } from './serviceLifeIdentities.generated';

/** Explicit aliases verified against the live categories registry. No fuzzy name matching. */
const CANONICAL_SLUG: Readonly<Record<string, string>> = { restaurants: 'restaurant', 'education-expat': 'education', 'beauty-spa': 'beauty' };
const LIFE_ID_BY_SLUG = Object.fromEntries(Object.entries(CATALOG_SERVICE_SLUG_BY_LIFE_ID).map(([id, slug]) => [slug, id]));
export function catalogServiceLifeId(slug: string, catalogRowId?: string): string | undefined {
  return LIFE_ID_BY_SLUG[CANONICAL_SLUG[slug] ?? slug] ?? catalogRowId;
}
export interface ServiceSituationLink {
  entity_id: string;
  role_scope: string[] | null;
  life_situations: { code: string; is_active: boolean | null } | null;
}
/** Public discovery uses guest-admitted links; null/empty scopes mean all roles,
 * matching resolve_life_os_context. A removed link stays removed. */
export function publicServiceSituationCodes(service: Pick<ServiceEntry, 'id' | 'catalogRowId'>, links: ServiceSituationLink[]): string[] {
  const identity = catalogServiceLifeId(service.id, service.catalogRowId);
  if (!identity) return [];
  return [...new Set(links.filter(link => link.entity_id === identity
    && (link.role_scope === null || link.role_scope.length === 0 || link.role_scope.includes('guest'))
    && link.life_situations?.is_active === true).map(link => link.life_situations!.code))];
}
