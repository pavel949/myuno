import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  canNotifyManualPayment,
  canNotifyProjectLead,
  isFresh,
  isUuid,
  NOTIFY_FRESH_WINDOW_MS,
  type NotifyCaller,
} from '../../../supabase/functions/_shared/notify-guards.ts';

const NOW = Date.parse('2026-11-25T12:00:00Z');
const fresh = new Date(NOW - 30_000).toISOString();
const stale = new Date(NOW - NOTIFY_FRESH_WINDOW_MS - 1).toISOString();
const PROJECT = '07652f9c-5bf5-4a7d-89e7-1c0ccf86fcd4';

const service: NotifyCaller = { mode: 'service' };
const anonymous: NotifyCaller = { mode: 'anonymous' };
const guest: NotifyCaller = { mode: 'user', userId: 'guest-1' };
const other: NotifyCaller = { mode: 'user', userId: 'other-1' };

describe('notify guards', () => {
  it('isUuid accepts only canonical UUID strings', () => {
    expect(isUuid(PROJECT)).toBe(true);
    expect(isUuid('07652f9c')).toBe(false);
    expect(isUuid("' or 1=1 --")).toBe(false);
    expect(isUuid(42)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('isFresh honours the window and rejects bad input', () => {
    expect(isFresh(fresh, NOW)).toBe(true);
    expect(isFresh(stale, NOW)).toBe(false);
    expect(isFresh(undefined, NOW)).toBe(false);
    expect(isFresh('garbage', NOW)).toBe(false);
    expect(isFresh(stale, NOW, NOTIFY_FRESH_WINDOW_MS * 2)).toBe(true);
  });

  describe('manual RUB payment', () => {
    const request = (overrides: Partial<{ userId: string | null; status: string | null; createdAt: string | null }> = {}) => ({
      userId: 'guest-1', status: 'awaiting_admin', createdAt: fresh, ...overrides,
    });

    it('service callers always pass', () => {
      expect(canNotifyManualPayment(service, request({ status: 'paid', createdAt: stale }), NOW)).toBe(true);
    });
    it('owning guest passes only while fresh and awaiting admin', () => {
      expect(canNotifyManualPayment(guest, request(), NOW)).toBe(true);
      expect(canNotifyManualPayment(guest, request({ createdAt: stale }), NOW)).toBe(false);
      expect(canNotifyManualPayment(guest, request({ status: 'contacted' }), NOW)).toBe(false);
    });
    it('other users and anonymous callers never pass', () => {
      expect(canNotifyManualPayment(other, request(), NOW)).toBe(false);
      expect(canNotifyManualPayment(anonymous, request(), NOW)).toBe(false);
      expect(canNotifyManualPayment(guest, request({ userId: null }), NOW)).toBe(false);
    });
  });

  describe('project lead (public form)', () => {
    const lead = (overrides: Partial<{ projectId: string | null; status: string | null; createdAt: string | null }> = {}) => ({
      projectId: PROJECT, status: 'new', createdAt: fresh, ...overrides,
    });

    it('anonymous submitter may alert once for a fresh new lead', () => {
      expect(canNotifyProjectLead(anonymous, lead(), PROJECT, NOW)).toBe(true);
    });
    it('replayed, worked or foreign-project leads are rejected', () => {
      expect(canNotifyProjectLead(anonymous, lead({ createdAt: stale }), PROJECT, NOW)).toBe(false);
      expect(canNotifyProjectLead(anonymous, lead({ status: 'contacted' }), PROJECT, NOW)).toBe(false);
      expect(canNotifyProjectLead(anonymous, lead({ projectId: 'other-project' }), PROJECT, NOW)).toBe(false);
    });
    it('service callers skip freshness but never cross projects', () => {
      expect(canNotifyProjectLead(service, lead({ createdAt: stale, status: 'contacted' }), PROJECT, NOW)).toBe(true);
      expect(canNotifyProjectLead(service, lead({ projectId: null }), PROJECT, NOW)).toBe(false);
    });
  });
});

describe('browser-reachable notifier source guards', () => {
  const root = resolve(__dirname, '../../..');
  const read = (fn: string) => readFileSync(resolve(root, `supabase/functions/${fn}/index.ts`), 'utf8');

  it('peylaa-lead-notify re-reads the lead and never trusts payload fields', () => {
    const src = read('peylaa-lead-notify');
    expect(src).toContain('canNotifyProjectLead(');
    expect(src).toContain('.from("nb_leads")');
    expect(src).not.toMatch(/payload\.record \|\| payload/);
    expect(src).not.toMatch(/\?\?\s*"66\d{8,}"/);
    expect(src.indexOf('canNotifyProjectLead(')).toBeLessThan(src.indexOf('await Promise.all(['));
  });

  it('notify-manual-payment-request accepts the order_id the browser sends and checks ownership first', () => {
    const src = read('notify-manual-payment-request');
    expect(src).toContain("isUuid(payload.order_id) ? 'order_id'");
    expect(src.indexOf('canNotifyManualPayment(')).toBeLessThan(src.indexOf('getAdminEmails()'));
  });

  it.each(['notify-admin-order', 'notify-admin-onboarding'])('%s is rate limited', (fn) => {
    expect(read(fn)).toMatch(/withRateLimit\(req, ['"]/);
  });

  it('notify-new-signup is rate limited through createNotifyHandler', () => {
    expect(read('notify-new-signup')).toMatch(/rateLimit: \{ maxRequests: \d+, windowSeconds: \d+ \}/);
  });
});
