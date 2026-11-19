import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { recordAttribution } from './attribution';

const fake = vi.hoisted(() => ({
  from: vi.fn(),
  lookup: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('@/lib/untypedTables', () => ({ typedFrom: fake.from }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fake.from, functions: { invoke: fake.notify } },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('crypto', webcrypto);
  fake.from.mockImplementation((table: string) => {
    if (table !== 'lead_attributions') throw new Error('Unexpected table');
    const lookup = { eq: () => lookup, or: () => lookup, order: () => lookup, limit: () => lookup, maybeSingle: fake.lookup };
    return {
      select: () => lookup,
      insert: (data: unknown) => {
        fake.insert(data);
        return { select: () => ({ single: async () => ({ data: { id: 'new-id' } }) }) };
      },
      update: (data: unknown) => {
        fake.update(data);
        return { eq: async () => ({ error: null }) };
      },
    };
  });
});
afterEach(() => vi.unstubAllGlobals());

it.each(['form_submit', 'viewing_booked', 'calc_run'] as const)(
  'records a qualified %s touchpoint without external dispatch',
  async (type) => {
    fake.lookup.mockResolvedValue({ data: null });
    const result = await recordAttribution({
      email: 'buyer@example.test', phone: '+66000000000', projectId: 'project',
      touchpoint: { type },
    });
    expect(result).toEqual({ attributionId: 'new-id', isNew: true });
    expect(fake.insert).toHaveBeenCalledWith(expect.objectContaining({
      project_id: 'project', email_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      touchpoints: [expect.objectContaining({ type, project_id: 'project' })],
    }));
    expect(fake.from.mock.calls.every(([table]) => table === 'lead_attributions')).toBe(true);
    expect(fake.notify).not.toHaveBeenCalled();
  },
);

it('updates an existing attribution without replacing its ID or notifying a developer', async () => {
  const previous = { type: 'page_view' };
  fake.lookup.mockResolvedValue({ data: { id: 'existing-id', touchpoints: [previous] } });
  const result = await recordAttribution({ projectId: 'project', touchpoint: { type: 'form_submit' } });
  expect(result).toEqual({ attributionId: 'existing-id', isNew: false });
  expect(fake.update).toHaveBeenCalledWith(expect.objectContaining({
    touchpoints: [previous, expect.objectContaining({ type: 'form_submit', project_id: 'project' })],
  }));
  expect(fake.insert).not.toHaveBeenCalled();
  expect(fake.notify).not.toHaveBeenCalled();
});
