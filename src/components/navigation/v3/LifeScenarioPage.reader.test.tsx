import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import LifeScenarioPage from './LifeScenarioPage';

const fixture = vi.hoisted(() => ({
  language: 'en' as 'en' | 'ru' | 'th',
  fail: false,
  retry: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/concierge/ConciergeHelpSheet', () => ({
  ConciergeHelpSheet: ({ sourceData }: { sourceData: Record<string, string> }) =>
    <div role="dialog" aria-label="Team request">{JSON.stringify(sourceData)}</div>,
}));
vi.mock('@/hooks/useLifeOS', () => ({
  useLifeSituations: () => ({ data: [{ id: 'family', code: 'family', title_en: 'Family', title_ru: 'Семья', title_th: 'ครอบครัว' }] }),
  useLifeScenarios: (id?: string) => ({ data: id ? [
    { id: 'activities', code: 'family.activities', title_en: 'Activities', title_ru: 'Занятия' },
    { id: 'childcare', code: 'family.childcare', title_en: 'Childcare', title_ru: 'Уход за детьми' },
  ] : [] }),
  useLifeTasks: (id?: string) => ({
    data: id && !fixture.fail ? [{ id: 'step', code: id + '.first', title_en: 'First step', title_ru: 'Первый шаг' }] : undefined,
    isError: Boolean(id) && fixture.fail,
    refetch: fixture.retry,
  }),
  scenarioSlug: (code: string) => code.split('.').at(-1),
}));

beforeEach(() => { fixture.language = 'en'; fixture.fail = false; fixture.retry.mockClear(); });
afterEach(cleanup);

function view(url = '/discover/family/activities') {
  return render(<MemoryRouter initialEntries={[url]}>
    <Link to="/discover/family/childcare">Change scenario</Link>
    <Routes><Route path="/discover/:code/:scenario" element={<LifeScenarioPage />} /></Routes>
  </MemoryRouter>);
}

it('opens a contextual team request and closes the former scenario selection on navigation', () => {
  view();
  fireEvent.click(screen.getByRole('button', { name: 'Ask the team about this step' }));
  const form = screen.getByRole('dialog', { name: 'Team request' });
  expect(JSON.parse(form.textContent ?? '{}')).toEqual({
    source: 'life_os_task',
    situation_code: 'family',
    scenario_code: 'family.activities',
    task_code: 'activities.first',
  });
  expect(screen.getByRole('link', { name: 'Browse the catalogue' })).toHaveAttribute('href', '/discover/family#situation-services');
  fireEvent.click(screen.getByRole('link', { name: 'Change scenario' }));
  expect(screen.getByRole('heading', { name: 'Childcare' })).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('separates a retryable read error from an absent scenario', () => {
  fixture.fail = true;
  view();
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load this section.');
  expect(screen.queryByRole('heading', { name: 'Section not found' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(fixture.retry).toHaveBeenCalledOnce();
  cleanup();
  fixture.fail = false;
  view('/discover/family/unknown');
  expect(screen.getByRole('heading', { name: 'Section not found' })).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('keeps the Thai frame and uses fallback where scenario translations are absent', () => {
  fixture.language = 'th';
  view();
  expect(screen.getByRole('heading', { name: 'Activities' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'สิ่งที่ต้องทำ' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'ครอบครัว' })).toHaveAttribute('href', '/discover/family');
});
