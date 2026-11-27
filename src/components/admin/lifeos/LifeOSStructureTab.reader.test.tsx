import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LifeOSStructureTab } from './LifeOSStructureTab';

const fixture = vi.hoisted(() => ({
  actor: 'admin-a' as string | null,
  language: 'en' as 'ru' | 'en' | 'th',
  fail: false,
  tables: [] as Array<{ table: string; order: string; actor: string | null }>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: fixture.actor ? { id: fixture.actor } : null, isLoading: false }),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from(table: string) {
    const actor = fixture.actor;
    const records: Record<string, unknown[]> = {
      life_situations: [
        { id: 's1', code: 's1', title_en: actor === 'admin-a' ? 'First situation' : 'Second situation', title_ru: 'Ситуация', title_th: 'สถานการณ์', is_active: true, priority: 1 },
        { id: 's2', code: 's2', title_en: 'Hidden parent', is_active: false, priority: 2 },
      ],
      life_scenarios: [
        { id: 'sc1', code: 'sc1', life_situation_id: 's1', title_en: 'Active scenario', is_active: true },
        { id: 'sc2', code: 'sc2', life_situation_id: 's1', title_en: 'Hidden scenario', is_active: false },
        { id: 'sc3', code: 'sc3', life_situation_id: 's2', title_en: 'Active beneath hidden', is_active: true },
      ],
      life_tasks: [
        { id: 'b', code: 'b', life_scenario_id: 'sc1', title_en: 'Search this step', is_active: true, priority: 1 },
        { id: 'a', code: 'a', life_scenario_id: 'sc1', title_en: 'First step', is_active: true, priority: 1 },
        { id: 'c', code: 'c', life_scenario_id: 'sc1', title_en: 'Hidden step', is_active: false },
        { id: 'd', code: 'd', life_scenario_id: 'sc2', title_en: 'Inactive ancestry', is_active: true },
      ],
      catalog_life_map: [{ life_situation_id: 's1' }, { life_situation_id: 's1' }],
    };
    return {
      select: () => ({
        order: (order: string) => ({
          range: () => ({
            abortSignal: async () => {
              fixture.tables.push({ table, order, actor });
              return fixture.fail && table === 'life_tasks'
                ? { data: null, error: new Error('synthetic read rejection') }
                : { data: records[table], error: null };
            },
          }),
        }),
      }),
    };
  },
} }));

beforeEach(() => { fixture.actor = 'admin-a'; fixture.language = 'en'; fixture.fail = false; fixture.tables = []; });
afterEach(cleanup);

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = () => <QueryClientProvider client={client}><MemoryRouter><LifeOSStructureTab /></MemoryRouter></QueryClientProvider>;
  const result = render(view());
  return () => result.rerender(view());
}

it('shows active descendant counts, describes raw links and finds a step by title', async () => {
  setup();
  const row = await screen.findByRole('button', { name: /First situation/ });
  expect(within(row).getByText('1 public scenarios')).toBeVisible();
  expect(within(row).getByText('2 catalogue link rows')).toBeVisible();
  expect(screen.getByText('Public steps').parentElement).toHaveTextContent('2');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'search this step' } });
  const steps = screen.getAllByRole('listitem').map(node => node.textContent?.trim());
  expect(steps).toEqual(['First step', 'Search this step', 'Hidden step Hidden on site', 'Inactive ancestry Hidden on site']);
  expect(screen.queryByRole('button', { name: /Hidden parent/ })).not.toBeInTheDocument();
  expect(fixture.tables.every(request => request.order === 'id')).toBe(true);
});

it('isolates the rendered tree and its search between sessions', async () => {
  const rerender = setup();
  await screen.findByRole('button', { name: /First situation/ });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'first' } });
  fixture.actor = null;
  rerender();
  expect(screen.getByText('Sign in to view the structure.')).toBeVisible();
  expect(screen.queryByRole('button', { name: /First situation/ })).not.toBeInTheDocument();
  fixture.actor = 'admin-b';
  rerender();
  await screen.findByRole('button', { name: /Second situation/ });
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(fixture.tables.filter(request => request.actor === null)).toHaveLength(0);
});

it('offers retry for an error and keeps recorded Thai titles and the English child fallback', async () => {
  fixture.language = 'th';
  fixture.fail = true;
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent('โหลดโครงสร้างไม่สำเร็จ');
  fixture.fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));
  const row = await screen.findByRole('button', { name: /สถานการณ์/ });
  fireEvent.click(row);
  expect(screen.getByText('First step')).toBeVisible();
});
