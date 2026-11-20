import { webcrypto } from 'node:crypto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import FlowersOrder from './FlowersOrder';
import { readFlowerCartLine } from '@/lib/flowerDelivery';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-customer' }, isLoading: false }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ isLoading: false, getItemsByType: () => [{ id: 'bouquet-00000000-0000-0000-0000-000000000002-M', name: 'Synthetic bouquet', quantity: 1 }] }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }) => children }));
vi.mock('@/components/uno/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/guest/LoginRequiredModal', () => ({ LoginRequiredModal: () => null }));

const id = '00000000-0000-0000-0000-000000000001';
const request = { address: 'Phuket synthetic address', date: '2099-11-20', slot: 'morning' };
const estimate = { subtotal: 900, delivery_fee: 200, total: 1100, currency: 'THB' };
const mount = (path = '/flowers/order') => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
  <MemoryRouter initialEntries={[path]}><FlowersOrder /></MemoryRouter>
</QueryClientProvider>);

beforeEach(() => { rpc.mockReset(); sessionStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());

it('submits only delivery preferences and canonical product IDs, with no payment instruction', async () => {
  rpc.mockResolvedValueOnce({ data: id, error: null }).mockResolvedValueOnce({ data: { id, request, status: 'pending', estimate }, error: null });
  mount();
  fireEvent.change(screen.getByLabelText('Preferred date'), { target: { value: '2099-11-20' } });
  fireEvent.change(screen.getByLabelText('Preferred window in Phuket'), { target: { value: 'morning' } });
  fireEvent.change(screen.getByLabelText('Recipient name'), { target: { value: 'Synthetic Guest' } });
  fireEvent.change(screen.getByLabelText('Recipient phone'), { target: { value: '+66000000000' } });
  fireEvent.change(screen.getByLabelText('Full delivery address'), { target: { value: request.address } });
  fireEvent.click(screen.getByRole('button', { name: 'Request delivery confirmation' }));
  expect(await screen.findByText('The team is checking delivery')).toBeVisible();
  expect(screen.getByText('Estimated total')).toBeVisible();
  expect(screen.queryByRole('button', { name: /pay/i })).toBeNull();
  expect(rpc.mock.calls[0]).toEqual(['request_flower_delivery', { payload: {
    ...request, recipient: 'Synthetic Guest', phone: '+66000000000', note: '',
    items: [{ bouquet_id: '00000000-0000-0000-0000-000000000002', size: 'M', quantity: 1 }],
    request_key: expect.any(String),
  } }]);
});

it('labels the total due only for the operator-confirmed snapshot', async () => {
  rpc.mockResolvedValue({ data: { id, request, status: 'confirmed', estimate: { ...estimate, total: 500 }, confirmed_quote: estimate }, error: null });
  mount('/flowers/order?request=' + id);
  expect(await screen.findByText('Delivery and total confirmed')).toBeVisible();
  expect(screen.getByText('Total due')).toBeVisible();
  expect(screen.queryByText('Estimated total')).toBeNull();
});

it('distinguishes a shop UUID from the canonical bouquet UUID', () => {
  expect(readFlowerCartLine('flowers-' + id + '-00000000-0000-0000-0000-000000000002', 1)).toMatchObject({
    bouquet_id: '00000000-0000-0000-0000-000000000002', quantity: 1,
  });
  expect(readFlowerCartLine('flowers-' + id, 1)).toBeNull();
});
