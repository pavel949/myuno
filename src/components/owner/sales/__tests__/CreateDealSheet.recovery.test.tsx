import { useLayoutEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({ actor: 'actor-a', recover: vi.fn(), navigate: vi.fn(), toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: m.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useAgentDeals', () => ({ useDuplicateCheck: () => ({ data: [] }), CLIENT_SOURCES: ['website'], PHUKET_DISTRICTS: [], PROPERTY_TYPES: [], CURRENCIES: ['THB'], DEAL_TYPES: [], DEAL_TYPE_LABELS: {} }));
vi.mock('@/components/owner/contacts/ContactSearchInput', () => ({ ContactSearchInput: () => null }));
vi.mock('@/components/owner/sales/PropertySearchInput', () => ({ PropertySearchInput: () => null }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => <>{children}{footer}</> }));
vi.mock('@/lib/crm/dealCreationRecovery', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/crm/dealCreationRecovery')>(), recoverDealCreation: m.recover }));
vi.mock('@/lib/crmWorkflowTrigger', () => ({ fireCrmWorkflowTrigger: vi.fn() }));
vi.mock('sonner', () => ({ toast: m.toast }));
vi.mock('react-router-dom', async importOriginal => ({ ...await importOriginal<typeof import('react-router-dom')>(), useNavigate: () => m.navigate }));
import { CreateDealSheet } from '../CreateDealSheet';
import { readDealAttempt } from '@/lib/crm/dealCreationRecovery';
const draw = (companyId = 'company-a') => <QueryClientProvider client={new QueryClient()}><MemoryRouter><CreateDealSheet open companyId={companyId} onOpenChange={vi.fn()} /></MemoryRouter></QueryClientProvider>;
beforeEach(() => { m.actor = 'actor-a'; m.recover.mockReset(); m.navigate.mockReset(); m.toast.mockClear(); sessionStorage.clear(); });
afterEach(cleanup);
it('latches same-tick activation throughout contact/deal work and keeps original snapshot on retry', async () => {
  let reject!: (reason: Error) => void;
  m.recover.mockImplementationOnce(() => new Promise((_, r) => { reject = r; }));
  render(draw()); fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Synthetic Customer' } });
  const create = screen.getByRole('button', { name: 'Create Deal' });
  act(() => { fireEvent.click(create); fireEvent.click(create); });
  expect(m.recover).toHaveBeenCalledTimes(1);
  const saved = readDealAttempt('actor-a', 'company-a')!;
  expect(saved.deal.client_name).toBe('Synthetic Customer');
  await act(async () => { reject(Error('lost acknowledgement')); });
  expect(screen.getByRole('alert')).toHaveTextContent('not confirmed');
  expect(screen.getAllByRole('textbox')[0]).toBeDisabled(); expect(m.navigate).not.toHaveBeenCalled();
  m.recover.mockResolvedValueOnce({ deal: { id: saved.dealId }, createdDeal: false, createdContact: false });
  fireEvent.click(screen.getByRole('button', { name: 'Retry saved attempt' }));
  await waitFor(() => expect(m.navigate).toHaveBeenCalledWith(`/mc/sales/${saved.dealId}`));
  expect(m.recover.mock.calls[1][0]).toEqual(saved); expect(readDealAttempt('actor-a', 'company-a')).toBeNull();
});
it('restores a failed attempt after unmount with same ids and hides it in another company/actor', async () => {
  m.recover.mockRejectedValue(Error('offline'));
  const view = render(draw()); fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Private Synthetic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Deal' })); await screen.findByRole('alert');
  const saved = readDealAttempt('actor-a', 'company-a');
  view.rerender(draw('company-b'));
  expect(screen.queryByText(/Private Synthetic/)).not.toBeInTheDocument(); expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
  view.rerender(draw()); expect(screen.getByRole('status')).toHaveTextContent(saved!.dealId);
  m.actor = 'actor-b'; view.rerender(draw()); expect(screen.queryByText(/Private Synthetic/)).not.toBeInTheDocument();
});
it('ignores old-context completion after switching actor and never navigates or clears its journal', async () => {
  let resolve!: (value: unknown) => void; let guard!: () => boolean;
  m.recover.mockImplementationOnce((_, isCurrent) => { guard = isCurrent; return new Promise(r => { resolve = r; }); });
  const view = render(draw()); fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Synthetic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Deal' }));
  const saved = readDealAttempt('actor-a', 'company-a')!;
  m.actor = 'actor-b'; view.rerender(draw()); expect(guard()).toBe(false);
  await act(async () => { resolve({ deal: { id: saved.dealId }, createdDeal: true, createdContact: true }); });
  expect(m.navigate).not.toHaveBeenCalled(); expect(m.toast).not.toHaveBeenCalled(); expect(readDealAttempt('actor-a', 'company-a')).toEqual(saved);
});
it('stops before writes if durable attempt storage is unavailable', async () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('storage denied'); });
  render(draw()); fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Synthetic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Deal' })); await screen.findByRole('alert');
  expect(m.recover).not.toHaveBeenCalled(); spy.mockRestore();
});

it('invalidates old context before a replacement layout effect can observe or resume it', async () => {
  let guard!: () => boolean;
  const layoutObservations: boolean[] = [];
  m.recover.mockImplementationOnce((_, isCurrent) => { guard = isCurrent; return new Promise(() => {}); });
  function Replacement({ companyId }: { companyId: string }) {
    useLayoutEffect(() => {
      if (companyId === 'company-b') layoutObservations.push(guard());
    }, [companyId]);
    return draw(companyId);
  }
  const view = render(<Replacement companyId="company-a" />);
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Synthetic' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Deal' }));
  expect(guard()).toBe(true);
  view.rerender(<Replacement companyId="company-b" />);
  expect(layoutObservations).toEqual([false]);
  expect(m.navigate).not.toHaveBeenCalled();
  expect(readDealAttempt('actor-a', 'company-a')).not.toBeNull();
});
