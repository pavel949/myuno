import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectUnitIdentityReview } from './ProjectUnitIdentityReview';
import { reviewProjectUnitIdentity } from '@/lib/real-estate/projectUnitIdentity';

const { response, steps, actor } = vi.hoisted(() => ({
  response: vi.fn(), steps: vi.fn(), actor: { id: 'operator' },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: actor.id ? actor : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (name: string) => {
    steps('from', name);
    const builder = {
      select: (...args: unknown[]) => { steps('select', ...args); return builder; },
      eq: (...args: unknown[]) => { steps('eq', ...args); return builder; },
      order: (...args: unknown[]) => { steps('order', ...args); return builder; },
      range: (...args: unknown[]) => { steps('range', ...args); return builder; },
      abortSignal: () => response(),
    };
    return builder;
  } },
}));

const match = { id: 'sale-1', unit_code: '020701', property_id: 'physical-1', properties: { id: 'physical-1', project_id: 'project-a', unit_number: ' 020701 ' } };
const rows = [
  match,
  { ...match, id: 'sale-unlinked', unit_code: '020702', property_id: null, properties: null },
  { ...match, id: 'sale-hidden', unit_code: '020703', property_id: 'inaccessible', properties: null },
  { ...match, id: 'sale-other', unit_code: '020704', properties: { ...match.properties, project_id: 'project-b' } },
  { ...match, id: 'sale-diff', unit_code: '20701' },
];
function show() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><ProjectUnitIdentityReview projectId="project-a" /></MemoryRouter></QueryClientProvider>);
}
function open() {
  const details = screen.getByText('Check sales catalogue links').parentElement!;
  details.setAttribute('open', '');
  fireEvent(details, new Event('toggle'));
}

beforeEach(() => {
  response.mockReset();
  steps.mockClear();
  actor.id = 'operator';
});

describe('project sales identity review', () => {
  it('reads only on expansion and shows the canonical physical href, never a sales id fallback', async () => {
    response.mockResolvedValue({ data: rows, count: rows.length, error: null });
    show();
    expect(steps).not.toHaveBeenCalled();
    open();
    const exact = (await screen.findByText('Linked · codes match')).closest('li')!;
    expect(within(exact).getByRole('link')).toHaveAttribute('href', '/admin/properties?edit=physical-1');
    expect(steps).toHaveBeenCalledWith('from', 'project_units');
    expect(steps).toHaveBeenCalledWith('eq', 'project_id', 'project-a');
    expect(steps).toHaveBeenCalledWith('eq', 'properties.project_id', 'project-a');
    expect(steps).toHaveBeenCalledWith('range', 0, 49);
    for (const status of ['No property link', 'Property could not be verified', 'Project does not match']) {
      expect(within(screen.getByText(status).closest('li')!).queryByRole('link')).toBeNull();
    }
    expect(screen.getByText('Check unit codes')).toBeVisible();
    expect(reviewProjectUnitIdentity({ ...match, properties: { ...match.properties, id: 'different-id' } }, 'project-a')).toEqual({ status: 'unverified', propertyId: null });
  });
  it('does not report failed reads as empty and retries the same scope', async () => {
    response.mockResolvedValueOnce({ error: new Error('raw backend details') }).mockResolvedValueOnce({ data: [], count: 0, error: null });
    show();
    open();
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('raw backend details');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No sales catalogue rows visible on this page.')).toBeVisible();
    expect(response).toHaveBeenCalledTimes(2);
  });
  it('keeps pagination project-scoped and never queries without a signed-in actor', async () => {
    response.mockResolvedValue({ data: rows, count: 51, error: null });
    actor.id = '';
    const anonymous = show();
    expect(screen.queryByText('Check sales catalogue links')).toBeNull();
    expect(steps).not.toHaveBeenCalled();
    anonymous.unmount();
    actor.id = 'operator';
    show();
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(steps).toHaveBeenCalledWith('range', 50, 99));
    expect(steps.mock.calls.filter(call => call[0] === 'eq')).toEqual([['eq', 'project_id', 'project-a'], ['eq', 'properties.project_id', 'project-a'], ['eq', 'project_id', 'project-a'], ['eq', 'properties.project_id', 'project-a']]);
  });
});
