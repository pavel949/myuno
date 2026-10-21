import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchModerationSourcePage, fetchModerationCategoryOptions } from './adminModeration';
import { fetchTeamModerationCounts, fetchTeamModerationPage, reviewTeamModerationItem } from './teamModeration';
import { fetchInbox, inboxStatusForStoredValue } from './adminInbox';

const db = vi.hoisted(() => ({ calls: [] as { table: string; operations: unknown[][] }[], result: { data: [] as unknown, error: null as unknown, count: 801 as number | null } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const call = { table, operations: [] as unknown[][] }; db.calls.push(call);
  const chain = Object.fromEntries(['select', 'eq', 'is', 'or', 'order', 'range', 'update'].map(method => [method, (...args: unknown[]) => { call.operations.push([method, ...args]); return chain; }])) as Record<string, (...args: unknown[]) => unknown> & { then: (resolve: (value: unknown) => unknown) => unknown; single: () => unknown };
  chain.then = resolve => Promise.resolve(db.result).then(resolve);
  chain.single = () => Promise.resolve(db.result);
  return chain;
} } }));
beforeEach(() => { db.calls = []; db.result = { data: [], error: null, count: 801 }; });

describe('per-source server review pages', () => {
  it('loads canonical options independently of review rows and includes paged inactive product taxonomy', async () => {
    expect(await fetchModerationCategoryOptions('property')).toContain('land');
    expect(await fetchModerationCategoryOptions('listing')).toContain('yacht');
    expect(db.calls).toHaveLength(0);
    Object.defineProperty(db.result, 'data', { get: () => db.calls.length === 1 ? Array.from({ length: 50 }, (_, index) => ({ slug: 'category-' + index })) : [{ slug: 'retired-category' }] });
    expect(await fetchModerationCategoryOptions('product')).toContain('retired-category');
    expect(db.calls).toHaveLength(2);
    expect(db.calls[1].operations.at(-1)).toEqual(['range', 50, 99]);
    expect(db.calls.flatMap(call => call.operations)).not.toContainEqual(['eq', 'is_active', true]);
  });
  it('reaches old pending properties beyond the former newest500 cap, filtering before range', async () => {
    db.result.data = [{ id: 'older', title_en: 'Older submitted home', approval_status: 'pending', updated_at: 'revision', created_at: '2024-01-01' }];
    const page = await fetchModerationSourcePage({ source: 'property', queue: 'pending', page: 12, search: 'Older', category: 'villa' });
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0].table).toBe('properties');
    expect(db.calls[0].operations).toContainEqual(['eq', 'approval_status', 'pending']);
    expect(db.calls[0].operations).toContainEqual(['is', 'deleted_at', null]);
    expect(db.calls[0].operations).toContainEqual(['eq', 'property_type', 'villa']);
    expect(db.calls[0].operations).toContainEqual(['or', 'title_en.ilike.%Older%,title_ru.ilike.%Older%']);
    expect(db.calls[0].operations.at(-1)).toEqual(['range', 600, 649]);
    expect(page.totals.property).toBe(801);
    expect(page.totals.listing).toBeNull();
    expect(page.items[0]).toMatchObject({ id: 'older', updated_at: 'revision', type: 'property' });
  });
  it('keeps drafts separate from submission and never infers pending from inactivity', async () => {
    await fetchModerationSourcePage({ source: 'listing', queue: 'draft', page: 0 });
    expect(db.calls[0].operations).toContainEqual(['eq', 'approval_status', 'draft']);
    await fetchModerationSourcePage({ source: 'service', queue: 'inactive', page: 1 });
    expect(db.calls[1].operations).toContainEqual(['eq', 'is_active', false]);
    expect(db.calls[1].operations).not.toContainEqual(['eq', 'approval_status', 'pending']);
    await expect(fetchModerationSourcePage({ source: 'service', queue: 'pending', page: 0 })).rejects.toThrow('Invalid moderation source/state');
  });
  it('does not pass text-query grammar through as a second filter', async () => {
    await fetchModerationSourcePage({ source: 'listing', queue: 'pending', page: 0, search: '%,(approval_status.eq.approved)' });
    const expression = db.calls[0].operations.find(operation => operation[0] === 'or')?.[1] as string;
    expect(expression).not.toContain('(');
    expect(expression).not.toContain(')');
  });
  it('reports unavailable source/count without trusting partial rows', async () => {
    db.result = { data: [{ id: 'partial' }], error: new Error('offline'), count: 30 };
    expect(await fetchModerationSourcePage({ source: 'property', queue: 'pending', page: 0 })).toMatchObject({ items: [], errors: ['property'], totals: { property: null } });
    db.result = { data: [], error: null, count: null };
    expect((await fetchModerationSourcePage({ source: 'product', queue: 'inactive', page: 0 })).errors).toEqual(['product']);
  });
});

describe('team review safety', () => {
  it('filters status on the server and pages beyond100 with exact source counts', async () => {
    const result = await fetchTeamModerationPage('pending', 3);
    expect(result.total).toBe(801);
    expect(db.calls[0].operations).toContainEqual(['eq', 'status', 'pending']);
    expect(db.calls[0].operations.at(-1)).toEqual(['range', 150, 199]);
  });
  it('distinguishes failed source counts from zero', async () => {
    db.result = { data: null, count: null, error: new Error('denied') };
    expect(await fetchTeamModerationCounts()).toEqual({ pending: null, approved: null, rejected: null });
    await expect(fetchTeamModerationPage('pending', 0)).rejects.toThrow('denied');
  });
  it('requires the reviewed pending revision and an authoritative returned row', async () => {
    db.result.data = { id: 'one', status: 'approved' };
    await reviewTeamModerationItem({ id: 'one', status: 'approved', expectedUpdatedAt: 'revision' });
    expect(db.calls[0].operations).toContainEqual(['eq', 'status', 'pending']);
    expect(db.calls[0].operations).toContainEqual(['eq', 'updated_at', 'revision']);
    db.result.data = null;
    await expect(reviewTeamModerationItem({ id: 'one', status: 'approved', expectedUpdatedAt: 'revision' })).rejects.toThrow('not confirmed');
    const count = db.calls.length;
    await expect(reviewTeamModerationItem({ id: 'one', status: 'approved', expectedUpdatedAt: '' })).rejects.toThrow('Reload');
    expect(db.calls).toHaveLength(count);
  });
});

describe('application source isolation', () => {
  it.each(['', 'new', 'pending', null])('treats only supported exact empty/new values as New: %s', raw => {
    expect(inboxStatusForStoredValue('partner_applications', raw)).toBe('new');
  });
  it.each(['approved', ' NEW ', 'NEW', 'under_review', 'unknown'])('keeps domain and noncanonical text status under All: %s', raw => {
    expect(inboxStatusForStoredValue('partner_applications', raw)).toBe('other');
  });
  it('uses only valid enum literals and exact enum type search for listing applications', async () => {
    await fetchInbox('listing_applications', 0, 'new', 'property');
    const expression = db.calls[0].operations.find(operation => operation[0] === 'or')?.[1] as string;
    expect(expression).toContain('status.in.(pending)');
    expect(expression).toContain('listing_type.eq.property');
    expect(expression).not.toContain('listing_type.ilike');
    expect(expression).not.toContain('status.eq.""');
    expect(expression).not.toContain('status.is.null');
    expect(inboxStatusForStoredValue('listing_applications', 'draft')).toBe('other');
    expect(inboxStatusForStoredValue('listing_applications', 'approved')).toBe('other');
    expect(inboxStatusForStoredValue('listing_applications', 'pending')).toBe('new');
    expect(inboxStatusForStoredValue('listing_applications', 'rejected')).toBe('closed');
    db.calls = [];
    expect(await fetchInbox('listing_applications', 0, 'escalated')).toEqual({ items: [], total: 0 });
    expect(db.calls).toHaveLength(0);
  });
  it.each([['partner_applications', 'business_category'], ['listing_applications', 'service_category'], ['consultation_requests', 'vertical_id'], ['nb_leads', 'phone'], ['property_inquiries', 'message']] as const)('searches advertised fields for %s', async (source, field) => {
    await fetchInbox(source, 0, 'all', 'clinic');
    expect(db.calls[0].operations).toContainEqual(['or', expect.stringContaining(field + '.ilike.%clinic%')]);
  });
  it.each(['partner_applications', 'listing_applications', 'consultation_requests', 'nb_leads', 'property_inquiries'] as const)('reads only %s and its own status/page/count', async source => {
    const result = await fetchInbox(source, 5, 'new');
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0].table).toBe(source);
    expect(db.calls[0].operations).toContainEqual(['or', source === 'listing_applications' ? 'or(status.in.(pending))' : 'or(status.in.(new,pending),status.is.null,status.eq."")']);
    expect(db.calls[0].operations.at(-1)).toEqual(['range', 250, 299]);
    expect(result.total).toBe(801);
  });
  it('intersects server search with status and never hides a read failure as empty', async () => {
    await fetchInbox('nb_leads', 0, 'new', 'Alice');
    const expression = db.calls[0].operations.find(operation => operation[0] === 'or')?.[1] as string;
    expect(expression).toContain('and(or(status.in.(new,pending),status.is.null,status.eq.""),or(full_name.ilike.%Alice%');
    db.result.error = new Error('unavailable');
    await expect(fetchInbox('nb_leads', 0, 'all')).rejects.toThrow('unavailable');
  });
});
