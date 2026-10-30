import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { PropertyProjectBulkLinkPanel } from './PropertyProjectBulkLinkPanel';
const state = vi.hoisted(() => ({
  mode: 'success', readError: false, writes: [] as unknown[], success: vi.fn(), error: vi.fn(),
  properties: [] as Array<{ id: string; title: string; project_id: string | null }>,
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <select aria-label="Project" value={value} onChange={event => onValueChange(event.target.value)}><option value="" />{children}</select>,
  SelectTrigger: () => null, SelectValue: () => null, SelectContent: ({ children }: any) => <>{children}</>, SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));
vi.mock('@/components/ui/checkbox', () => ({ Checkbox: ({ checked, onCheckedChange, ...props }: any) => <input type="checkbox" checked={checked} onChange={event => onCheckedChange(event.target.checked)} {...props} /> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let payload: { project_id: string } | undefined, ids: string[] = [], unlinked = false;
  const query = {
    select: () => query, order: () => query, limit: () => query,
    is: () => { unlinked = true; return query; },
    update: (value: { project_id: string }) => { payload = value; return query; },
    in: (_column: string, values: string[]) => { ids = values; return query; },
    then: (resolve: (value: unknown) => void) => {
      if (!payload) return Promise.resolve({ data: table === 'property_projects' ? [{ id: 'project', name_en: 'Synthetic project' }] : state.properties.filter(row => !unlinked || row.project_id === null), error: state.readError ? new Error('synthetic read failed') : null }).then(resolve);
      state.writes.push({ table, payload, ids });
      const selected = state.properties.filter(row => ids.includes(row.id));
      const returned = state.mode === 'zero' ? [] : state.mode === 'partial' ? selected.slice(0, 1) : selected;
      const data = returned.map(row => ({ ...row, project_id: state.mode === 'inconsistent' ? 'other-project' : payload!.project_id }));
      if (state.mode === 'success') state.properties = state.properties.map(row => ids.includes(row.id) ? { ...row, project_id: payload!.project_id } : row);
      return Promise.resolve({ data, error: state.mode === 'error' ? new Error('synthetic write failed') : null }).then(resolve);
    },
  };
  return query;
} } }));
beforeEach(() => {
  vi.clearAllMocks(); state.mode = 'success'; state.readError = false; state.writes = [];
  state.properties = [{ id: 'one', title: 'Synthetic one', project_id: null }, { id: 'two', title: 'Synthetic two', project_id: null }];
});
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><PropertyProjectBulkLinkPanel /></QueryClientProvider>); }
async function choose() {
  await screen.findByText('Synthetic one');
  fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'project' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save linkage' }));
}
it('confirms a complete bulk link, refreshes actual data and clears selection', async () => {
  mount(); await choose();
  await waitFor(() => expect(state.success).toHaveBeenCalledWith('Linked 2 properties'));
  await screen.findByText('Every property is linked to a project.');
  expect(state.writes).toEqual([{ table: 'properties', payload: { project_id: 'project' }, ids: ['one', 'two'] }]);
  expect(screen.getByRole('checkbox', { name: 'Select all' })).not.toBeChecked();
});
it.each(['zero', 'partial', 'inconsistent', 'error'])('retains selection and reports unconfirmed %s bulk writes', async mode => {
  state.mode = mode; mount(); await choose();
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(state.success).not.toHaveBeenCalled();
  expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  expect(screen.getByText('Synthetic one')).toBeVisible();
});
it('does not report all properties linked when the source query fails, and retries reads only', async () => {
  state.readError = true; mount();
  await screen.findByRole('alert');
  expect(screen.queryByText('Every property is linked to a project.')).not.toBeInTheDocument();
  state.readError = false; fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Synthetic one');
  expect(state.writes).toEqual([]);
});
