import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { ProjectUnitsGrid } from './ProjectUnitsGrid';
const state = vi.hoisted(() => ({
  mode: 'success', rows: [] as Array<Record<string, unknown>>, filters: [] as unknown[][], success: vi.fn(), error: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: true }) }));
vi.mock('./ProjectUnitsBulkImport', () => ({ ProjectUnitsBulkImport: () => null }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ children, open, title }: any) => open ? <div role="dialog" aria-label={title}>{children}</div> : null }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <select value={value} onChange={event => onValueChange(event.target.value)}>{children}</select>,
  SelectTrigger: () => null, SelectValue: () => null, SelectContent: ({ children }: any) => <>{children}</>, SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  let operation = 'read', payload: Record<string, unknown> = {}, id = '';
  const query = {
    select: () => query,
    eq: (column: string, value: string) => { if (operation !== 'read') state.filters.push([column, value]); if (column === 'id') id = value; return query; },
    order: async () => ({ data: state.rows, error: null }),
    insert: (value: Record<string, unknown>) => { operation = 'create'; payload = value; return query; },
    update: (value: Record<string, unknown>) => { operation = 'update'; payload = value; return query; },
    delete: () => { operation = 'delete'; return query; },
    single: async () => {
      if (state.mode === 'zero') return { data: null, error: null };
      if (state.mode === 'error') return { data: null, error: new Error('synthetic denied') };
      if (state.mode === 'mismatch') return { data: { id: 'unrelated' }, error: null };
      if (operation === 'create') { const row = { id: 'new-unit', ...payload }; state.rows = [...state.rows, row]; return { data: { id: row.id }, error: null }; }
      state.rows = operation === 'delete' ? state.rows.filter(row => row.id !== id) : state.rows.map(row => row.id === id ? { ...row, ...payload } : row);
      return { data: { id }, error: null };
    },
  };
  return query;
} } }));
beforeEach(() => { vi.clearAllMocks(); state.mode = 'success'; state.rows = []; state.filters = []; });
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><ProjectUnitsGrid projectId="project" /></QueryClientProvider>); }
async function create() {
  fireEvent.click(await screen.findByRole('button', { name: 'Add Unit' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByPlaceholderText('A-301'), { target: { value: 'Synthetic A-301' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add Unit' }));
}
it('creates, reopens in the refreshed grid and deletes a confirmed unit through the real hooks', async () => {
  mount(); await create();
  const row = (await screen.findByText('Synthetic A-301')).closest('tr')!;
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(screen.queryByText('Synthetic A-301')).not.toBeInTheDocument());
  expect(state.success.mock.calls.map(call => call[0])).toEqual(['Unit added', 'Unit removed']);
  expect(state.filters).toEqual([['id', 'new-unit'], ['project_id', 'project']]);
});
it.each(['zero', 'error'])('keeps the create form and input on %s readback failure', async mode => {
  state.mode = mode; mount(); await create();
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(screen.getByPlaceholderText('A-301')).toHaveValue('Synthetic A-301');
  expect(state.success).not.toHaveBeenCalled();
});
it.each(['zero', 'mismatch', 'error'])('does not remove a displayed row or claim a %s deletion', async mode => {
  state.mode = mode; state.rows = [{ id: 'existing', project_id: 'project', unit_code: 'Synthetic existing', unit_type: 'studio', status: 'available', floor: 0 }];
  mount(); const row = (await screen.findByText('Synthetic existing')).closest('tr')!;
  fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(screen.getByText('Synthetic existing')).toBeVisible();
  expect(state.success).not.toHaveBeenCalled();
});
