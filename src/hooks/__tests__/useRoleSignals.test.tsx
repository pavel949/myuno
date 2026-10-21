import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoleSignals, formatSignalDate, formatSignalTime, signalDaysUntil } from '../useRoleSignals';

const mocks = vi.hoisted(() => ({ user: { id: 'account-a' } as { id: string } | null, from: vi.fn(), calls: [] as unknown[][] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));
function chain(response: unknown) {
  const query = new Proxy({}, { get: (_, method) => method === 'then'
    ? (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(response).then(resolve, reject)
    : (...args: unknown[]) => { mocks.calls.push([method, ...args]); return query; } });
  return query;
}
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => { mocks.user = { id: 'account-a' }; mocks.calls = []; mocks.from.mockReset().mockImplementation(() => chain({ data: [], error: null })); });
describe('real-only home signals', () => {
  it('never inserts demo dates or bookings for an empty account', async () => {
    const { result } = renderHook(() => useRoleSignals(['pet_owner', 'family', 'couple']), { wrapper: wrapper() });
    expect(result.current.signals).toEqual({});
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signals).toEqual({});
    expect(result.current.hasError).toBe(false);
  });
  it('does not query or invent records for a guest', () => {
    mocks.user = null;
    const { result } = renderHook(() => useRoleSignals(['tourist']), { wrapper: wrapper() });
    expect(result.current.signals).toEqual({});
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('distinguishes failed reads from empty results and can retry', async () => {
    mocks.from.mockImplementation(() => chain({ data: null, error: new Error('offline') }));
    const { result } = renderHook(() => useRoleSignals(['pet_owner']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.signals).toEqual({});
    mocks.from.mockImplementation(() => chain({ data: [], error: null }));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.hasError).toBe(false));
  });
  it('preserves real records when another source fails', async () => {
    mocks.from.mockImplementation(table => chain(table === 'airport_bookings'
      ? { data: [{ flight_date: '2026-10-19', flight_time: '13:20:00', direction: 'arrival', flight_number: 'TEST1' }], error: null }
      : { data: null, error: new Error('source unavailable') }));
    const { result } = renderHook(() => useRoleSignals(['tourist', 'pet_owner']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.signals.tourist).toMatchObject({ value: '13:20', isLive: true });
    expect(result.current.signals.pet_owner).toBeUndefined();
  });
  it('uses Bangkok civil today and excludes departed stays', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-18T18:30:00Z'));
    try {
      const { result } = renderHook(() => useRoleSignals(['property_owner', 'tourist']), { wrapper: wrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mocks.calls).toContainEqual(['gt', 'check_out', '2026-10-19']);
      expect(mocks.calls).toContainEqual(['gte', 'flight_date', '2026-10-19']);
    } finally { vi.useRealTimers(); }
  });
});
describe('event dates and times', () => {
  it('formats timestamps in Phuket rather than the device timezone', () => {
    expect(formatSignalTime('2026-10-18T18:30:00Z')).toBe('01:30');
    expect(formatSignalDate('2026-10-18T18:30:00Z', 'en')).toContain('19');
  });
  it('keeps civil dates and localizes month names', () => {
    expect(formatSignalDate('2026-10-19', 'en')).toBe('19 Oct');
    expect(formatSignalDate('2026-10-19', 'ru')).toContain('19 окт');
    expect(formatSignalDate('2026-10-19', 'th')).toContain('19 ต.ค.');
    expect(formatSignalDate('2026-10-18T18:30:00Z', 'th')).toContain('19 ต.ค.');
  });
  it('counts whole Bangkok calendar days without instant rounding', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-18T18:30:00Z'));
    try { expect(signalDaysUntil('2026-10-20')).toBe(1); } finally { vi.useRealTimers(); }
  });
});

describe('operational claims match their sources', () => {
  it('limits pet updates to pet-service commercial orders and labels that source', async () => {
    mocks.from.mockImplementation(() => chain({ data: [{
      id: 'synthetic-pet-order', vertical: 'pet_service', order_type: 'service',
      start_at: '2027-01-01T06:20:00Z', status: 'pending',
    }], error: null }));
    const { result } = renderHook(() => useRoleSignals(['pet_owner']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.signals.pet_owner).toBeDefined());
    expect(mocks.from).toHaveBeenCalledWith('orders');
    expect(mocks.calls).toContainEqual(['in', 'vertical', ['pet_service']]);
    expect(mocks.calls).not.toContainEqual(['in', 'vertical', ['pet_service', 'medical']]);
    expect(result.current.signals.pet_owner).toMatchObject({
      lead: 'Pet-service order', leadRu: 'Заказ для питомца', leadTh: 'คำสั่งซื้อบริการสัตว์เลี้ยง',
      value: '13:20', isLive: true, href: '/orders/synthetic-pet-order/tracking',
    });
  });
  it.each(['cancelled', 'rejected', 'expired', null])('does not surface a released or unknown booking (%s)', async status => {
    mocks.from.mockImplementation(() => chain({ data: [{ check_in: '2026-10-01', check_out: '2026-11-01', status }], error: null }));
    const { result } = renderHook(() => useRoleSignals(['property_owner']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.signals.property_owner).toBeUndefined();
    expect(mocks.calls).toContainEqual(['not', 'status', 'in', '(cancelled,rejected,expired)']);
  });
  it('shows current booking dates and source status without claiming physical occupancy', async () => {
    mocks.from.mockImplementation(() => chain({ data: [{ check_in: '2026-10-01', check_out: '2026-11-01', status: 'confirmed' }], error: null }));
    const { result } = renderHook(() => useRoleSignals(['property_owner']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.signals.property_owner).toBeDefined());
    expect(result.current.signals.property_owner).toMatchObject({ lead: 'Current booking', tail: 'Status: confirmed' });
    expect(result.current.signals.property_owner?.value).not.toBe('Occupied');
  });
  it('counts deals without presenting unlike currencies as THB', async () => {
    mocks.from.mockImplementation(() => chain({ data: [
      { currency: 'USD', deal_value: 100, stage: 'proposal', deal_status: 'active' },
      { currency: 'THB', deal_value: 100, stage: 'negotiation', deal_status: 'active' },
    ], error: null }));
    const { result } = renderHook(() => useRoleSignals(['investor']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.signals.investor).toBeDefined());
    expect(result.current.signals.investor).toMatchObject({ value: '2 deals', valueRu: '2 сделок', lead: 'Active deals' });
    expect(JSON.stringify(result.current.signals)).not.toContain('฿');
  });
  it('marks provider summary unavailable without treating auth ID as an organization', async () => {
    const { result } = renderHook(() => useRoleSignals(['local_services_provider']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.unavailablePersonas).toEqual(['local_services_provider']);
    expect(result.current.signals).toEqual({});
    expect(mocks.from).not.toHaveBeenCalled();
  });
});


it('does not invent an active visa status when the source omits it', async () => {
  mocks.from.mockImplementation(() => chain({ data: [{ visa_type: 'Synthetic visa', expiry_date: '2027-01-01', status: null }], error: null }));
  const { result } = renderHook(() => useRoleSignals(['resident']), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.signals.resident).toBeDefined());
  expect(result.current.signals.resident).toMatchObject({ tail: 'Synthetic visa · status unavailable', tailTh: 'Synthetic visa · ไม่ระบุสถานะ' });
});

it('keeps missing project sales and status unknown', async () => {
  mocks.from.mockImplementation(() => chain({ data: [{ name_en: 'Synthetic project', completion_date: '2027-01-01', total_units: 12, units_sold: null, project_status: null }], error: null }));
  const { result, unmount } = renderHook(() => useRoleSignals(['real_estate_developer']), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.signals.real_estate_developer).toBeDefined());
  expect(result.current.signals.real_estate_developer?.value).toBe('— / 12');
  unmount();
  mocks.from.mockImplementation(() => chain({ data: [{ name_en: 'Synthetic project', completion_date: '2027-01-01', total_units: null, units_sold: null, project_status: null }], error: null }));
  const unknown = renderHook(() => useRoleSignals(['real_estate_developer']), { wrapper: wrapper() });
  await waitFor(() => expect(unknown.result.current.signals.real_estate_developer).toBeDefined());
  expect(unknown.result.current.signals.real_estate_developer).toMatchObject({ value: 'Status unavailable', valueTh: 'ไม่ระบุสถานะ' });
});
