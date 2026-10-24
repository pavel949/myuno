import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManagedComplexPicker } from '../ManagedComplexPicker';
const mocks = vi.hoisted(() => ({ list: vi.fn(), actorId: 'employee-a', companyId: 'company-a', language: 'en', loading: false, companyError: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actorId } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: mocks.companyId }, isLoading: mocks.loading, error: mocks.companyError }) }));
vi.mock('@/lib/companyAccessOperation', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/companyAccessOperation')>(), bindCompanyAccessOperation: async lease => lease }));
vi.mock('@/lib/complexAuthoring', () => ({ listManagedComplexDrafts: (...args: unknown[]) => mocks.list(...args) }));
const approved = { id: 'complex-a', name: 'Approved complex', name_ru: 'Одобренный комплекс', is_active: true, approval_status: 'approved' };
const wrapper = ({ children }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
beforeEach(() => { vi.clearAllMocks(); mocks.actorId = 'employee-a'; mocks.companyId = 'company-a'; mocks.language = 'en'; mocks.loading = false; mocks.companyError = false; mocks.list.mockResolvedValue([approved]); });
const scrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
beforeAll(() => Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() }));
afterAll(() => { if (scrollIntoView) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollIntoView); else delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView; });
afterEach(cleanup);
async function openOptions() {
  const trigger = screen.getByRole('combobox');
  await waitFor(() => expect(trigger).not.toBeDisabled());
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
}

describe('employee complex grouping choice', () => {
  it('shows workspace loading and failure without querying or clearing the current link', () => {
    const change = vi.fn(); mocks.loading = true;
    const { rerender } = render(<ManagedComplexPicker value="existing" onChange={change} />, { wrapper });
    expect(screen.getByRole('status')).toHaveTextContent('Loading complex workspace');
    mocks.loading = false; mocks.companyError = true;
    rerender(<ManagedComplexPicker value="existing" onChange={change} />);
    expect(screen.getByRole('alert')).toHaveTextContent('current link is preserved');
    expect(mocks.list).not.toHaveBeenCalled(); expect(change).not.toHaveBeenCalled();
  });
  it('reads the bound checked list and links only an approved active own complex', async () => {
    mocks.list.mockResolvedValue([approved, { ...approved, id: 'draft', name: 'Hidden draft', approval_status: 'draft', is_active: false }, { ...approved, id: 'pending', name: 'Hidden pending', approval_status: 'pending', is_active: false }]);
    const change = vi.fn(); const { rerender } = render(<ManagedComplexPicker onChange={change} />, { wrapper });
    await openOptions();
    await screen.findByRole('option', { name: 'Approved complex' });
    expect(screen.queryByRole('option', { name: 'Hidden draft' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'Hidden pending' })).toBeNull();
    expect(screen.getByRole('combobox', { hidden: true }).tagName).toBe('BUTTON');
    expect(screen.getByRole('option', { name: 'Approved complex' })).toHaveClass('min-h-11', 'whitespace-normal', 'break-words');
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'employee-a', companyId: 'company-a' }), 0, 100);
    fireEvent.click(screen.getByRole('option', { name: 'Approved complex' }));
    expect(change).toHaveBeenCalledWith('complex-a');
    rerender(<ManagedComplexPicker value="complex-a" onChange={change} />);
    await openOptions();
    fireEvent.click(screen.getByRole('option', { name: 'Standalone property' }));
    expect(change).toHaveBeenLastCalledWith(undefined);
  });
  it('preserves an existing unseen link without automatically clearing it', async () => {
    const change = vi.fn(); render(<ManagedComplexPicker value="existing" onChange={change} />, { wrapper });
    await openOptions();
    await screen.findByRole('option', { name: 'Approved complex' });
    expect(screen.getByRole('combobox', { hidden: true })).toHaveTextContent('Current complex (not in this list)');
    expect(change).not.toHaveBeenCalled();
  });
  it('fails closed on list failure and supports retry without changing the link', async () => {
    mocks.list.mockRejectedValueOnce(new Error('RPC unavailable'));
    const change = vi.fn(); render(<ManagedComplexPicker value="existing" onChange={change} />, { wrapper });
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Your published complex')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await openOptions();
    await screen.findByRole('option', { name: 'Approved complex' });
    expect(change).not.toHaveBeenCalled();
  });
  it('paginates checked rows so an approved complex after many drafts stays reachable', async () => {
    mocks.list.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => ({ ...approved, id: `draft-${i}`, is_active: false, approval_status: 'draft' }))).mockResolvedValueOnce([approved]);
    render(<ManagedComplexPicker onChange={vi.fn()} />, { wrapper });
    fireEvent.click(await screen.findByRole('button', { name: 'Load more complexes' }));
    await openOptions();
    await screen.findByRole('option', { name: 'Approved complex' });
    expect(mocks.list).toHaveBeenLastCalledWith(expect.anything(), 100, 100);
  });
  it('never shows previous company choices after a company switch', async () => {
    const { rerender } = render(<ManagedComplexPicker onChange={vi.fn()} />, { wrapper });
    await openOptions();
    await screen.findByRole('option', { name: 'Approved complex' });
    mocks.companyId = 'company-b'; mocks.list.mockResolvedValue([]);
    rerender(<ManagedComplexPicker onChange={vi.fn()} />);
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ companyId: 'company-b' }), 0, 100));
    expect(screen.queryByRole('option', { name: 'Approved complex' })).toBeNull();
  });
  it('uses the Russian name where available', async () => {
    mocks.language = 'ru'; render(<ManagedComplexPicker onChange={vi.fn()} />, { wrapper });
    await openOptions();
    expect(await screen.findByRole('option', { name: 'Одобренный комплекс' })).toBeInTheDocument();
  });
});
