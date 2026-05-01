/**
 * @module content/landings/personaAreaLandings
 * @description Wave 4 — long-tail SEO geo pages: persona × area combos.
 *
 * Generates one entry per (persona slug × area slug) where the area's
 * `relatedPersonaSlugs` includes the persona. Used by:
 *   - Route `/for/:persona/in/:area` (PersonaAreaLandingPage)
 *   - sitemap-landings.xml generation script
 */
import { AREA_LANDINGS, type AreaLanding } from './areaLandings';
import { PERSONA_LANDINGS } from './personaLandings';
import type { PersonaLanding } from '@/lib/landings/types';

export interface PersonaAreaLanding {
  personaSlug: string;
  areaSlug: string;
  persona: PersonaLanding;
  area: AreaLanding;
  /** Canonical path: `/for/:persona/in/:area`. */
  canonicalPath: string;
}

function build(): readonly PersonaAreaLanding[] {
  const out: PersonaAreaLanding[] = [];
  const personaBySlug = new Map(PERSONA_LANDINGS.map((p) => [p.slug, p] as const));
  for (const area of AREA_LANDINGS) {
    for (const personaSlug of area.relatedPersonaSlugs) {
      const persona = personaBySlug.get(personaSlug);
      if (!persona || persona.status !== 'live') continue;
      out.push({
        personaSlug,
        areaSlug: area.slug,
        persona,
        area,
        canonicalPath: `/for/${personaSlug}/in/${area.slug}`,
      });
    }
  }
  return out;
}

export const PERSONA_AREA_LANDINGS: readonly PersonaAreaLanding[] = build();

export function findPersonaAreaLanding(
  personaSlug: string,
  areaSlug: string,
): PersonaAreaLanding | undefined {
  return PERSONA_AREA_LANDINGS.find(
    (l) => l.personaSlug === personaSlug && l.areaSlug === areaSlug,
  );
}
