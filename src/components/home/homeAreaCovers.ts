import coastalIllustration from '@/assets/home-area-covers/coastal-illustration.svg';

export type AreaCover = { src: string; kind: 'illustration' | 'photo'; provenance: string };
/** Temporary original vector artwork. It depicts no identifiable district.
 * Replace individual entries only with verified district-correct, licensed media.
 */
const overrides: Record<string, AreaCover> = {};
const temporary: AreaCover = { src: coastalIllustration, kind: 'illustration', provenance: 'Original repository vector, created 2026-10-25; no external photograph or geographical claim.' };
export const homeAreaCover = (slug: string): AreaCover => overrides[slug] ?? temporary;
