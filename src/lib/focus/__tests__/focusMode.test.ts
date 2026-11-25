import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FOCUS_HIDDEN_APP_IDS,
  FOCUS_REDIRECT_TARGET,
  filterFocusHidden,
  isFocusHiddenApp,
  isFocusHiddenPath,
  isHiddenNow,
  setFocusModeActive,
  toPathname,
} from '../focusMode';
import { APP_REGISTRY } from '@/lib/appRegistry';

afterEach(() => setFocusModeActive(true));

describe('focus mode path rules', () => {
  it.each([
    '/beauty', '/beauty/salon/abc', '/restaurants', '/restaurants/x/reserve',
    '/transport/fast-track', '/cleaning', '/cleaning/1/book', '/babysitters',
    '/pets/transport', '/sim', '/kids', '/wedding', '/insurance/plan/p1',
  ])('hides %s', (path) => {
    expect(isFocusHiddenPath(path)).toBe(true);
  });

  it.each([
    '/', '/property', '/rent', '/buy', '/newbuilds', '/offplan', '/yachts', '/experiences',
    '/experiences?type=activity', '/transport', '/transport/airport-transfer', '/transport/vehicle/v1',
    '/flowers', '/events', '/services?category=plumbing', '/vip-concierge', '/thai-services', '/mc',
    '/legal', '/legal/visa', '/legal/contract-analysis', '/legal/deposit-vault/dispute/p1',
    '/discover/services', '/simulator', '/kidsclub', '/beautyshop',
  ])('keeps %s', (path) => {
    expect(isFocusHiddenPath(path)).toBe(false);
  });

  it('keeps pages for bookings that already exist', () => {
    expect(isFocusHiddenPath('/beauty/booking/b1')).toBe(false);
    expect(isFocusHiddenPath('/fitness/booking/b1')).toBe(false);
    expect(isFocusHiddenPath('/medical/appointment/a1')).toBe(false);
    // ...but not discovery pages next to them
    expect(isFocusHiddenPath('/beauty/booking')).toBe(true);
    expect(isFocusHiddenPath('/medical/clinic/c1')).toBe(true);
  });

  it('normalises absolute URLs, queries, hashes, case and trailing slashes', () => {
    expect(toPathname('https://www.myuno.app/Beauty/?x=1#top')).toBe('/beauty');
    expect(isFocusHiddenPath('https://www.myuno.app/cleaning/')).toBe(true);
    expect(isFocusHiddenPath('/SIM?step=2')).toBe(true);
  });

  it('never hides external links, anchors, mail or phone links', () => {
    expect(isFocusHiddenPath('https://example.com/beauty')).toBe(false);
    expect(isFocusHiddenPath('#beauty')).toBe(false);
    expect(isFocusHiddenPath('mailto:hi@example.com')).toBe(false);
    expect(isFocusHiddenPath('tel:+66000')).toBe(false);
    expect(isFocusHiddenPath(null)).toBe(false);
    expect(isFocusHiddenPath('')).toBe(false);
  });

  it('redirect target is itself visible', () => {
    expect(isFocusHiddenPath(FOCUS_REDIRECT_TARGET)).toBe(false);
  });
});

describe('focus mode app rules', () => {
  it('every hidden app id exists in the registry', () => {
    for (const id of FOCUS_HIDDEN_APP_IDS) expect(APP_REGISTRY[id], id).toBeDefined();
  });

  it('kept wedges stay visible', () => {
    for (const id of ['property', 'offplan', 'resale', 'newbuilds', 'developers', 'consultation',
      'mc', 'vip-concierge', 'thai-services', 'sos', 'yacht', 'experience', 'transfer', 'event',
      'vehicle', 'flowers', 'legal']) {
      expect(isFocusHiddenApp(id), id).toBe(false);
    }
  });

  it('hides the cut micro-apps', () => {
    for (const id of ['beauty', 'restaurant', 'cleaning', 'services-plumbing', 'water-activity', 'kids']) {
      expect(isFocusHiddenApp(id), id).toBe(true);
    }
  });

  it('every hidden standalone app route is actually hidden', () => {
    for (const id of FOCUS_HIDDEN_APP_IDS) {
      const route = APP_REGISTRY[id]?.route ?? '';
      // services-* and water-activity are filtered views of kept routes.
      if (route.includes('?')) continue;
      expect(isFocusHiddenPath(route), `${id} → ${route}`).toBe(true);
    }
  });
});

describe('flag switching', () => {
  it('isHiddenNow follows the module flag', () => {
    expect(isHiddenNow('/beauty')).toBe(true);
    setFocusModeActive(false);
    expect(isHiddenNow('/beauty')).toBe(false);
  });

  it('filterFocusHidden is a no-op when disabled and filters by href or app id when enabled', () => {
    const items = [
      { id: 'yacht', href: '/yachts' },
      { id: 'beauty', href: '/beauty' },
      { id: 'services-ac', href: '/services?category=ac-repair' },
    ];
    expect(filterFocusHidden(items, false, (i) => i.href, (i) => i.id)).toHaveLength(3);
    expect(filterFocusHidden(items, true, (i) => i.href, (i) => i.id).map((i) => i.id)).toEqual(['yacht']);
  });
});

describe('public sitemap', () => {
  it('lists no focus-hidden URLs', () => {
    const xml = readFileSync(resolve(__dirname, '../../../../public/sitemap-static.xml'), 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    expect(locs.filter((loc) => isFocusHiddenPath(loc))).toEqual([]);
  });
});
