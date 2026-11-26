/**
 * Round 4A HQ — pure logic: ClearView review model, copy check, content
 * inventory checks, notification grouping, access policy ↔ SQL pairing.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  analysisKey, categoryStatus, effectiveConfidence, liveScore, parseCategoryReview, publishChecklist, toReportPatch,
  MISSING_EVIDENCE_CONFIDENCE_CAP, type CategoryMap, type RiskItem,
} from '@/lib/clearview/reviewModel';
import { CLEARVIEW_CATEGORIES } from '@/lib/clearview/methodology';
import { checkCopy } from '@/lib/content/copyCheck';
import { contentChecks, fromRelocation, countInternalLinks } from '@/lib/content/contentInventory';
import { groupNotifications } from '@/lib/notifications/groupNotifications';
import { APPROVAL_ROLES, canApprove, permissionFor, HQ_ROLE_MATRIX } from '@/lib/access/hqAccessPolicy';
import { approvableTotal, periodFor, summariseOrders, type PayoutLine } from '@/hooks/useHqPayoutRun';

const item = (over: Partial<RiskItem> = {}): RiskItem => ({
  id: 'i', title: 'Late delivery penalty weak', probability: 4, severity: 3, detectability: 2, mitigation: 1, confidence: 0.95, evidence: 'document', ...over,
});

function fullMap(score: number): CategoryMap {
  const out: CategoryMap = {};
  for (const c of CLEARVIEW_CATEGORIES) out[analysisKey(c)] = { ...parseCategoryReview({}, score), public_finding: 'Plain finding.' };
  return out;
}

describe('ClearView review model', () => {
  it('caps confidence when evidence is missing', () => {
    expect(effectiveConfidence(item({ evidence: 'missing', confidence: 0.95 }))).toBe(MISSING_EVIDENCE_CONFIDENCE_CAP);
    expect(effectiveConfidence(item({ evidence: 'registry', confidence: 0.95 }))).toBe(0.95);
  });

  it('computes canon V3 score: Σ score×10×weight + modifiers, clamped, grade only when complete', () => {
    expect(liveScore(fullMap(8), [])).toMatchObject({ score: 80, grade: 'AA', complete: true });
    expect(liveScore(fullMap(8), [{ type: 'verified_structure', delta: 3, reason: 'x' }]).score).toBe(83);
    expect(liveScore(fullMap(10), [{ type: 'x', delta: 9, reason: 'x' }]).score).toBe(100);
    const partial = fullMap(8);
    partial.legal = { ...partial.legal, score: null };
    expect(liveScore(partial, []).grade).toBeNull();
  });

  it('tolerates AI output and clamps item values', () => {
    const r = parseCategoryReview({ score: 12, findings: ['a', 3], items: [{ title: 'x', probability: 9, evidence: 'nope' }, { nope: 1 }] }, null);
    expect(r.score).toBe(10);
    expect(r.findings).toEqual(['a']);
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ probability: 5, evidence: 'missing' });
  });

  it('derives category status and blocks publishing until two fresh sign-offs', () => {
    const map = fullMap(8);
    expect(categoryStatus(map.legal)).toBe('done');
    expect(categoryStatus({ ...map.legal, items: [item({ evidence: 'missing' })] })).toBe('waiting');
    expect(categoryStatus({ ...map.legal, public_finding: '' })).toBe('active');
    expect(publishChecklist(map, 1).find((c) => c.id === 'second_review')?.ok).toBe(false);
    expect(publishChecklist(map, 2).every((c) => c.ok)).toBe(true);
    map.developer = { ...map.developer, public_finding: 'A seamless, revolutionary project.' };
    expect(publishChecklist(map, 2).find((c) => c.id === 'copy')?.ok).toBe(false);
  });

  it('serialises back to analysis jsonb and score_* columns without dropping AI fields', () => {
    const map = fullMap(7);
    const patch = toReportPatch(map, [], { legal: { maturity_level: 3, extra: 'keep' } });
    expect(patch.score_legal).toBe(7);
    expect((patch.analysis.legal as Record<string, unknown>).extra).toBe('keep');
    expect(patch.total_score).toBe(70);
    expect(patch.grade).toBe('A');
  });
});

describe('copy check', () => {
  it('flags tone-of-voice bans, semantic-core synonyms and unsourced numbers', () => {
    const kinds = checkCopy('Уникальный проект. Expected returns of 8% a year. MyUNO').map((i) => i.kind);
    expect(kinds).toContain('banned');
    expect(kinds).toContain('synonym');
    expect(kinds).toContain('unsourced_number');
    expect(checkCopy('Yield 6% (source: Land Office, 2026).').filter((i) => i.kind === 'unsourced_number')).toHaveLength(0);
    expect(checkCopy('')).toEqual([]);
  });
});

describe('content inventory', () => {
  const row = { id: '1', slug: 'dtv', title_en: 'DTV visa 2026', title_ru: '', summary_en: 'x'.repeat(80), summary_ru: null, content_en: 'See [rentals](/rent).', content_ru: null, is_published: true, updated_at: '2026-11-04', category: 'visa' };
  it('marks missing translations and counts internal links', () => {
    const item = fromRelocation(row);
    expect(item.status).toBe('partial');
    const { checks } = contentChecks(item);
    expect(checks.find((c) => c.id === 'languages')).toMatchObject({ ok: false, value: 'RU' });
    expect(countInternalLinks(item.body)).toBe(1);
  });
});

describe('notification grouping', () => {
  it('groups by trip and purchase, newest group first, other last', () => {
    const g = groupNotifications([
      { id: 'a', created_at: '2026-11-20', data: { booking_id: 'b1' } },
      { id: 'b', created_at: '2026-11-22', data: { order_id: 'o1' } },
      { id: 'c', created_at: '2026-11-25', data: null },
      { id: 'd', created_at: '2026-11-21', data: { booking_id: 'b1' } },
    ]);
    expect(g.map((x) => x.key)).toEqual(['purchase:o1', 'trip:b1', 'other']);
    expect(g[1].items.map((i) => i.id)).toEqual(['a', 'd']);
  });
});

describe('HQ access policy', () => {
  it('approval roles match public.hq_can_approve in the migration', () => {
    const sql = readFileSync('supabase/migrations/20261125120000_hq_dual_approvals.sql', 'utf8');
    const fn = sql.slice(sql.indexOf('FUNCTION public.hq_can_approve'), sql.indexOf('FUNCTION public.hq_record_approval'));
    const block = (entity: string) => fn.slice(fn.indexOf(`WHEN '${entity}'`)).split(/WHEN '|ELSE/)[1];
    for (const [entity, roles] of Object.entries(APPROVAL_ROLES)) {
      const found = [...block(entity).matchAll(/'(\w+)'::public\.app_role/g)].map((m) => m[1]).sort();
      expect(found).toEqual([...roles].sort());
    }
  });

  it('matrix approve rights agree with approval roles', () => {
    for (const role of Object.keys(HQ_ROLE_MATRIX)) {
      const r = role as keyof typeof HQ_ROLE_MATRIX;
      expect(permissionFor(r, 'payouts').approve).toBe(canApprove([r], 'payout_run'));
      expect(permissionFor(r, 'clearview').approve).toBe(canApprove([r], 'clearview_report'));
    }
  });
});

describe('payout run', () => {
  it('sums paid orders and refunds; holds exceptions out of the approval total', () => {
    expect(summariseOrders([
      { total_amount: 100, platform_fee_amount: 10, status: 'completed' },
      { total_amount: 50, platform_fee_amount: 5, status: 'refunded' },
      { total_amount: 70, platform_fee_amount: 7, status: 'pending' },
    ])).toEqual({ collected: 100, platformFees: 10, refunds: 50, refundCount: 1 });
    const line = (status: PayoutLine['status'], payout: number): PayoutLine => ({ id: String(payout), kind: 'provider', payee: 'p', detail: '', gross: payout, fees: 0, payout, status });
    expect(approvableTotal([line('ready', 10), line('exception', 99), line('processing', 5)])).toEqual({ count: 2, amount: 15 });
    expect(periodFor(new Date('2026-11-25T10:00:00Z')).key).toBe('2026-11');
  });
});
