import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManagementTermsForm } from '../ManagementTermsForm';

const state = vi.hoisted(() => ({
  create: vi.fn(), update: vi.fn(), log: vi.fn(), addRule: vi.fn(), removeRule: vi.fn(), retry: vi.fn(),
  language: 'en', rulesError: null as Error | null, saved: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/hooks/usePropertyManagementTerms', () => ({
  useCreateManagementTerms: () => ({ mutateAsync: state.create, isPending: false }),
  useUpdateManagementTerms: () => ({ mutateAsync: state.update, isPending: false }),
}));
vi.mock('@/hooks/useManagementTermsActivity', () => ({ useLogTermsActivity: () => ({ mutateAsync: state.log }) }));
vi.mock('@/hooks/usePayoutRules', () => ({
  usePayoutRules: () => ({ data: [], isLoading: false, error: state.rulesError, refetch: state.retry }),
  useCreatePayoutRule: () => ({ mutate: state.addRule, isPending: false }),
  useDeletePayoutRule: () => ({ mutate: state.removeRule, isPending: false }),
}));
vi.mock('../PayoutWaterfall', () => ({ PayoutWaterfall: () => <div>Configured preview boundary</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw Error('Database access forbidden'); } }) }));
beforeEach(() => {
  vi.clearAllMocks(); state.language = 'en'; state.rulesError = null;
  state.create.mockImplementation(async (payload) => ({ ...payload, id: 'saved-terms' }));
  state.log.mockResolvedValue(undefined);
  vi.stubGlobal('fetch', () => { throw Error('Network forbidden'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const mount = () => render(<ManagementTermsForm propertyId="synthetic-property" onSaved={state.saved} />);

describe('configurable management terms actual form', () => {
  it.each(['en','ru'])('saves blank configuration as a draft without financial defaults (%s)', async language => {
    state.language = language; mount();
    expect(screen.getByRole('spinbutton', { name: language === 'ru' ? 'Процент комиссии' : 'Commission rate' })).toHaveValue(null);
    expect(screen.getByRole('spinbutton', { name: language === 'ru' ? 'День выплаты' : 'Payout day' })).toHaveValue(null);
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Черновик' : 'Save Draft' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledOnce());
    expect(state.create.mock.calls[0][0]).toMatchObject({
      property_id: 'synthetic-property', status: 'draft', commission_rate: null,
      commission_amount: null, revenue_split_owner: null, revenue_split_manager: null,
      expense_responsibility: {}, payment_day: null, accounting_policy: null, owner_notification_defaults: null,
    });
    expect(screen.queryByText(/70\/30|80\/20|Full Service/)).not.toBeInTheDocument();
  });
  it('keeps explicit zero and accounting options in the save payload', async () => {
    mount();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Commission rate' }), { target: { value: '0' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Hold (days)' }), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledOnce());
    expect(state.create.mock.calls[0][0]).toMatchObject({ commission_rate: 0, accounting_policy: { payout_hold_days: 0 } });
  });
  it('does not activate an incomplete draft or create payout rules implicitly', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    expect(state.create).not.toHaveBeenCalled(); expect(state.update).not.toHaveBeenCalled(); expect(state.addRule).not.toHaveBeenCalled();
  });
  it('activates explicitly entered zero after expense responsibilities are selected', async () => {
    mount(); fireEvent.change(screen.getByRole('spinbutton', { name: 'Commission rate' }), { target: { value: '0' } });
    screen.getAllByRole('button', { name: 'Owner' }).forEach(button => fireEvent.click(button));
    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledOnce());
    expect(state.create.mock.calls[0][0]).toMatchObject({ status: 'active', commission_rate: 0 });
    expect(Object.keys(state.create.mock.calls[0][0].expense_responsibility)).toHaveLength(9);
  });
  it('resets unsaved values on a property switch', () => {
    const view = mount();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Commission rate' }), { target: { value: '37' } });
    view.rerender(<ManagementTermsForm propertyId="another-property" />);
    expect(screen.getByRole('spinbutton', { name: 'Commission rate' })).toHaveValue(null);
  });
  it('retains a new recipient until confirmed success, including explicit zero', () => {
    mount();
    const name = screen.getByRole('textbox', { name: 'Recipient name' });
    const amount = screen.getByRole('spinbutton', { name: 'Recipient commission' });
    fireEvent.change(name, { target: { value: 'Chosen recipient' } });
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    fireEvent.change(amount, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(state.addRule).toHaveBeenCalledOnce();
    expect(state.addRule.mock.calls[0][0]).toMatchObject({ commission_value: 0, recipient_name: 'Chosen recipient' });
    expect(name).toHaveValue('Chosen recipient'); expect(amount).toHaveValue(0);
    act(() => { state.addRule.mock.calls[0][1].onSuccess(); });
    expect(name).toHaveValue(''); expect(amount).toHaveValue(null);
  });
  it('reports a read failure instead of an empty payout configuration', () => {
    state.rulesError = Error('Synthetic denial'); mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load payout rules');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(state.retry).toHaveBeenCalledOnce();
    expect(screen.queryByText('Configured preview boundary')).not.toBeInTheDocument();
  });
  it('keeps a committed save successful when the secondary log fails', async () => {
    state.log.mockRejectedValue(Error('Log unavailable')); mount();
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(state.saved).toHaveBeenCalledOnce());
    expect(state.create).toHaveBeenCalledOnce();
  });
});

