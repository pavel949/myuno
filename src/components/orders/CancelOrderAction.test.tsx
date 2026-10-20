import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CancelOrderAction } from './CancelOrderAction';
const state = vi.hoisted(() => ({ language: 'en', user: { id: 'synthetic-user' } as { id: string } | null, read: vi.fn(), cancel: vi.fn(), pending: new Set<string>() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/lib/customerOrderCancellation', () => ({ readCustomerCancellation: (...args: unknown[]) => state.read(...args), hasUnresolvedCancellation: (actor: string, order: string) => state.pending.has(`${actor}:${order}`), retryCustomerCancellation: async (actor: string, order: string, ...args: unknown[]) => {
 const key = `${actor}:${order}`; state.pending.add(key); const receipt = await state.cancel(actor, order, ...args); state.pending.delete(key); return receipt;
} }));
afterEach(cleanup);
beforeEach(() => {
 vi.clearAllMocks(); state.pending.clear(); state.language = 'en'; state.user = { id: 'synthetic-user' };
 state.read.mockImplementation(async (orderId: string) => ({ eligible: true, orderId, expectedUpdatedAt: '2026-10-20T00:00:00Z' }));
 state.cancel.mockResolvedValue({ orderId: 'synthetic-order', historyId: 'history-one' });
});
const show = (status = 'pending', onCancelled = vi.fn()) => {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
 const node = (orderId: string, nextStatus = status) => <QueryClientProvider client={client}><CancelOrderAction orderId={orderId} status={nextStatus} onCancelled={onCancelled} /></QueryClientProvider>;
 const view = render(node('synthetic-order'));
 return { ...view, client, rerenderAction: (orderId: string, nextStatus = status) => view.rerender(node(orderId, nextStatus)) };
};
it('requires confirmation and shows Cancelled only after the authoritative command', async () => {
 const refreshed = vi.fn(); show('pending', refreshed);
 fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
 expect(screen.getByRole('dialog')).toBeVisible(); expect(state.cancel).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
 expect(await screen.findByRole('status')).toHaveTextContent('Order cancelled');
 await waitFor(() => expect(refreshed).toHaveBeenCalledOnce());
});
it('keeps the order when confirmation is declined', async () => {
 show(); fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
 fireEvent.click(screen.getByRole('button', { name: 'Keep order' }));
 expect(state.cancel).not.toHaveBeenCalled();
});
it('does not show an enabled cancellation control when the server contract is unavailable', async () => {
 state.read.mockResolvedValue({ eligible: false, reason: 'unavailable' }); show();
 expect(await screen.findByText('Cancellation is currently unavailable')).toBeVisible();
 expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
});
it('retains the same request identity after an uncertain error and does not claim success', async () => {
 state.cancel.mockRejectedValue(new Error('synthetic timeout')); show();
 fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
 fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('Cancellation was not confirmed');
 expect(screen.queryByRole('status')).toBeNull();
 fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
 await waitFor(() => expect(state.cancel).toHaveBeenCalledTimes(2));
 expect(state.cancel.mock.calls[0]).toEqual(state.cancel.mock.calls[1]);
});
it.each(['deposit_paid', 'confirmed', 'in_progress', 'refunded', 'cancelled'])('does not offer simple unpaid cancellation for %s', status => {
 show(status); expect(state.read).not.toHaveBeenCalled(); expect(screen.queryByRole('button')).toBeNull();
});
it('does not read private cancellation eligibility for a guest', () => { state.user = null; show(); expect(state.read).not.toHaveBeenCalled(); });
it.each(['order', 'actor', 'status'])('does not reuse a cancellation receipt after the %s context changes', async context => {
 const view = show(); fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
 fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
 expect(await screen.findByRole('status')).toHaveTextContent('Order cancelled');
 if (context === 'actor') state.user = { id: 'other-synthetic-user' };
 if (context === 'status') view.rerenderAction('synthetic-order', 'confirmed');
 view.rerenderAction(context === 'order' ? 'other-order' : 'synthetic-order');
 expect(screen.queryByText('Order cancelled')).toBeNull();
 expect(await screen.findByRole('button', { name: 'Cancel order' })).toBeVisible();
});
it.each([['ru', 'Отменить заказ'], ['th', 'ยกเลิกคำสั่ง']])('localizes the action in %s', async (language, label) => { state.language = language; show(); expect(await screen.findByRole('button', { name: label })).toBeVisible(); });

it('reopens an uncertain cancellation without changing its actor/order retry context', async () => {
 state.cancel.mockRejectedValue(new Error('timeout')); const view = show();
 fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
 fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
 await screen.findByRole('alert'); state.read.mockResolvedValue({ eligible: false, reason: 'not_eligible' });
 await act(async () => { await view.client.invalidateQueries({ queryKey: ['customer-order-cancellation'] }); });
 fireEvent.click(screen.getByRole('button', { name: 'Keep order' }));
 state.cancel.mockResolvedValue({ orderId: 'synthetic-order', historyId: 'recovered-receipt' });
 fireEvent.click(screen.getByRole('button', { name: 'Cancel order' })); fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
 await waitFor(() => expect(state.cancel).toHaveBeenCalledTimes(2)); expect(state.cancel.mock.calls[0].slice(0, 2)).toEqual(state.cancel.mock.calls[1].slice(0, 2));
 expect(await screen.findByRole('status')).toHaveTextContent('Order cancelled');
});
