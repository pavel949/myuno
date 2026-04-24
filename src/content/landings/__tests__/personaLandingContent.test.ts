/**
 * Live Persona Landing — Content completeness gate.
 *
 * Pre-deploy validator that ensures every persona landing marked
 * `status: 'live'` ships with the minimum content surface required
 * by §M6 (B.7) and the Tone-of-Voice canon §14:
 *
 *   1. H1 — non-empty in RU and EN.
 *   2. Subtitle — non-empty in RU and EN, ≤25 words RU (CONTENT_STYLE §4).
 *   3. FAQ — at least 2 entries, each with bilingual q + a.
 *   4. At least one seeded CTA section:
 *        - `primaryCta` with bilingual label + non-empty href, OR
 *        - `services[]` with at least one entry that has a bilingual label
 *          and a non-empty href (these render as CTA cards on the page).
 *      `live` landings must satisfy the primaryCta path AND have ≥1 service,
 *      because `isLivePersonaLanding()` already requires `services.length > 0`.
 *
 * Why a separate file from `personaLandings.test.ts`:
 *  - That file pins the *count* and *slug set* of live personas (M10b contract).
 *  - This file pins *content quality* per landing — a deploy gate that fails
 *    fast if a live persona is missing a heading, subtitle, FAQ block, or CTA.
 */
import { describe, it, expect } from 'vitest';
import { PERSONA_LANDINGS } from '../personaLandings';
import { isLivePersonaLanding } from '@/lib/landings/types';
import type { PersonaLanding, BilingualString } from '@/lib/landings/types';

const SUBTITLE_MAX_WORDS_RU = 25;

const livePersonas: PersonaLanding[] = PERSONA_LANDINGS.filter(
  (l) => l.status === 'live',
);

function isNonEmptyBilingual(value: BilingualString | undefined): value is BilingualString {
  return Boolean(value && value.ru.trim().length > 0 && value.en.trim().length > 0);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

describe('Live persona landings — content completeness gate', () => {
  it('there is at least one live persona to validate', () => {
    // Sanity check: if this fails, the live promotion got reverted.
    expect(livePersonas.length).toBeGreaterThan(0);
  });

  it('every live landing passes isLivePersonaLanding() (status + seo + non-empty arrays)', () => {
    const offenders = livePersonas
      .filter((l) => !isLivePersonaLanding(l))
      .map((l) => l.slug);
    expect(
      offenders,
      `Live personas failing isLivePersonaLanding(): ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  for (const landing of livePersonas) {
    describe(`/for/${landing.slug} (${landing.personaCode})`, () => {
      // 1. H1 ─────────────────────────────────────────────────────────
      it('has a bilingual H1', () => {
        expect(
          isNonEmptyBilingual(landing.h1),
          `H1 missing/empty for ${landing.slug}`,
        ).toBe(true);
      });

      // 2. Subtitle ───────────────────────────────────────────────────
      it('has a bilingual subtitle', () => {
        expect(
          isNonEmptyBilingual(landing.subtitle),
          `Subtitle missing/empty for ${landing.slug}`,
        ).toBe(true);
      });

      it(`subtitle stays within ${SUBTITLE_MAX_WORDS_RU} words (RU, CONTENT_STYLE §4)`, () => {
        const ruWords = wordCount(landing.subtitle.ru);
        expect(
          ruWords,
          `RU subtitle of "${landing.slug}" has ${ruWords} words (max ${SUBTITLE_MAX_WORDS_RU})`,
        ).toBeLessThanOrEqual(SUBTITLE_MAX_WORDS_RU);
      });

      // 3. FAQ ────────────────────────────────────────────────────────
      it('has at least 2 FAQ entries', () => {
        expect(
          landing.faq.length,
          `FAQ block of "${landing.slug}" has ${landing.faq.length} entries (min 2)`,
        ).toBeGreaterThanOrEqual(2);
      });

      it('every FAQ entry has bilingual question and answer', () => {
        const broken = landing.faq
          .map((entry, i) => ({
            i,
            okQ: isNonEmptyBilingual(entry.q),
            okA: isNonEmptyBilingual(entry.a),
          }))
          .filter((e) => !e.okQ || !e.okA);
        expect(
          broken,
          `FAQ entries missing ru/en for "${landing.slug}": ${broken
            .map((b) => `#${b.i}`)
            .join(', ')}`,
        ).toEqual([]);
      });

      // 4. CTA surface ────────────────────────────────────────────────
      it('has a seeded primaryCta with bilingual label and non-empty href', () => {
        const cta = landing.primaryCta;
        expect(cta, `primaryCta missing for "${landing.slug}"`).toBeDefined();
        expect(
          isNonEmptyBilingual(cta.label),
          `primaryCta.label missing ru/en for "${landing.slug}"`,
        ).toBe(true);
        expect(
          cta.href.trim().length,
          `primaryCta.href empty for "${landing.slug}"`,
        ).toBeGreaterThan(0);
        // Hrefs must be internal routes or absolute URLs — never bare text.
        expect(
          /^(https?:\/\/|[/#])/.test(cta.href),
          `primaryCta.href "${cta.href}" is not a valid route for "${landing.slug}"`,
        ).toBe(true);
      });

      it('renders at least one service card (CTA section)', () => {
        expect(
          landing.services.length,
          `Services CTA section empty for "${landing.slug}"`,
        ).toBeGreaterThanOrEqual(1);

        const broken = landing.services
          .map((s, i) => ({
            i,
            slug: s.slug,
            okLabel: isNonEmptyBilingual(s.label),
            okHref: typeof s.href === 'string' && /^(https?:\/\/|[/#])/.test(s.href),
          }))
          .filter((s) => !s.okLabel || !s.okHref);

        expect(
          broken,
          `Service cards missing label/href in "${landing.slug}": ${broken
            .map((b) => `${b.slug || `#${b.i}`}`)
            .join(', ')}`,
        ).toEqual([]);
      });

      it('secondaryCta (if present) is fully formed', () => {
        if (!landing.secondaryCta) return;
        expect(isNonEmptyBilingual(landing.secondaryCta.label)).toBe(true);
        expect(landing.secondaryCta.href.trim().length).toBeGreaterThan(0);
        expect(/^(https?:\/\/|[/#])/.test(landing.secondaryCta.href)).toBe(true);
      });

      // 5. Pains — required for live (already enforced by isLivePersonaLanding,
      //    but assert per-entry bilingual-ness here for a clean error).
      it('every pain bullet is bilingual and non-empty', () => {
        const broken = landing.pains
          .map((p, i) => ({ i, ok: isNonEmptyBilingual(p) }))
          .filter((p) => !p.ok);
        expect(
          broken,
          `Pain bullets missing ru/en in "${landing.slug}": ${broken
            .map((b) => `#${b.i}`)
            .join(', ')}`,
        ).toEqual([]);
      });
    });
  }
});
