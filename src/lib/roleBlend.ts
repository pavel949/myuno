import type { UserPersona } from '@/hooks/useUserPersonas';
import {
  CLUSTER_CATALOG,
  filterCatalogForUser,
  type ClusterCatalogEntry,
  type ClusterAudienceContext,
} from '@/lib/nav/clusterCatalog';

/**
 * ROLE_META — canonical visual + textual metadata for every persona.
 *
 * `descRu` / `descEn` come from design package v5 (`screens-core.jsx · S03_Roles`)
 * and are surfaced in `RoleSheet` as a sub-line under each role name. One
 * sentence each: nominal phrases describing the user's life-context, not
 * promises. Keep < 40 chars where possible to fit single-line on 375px.
 *
 * Color access is via `personaColor(persona)` below — it returns a
 * theme-aware `hsl(var(--persona-*))` string. The previous raw-hex `color`
 * field was removed 2026-05-21 after all consumers migrated.
 */
export const ROLE_META: Record<UserPersona, {
  short: string;
  glyph: string;
  label: string;
  labelRu: string;
  descEn: string;
  descRu: string;
}> = {
  tourist:                 { short: 'Tourist',   glyph: 'T', label: 'Visiting Phuket',    labelRu: 'Турист',        descEn: 'Arrival, stays, experiences',           descRu: 'Прилёт, аренда, впечатления' },
  resident:                { short: 'Resident',  glyph: 'R', label: 'Living in Phuket',   labelRu: 'Резидент',      descEn: 'Visa, housing, daily services',         descRu: 'Виза, жильё, ежедневные сервисы' },
  property_owner:          { short: 'Owner',     glyph: 'O', label: 'Property owner',     labelRu: 'Собственник',   descEn: 'Property and income management',        descRu: 'Управление недвижимостью и доходом' },
  investor:                { short: 'Investor',  glyph: 'I', label: 'Investor',           labelRu: 'Инвестор',      descEn: 'Pipeline, partners, capital',           descRu: 'Pipeline, партнёры, капитал' },
  real_estate_developer:   { short: 'Developer', glyph: 'D', label: 'Property developer', labelRu: 'Застройщик',    descEn: 'Projects, reservations, sales',         descRu: 'Проекты, бронирования, продажи' },
  local_services_provider: { short: 'Provider',  glyph: 'P', label: 'Local business',     labelRu: 'Поставщик',     descEn: 'Storefront, bookings, payouts',         descRu: 'Витрина, брони, выплаты' },
  family:                  { short: 'Family',    glyph: 'F', label: 'Family',             labelRu: 'Семья',         descEn: 'Schools, clinics, family logistics',    descRu: 'Школы, клиники, семейная логистика' },
  couple:                  { short: 'Couple',    glyph: 'C', label: 'Couple',             labelRu: 'Пара',          descEn: 'Restaurants, getaways, moments',        descRu: 'Рестораны, выезды, моменты' },
  nightlife:               { short: 'Night',     glyph: 'N', label: 'Nightlife',          labelRu: 'Ночная жизнь',  descEn: 'Clubs, bars, late-night transfers',     descRu: 'Клубы, бары, ночной трансфер' },
  active:                  { short: 'Active',    glyph: 'A', label: 'Active',             labelRu: 'Спорт',         descEn: 'Training, gear, sports facilities',     descRu: 'Тренировки, экипировка, спортзалы' },
  business:                { short: 'Business',  glyph: 'B', label: 'Business',           labelRu: 'Бизнес',        descEn: 'Companies, accounting, contracts',      descRu: 'Компании, бухгалтерия, договоры' },
  nomad:                   { short: 'Nomad',     glyph: 'M', label: 'Nomad',              labelRu: 'Номад',         descEn: 'Co-working, SIM, long-term housing',    descRu: 'Коворкинг, SIM, долгосрочное жильё' },
  pet_owner:               { short: 'Pets',      glyph: 'X', label: 'Pet owner',          labelRu: 'С питомцем',    descEn: 'Vets, pet-friendly housing, transfer',  descRu: 'Ветеринар, жильё с животными, перевозка' },
  relocation:              { short: 'Relocate',  glyph: 'L', label: 'Relocating',         labelRu: 'Переезд',       descEn: 'Visa, housing search, paperwork',       descRu: 'Виза, поиск жилья, документы' },
};

/**
 * Canonical persona color accessor. Returns a theme-aware HSL string referencing
 * the `--persona-*` token in `src/styles/tokens.css`. Use this everywhere
 * personas need a tint (avatar bg, status dot, active-card tint). The previous
 * raw-hex `ROLE_META[p].color` field was removed 2026-05-21.
 *
 * @example
 *   <span style={{ background: personaColor(p) }} />
 *   <div style={{ borderColor: personaColor(p, 0.35) }} />
 */
export function personaColor(persona: UserPersona, alpha?: number): string {
  const slug = persona.replace(/_/g, '-');
  return alpha !== undefined
    ? `hsl(var(--persona-${slug}) / ${alpha})`
    : `hsl(var(--persona-${slug}))`;
}

export type ClusterId = 'live' | 'manage' | 'invest' | 'legal' | 'arrive' | 'build';

/**
 * Persona → cluster scoring matrix. Drives ordering on Home `ClusterGrid`
 * (primary persona ×3, secondary ×2, tertiary ×1).
 *
 * NOTE: cluster labels / routes / counts no longer live here — they come
 * from the SSOT (`src/lib/catalog/taxonomy.ts`) via `CLUSTER_CATALOG`.
 * This file owns ONLY the persona-weighting model.
 */
const CLUSTER_SCORES: Record<UserPersona, Record<ClusterId, number>> = {
  tourist:                 { arrive: 5, live: 4, legal: 1, manage: 0, invest: 0, build: 0 },
  resident:                { live: 5, legal: 4, manage: 3, arrive: 1, invest: 2, build: 0 },
  property_owner:          { manage: 5, invest: 4, legal: 3, live: 2, build: 1, arrive: 0 },
  investor:                { invest: 5, legal: 3, manage: 2, build: 2, live: 1, arrive: 0 },
  real_estate_developer:   { build: 5, invest: 4, legal: 3, manage: 2, live: 1, arrive: 0 },
  local_services_provider: { live: 5, manage: 4, legal: 2, invest: 1, build: 1, arrive: 0 },
  family:                  { live: 4, legal: 3, arrive: 2, manage: 1, invest: 0, build: 0 },
  couple:                  { live: 5, arrive: 3, legal: 1, manage: 0, invest: 0, build: 0 },
  nightlife:               { live: 5, arrive: 2, legal: 0, manage: 0, invest: 0, build: 0 },
  active:                  { live: 4, arrive: 3, legal: 1, manage: 0, invest: 0, build: 0 },
  business:                { live: 3, legal: 4, manage: 3, invest: 2, build: 1, arrive: 0 },
  nomad:                   { live: 4, legal: 3, arrive: 2, manage: 0, invest: 0, build: 0 },
  pet_owner:               { live: 5, manage: 2, legal: 1, arrive: 1, invest: 0, build: 0 },
  relocation:              { arrive: 5, legal: 4, live: 3, manage: 2, invest: 1, build: 0 },
};

export const SIGNAL_ROUTE: Record<UserPersona, string> = {
  tourist:                 '/life/arrival',
  resident:                '/life/relocation',
  property_owner:          '/mc',
  investor:                '/invest',
  real_estate_developer:   '/developer-portal',
  local_services_provider: '/vendor',
  family:                  '/discover',
  couple:                  '/discover',
  nightlife:               '/discover',
  active:                  '/discover',
  business:                '/discover',
  nomad:                   '/discover',
  pet_owner:               '/discover',
  relocation:              '/life/relocation',
};

/**
 * Persona-weighted cluster ordering, returning **SSOT cluster entries**.
 *
 * - Primary persona (index 0) gets weight ×3, secondary ×2, tertiary ×1.
 * - Audience filter applied first: workspace clusters (e.g. `manage`) hidden
 *   from users who don't own them. Same contract as `filterCatalogForUser`.
 * - Number of available services per cluster:
 *   `entry.services.filter(s => s.status !== 'soon').length`.
 *
 * Pass `audienceCtx` when you also have an `NavRoleKey` (e.g. owner shell);
 * by default we use `personas` only, treating the user as a guest.
 */
export function blendClusters(
  personas: UserPersona[],
  audienceCtx?: ClusterAudienceContext,
  /**
   * Optional live catalog override. When provided (typically from
   * `useLiveClusterCatalog` reading `public.category_groups`/`categories`),
   * persona ordering is applied on top of the DB-driven clusters instead
   * of the static SSOT.
   */
  catalogOverride?: ClusterCatalogEntry[],
): ClusterCatalogEntry[] {
  const scores: Record<ClusterId, number> = { live: 0, manage: 0, invest: 0, legal: 0, arrive: 0, build: 0 };
  personas.forEach((p, i) => {
    const weight = i === 0 ? 3 : i === 1 ? 2 : 1;
    const s = CLUSTER_SCORES[p];
    if (!s) return;
    (Object.entries(s) as [ClusterId, number][]).forEach(([k, v]) => {
      scores[k] += v * weight;
    });
  });

  const ctx: ClusterAudienceContext =
    audienceCtx ?? { personas: personas as unknown as string[], role: null };
  const source = catalogOverride ?? filterCatalogForUser(ctx);
  const visible = catalogOverride
    ? source.filter((c) =>
        // re-apply audience filter on the override (safety net for workspace clusters)
        c.audience !== 'workspace' ||
        (c.personas ?? []).some((p) => (ctx.personas ?? []).includes(p)) ||
        (!!ctx.role && (c.roles ?? []).includes(ctx.role)),
      )
    : source;
  return [...visible].sort(
    (a, b) => (scores[b.id as ClusterId] ?? 0) - (scores[a.id as ClusterId] ?? 0),
  );
}

/**
 * @deprecated since 2026-04-26 — kept as backwards-compat shim while
 * downstream imports migrate. Reads straight from SSOT.
 */
export const CLUSTERS = CLUSTER_CATALOG;
