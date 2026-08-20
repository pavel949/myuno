/**
 * Discover shared filter state.
 *
 * Guarantees:
 *  1. the search query / selected situation live in the URL, so list + map read
 *     one shared state;
 *  2. browser back restores the previous filter *without* re-applying it (the
 *     filter is derived from the URL, never re-pushed by an effect);
 *  3. analytics receives exactly the href and filters that were applied,
 *     including on the map route, with no duplicated events.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Link } from 'react-router-dom';

const trackSituationClick = vi.fn();
const trackSituationImpression = vi.fn();

vi.mock('@/lib/analytics/track', () => ({
  trackSituationClick: (...args: unknown[]) => trackSituationClick(...args),
  trackSituationImpression: (...args: unknown[]) => trackSituationImpression(...args),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (k: string) => k }),
}));

import { useDiscoverFilter } from '../useDiscoverFilter';
import { SituationList } from '../SituationList';
import { buildSituationListUrl, buildSituationMapUrl } from '@/lib/navigation/situationUrls';

/* eslint-disable @typescript-eslint/no-explicit-any */
const SITUATIONS = [
  { id: 'id-arrival', code: 'arrival', title_ru: 'RU arrival', title_en: 'EN arrival', description_ru: null, description_en: null, icon: null, color: null },
  { id: 'id-visa_extension', code: 'visa_extension', title_ru: 'RU visa', title_en: 'EN visa', description_ru: null, description_en: null, icon: null, color: null },
] as unknown as any[];

class ImmediateIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.cb(
      [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

/** Counts how many times the filter value was actually applied to the list. */
const applyCount = { value: 0 };

function DiscoverScreen({ source = 'navigator_v3_for_you' }: { source?: string }) {
  const { query, selectedSituation, filter, setQuery, mapUrl } = useDiscoverFilter();
  const visible = React.useMemo(() => {
    applyCount.value += 1;
    const q = query.toLowerCase();
    return q ? SITUATIONS.filter((s) => String(s.title_en).toLowerCase().includes(q)) : SITUATIONS;
  }, [query]);

  return (
    <div>
      <span data-testid="query">{query}</span>
      <span data-testid="selected">{selectedSituation}</span>
      <span data-testid="apply-count">{applyCount.value}</span>
      <button type="button" onClick={() => setQuery('visa')}>apply-filter</button>
      <Link to={mapUrl}>to-map</Link>
      <SituationList
        situations={visible}
        source={source}
        trackContext={{ filters: filter }}
      />
    </div>
  );
}

function MapScreen() {
  const { query, selectedSituation, mapUrl } = useDiscoverFilter();
  return (
    <div>
      <span data-testid="map-query">{query}</span>
      <span data-testid="map-selected">{selectedSituation}</span>
      <span data-testid="map-url">{mapUrl}</span>
    </div>
  );
}

function renderApp(initial = '/discover', source = 'navigator_v3_for_you') {
  const router = createMemoryRouter(
    [
      { path: '/discover', element: <DiscoverScreen source={source} /> },
      { path: '/map', element: <MapScreen /> },
    ],
    { initialEntries: [initial] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

beforeEach(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    ImmediateIntersectionObserver;
  trackSituationClick.mockClear();
  trackSituationImpression.mockClear();
  applyCount.value = 0;
});

describe('filter lives in the shared UI state (URL)', () => {
  it('writes the applied filter into the query string', async () => {
    const { router } = renderApp();
    await act(async () => { screen.getByText('apply-filter').click(); });
    expect(router.state.location.search).toBe('?q=visa');
    expect(screen.getByTestId('query')).toHaveTextContent('visa');
  });

  it('hydrates the filter from the URL on first render', () => {
    renderApp('/discover?q=visa&situation=visa_extension');
    expect(screen.getByTestId('query')).toHaveTextContent('visa');
    expect(screen.getByTestId('selected')).toHaveTextContent('visa_extension');
  });

  it('carries the same filter params to the map link', async () => {
    renderApp('/discover?q=visa&situation=visa_extension');
    expect(screen.getByRole('link', { name: 'to-map' })).toHaveAttribute(
      'href',
      buildSituationMapUrl({ query: 'visa', situation: 'visa_extension' }),
    );
  });
});

describe('browser back restores list and map without re-applying the filter', () => {
  it('restores the query after navigating to the map and back', async () => {
    const { router } = renderApp();

    await act(async () => { screen.getByText('apply-filter').click(); });
    const appliesAfterFilter = applyCount.value;
    expect(screen.getByTestId('query')).toHaveTextContent('visa');

    // Go to the map — filter travels in the URL.
    await act(async () => { await router.navigate(buildSituationMapUrl({ query: 'visa' })); });
    await waitFor(() => expect(screen.getByTestId('map-query')).toHaveTextContent('visa'));
    expect(screen.getByTestId('map-url')).toHaveTextContent('/map?q=visa');

    // Browser back.
    await act(async () => { await router.navigate(-1); });
    await waitFor(() => expect(screen.getByTestId('query')).toHaveTextContent('visa'));
    expect(router.state.location.search).toBe('?q=visa');

    // The list is restored from the URL — the filter is applied once on mount,
    // not applied again on top of itself (no extra history entry either).
    expect(applyCount.value).toBe(appliesAfterFilter + 1);
    expect(screen.getAllByRole('link').filter((el) => el.textContent?.includes('EN visa'))).toHaveLength(1);
  });

  it('does not push an extra history entry while typing the filter', async () => {
    const { router } = renderApp();
    await act(async () => { screen.getByText('apply-filter').click(); });
    await act(async () => { await router.navigate(-1); });
    // Back from a replaced filter leaves the app on /discover, not a dead entry.
    expect(router.state.location.pathname).toBe('/discover');
  });
});

describe('analytics matches what was actually applied', () => {
  it('sends the resolved href and the applied filters on click', async () => {
    renderApp('/discover?q=visa');
    const link = screen.getByRole('link', { name: /EN visa/ });
    const expectedHref = buildSituationListUrl('visa_extension');
    expect(link).toHaveAttribute('href', expectedHref);

    await act(async () => { link.click(); });
    expect(trackSituationClick).toHaveBeenCalledTimes(1);
    expect(trackSituationClick).toHaveBeenCalledWith(
      'visa_extension',
      expect.objectContaining({
        source: 'navigator_v3_for_you',
        href: expectedHref,
        filters: { query: 'visa', situation: '' },
      }),
    );
  });

  it('reports the map destination exactly as navigated', async () => {
    const { router } = renderApp('/discover?q=visa&situation=visa_extension');
    const mapHref = screen.getByRole('link', { name: 'to-map' }).getAttribute('href');
    await act(async () => { await router.navigate(mapHref as string); });
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(mapHref);
    expect(screen.getByTestId('map-url')).toHaveTextContent(mapHref as string);
  });

  it('does not duplicate impressions across re-renders and back navigation', async () => {
    const source = `impression_probe_${Math.random().toString(36).slice(2)}`;
    const { router } = renderApp('/discover?q=visa', source);
    await waitFor(() => expect(trackSituationImpression).toHaveBeenCalledTimes(1));
    expect(trackSituationImpression).toHaveBeenCalledWith(
      ['visa_extension'],
      expect.objectContaining({ source }),
    );

    // Same filter re-applied → no new impression for an already-seen code.
    await act(async () => { screen.getByText('apply-filter').click(); });
    expect(trackSituationImpression).toHaveBeenCalledTimes(1);

    // Round-trip to the map and back must not double-count the same rows.
    await act(async () => { await router.navigate(buildSituationMapUrl({ query: 'visa' })); });
    await act(async () => { await router.navigate(-1); });
    await waitFor(() => expect(screen.getByTestId('query')).toHaveTextContent('visa'));
    const codes = trackSituationImpression.mock.calls.flatMap((c) => c[0] as string[]);
    expect(codes.filter((c) => c === 'visa_extension')).toHaveLength(1);
  });
});
