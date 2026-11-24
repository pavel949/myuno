import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OperationsInquiriesTab } from './OperationsInquiriesTab';

const fake = vi.hoisted(() => ({ error: false, limit: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const q = {
    select: () => q, order: () => q, eq: () => q,
    limit: (size: number) => { fake.limit(size); return q; },
    then: (resolve: (response: unknown) => unknown) => Promise.resolve({
      error: fake.error ? new Error('Synthetic denied read') : null,
      data: fake.error ? null : [{ id: 'one', subject: 'Synthetic inquiry', description: 'Test request', ticket_number: 'SUP-1', status: 'open', priority: 'normal', created_at: '2026-01-01T00:00:00Z' }],
    }).then(resolve),
  };
  return q;
} } }));
beforeEach(() => { fake.error = false; fake.limit.mockClear(); });
afterEach(cleanup);
const mount = () => render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><OperationsInquiriesTab /></QueryClientProvider></MemoryRouter>);

it('labels loaded-slice search and counts rather than implying a global total', async () => {
  mount();
  expect(await screen.findByText('Synthetic inquiry')).toBeVisible();
  expect(fake.limit).toHaveBeenCalledExactlyOnceWith(100);
  const search = screen.getByRole('searchbox', { name: 'Search loaded inquiries' });
  expect(search).toHaveAccessibleDescription(/up to the latest 100 loaded inquiries/);
  expect(screen.getByText('Loaded')).toBeVisible();
  fireEvent.change(search, { target: { value: 'missing from page' } });
  expect(screen.queryByText('Synthetic inquiry')).not.toBeInTheDocument();
  expect(fake.limit).toHaveBeenCalledTimes(1);
});
it('keeps a denied read distinct from a verified empty queue and offers retry', async () => {
  fake.error = true;
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load inquiries.');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  fake.error = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getByText('Synthetic inquiry')).toBeVisible());
});
