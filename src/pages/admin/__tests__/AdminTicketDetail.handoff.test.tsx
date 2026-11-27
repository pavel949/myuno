import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminTicketDetail from '../AdminTicketDetail';
const state = vi.hoisted(() => ({
  error: false, missing: false, messagesError: false, retry: vi.fn(), retryMessages: vi.fn(), resolve: vi.fn(async () => false),
  row: { id: 'ticket-a', ticket_number: 'SUP-1', status: 'open', priority: 'normal', category: 'other',
    subject: 'Synthetic support request', description: 'QA', created_at: '2026-11-27T01:00:00Z', sla_deadline: null,
    order_id: '22222222-2222-4222-8222-222222222222', resolution: null },
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/hooks/useAdminTickets', () => ({ useAdminTickets: () => ({
  resolveTicket: state.resolve, updateTicketStatus: vi.fn(), updatePriority: vi.fn(), addAdminMessage: vi.fn(),
}) }));
vi.mock('@/hooks/useTickets', () => ({
  useTicketDetail: (id: string) => ({ data: state.error ? undefined : state.missing ? null : id === 'ticket-b' ? { ...state.row, id, ticket_number: 'SUP-B' } : state.row, isLoading: false, isError: state.error, refetch: state.retry }),
  useTicketMessages: () => ({ data: [], isError: state.messagesError, refetch: state.retryMessages }),
}));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ symbol: 'THB' }) }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/tickets/TicketStatusBadge', () => ({ TicketStatusBadge: () => <span>Open status</span> }));
vi.mock('@/components/tickets/TicketPriorityBadge', () => ({ TicketPriorityBadge: () => <span>Normal priority</span> }));
vi.mock('@/components/tickets/TicketCategoryBadge', () => ({ TicketCategoryBadge: () => <span>Other category</span> }));
vi.mock('@/components/tickets/TicketMessages', () => ({ TicketMessages: () => <p>Conversation boundary</p> }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
function Location() {
  const location = useLocation(), navigate = useNavigate();
  return <><output data-testid="location">{location.pathname}{location.search}</output><button data-testid="next-ticket" onClick={() => navigate('/admin/tickets/ticket-b')}>Navigate fixture</button></>;
}
function mount() { return render(<MemoryRouter initialEntries={['/admin/tickets/ticket-a']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/admin/tickets/:ticketId" element={<><AdminTicketDetail /></>} /></Routes><Location /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); state.error = false; state.missing = false; state.messagesError = false; });
afterEach(cleanup);
describe('support case handoffs', () => {
  it('discards a resolution draft when navigation changes the selected ticket', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Решить тикет' }));
    fireEvent.change(screen.getByPlaceholderText('Опишите решение для клиента...'), { target: { value: 'Draft for ticket A' } });
    fireEvent.click(screen.getByTestId('next-ticket'));
    expect(screen.getByRole('heading', { name: 'SUP-B' })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Решить тикет' }));
    expect(screen.getByPlaceholderText('Опишите решение для клиента...')).toHaveValue('');
    expect(state.resolve).not.toHaveBeenCalled();
  });
  it('shows a confirmed absent record separately from a failed read', () => {
    state.missing = true; mount();
    expect(screen.getByRole('heading', { name: 'Support request not found or not accessible' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('opens the related order through the existing operations workspace rather than a missing route', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: /Заказ #22222222/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/operations?tab=bookings&order_id=22222222-2222-4222-8222-222222222222');
  });
  it('distinguishes a failed read from a missing ticket and offers retry', () => {
    state.error = true; mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection');
    expect(screen.queryByText('Support request not found or not accessible')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(state.retry).toHaveBeenCalledOnce();
  });
  it('keeps an unsuccessful resolution form open instead of acknowledging a successful decision', async () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Решить тикет' }));
    fireEvent.change(screen.getByPlaceholderText('Опишите решение для клиента...'), { target: { value: 'Synthetic resolution' } });
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить решение' }));
    await waitFor(() => expect(state.resolve).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Решение тикета' })).toBeVisible();
  });
});
