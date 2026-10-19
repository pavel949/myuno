vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { OperationsModerationTab } from './OperationsModerationTab';
import type { ModerationItem, ModerationQueue } from '@/lib/adminModeration';

const state = vi.hoisted(() => ({ language: 'en', fetch: vi.fn(), success: vi.fn(), error: vi.fn(), response: null as null | Record<string, unknown>, pending: null as null | Promise<unknown>, filters: [] as unknown[][], writes: [] as Array<{ table: string; value: unknown; id?: string }> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/lib/adminModeration', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/adminModeration')>(), fetchModerationQueue: () => state.fetch() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => ({ update: (value: Record<string, unknown>) => {
    let id = '';
    const chain = {
      eq: (key: string, field: unknown) => { state.filters.push([key, field]); if (key === 'id') id = String(field); return chain; },
      is: (key: string, field: unknown) => { state.filters.push(['is', key, field]); return chain; },
      select: () => chain,
      single: async () => {
        state.writes.push({ table, value, id });
        return state.pending ? await state.pending : state.response ?? { data: { id, ...value }, error: null };
      },
    };
    return chain;
  } }),
} }));

const item = (type: ModerationItem['type'], id: string, values: Partial<ModerationItem> = {}): ModerationItem => ({
  type, id, updated_at: '2026-10-19T04:00:00Z', name_en: id, name_ru: null, created_at: '2026-02-01T12:00:00Z', approval_status: 'pending',
  provider_name: null, provider_id: null, category: null, vertical: null, ...values,
});
const rows = [
  item('listing', 'clinic-id', { name_en: 'Synthetic clinic', name_ru: 'Тестовая клиника', vertical: 'clinic' }),
  item('listing', 'yacht-id', { name_en: 'Synthetic yacht', vertical: 'yacht', provider_name: 'Ocean provider' }),
  item('property', 'property-id', { name_en: 'Ownerless villa', name_ru: 'Вилла без владельца', category: 'villa', created_at: null }),
  item('service', 'service-id', { name_en: 'Inactive approved service', approval_status: 'approved', provider_id: 'provider-id' }),
  item('product', 'product-id', { name_en: 'Inactive rejected product', approval_status: 'rejected', category: 'supplies' }),
];
let data: ModerationQueue;
const clients: QueryClient[] = [];
function LocationProbe({ navigation = false }: { navigation?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="route">{location.pathname}{location.search}</output>{navigation && <>
    <button onClick={() => navigate('/admin/operations?tab=moderation&queue=inactive&q=Inactive&type=product&category=supplies')}>External queue</button>
    <button onClick={() => navigate(-1)}>Back fixture</button>
  </>}</>;
}
function mount(route = '/admin/operations?tab=moderation', transitions = false, navigation = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]} future={transitions ? { v7_startTransition: true, v7_relativeSplatPath: true } : undefined}><OperationsModerationTab /><LocationProbe navigation={navigation} /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  state.language = 'en'; state.writes.length = 0; state.fetch.mockReset(); state.success.mockReset(); state.error.mockReset(); state.response = null; state.pending = null; state.filters.length = 0;
  data = { items: rows, totals: { listing: 240, property: 8, service: 4, product: 3 }, errors: [] };
  state.fetch.mockImplementation(async () => data);
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
const loaded = async () => { await waitFor(() => expect(screen.getAllByTestId('moderation-row')).toHaveLength(3)); };

describe('review-first moderation queue', () => {
  it('shows 248 exact pending records and keeps seven inactive catalog records separate', async () => {
    mount(); await loaded();
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('248');
    expect(screen.getByTestId('moderation-summary')).toHaveTextContent('Loaded 3 of 248');
    expect(screen.queryByRole('tab', { name: 'Approved' })).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Inactive catalog' }));
    await waitFor(() => expect(screen.getByTestId('moderation-count')).toHaveTextContent('7'));
    expect(screen.getAllByTestId('moderation-row')).toHaveLength(2);
    expect(screen.getByText('Approved · Inactive')).toBeInTheDocument();
    expect(screen.getByText('Rejected · Inactive')).toBeInTheDocument();
    expect(screen.getByText(/Inactive does not mean awaiting approval/)).toBeInTheDocument();
    expect(state.writes).toEqual([]);
  });

  it('filters loaded names in both languages, provider, type and category, then resets', async () => {
    mount(); await loaded();
    const search = screen.getByRole('textbox', { name: 'Search queue' });
    fireEvent.change(search, { target: { value: 'клиника' } });
    expect(screen.getAllByTestId('moderation-row')).toHaveLength(1);
    expect(screen.getByText('Synthetic clinic')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'Ocean' } });
    expect(screen.getByText('Synthetic yacht')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Content type' }), { target: { value: 'listing' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: 'clinic' } });
    expect(screen.getAllByTestId('moderation-row')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByTestId('moderation-row')).toHaveLength(3);
    expect(state.writes).toEqual([]);
  });

  it('opens only the verified property editor; missing item routes are explained and collection links are honest', async () => {
    mount(); await loaded();
    const property = screen.getAllByTestId('moderation-row').find(row => row.textContent?.includes('Ownerless villa'))!;
    fireEvent.click(within(property).getByRole('button', { name: 'Review' }));
    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/admin/properties?edit=property-id'));
    const clinic = screen.getAllByTestId('moderation-row').find(row => row.textContent?.includes('Synthetic clinic'))!;
    expect(within(clinic).getByRole('button', { name: 'Review' })).toBeDisabled();
    expect(within(clinic).getByText(/Direct item review is not available/)).toBeInTheDocument();
    fireEvent.click(within(clinic).getByRole('button', { name: 'Open category catalog' }));
    await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/admin/clinics'));
    expect(state.writes).toEqual([]);
  });

  it('does not invent providers or submission age and tolerates missing dates', async () => {
    mount(); await loaded();
    expect(screen.getAllByText('Not available')).toHaveLength(2);
    expect(screen.getAllByText('Created, not submitted')).toHaveLength(3);
    expect(screen.getAllByText('01.02.2026')).toHaveLength(2);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('shows unknown counts and retries failed sources rather than declaring an empty or approved queue', async () => {
    data = { items: [], totals: { listing: null, property: 0, service: 0, product: 0 }, errors: ['listing'] };
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Some queue data is unavailable');
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('Unknown');
    expect(screen.queryByText('No pending items')).not.toBeInTheDocument();
    data = { items: rows, totals: { listing: 240, property: 8, service: 4, product: 3 }, errors: [] };
    fireEvent.click(screen.getByRole('button', { name: 'Retry' })); await loaded();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(state.fetch).toHaveBeenCalledTimes(2);
  });

  it('distinguishes a genuine empty queue from no matches and loading', async () => {
    data = { items: [], totals: { listing: 0, property: 0, service: 0, product: 0 }, errors: [] };
    mount();
    expect(await screen.findByText('No pending items')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search queue' }), { target: { value: 'absent' } });
    expect(screen.getByText('No matching items')).toBeInTheDocument();
  });

  it('does not render loading as zero', () => {
    state.fetch.mockImplementation(() => new Promise(() => {})); mount();
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('…');
    expect(screen.queryByText('No pending items')).not.toBeInTheDocument();
    expect(state.writes).toEqual([]);
  });

  it('supports Russian labels and localizes already-fetched bilingual records', async () => {
    state.language = 'ru'; mount(); await loaded();
    expect(screen.getByRole('textbox', { name: 'Поиск в очереди' })).toBeInTheDocument();
    expect(screen.getByText('Тестовая клиника')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Неактивный каталог' })).toBeInTheDocument();
  });

  it.each([
    ['listing', 'clinic-id', 'Approve & activate', { approval_status: 'approved', is_active: true }, 'listings'],
    ['listing', 'clinic-id', 'Reject', { approval_status: 'rejected', is_active: false }, 'listings'],
    ['property', 'property-id', 'Reject', { approval_status: 'rejected', is_active: false }, 'properties'],
    ['property', 'property-id', 'Approve & activate', { approval_status: 'approved', is_active: true }, 'properties'],
    ['service', 'service-id', 'Activate', { is_active: true }, 'services'],
    ['service', 'service-id', 'Keep inactive', { is_active: false }, 'services'],
    ['product', 'product-id', 'Keep inactive', { is_active: false }, 'marketplace_products'],
    ['product', 'product-id', 'Activate', { is_active: true }, 'marketplace_products'],
  ] as const)('preserves the existing %s writer only on explicit action', async (type, id, action, value, table) => {
    mount(); await loaded(); expect(state.writes).toEqual([]);
    if (type === 'service' || type === 'product') fireEvent.mouseDown(screen.getByRole('tab', { name: 'Inactive catalog' }));
    const target = rows.find(row => row.id === id)!;
    fireEvent.click(await screen.findByRole('button', { name: `${action}: ${target.name_en}` }));
    await waitFor(() => expect(state.writes).toEqual([{ table, value, id }]));
    expect(state.filters).toEqual([['id', id], type === 'listing' || type === 'property' ? ['approval_status', 'pending'] : ['is_active', false], ...(type === 'property' ? [['updated_at', target.updated_at], ['is', 'deleted_at', null]] : [])]);
    await waitFor(() => expect(state.success).toHaveBeenCalledWith(action === 'Activate' ? 'Activated' : action === 'Keep inactive' ? 'Kept inactive' : action === 'Approve & activate' ? 'Approved and activated' : 'Rejected'));
  });
});


it.each([
  { data: null, error: { message: 'No matching row' } },
  { data: null, error: null },
  { data: { id: 'property-id', approval_status: 'pending', is_active: true }, error: null },
  { data: { id: 'property-id', approval_status: 'approved', is_active: false }, error: null },
])('never reports an unconfirmed moderation write as successful: %o', async response => {
  state.response = response;
  mount(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
  await waitFor(() => expect(state.error).toHaveBeenCalledWith('Change not confirmed. Refresh the queue and try again.'));
  expect(state.success).not.toHaveBeenCalled();
  expect(state.fetch).toHaveBeenCalledTimes(2);
});

it('blocks repeated and conflicting actions while a mutation is in flight', async () => {
  let resolve!: (value: unknown) => void;
  state.pending = new Promise(done => { resolve = done; });
  mount(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
  fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reject: Ownerless villa' }));
  await waitFor(() => expect(state.writes).toHaveLength(1));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reject: Ownerless villa' })).toBeDisabled());
  resolve({ data: { id: 'property-id', approval_status: 'approved', is_active: true }, error: null });
  await waitFor(() => expect(state.success).toHaveBeenCalledWith('Approved and activated'));
});

it('hydrates a filtered queue URL and carries it into property review', async () => {
  mount('/admin/operations?tab=moderation&q=Ownerless&type=property&category=villa');
  expect(await screen.findByText('Ownerless villa')).toBeInTheDocument();
  expect(screen.getAllByTestId('moderation-row')).toHaveLength(1);
  expect(screen.getByRole('textbox', { name: 'Search queue' })).toHaveValue('Ownerless');
  fireEvent.click(screen.getByRole('button', { name: 'Review' }));
  await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/admin/properties?edit=property-id&return=%2Fadmin%2Foperations%3Ftab%3Dmoderation%26q%3DOwnerless%26type%3Dproperty%26category%3Dvilla'));
  expect(state.writes).toEqual([]);
});


it('does not attempt property approval when the reviewed revision is missing', async () => {
  data = { ...data, items: rows.map(row => ({ ...row, updated_at: null })) };
  mount(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(state.writes).toEqual([]);
  expect(state.success).not.toHaveBeenCalled();
});

it('localizes the reviewed queue controls and status in Thai without translating source names', async () => {
  state.language = 'th'; mount(); await loaded();
  expect(screen.getByText('คิวตรวจสอบ')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'ค้นหาในคิว' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'อนุมัติและเปิดใช้งาน: Ownerless villa' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'รายการที่ไม่ใช้งาน' })).toBeInTheDocument();
  expect(screen.getByText('Synthetic clinic')).toBeInTheDocument();
  expect(screen.getByTestId('moderation-summary')).toHaveTextContent('โหลด 3 จาก 248');
});


it('does not confirm approval when the pending property was moved to trash after loading', async () => {
  state.response = { data: null, error: { message: 'No non-deleted property matched' } };
  mount(); await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(state.filters).toContainEqual(['is', 'deleted_at', null]);
  expect(state.filters).toContainEqual(['approval_status', 'pending']);
  expect(state.filters).toContainEqual(['updated_at', '2026-10-19T04:00:00Z']);
  expect(state.success).not.toHaveBeenCalled();
});


it('keeps rapid clear, type and category changes composed before a router transition commits', async () => {
  state.language = 'ru';
  data = { ...data, items: [
    item('service', 'transfer', { name_en: 'Transfer service', name_ru: 'Услуга трансфера', approval_status: 'approved' }),
    item('product', 'coffee', { name_en: 'Local coffee', name_ru: 'Местный кофе', approval_status: 'draft', category: 'groceries' }),
  ] };
  mount('/admin/operations?tab=moderation&queue=inactive&q=' + encodeURIComponent('Услуга трансфера'), true);
  await screen.findByText('Услуга трансфера');
  const clear = screen.getByRole('button', { name: 'Сбросить фильтры' });
  const type = screen.getByRole('combobox', { name: 'Тип контента' });
  const category = screen.getByRole('combobox', { name: 'Категория' });
  act(() => {
    fireEvent.click(clear);
    fireEvent.change(type, { target: { value: 'product' } });
    fireEvent.change(category, { target: { value: 'groceries' } });
  });
  await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/admin/operations?tab=moderation&queue=inactive&type=product&category=groceries'));
  expect(screen.getByTestId('route').textContent).not.toContain('q=');
  expect(screen.getByRole('textbox', { name: 'Поиск в очереди' })).toHaveValue('');
  expect(screen.getByText('Местный кофе')).toBeInTheDocument();
  expect(screen.getAllByTestId('moderation-row')).toHaveLength(1);
  expect(state.writes).toEqual([]);
});


it('resynchronizes the filter snapshot after external navigation and history back', async () => {
  mount('/admin/operations?tab=moderation&q=Ownerless&type=property&category=villa', true, true);
  await screen.findByText('Ownerless villa');
  fireEvent.click(screen.getByRole('button', { name: 'External queue' }));
  await screen.findByText('Inactive rejected product');
  fireEvent.change(screen.getByRole('textbox', { name: 'Search queue' }), { target: { value: '' } });
  await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/admin/operations?tab=moderation&queue=inactive&type=product&category=supplies'));
  fireEvent.click(screen.getByRole('button', { name: 'Back fixture' }));
  await screen.findByText('Ownerless villa');
  fireEvent.change(screen.getByRole('textbox', { name: 'Search queue' }), { target: { value: 'villa' } });
  await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/admin/operations?tab=moderation&q=villa&type=property&category=villa'));
  expect(screen.getAllByTestId('moderation-row')).toHaveLength(1);
  expect(state.writes).toEqual([]);
});
