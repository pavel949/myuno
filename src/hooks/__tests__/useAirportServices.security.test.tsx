import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAirportServices } from '../useAirportServices';

interface ReadRequest {
  table: string;
  columns: string;
  filters: Array<[string, unknown]>;
}
interface ReadResult { data: Array<Record<string, unknown>> | null; error: Error | null }

const boundary = vi.hoisted(() => ({
  reads: [] as ReadRequest[],
  read: vi.fn<(request: ReadRequest) => Promise<ReadResult>>(),
  forbidden: vi.fn(() => { throw new Error('Unexpected non-catalogue capability'); }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from(table: string) {
      if (!['airport_suppliers', 'airport_services'].includes(table)) return boundary.forbidden();
      const request: ReadRequest = { table, columns: '', filters: [] };
      boundary.reads.push(request);
      const query = {
        select(columns: string) { request.columns = columns; return query; },
        eq(column: string, value: unknown) { request.filters.push([column, value]); return query; },
        order() { return query; },
        insert: boundary.forbidden, update: boundary.forbidden, upsert: boundary.forbidden, delete: boundary.forbidden,
        then(resolve: (value: ReadResult) => unknown, reject?: (reason: unknown) => unknown) {
          return boundary.read(request).then(resolve, reject);
        },
      };
      return query;
    },
    rpc: boundary.forbidden,
    functions: { invoke: boundary.forbidden },
    storage: { from: boundary.forbidden },
  },
}));

const supplier = { id: 'synthetic-supplier', airport_code: 'HKT', is_active: true };
const offer = { id: 'synthetic-offer', airport_code: 'HKT', supplier_id: supplier.id, service_type: 'fast_track', is_active: true };
const denied = new Error('Synthetic catalogue access rejected');
const ok = (data: ReadResult['data']): ReadResult => ({ data, error: null });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => {
  boundary.reads.length = 0;
  boundary.forbidden.mockClear();
  boundary.read.mockReset();
  boundary.read.mockImplementation(async request => ok(request.table === 'airport_suppliers' ? [supplier] : [offer]));
});
afterEach(() => { cleanup(); expect(boundary.forbidden).not.toHaveBeenCalled(); });

describe('airport catalogue client read boundary (synthetic SDK, not server RLS acceptance)', () => {
  it('clears a failed read only while retrying the same active airport/supplier scope and recovers without writes', async () => {
    const retryRead = deferred<ReadResult>();
    let serviceReads = 0;
    boundary.read.mockImplementation(async request => {
      if (request.table === 'airport_suppliers') return ok([supplier]);
      return ++serviceReads === 1 ? { data: null, error: denied } : retryRead.promise;
    });
    const { result } = renderHook(() => useAirportServices('HKT', supplier.id));
    await waitFor(() => expect(result.current.error).toBe(denied));
    expect(result.current.services).toEqual([]);
    let retry!: Promise<void>;
    act(() => { retry = result.current.refetch(); });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(serviceReads).toBe(2));
    await act(async () => { retryRead.resolve(ok([offer])); await retry; });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fastTrackServices).toEqual([offer]);
    const reads = boundary.reads.filter(request => request.table === 'airport_services');
    expect(reads).toHaveLength(2);
    for (const request of reads) expect(request.filters).toEqual([
      ['airport_code', 'HKT'], ['is_active', true], ['supplier_id', supplier.id],
    ]);
    for (const request of boundary.reads.filter(request => request.table === 'airport_suppliers')) {
      expect(request.filters).toEqual([['airport_code', 'HKT'], ['is_active', true]]);
    }
  });

  it('does not replace a rejected supplier read with an unscoped service catalogue', async () => {
    boundary.read.mockResolvedValue({ data: null, error: denied });
    const { result } = renderHook(() => useAirportServices('HKT', supplier.id));
    await waitFor(() => expect(result.current.error).toBe(denied));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe(denied);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.services).toEqual([]);
    expect(result.current.suppliers).toEqual([]);
    expect(boundary.reads).toHaveLength(2);
    expect(boundary.reads.every(request => request.table === 'airport_suppliers')).toBe(true);
    for (const request of boundary.reads) expect(request.filters).toEqual([['airport_code', 'HKT'], ['is_active', true]]);
  });

  it('retains an explicit rejected supplier filter on every retry instead of falling back to other offers', async () => {
    boundary.read.mockImplementation(async request => {
      if (request.table === 'airport_suppliers') return ok([supplier]);
      return request.filters.some(([column]) => column === 'supplier_id')
        ? { data: null, error: denied }
        : ok([{ ...offer, supplier_id: 'different-synthetic-supplier' }]);
    });
    const { result } = renderHook(() => useAirportServices('HKT', 'rejected-synthetic-supplier'));
    await waitFor(() => expect(result.current.error).toBe(denied));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe(denied);
    expect(result.current.services).toEqual([]);
    const reads = boundary.reads.filter(request => request.table === 'airport_services');
    expect(reads).toHaveLength(2);
    for (const request of reads) expect(request.filters).toEqual([
      ['airport_code', 'HKT'], ['is_active', true], ['supplier_id', 'rejected-synthetic-supplier'],
    ]);
  });

  it('uses the default airport and applies a newly selected airport/supplier only through the same read boundary', async () => {
    boundary.read.mockImplementation(async request => {
      const airport = request.filters.find(([column]) => column === 'airport_code')?.[1];
      const provider = request.filters.find(([column]) => column === 'supplier_id')?.[1];
      return ok(request.table === 'airport_suppliers'
        ? [{ ...supplier, airport_code: airport }]
        : [{ ...offer, airport_code: airport, supplier_id: provider ?? null }]);
    });
    const { result, rerender } = renderHook(({ airport, provider }: { airport?: string; provider?: string }) => useAirportServices(airport, provider), {
      initialProps: { airport: undefined, provider: undefined },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(boundary.reads.find(request => request.table === 'airport_services')?.filters).toEqual([
      ['airport_code', 'HKT'], ['is_active', true],
    ]);
    boundary.reads.length = 0;
    rerender({ airport: 'BKK', provider: 'synthetic-bkk-supplier' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(boundary.reads).toHaveLength(2);
    expect(boundary.reads[0].filters).toEqual([['airport_code', 'BKK'], ['is_active', true]]);
    expect(boundary.reads[1].filters).toEqual([
      ['airport_code', 'BKK'], ['is_active', true], ['supplier_id', 'synthetic-bkk-supplier'],
    ]);
    expect(result.current.services[0]).toMatchObject({ airport_code: 'BKK', supplier_id: 'synthetic-bkk-supplier' });
  });
});
