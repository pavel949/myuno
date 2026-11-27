import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePmsQueuedCompletion } from '@/hooks/usePmsQueuedCompletion';
import type { OperationalTask } from '@/hooks/useOperationalTasks';

const backend = vi.hoisted(() => ({ from: vi.fn(), getSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: backend.from, auth: { getSession: backend.getSession } } }));

const scope = new Set(['property-a']);
const task = { id: 'task-a', property_id: 'property-a', status: 'pending', updated_at: '2026-11-27T01:00:00Z' } as OperationalTask;

function setup() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(({ actor }) => usePmsQueuedCompletion(actor, 'company-a', scope), {
    initialProps: { actor: 'actor-a' },
    wrapper,
  });
}

function query(result: unknown) {
  const builder = {
    update: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    setHeader: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  builder.update.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.setHeader.mockReturnValue(builder);
  return builder;
}

beforeEach(() => {
  localStorage.clear();
  backend.from.mockReset();
  backend.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'actor-a' }, access_token: 'test-token' } }, error: null });
});
afterEach(() => vi.restoreAllMocks());

describe('PMS task completion outbox', () => {
  it('restores the saved completion after reload and writes only for the original actor and task revision', async () => {
    const network = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const pending = setup();
    act(() => { expect(pending.result.current.save(task)).toBe(true); });
    expect(pending.result.current.pending).toBe(1);
    expect(backend.from).not.toHaveBeenCalled();
    pending.unmount();

    const saved = setup();
    saved.rerender({ actor: 'actor-b' });
    expect(saved.result.current.pending).toBe(0);
    network.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    expect(backend.from).not.toHaveBeenCalled();

    const write = query({ data: { id: task.id }, error: null });
    backend.from.mockReturnValue(write);
    saved.rerender({ actor: 'actor-a' });
    await waitFor(() => expect(saved.result.current.pending).toBe(0));
    expect(write.eq).toHaveBeenCalledWith('property_id', task.property_id);
    expect(write.eq).toHaveBeenCalledWith('updated_at', task.updated_at);
    expect(write.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(write.update).toHaveBeenCalledTimes(1);
  });

  it('keeps an edited task for review without overwriting server state', async () => {
    const network = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const write = query({ data: null, error: null });
    const read = query({ data: { status: 'completed', completed_by: 'another-actor' }, error: null });
    backend.from.mockReturnValueOnce(write).mockReturnValueOnce(read);
    const view = setup();
    act(() => { view.result.current.save(task); });
    network.mockReturnValue(true);
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(view.result.current.conflicts).toBe(1));
    expect(write.update).toHaveBeenCalledTimes(1);
    expect(view.result.current.pending).toBe(0);
  });
});
