/**
 * Situation URL contract.
 *
 * `situationUrls` is the only place allowed to build situation destinations
 * (list / discover / map / landing override). These tests pin the exact strings
 * so no surface can drift into its own query-param dialect.
 */
import { describe, it, expect } from 'vitest';
import {
  buildSituationListUrl,
  buildDiscoverUrl,
  buildSituationMapUrl,
  buildSituationFilterSearch,
  parseSituationFilter,
  isSituationLandingOverride,
  DISCOVER_QUERY_PARAM,
  DISCOVER_SITUATION_PARAM,
} from '../situationUrls';
import { SITUATION_LANDING_OVERRIDES } from '../situationLandingMap';

describe('filter serialization', () => {
  it('drops empty values and trims input', () => {
    expect(buildSituationFilterSearch({})).toBe('');
    expect(buildSituationFilterSearch({ query: '   ', situation: '' })).toBe('');
    expect(buildSituationFilterSearch({ query: '  visa  ' })).toBe(`${DISCOVER_QUERY_PARAM}=visa`);
  });

  it('always emits params in the same order', () => {
    const a = buildSituationFilterSearch({ query: 'visa', situation: 'arrival' });
    const b = buildSituationFilterSearch({ situation: 'arrival', query: 'visa' });
    expect(a).toBe(b);
    expect(a).toBe(`${DISCOVER_QUERY_PARAM}=visa&${DISCOVER_SITUATION_PARAM}=arrival`);
  });

  it('round-trips through parseSituationFilter', () => {
    const state = { query: 'long term rent', situation: 'rent_long_term' };
    expect(parseSituationFilter(buildSituationFilterSearch(state))).toEqual(state);
    expect(parseSituationFilter(null)).toEqual({ query: '', situation: '' });
  });
});

describe('situation destinations', () => {
  it('routes a plain situation to its filtered catalog list', () => {
    expect(buildSituationListUrl('arrival')).toBe('/discover/arrival');
  });

  it('keeps the search query on the list URL, never the situation param', () => {
    expect(buildSituationListUrl('arrival', { query: 'visa', situation: 'arrival' })).toBe(
      '/discover/arrival?q=visa',
    );
  });

  it('honours marketing landing overrides and ignores filters for them', () => {
    for (const [code, href] of Object.entries(SITUATION_LANDING_OVERRIDES)) {
      expect(isSituationLandingOverride(code)).toBe(true);
      expect(buildSituationListUrl(code)).toBe(href);
      expect(buildSituationListUrl(code, { query: 'visa' })).toBe(href);
    }
    expect(isSituationLandingOverride('arrival')).toBe(false);
  });

  it('builds discover and map URLs from the identical filter state', () => {
    const filter = { query: 'visa', situation: 'visa_extension' };
    const search = buildSituationFilterSearch(filter);
    expect(buildDiscoverUrl(filter)).toBe(`/discover?${search}`);
    expect(buildSituationMapUrl(filter)).toBe(`/map?${search}`);
    expect(buildSituationMapUrl()).toBe('/map');
  });

  it('is idempotent — same input, same string, every call', () => {
    const filter = { query: ' visa ', situation: ' arrival ' };
    const calls = Array.from({ length: 5 }, () => [
      buildDiscoverUrl(filter),
      buildSituationMapUrl(filter),
      buildSituationListUrl('arrival', filter),
    ].join('|'));
    expect(new Set(calls).size).toBe(1);
  });
});
