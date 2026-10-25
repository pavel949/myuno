import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authoringCreateRequestId, clearAuthoringCreateIntent, confirmAuthoringCreateIntent, clearConfirmedAuthoringCreateIntents, AuthoringCreationResumeRequired } from '../authoringCreateIntent';
const scope = { kind: 'property' as const, actorId: 'actor-a', companyId: 'company-a', spaceId: 'space-a' };
beforeEach(() => { sessionStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());
describe('durable authoring create intent', () => {
  it('retains the same key across concurrent dispatch and repeated browser reads', async () => {
    const keys = await Promise.all(Array.from({ length: 4 }, () => authoringCreateRequestId(scope, { title: 'Synthetic unit' })));
    expect(new Set(keys).size).toBe(1);
    expect(await authoringCreateRequestId(scope, { title: 'Synthetic unit' })).toBe(keys[0]);
    expect(sessionStorage.getItem(sessionStorage.key(0)!)).not.toContain('Synthetic unit');
  });
  it('rejects changing an uncertain creation payload and retains its request key', async () => {
    const original = await authoringCreateRequestId(scope, { title: 'Synthetic unit' });
    await expect(authoringCreateRequestId(scope, { title: 'Other initial content' })).rejects.toThrow('Reopen its draft');
    expect(await authoringCreateRequestId(scope, { title: 'Synthetic unit' })).toBe(original);
  });
  it('separates actor, company, Space and domain', async () => {
    const input = { title: 'Synthetic unit' };
    const keys = await Promise.all([scope, { ...scope, actorId: 'actor-b' }, { ...scope, companyId: 'company-b' }, { ...scope, spaceId: 'space-b' }, { ...scope, kind: 'complex' as const }].map(value => authoringCreateRequestId(value, input)));
    expect(new Set(keys).size).toBe(5);
  });
  it('normalizes object order while preserving array order and supports an explicit known-result reset', async () => {
    const first = await authoringCreateRequestId(scope, { title: 'Unit', images: ['a', 'b'] });
    expect(await authoringCreateRequestId(scope, { images: ['a', 'b'], title: 'Unit' })).toBe(first);
    await expect(authoringCreateRequestId(scope, { title: 'Unit', images: ['b', 'a'] })).rejects.toThrow('Reopen its draft');
    confirmAuthoringCreateIntent(scope, 'known-property');
    clearAuthoringCreateIntent(scope);
    expect(await authoringCreateRequestId(scope, { title: 'Unit', images: ['a', 'b'] })).not.toBe(first);
  });
  it('retains confirmed keys until an explicit new action and never clears uncertain keys', async () => {
    const first = await authoringCreateRequestId(scope, { title: 'Unit' });
    clearConfirmedAuthoringCreateIntents('property', scope.actorId, scope.companyId);
    expect(await authoringCreateRequestId(scope, { title: 'Unit' })).toBe(first);
    confirmAuthoringCreateIntent(scope, 'known-property');
    expect(await authoringCreateRequestId(scope, { title: 'Unit' })).toBe(first);
    clearConfirmedAuthoringCreateIntents('property', scope.actorId, scope.companyId);
    expect(await authoringCreateRequestId(scope, { title: 'Unit' })).not.toBe(first);
  });
  it('resolves a committed uncertain request to its existing draft without making a new identity', async () => {
    const first = await authoringCreateRequestId(scope, { title: 'Original' });
    const resolver = vi.fn().mockResolvedValue({ id: 'already-saved', updated_at: 'exact-version' });
    await expect(authoringCreateRequestId(scope, { title: 'Changed' }, resolver)).rejects.toBeInstanceOf(AuthoringCreationResumeRequired);
    expect(resolver).toHaveBeenCalledWith(first);
    expect(await authoringCreateRequestId(scope, { title: 'Original' })).toBe(first);
  });
  it('permits validation correction with the same identity after a checked null result', async () => {
    const first = await authoringCreateRequestId(scope, { title: 'Original' });
    expect(await authoringCreateRequestId(scope, { title: 'Changed' }, async () => null)).toBe(first);
    expect(await authoringCreateRequestId(scope, { title: 'Original' })).toBe(first);
    clearConfirmedAuthoringCreateIntents('property', scope.actorId, scope.companyId);
    expect(await authoringCreateRequestId(scope, { title: 'Changed' }, async () => null)).toBe(first);
  });
  it('resolves the winning delayed original instead of allocating another key after a same-key conflict', async () => {
    const first = await authoringCreateRequestId(scope, { title: 'Original' });
    const resolver = vi.fn().mockResolvedValueOnce(null).mockResolvedValue({ id: 'winning-original', updated_at: 'server-version' });
    expect(await authoringCreateRequestId(scope, { title: 'Changed' }, resolver)).toBe(first);
    await expect(authoringCreateRequestId(scope, { title: 'Changed' }, resolver)).rejects.toMatchObject({ draft: { id: 'winning-original' } });
    expect(resolver.mock.calls.map(([key]) => key)).toEqual([first, first]);
    expect(await authoringCreateRequestId(scope, { title: 'Original' })).toBe(first);
  });
});
