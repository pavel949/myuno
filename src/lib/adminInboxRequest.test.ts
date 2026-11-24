import { beforeEach, expect, it, vi } from 'vitest';
import { fetchInbox, fetchInboxRequest, INBOX_SOURCES, updateHelpInboxStatus } from './adminInbox';
const db = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), update: vi.fn(), result: { data: null as unknown, error: null as unknown, count: 1 } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: db.from } }));
const id = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  vi.clearAllMocks(); db.result = { data: { id, message: 'Selected request' }, error: null, count: 1 };
  const chain = { select: db.select, eq: db.eq, update: db.update, maybeSingle: () => Promise.resolve(db.result), or: () => chain, order: () => chain, range: () => Promise.resolve(db.result) };
  db.from.mockReturnValue(chain); db.select.mockReturnValue(chain); db.eq.mockReturnValue(chain); db.update.mockReturnValue(chain);
});
it.each(INBOX_SOURCES)('reads the exact %s ID without a list limit or alternate domain', async source => {
  expect(await fetchInboxRequest(source, id)).toMatchObject({ id, message: 'Selected request' });
  expect(db.from).toHaveBeenCalledExactlyOnceWith(source);
  expect(db.eq).toHaveBeenCalledExactlyOnceWith('id', id);
  expect(db.select.mock.calls[0][0]).not.toContain('*');
});
it.each(INBOX_SOURCES)('keeps %s identity in the generated Inbox handoff', async source => {
  db.result.data = [{ id, created_at: '2026-11-13T00:00:00Z', status: 'pending' }];
  const result = await fetchInbox(source, 0, 'all');
  const url = new URL(result.items[0].href, 'http://localhost');
  expect(url.pathname).toBe('/admin/inbox');
  expect(url.searchParams.get('source')).toBe(source);
  expect(url.searchParams.get('request')).toBe(id);
});
it('rejects invalid IDs before network access', async () => {
  await expect(fetchInboxRequest('property_inquiries', '../other')).rejects.toThrow('Invalid');
  expect(db.from).not.toHaveBeenCalled();
});
it('distinguishes missing, denied and wrong-record results without fallback', async () => {
  db.result.data = null; expect(await fetchInboxRequest('property_inquiries', id)).toBeNull();
  db.result.error = new Error('denied'); await expect(fetchInboxRequest('property_inquiries', id)).rejects.toThrow('denied');
  db.result.error = null; db.result.data = { id: 'other' }; await expect(fetchInboxRequest('property_inquiries', id)).rejects.toThrow('identity');
  expect(db.from.mock.calls.every(([source]) => source === 'property_inquiries')).toBe(true);
});
it('keeps Help internal notes and provider identifiers out of the detail projection', async () => {
  await fetchInboxRequest('help_requests', id);
  const projection = db.select.mock.calls[0][0];
  expect(projection).toContain('preferred_channel');
  expect(projection).not.toMatch(/internal_notes|source_data|vendor_id/);
});
it('advances only the intended Help row and requires exact status readback', async () => {
  db.result.data = { id, status: 'in_progress' };
  expect(await updateHelpInboxStatus(id, 'new')).toBe(true);
  expect(db.update).toHaveBeenCalledExactlyOnceWith({ status: 'in_progress' });
  expect(db.eq.mock.calls).toEqual([['id', id], ['status', 'new']]);
  db.result.data = null;
  expect(await updateHelpInboxStatus(id, 'new')).toBe(false);
  db.result.data = { id: 'wrong', status: 'closed' };
  await expect(updateHelpInboxStatus(id, 'in_progress')).rejects.toThrow('could not be confirmed');
  await expect(updateHelpInboxStatus(id, 'closed')).rejects.toThrow('Invalid');
});
