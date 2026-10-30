import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProjectUnitsTab } from './ProjectUnitsTab';
const state = vi.hoisted(() => ({ error: null as null | Error, inserted: null as null | Record<string, unknown>, writes: 0, confirmError: null as null | Error }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, children, footer }: any) => open ? <div role="dialog">{children}{footer}</div> : null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = {
    select: () => query, eq: () => query,
    order: async () => ({ data: [{ id: 'existing', internal_name: 'Existing unit', bedrooms: 0, floor: 0, is_active: false }], error: state.error }),
    insert: (payload: Record<string, unknown>) => { state.inserted = payload; state.writes++; return query; },
    single: async () => ({ data: state.confirmError ? null : { id: 'created' }, error: state.confirmError }),
  };
  return query;
} } }));
beforeEach(() => { state.error = null; state.inserted = null; state.writes = 0; state.confirmError = null; });
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><ProjectUnitsTab projectId="project" /></MemoryRouter></QueryClientProvider>); }
describe('physical properties in admin project authoring', () => {
  it('does not infer sold inventory from an inactive listing', async () => {
    mount();
    await screen.findByText('Existing unit');
    expect(screen.queryByText('Sold')).not.toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeVisible();
    expect(state.writes).toBe(0);
    expect(screen.getByRole('link', { name: 'Existing unit' })).toHaveAttribute('href', '/admin/properties?edit=existing');
  });
  it('renders a stored ground floor as zero', async () => {
    mount();
    const row = (await screen.findByText('Existing unit')).closest('tr')!;
    expect(within(row).getAllByRole('cell')[3]).toHaveTextContent(/^0$/);
  });
  it('exposes load failure with retry instead of an empty inventory', async () => {
    state.error = new Error('synthetic load failure');
    mount();
    await screen.findByRole('alert');
    expect(screen.queryByText('No units in this project')).not.toBeInTheDocument();
    state.error = null;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Existing unit');
  });
  it('keeps an unconfirmed create open and preserves zero-bedroom studio and ground-floor input', async () => {
    state.confirmError = new Error('synthetic denied write');
    mount();
    await screen.findByText('Existing unit');
    fireEvent.click(screen.getByRole('button', { name: 'Unit' }));
    fireEvent.change(screen.getByPlaceholderText('A-101'), { target: { value: 'Synthetic-0' } });
    const numbers = screen.getAllByRole('spinbutton');
    fireEvent.change(numbers[0], { target: { value: '0' } });
    fireEvent.change(numbers[3], { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Unit' }));
    await waitFor(() => expect(state.writes).toBe(1));
    expect(state.inserted).toMatchObject({ project_id: 'project', unit_number: 'Synthetic-0', bedrooms: 0, floor: 0, is_active: false, approval_status: 'pending' });
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByPlaceholderText('A-101')).toHaveValue('Synthetic-0');
  });
});
