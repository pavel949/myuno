import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { usePropertyWithRentalTerms } from '../useProperties';
import { GUEST_PROJECT_COLUMNS } from '../usePropertyProjects';

const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mock.from } }));

beforeEach(() => vi.clearAllMocks());

function setup(projectResponse: Record<string, unknown>) {
  const property = { id: 'published-home', title_en: 'Family villa', project_id: 'linked-project', price_per_night: 4200 };
  const chain = (response: Record<string, unknown>) => ({
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(response),
  });
  const listing = chain({ data: property, error: null });
  const project = chain(projectResponse);
  mock.from.mockImplementation((table: string) => {
    if (table === 'public_property_catalog') return listing;
    if (table === 'property_projects') return project;
    throw new Error(`Unexpected read from ${table}`);
  });
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { ...renderHook(() => usePropertyWithRentalTerms(property.id), {
    wrapper: ({ children }: React.PropsWithChildren) => <QueryClientProvider client={query}>{children}</QueryClientProvider>,
  }), listing, project };
}

it('keeps the public home and nightly terms when the linked project is missing or filtered out', async () => {
  const { result, project } = setup({ data: null, error: null });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toMatchObject({ id: 'published-home', project: null, rentalTerms: { price_per_night: 4200 } });
  expect(project.select).toHaveBeenCalledExactlyOnceWith(GUEST_PROJECT_COLUMNS + ',developer_name,year_built,total_units');
  expect(project.eq.mock.calls).toEqual([['id', 'linked-project'], ['is_active', true]]);
  expect(mock.from.mock.calls).toEqual([['public_property_catalog'], ['property_projects']]);
});

it('retains a visible project and does not swallow a real project-read failure', async () => {
  const linked = { id: 'linked-project', name_en: 'Active project' };
  const healthy = setup({ data: linked, error: null });
  await waitFor(() => expect(healthy.result.current.data?.project).toEqual(linked));
  healthy.unmount();
  const error = new Error('Connection lost');
  const failed = setup({ data: null, error });
  await waitFor(() => expect(failed.result.current.error).toBe(error));
});
