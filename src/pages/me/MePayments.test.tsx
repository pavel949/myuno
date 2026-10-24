import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import MePayments from './MePayments';
const state = vi.hoisted(() => ({ result: {} as Record<string, unknown>, language: 'en', retry: vi.fn() }));
vi.mock('@/hooks/useMyPayments', () => ({ useMyPayments: () => state.result }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/layout/MeShellLayout', () => ({ MeShellLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/orders/CancelOrderAction', () => ({ CancelOrderAction: ({ orderId }: { orderId: string }) => <span data-testid="cancel-boundary">{orderId}</span> }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); state.language = 'en'; state.result = { isLoading: false, isError: false, refetch: state.retry, data: { dueNow: [], history: [], totalDue: 0, currency: null } }; });
const show = () => render(<MemoryRouter><MePayments /></MemoryRouter>);
it.each([['en', 'Payments could not be loaded'], ['ru', 'Не удалось загрузить платежи'], ['th', 'โหลดการชำระเงินไม่สำเร็จ']])('shows a localized failure instead of a false empty account in %s', (language, message) => {
 state.language = language; state.result = { isError: true, isLoading: false, refetch: state.retry }; show();
 expect(screen.getByRole('alert')).toHaveTextContent(message); expect(screen.queryByText('No payments')).toBeNull();
 fireEvent.click(screen.getByRole('button')); expect(state.retry).toHaveBeenCalledOnce();
});
it('shows cancellation only beside commercial due records while retaining cancelled history', () => {
 const row = { id: 'due', orderId: 'due', orderType: 'property', amount: 100, currency: 'THB', status: 'pending', createdAt: '2026-10-20T00:00:00Z' };
 state.result = { isError: false, isLoading: false, data: { dueNow: [row], history: [{ ...row, id: 'old', orderId: 'old', status: 'cancelled' }], totalDue: 100, currency: 'THB' } }; show();
 expect(screen.getAllByTestId('cancel-boundary')).toHaveLength(1); expect(screen.getByTestId('cancel-boundary')).toHaveTextContent('due');
 expect(screen.getByText('cancelled')).toBeVisible();
});

it('labels paid confirmed and unpaid cancelled history as order activity and order amounts', () => {
 const row = { id: 'paid', orderId: 'paid', orderType: 'property', amount: 100, currency: 'THB', status: 'confirmed', paidAt: '2026-10-20T01:00:00Z', createdAt: '2026-10-20T00:00:00Z' };
 state.result = { isError: false, isLoading: false, data: { dueNow: [], history: [row, { ...row, id: 'cancelled', orderId: 'cancelled', paidAt: null, status: 'cancelled' }], totalDue: 0, currency: null } }; show();
 expect(screen.getByText('Order activity')).toBeVisible(); expect(screen.getAllByText('Order amount')).toHaveLength(2);
 expect(screen.getByText('confirmed')).toBeVisible(); expect(screen.getByText('cancelled')).toBeVisible(); expect(screen.queryByText('Due now')).toBeNull();
 expect(screen.queryByTestId('cancel-boundary')).toBeNull();
});
