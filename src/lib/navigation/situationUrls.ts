/**
 * Situation URL builders — the single place that knows how a life-situation
 * turns into a URL.
 *
 * Every surface (Discover list rows, situation cards, the map entry point, the
 * related-situations block, analytics payloads) must go through these helpers,
 * so the query string and params can never drift between call sites.
 *
 * Contract:
 *  - list      → `/discover/:code` (or a marketing landing override)
 *  - discover  → `/discover` with the shared filter state in the query string
 *  - map       → `/map` carrying the *same* filter params as `/discover`
 */
import { APP_ROUTES } from '@/lib/config/routes';
import { SITUATION_LANDING_OVERRIDES } from './situationLandingMap';

/** Shared filter/selection state of the Discover surface, mirrored in the URL. */
export interface SituationFilterState {
  /** Free-text search query. */
  query?: string | null;
  /** Currently selected situation code (list filter / map focus). */
  situation?: string | null;
}

export const DISCOVER_QUERY_PARAM = 'q';
export const DISCOVER_SITUATION_PARAM = 'situation';

/** Normalize the filter state so equal filters always serialize identically. */
export function normalizeSituationFilter(state: SituationFilterState = {}): {
  query: string;
  situation: string;
} {
  return {
    query: (state.query ?? '').trim(),
    situation: (state.situation ?? '').trim(),
  };
}

/**
 * Serialize the filter state to a stable query string (no leading `?`).
 * Params are always emitted in the same order and empty values are dropped.
 */
export function buildSituationFilterSearch(state: SituationFilterState = {}): string {
  const { query, situation } = normalizeSituationFilter(state);
  const params = new URLSearchParams();
  if (query) params.set(DISCOVER_QUERY_PARAM, query);
  if (situation) params.set(DISCOVER_SITUATION_PARAM, situation);
  return params.toString();
}

/** Read the filter state back from a URLSearchParams / query string. */
export function parseSituationFilter(
  search: URLSearchParams | string | null | undefined,
): { query: string; situation: string } {
  const params =
    typeof search === 'string' || search == null
      ? new URLSearchParams(search ?? '')
      : search;
  return normalizeSituationFilter({
    query: params.get(DISCOVER_QUERY_PARAM),
    situation: params.get(DISCOVER_SITUATION_PARAM),
  });
}

function withSearch(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

/** True when the situation opens a marketing landing instead of the catalog. */
export function isSituationLandingOverride(code: string): boolean {
  return Boolean(SITUATION_LANDING_OVERRIDES[code]);
}

/** Destination of a situation click: catalog list, or landing override. */
export function buildSituationListUrl(
  code: string,
  state: SituationFilterState = {},
): string {
  const override = SITUATION_LANDING_OVERRIDES[code];
  if (override) return override;
  // The selected situation lives in the path, never duplicated in the query.
  const { query } = normalizeSituationFilter(state);
  return withSearch(`/discover/${code}`, buildSituationFilterSearch({ query }));
}

/** The Discover surface itself, carrying the shared filter state. */
export function buildDiscoverUrl(state: SituationFilterState = {}): string {
  return withSearch(APP_ROUTES.DISCOVER ?? '/discover', buildSituationFilterSearch(state));
}

/** Map entry point — same filter params as `/discover`, so back/forward match. */
export function buildSituationMapUrl(state: SituationFilterState = {}): string {
  return withSearch(APP_ROUTES.MAP ?? '/map', buildSituationFilterSearch(state));
}
