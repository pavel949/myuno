import { describe, expect, it, vi } from 'vitest';
import { confirmPropertyWrite } from './propertyWriteReceipt';

describe('managed property write confirmation', () => {
  it('requires the exact requested IDs, in any order, without duplicate inputs', async () => {
    const write = vi.fn(async () => ({ data: [{ id: 'b' }, { id: 'a' }], error: null }));
    expect(await confirmPropertyWrite(['a', 'b', 'a'], write))
      .toEqual({ kind: 'complete', confirmed: 2, requested: 2 });
    expect(write).toHaveBeenCalledExactlyOnceWith(['a', 'b']);
  });

  it('does not treat a zero-row response with no error as success', async () => {
    expect(await confirmPropertyWrite(['a'], async () => ({ data: [], error: null })))
      .toEqual({ kind: 'none', confirmed: 0, requested: 1 });
  });

  it('reports only proven IDs for a partial response', async () => {
    expect(await confirmPropertyWrite(['a', 'b'], async () => ({ data: [{ id: 'b' }], error: null })))
      .toEqual({ kind: 'partial', confirmed: 1, requested: 2 });
  });

  it('does not accept unexpected or duplicate IDs or missing receipts', async () => {
    for (const data of [[{ id: 'a' }, { id: 'c' }], [{ id: 'a' }, { id: 'a' }], null]) {
      expect(await confirmPropertyWrite(['a', 'b'], async () => ({ data, error: null })))
        .toEqual({ kind: 'unknown', confirmed: 0, requested: 2 });
    }
  });

  it('does not infer a result from errors or assume a failed response means no write', async () => {
    const write = vi.fn().mockRejectedValue(new Error('response lost'));
    expect(await confirmPropertyWrite(['a'], write)).toEqual({ kind: 'unknown', confirmed: 0, requested: 1 });
    expect(write).toHaveBeenCalledTimes(1);
    expect(await confirmPropertyWrite(['a'], async () => ({ data: null, error: { message: 'denied' } })))
      .toEqual({ kind: 'unknown', confirmed: 0, requested: 1 });
  });

  it('never issues a write for an empty selection', async () => {
    const write = vi.fn();
    expect(await confirmPropertyWrite([], write)).toEqual({ kind: 'none', confirmed: 0, requested: 0 });
    expect(write).not.toHaveBeenCalled();
  });
});
