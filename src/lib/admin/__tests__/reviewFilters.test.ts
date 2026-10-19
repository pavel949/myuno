import { describe, expect, it } from 'vitest';
import { ACTIVITY_FILTERS, PROJECT_REVIEW_FILTERS, UNASSIGNED_DEVELOPER_ID, matchesProjectReview, matchesPropertyReview, readFilter, updateReviewParams } from '../reviewFilters';

describe('read-only admin review filters', () => {
  it('composes property activity, approval and trimmed multilingual search', () => {
    const rows = [
      { title_ru: 'Дом у моря', is_active: true, approval_status: 'pending' },
      { title_ru: 'Дом у моря', is_active: true, approval_status: 'approved' },
      { title_ru: 'Дом у моря', is_active: false, approval_status: 'pending' },
      { title_ru: 'Другой объект', is_active: true, approval_status: 'pending' },
    ];
    expect(rows.filter(p => matchesPropertyReview(p, { q: '  МОРЯ ', activity: 'active', status: 'pending' }))).toEqual([rows[0]]);
  });
  it('does not infer pending, draft or inactive from missing fields', () => {
    expect(matchesPropertyReview({}, { q: '', activity: 'inactive', status: 'all' })).toBe(false);
    expect(matchesPropertyReview({}, { q: '', activity: 'all', status: 'pending' })).toBe(false);
    expect(matchesPropertyReview({}, { q: '', activity: 'all', status: 'draft' })).toBe(false);
    expect(matchesPropertyReview({}, { q: '', activity: 'all', status: 'all' })).toBe(true);
  });
  it('preserves unrelated route parameters and clears only requested filters', () => {
    const previous = new URLSearchParams('provider=fixture&status=pending&edit=property-1&source=dashboard');
    const next = updateReviewParams(previous, { activity: 'active', q: 'Sea view' });
    expect(next.get('provider')).toBe('fixture');
    expect(next.get('status')).toBe('pending');
    expect(next.get('edit')).toBe('property-1');
    expect(next.get('q')).toBe('Sea view');
    expect(updateReviewParams(next, { activity: 'all', q: '' }).toString()).toBe(previous.toString());
  });
  it('preserves literal all in search and provider values, resetting enum filters only', () => {
    const previous = new URLSearchParams('status=pending&activity=active&stage=completed&filter=stale');
    const next = updateReviewParams(previous, { q: 'all', provider: 'all', status: 'all', activity: 'all', stage: 'all', filter: 'all' });
    expect(next.toString()).toBe('q=all&provider=all');
    expect(updateReviewParams(next, { q: '' }).toString()).toBe('provider=all');
  });
  it('reads existing project console links and rejects unrecognized view values', () => {
    for (const value of PROJECT_REVIEW_FILTERS) expect(readFilter(value, PROJECT_REVIEW_FILTERS)).toBe(value);
    expect(readFilter('archived', ACTIVITY_FILTERS)).toBe('all');
  });
  it('composes project review, construction stage and search', () => {
    const p = { name_en: 'Synthetic coastal project', project_status: 'offplan', is_approved: false, needs_review: true, developer_id: UNASSIGNED_DEVELOPER_ID };
    expect(matchesProjectReview(p, { q: ' COASTAL ', stage: 'offplan', review: 'pending' })).toBe(true);
    expect(matchesProjectReview(p, { q: '', stage: 'completed', review: 'orphan' })).toBe(false);
    expect(matchesProjectReview(p, { q: '', stage: 'offplan', review: 'needs_review' })).toBe(true);
    expect(matchesProjectReview({ developer_id: null }, { q: '', stage: 'all', review: 'orphan' })).toBe(false);
    expect(matchesProjectReview({}, { q: '', stage: 'all', review: 'pending' })).toBe(false);
  });
  it('matches the existing 45-day KPI boundary without treating missing/invalid dates as stale', () => {
    const now = Date.parse('2026-10-19T00:00:00Z');
    const filter = { q: '', stage: 'all', review: 'stale' } as const;
    const updated_at = new Date(now - 45 * 86400000).toISOString();
    expect(matchesProjectReview({ is_approved: true, updated_at }, filter, now)).toBe(true);
    expect(matchesProjectReview({ is_approved: false, updated_at }, filter, now)).toBe(false);
    expect(matchesProjectReview({ is_approved: true, updated_at: new Date(now - 45 * 86400000 + 1).toISOString() }, filter, now)).toBe(false);
    for (const date of [undefined, '', 'invalid']) expect(matchesProjectReview({ is_approved: true, updated_at: date }, filter, now)).toBe(false);
  });
});
