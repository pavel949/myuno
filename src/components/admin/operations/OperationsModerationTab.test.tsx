vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { OperationsModerationTab } from './OperationsModerationTab';
import type { ModerationItem, ModerationQueue } from '@/lib/adminModeration';

const state = vi.hoisted(() => ({ language: 'en', fetch: vi.fn(), detail: vi.fn(), success: vi.fn(), error: vi.fn(), response: null as null | Record<string, unknown>, pending: null as null | Promise<unknown>, filters: [] as unknown[][], writes: [] as Array<{ table: string; value: unknown; id?: string }> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/lib/adminModeration', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/adminModeration')>();
  return { ...actual, fetchModerationDetail: (type: string,id: string) => state.detail(type,id), fetchModerationQueue: (options: unknown) => state.fetch(options), fetchModerationCategoryOptions: (source: ModerationItem['type']) => source === 'product' ? Promise.resolve(['supplies', 'retired-category']) : actual.fetchModerationCategoryOptions(source) };
});
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
  data = { items: rows, totals: { listing: 240, property: 801, service: 4, product: 3 }, errors: [] };
  state.fetch.mockImplementation(async ({ source, search, category }: { source: string; search: string; category: string }) => ({ ...data,
    items: data.items.filter(item => item.type === source && (!search || [item.name_en, item.name_ru, item.id].some(value => value?.toLowerCase().includes(search.toLowerCase()))) && (category === 'all' || !category || (item.vertical || item.category) === category))
  }));
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
const ready = async (name = 'Synthetic clinic') => { await screen.findByText(name); };

describe('source-specific review pages', () => {
  it('offers retired taxonomy categories even when no current row uses them', async () => {
    mount('/admin/operations?tab=moderation&queue=inactive&type=product');
    await ready('Inactive rejected product');
    await screen.findByRole('option', { name: 'retired-category' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: 'retired-category' } });
    await waitFor(() => expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'product', page: 0, category: 'retired-category' })));
    expect(state.writes).toEqual([]);
  });
  it('keeps source counts and records separate, rather than merging capped cursors', async () => {
    mount(); await ready();
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('240');
    expect(screen.getAllByTestId('moderation-row')).toHaveLength(2);
    expect(screen.queryByText('Ownerless villa')).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Content type' }), { target: { value: 'property' } });
    await ready('Ownerless villa');
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('801');
    await waitFor(() => expect(screen.getAllByTestId('moderation-row')).toHaveLength(1));
    expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'property', page: 0, queue: 'pending' }));
    expect(state.writes).toEqual([]);
  });
  it('pages beyond the former500 cap and retains the exact return context for property review', async () => {
    mount('/admin/operations?tab=moderation&type=property&page=12&category=villa'); await ready('Ownerless villa');
    expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'property', page: 12, category: 'villa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    await waitFor(() => expect(screen.getByTestId('route').textContent).toContain('page%3D12'));
    expect(state.writes).toEqual([]);
  });
  it('applies filters as server query inputs and resets only page/filter state', async () => {
    mount('/admin/operations?tab=moderation&type=property&page=12&persona=P3'); await ready('Ownerless villa');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search queue' }), { target: { value: 'villa' } });
    await waitFor(() => expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'property', page: 0, search: 'villa' })));
    expect(screen.getByTestId('route').textContent).toContain('persona=P3');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, search: '', category: 'all' })));
    expect(screen.getByTestId('route').textContent).toContain('persona=P3');
  });
  it('keeps inactive catalog statuses distinct and drafts read-only', async () => {
    mount('/admin/operations?tab=moderation&queue=inactive&type=service'); await ready('Inactive approved service');
    expect(screen.getByText(/Inactive does not mean awaiting approval/)).toBeVisible();
    expect(screen.getByText(/Approved/)).toBeVisible();
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Drafts/ }));
    await ready('Synthetic clinic');
    expect(state.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ queue: 'draft', source: 'listing' }));
    expect(screen.getByText('Drafts have not been submitted for approval.')).toBeVisible();
    for (const button of screen.getAllByRole('button', { name: /Approve & activate:/ })) expect(button).toBeDisabled();
    expect(state.writes).toEqual([]);
  });
  it('does not claim an empty queue or count after selected source failure', async () => {
    data = { ...data, errors: ['listing'], totals: { ...data.totals, listing: null }, items: [] };
    mount(); await screen.findByRole('alert');
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('Unknown');
    expect(screen.queryByText('No pending items')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(state.fetch.mock.calls.length).toBeGreaterThan(1));
  });
  it('opens the exact listing content without leaving the filtered queue', async()=>{
    state.detail.mockResolvedValue({id:'clinic-id',type:'listing',name_en:'Persisted clinic content',description_en:'Saved description',images:[],price:null,currency:null,is_active:false,approval_status:'pending',updated_at:'revision'});
    mount();await ready();
    fireEvent.click(screen.getAllByRole('button',{name:'Review'})[0]);
    expect(await screen.findByText('Persisted clinic content')).toBeInTheDocument();
    expect(state.detail).toHaveBeenCalledWith('listing','clinic-id');
    expect(state.writes).toEqual([]);
    fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});
    await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(()=>expect(state.fetch.mock.calls.length).toBeGreaterThan(1));
    expect(screen.getAllByRole('button',{name:'Review'})[0]).toHaveFocus();
  });
  it('does not imply source catalogs are record review or publish them on navigation', async () => {
    mount(); await ready();
    expect(screen.getAllByRole('button', { name: 'Review' })[0]).toBeEnabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Open category catalog' })[0]);
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/admin/clinics'));
    expect(state.writes).toEqual([]);
  });
  it('retains property pending revision and non-deleted guards and confirms only returned rows', async () => {
    state.response = { data: null, error: { message: 'stale or unauthorized' } };
    mount('/admin/operations?tab=moderation&type=property'); await ready('Ownerless villa');
    fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
    await waitFor(() => expect(state.error).toHaveBeenCalled());
    expect(state.filters).toContainEqual(['approval_status', 'pending']);
    expect(state.filters).toContainEqual(['updated_at', '2026-10-19T04:00:00Z']);
    expect(state.filters).toContainEqual(['is', 'deleted_at', null]);
    expect(state.success).not.toHaveBeenCalled();
  });
  it('refuses a missing reviewed property revision without making a write', async () => {
    data = { ...data, items: rows.map(row => ({ ...row, updated_at: null })) };
    mount('/admin/operations?tab=moderation&type=property'); await ready('Ownerless villa');
    fireEvent.click(screen.getByRole('button', { name: 'Approve & activate: Ownerless villa' }));
    await waitFor(() => expect(state.error).toHaveBeenCalled());
    expect(state.writes).toEqual([]);
  });
  it('keeps rapid filter changes composed before concurrent router commits', async () => {
    mount('/admin/operations?tab=moderation&type=property&page=4&q=Ownerless', true); await ready('Ownerless villa');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
      fireEvent.change(screen.getByRole('combobox', { name: 'Content type' }), { target: { value: 'listing' } });
    });
    await ready();
    fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: 'clinic' } });
    await waitFor(() => expect(screen.getByTestId('route').textContent).toContain('category=clinic'));
    const route = screen.getByTestId('route').textContent || '';
    expect(route).toContain('type=listing'); expect(route).toContain('category=clinic');
    expect(route).not.toContain('q='); expect(route).not.toContain('page=');
    await waitFor(() => expect(screen.getAllByTestId('moderation-row')).toHaveLength(1));
  });
  it('keeps original source names while localizing controls in Thai', async () => {
    state.language = 'th'; mount('/admin/operations?tab=moderation&type=property'); await ready('Ownerless villa');
    expect(screen.getByRole('textbox')).toHaveAccessibleName('\u0e04\u0e49\u0e19\u0e2b\u0e32\u0e43\u0e19\u0e04\u0e34\u0e27');
    expect(screen.getByTestId('moderation-count')).toHaveTextContent('801');
  });
});
