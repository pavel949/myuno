import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingPaymentsChip } from '../PendingPaymentsChip';

const state = vi.hoisted(() => ({
  language: 'ru', user: { id: 'account-a' } as { id: string } | null,
  query: { data: undefined as number | undefined, isLoading: false, isError: false, refetch: vi.fn() },
  options: {} as { enabled?: boolean; queryKey?: unknown[]; queryFn?: () => Promise<number> },
  response: { count: 2 as number | null, error: null as Error | null },
  calls: [] as unknown[][],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: typeof state.options) => { state.options = options; return state.query; } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  state.calls.push(['from', table]);
  const query = {
    select: (...args: unknown[]) => { state.calls.push(['select', ...args]); return query; },
    eq: (...args: unknown[]) => { state.calls.push(['eq', ...args]); return query; },
    is: (...args: unknown[]) => { state.calls.push(['is', ...args]); return query; },
    in: (...args: unknown[]) => { state.calls.push(['in', ...args]); return Promise.resolve(state.response); },
  };
  return query;
} } }));
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
afterEach(cleanup);
beforeEach(() => {
  state.user = { id: 'account-a' }; state.language = 'ru'; state.query.data = undefined; state.query.isLoading = false; state.query.isError = false; state.query.refetch.mockReset(); state.calls = []; state.response = { count: 2, error: null };
});

describe('factual pending-order reminder', () => {
  it('counts only the current actor’s non-deleted pending orders and never sums money', async () => {
    render(<PendingPaymentsChip />, { wrapper });
    await expect(state.options.queryFn!()).resolves.toBe(2);
    expect(state.options.queryKey).toEqual(['home-pending-orders', 'account-a']);
    expect(state.calls).toContainEqual(['select', 'id', { count: 'exact', head: true }]);
    expect(state.calls).toContainEqual(['eq', 'customer_user_id', 'account-a']);
    expect(state.calls).toContainEqual(['is', 'deleted_at', null]);
  });
  it.each([['ru', 'Проверить ожидающие заказы: 2'], ['en', 'Review pending orders: 2'], ['th', 'ตรวจสอบรายการที่รอดำเนินการ: 2']])('shows the count as pending orders, not a payment claim, in %s', (language, label) => {
    state.language = language; state.query.data = 2;
    const { container } = render(<PendingPaymentsChip />, { wrapper });
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', '/me');
    expect(container.textContent).not.toMatch(/฿|THB|USD|Оплатить|Pay now/);
  });
  it('stays quiet only after a successful zero result', () => {
    state.query.data = 0;
    render(<PendingPaymentsChip />, { wrapper });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('distinguishes loading and errors, including a failed refresh of cached data', () => {
    state.query.isLoading = true;
    const { rerender } = render(<PendingPaymentsChip />, { wrapper });
    expect(screen.getByRole('status')).toHaveTextContent('Проверяем');
    state.query.isLoading = false; state.query.isError = true; state.query.data = 2;
    rerender(<PendingPaymentsChip />);
    expect(screen.getByRole('status')).toHaveTextContent('Не удалось');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить проверку' }));
    expect(state.query.refetch).toHaveBeenCalledOnce();
  });
  it.each(['error', 'unknown'])('does not convert %s into zero', async kind => {
    state.response = kind === 'error' ? { count: null, error: new Error('unavailable') } : { count: null, error: null };
    render(<PendingPaymentsChip />, { wrapper });
    await expect(state.options.queryFn!()).rejects.toThrow();
  });
  it('does not read or show account reminders while signed out', () => {
    state.user = null; state.query.data = 2;
    render(<PendingPaymentsChip />, { wrapper });
    expect(state.options.enabled).toBe(false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(state.calls).toHaveLength(0);
  });
});
