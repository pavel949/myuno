import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManagedPropertyDrafts } from '../ManagedPropertyDrafts';
const mocks = vi.hoisted(() => ({ list: vi.fn(), actor: 'employee-a', company: 'company-a', language: 'en' }));
vi.mock('@/lib/propertyAuthoring', () => ({ listManagedPropertyDrafts: mocks.list }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: mocks.company ? { company_id: mocks.company } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/hooks/useCompanyAccessLifetime', () => ({ useCompanyAccessLifetime: () => ({ begin: () => ({ finish: vi.fn() }) }) }));
vi.mock('@/lib/companyAccessOperation', () => ({ bindCompanyAccessOperation: vi.fn(async () => ({})) }));
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><ManagedPropertyDrafts /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => { vi.clearAllMocks(); mocks.company = 'company-a'; mocks.language = 'en'; mocks.list.mockResolvedValue([]); });
afterEach(cleanup);
describe('catalogue-only data entry list', () => {
  it('links the exact safe draft ID to its authoring editor', async () => {
    mocks.list.mockResolvedValue([{ id: 'draft-a', title_en: 'Synthetic villa', approval_status: 'pending' }]);
    mount();
    expect(await screen.findByText('Awaiting review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/mc/properties/draft-a/editor');
    expect(mocks.list).toHaveBeenCalledWith('company-a', 0, 50, expect.anything());
  });
  it('keeps an empty scope empty', async () => {
    mount();
    expect(await screen.findByText('No drafts available in this scope.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('shows unavailable with retry rather than inventing an empty list', async () => {
    mocks.list.mockRejectedValueOnce(new Error('RPC not deployed')).mockResolvedValueOnce([]);
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Data entry is unavailable');
    expect(screen.queryByText('No drafts available in this scope.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No drafts available in this scope.')).toBeInTheDocument();
  });
  it('does not query without an active company', () => { mocks.company = ''; mount(); expect(mocks.list).not.toHaveBeenCalled(); });
  it('localizes Thai status without falling back to English', async () => {
    mocks.language = 'th'; mocks.list.mockResolvedValue([{ id: 'draft-a', title_en: 'Synthetic villa', approval_status: 'draft' }]);
    mount(); expect(await screen.findByText('ฉบับร่าง')).toBeInTheDocument();
  });
});
