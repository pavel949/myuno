import React from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminProviders from '../AdminProviders';

const state = vi.hoisted(() => ({ from: vi.fn(), order: vi.fn(), error: vi.fn(), language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' }, isLoading: false }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: true, isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
vi.mock('@/components/admin/BusinessCardScanButton', () => ({ BusinessCardScanButton: () => null }));
vi.mock('sonner', () => ({ toast: { error: state.error, success: vi.fn() } }));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ silent: vi.fn() }) }));

const provider = { id: 'provider-b', name: 'Fresh Synthetic Provider B', business_category: 'legal', is_active: true, is_verified: false };
const Location = () => <output aria-label="Current route">{useLocation().pathname}{useLocation().search}</output>;
const clients: QueryClient[] = [];

function view(cached: object[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  client.setQueryData(['admin', 'providers', 'synthetic-admin', 'inactive', 'keep', 0, 'provider-b'], {rows:cached,count:cached.length});
  return <QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin/providers?edit=provider-b&q=keep&filter=inactive']}><Location /><AdminProviders /></MemoryRouter></QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.language = 'en';
  state.from.mockImplementation(() => { const query = {select:()=>query,order:()=>query,eq:()=>query,or:()=>query,range:()=>query,then:(resolve: (value: unknown)=>unknown,reject: (reason: unknown)=>unknown)=>state.order().then(resolve,reject)}; return query; });
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

describe('provider edit waits for the real query refetch', () => {
  it.each([false, true])('waits for refreshed data when the cache contains the target: %s', async cachedTarget => {
    let resolve!: (value: { data: object[]; error: null }) => void;
    state.order.mockReturnValue(new Promise(done => { resolve = done; }));
    render(view(cachedTarget ? [{ ...provider, name: 'Stale Synthetic Name' }] : []));
    await waitFor(() => expect(state.order).toHaveBeenCalledOnce());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('edit=provider-b');
    expect(state.error).not.toHaveBeenCalled();
    await act(async () => resolve({ data: [provider], error: null }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Provider' });
    expect(within(dialog).getByDisplayValue(provider.name)).toBeTruthy();
    expect(screen.getByLabelText('Current route').textContent).toBe('/admin/providers?q=keep&filter=inactive');
    await waitFor(()=>expect(state.from).toHaveBeenCalledTimes(2));
    expect(state.from).toHaveBeenCalledWith('providers');
  });

  it.each(['en', 'ru'])('reports a settled read error instead of missing access or opening stale data (%s)', async language => {
    state.language = language;
    let resolve!: (value: { data: null; error: Error }) => void;
    state.order.mockReturnValue(new Promise(done => { resolve = done; }));
    render(view([provider]));
    await waitFor(() => expect(state.order).toHaveBeenCalledOnce());
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => resolve({ data: null, error: new Error('Synthetic read failure') }));
    await waitFor(() => expect(state.error).toHaveBeenCalledWith(language === 'ru'
      ? 'Не удалось загрузить провайдеров. Попробуйте ещё раз.'
      : 'Could not load providers. Please try again.'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Current route').textContent).toBe('/admin/providers?q=keep&filter=inactive');
    await waitFor(()=>expect(state.from).toHaveBeenCalledTimes(2));
  });
});
